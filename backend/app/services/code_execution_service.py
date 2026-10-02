import base64
import json
import os
import shutil
import subprocess
import threading
import time
import uuid

from app.config import Config


class SandboxUnavailable(RuntimeError):
    pass


class DockerCodeRunner:
    MAX_STDOUT_BYTES = 128 * 1024
    MAX_STDERR_BYTES = 64 * 1024

    def __init__(self, image=None, timeout_seconds=5, memory_limit="128m", cpu_limit="0.5"):
        self.image = image or os.getenv("CODE_SANDBOX_IMAGE", Config.CODE_SANDBOX_IMAGE)
        self.timeout_seconds = timeout_seconds
        self.memory_limit = memory_limit
        self.cpu_limit = cpu_limit
        self.docker = shutil.which("docker")

    def _available(self):
        if not self.docker:
            return False
        try:
            result = subprocess.run(
                [self.docker, "image", "inspect", self.image],
                capture_output=True,
                text=True,
                timeout=3,
                check=False,
            )
            return result.returncode == 0
        except (OSError, subprocess.TimeoutExpired):
            return False

    def _run(self, script):
        if not self._available():
            raise SandboxUnavailable(
                "The Docker sandbox image is unavailable. Start Docker and install the configured sandbox image."
            )

        container_name = f"microlearn-run-{uuid.uuid4().hex[:16]}"
        command = [
            self.docker,
            "run",
            "--pull=never",
            "--rm",
            "--interactive",
            "--name",
            container_name,
            "--network=none",
            "--read-only",
            "--pids-limit=32",
            f"--memory={self.memory_limit}",
            f"--cpus={self.cpu_limit}",
            "--security-opt=no-new-privileges",
            "--cap-drop=ALL",
            "--user=65534:65534",
            "--tmpfs=/tmp:rw,noexec,nosuid,size=16m",
            self.image,
            "python",
            "-I",
            "-",
        ]
        started = time.perf_counter()
        try:
            process = subprocess.Popen(
                command,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
        except OSError as error:
            raise SandboxUnavailable("The Docker engine is unavailable.") from error

        output_exceeded = threading.Event()
        stdout_buffer = bytearray()
        stderr_buffer = bytearray()

        def drain(stream, buffer, limit):
            while chunk := stream.read(4096):
                remaining = limit - len(buffer)
                if remaining > 0:
                    buffer.extend(chunk[:remaining])
                if len(chunk) > max(remaining, 0):
                    output_exceeded.set()

        stdout_thread = threading.Thread(
            target=drain,
            args=(process.stdout, stdout_buffer, self.MAX_STDOUT_BYTES),
            daemon=True,
        )
        stderr_thread = threading.Thread(
            target=drain,
            args=(process.stderr, stderr_buffer, self.MAX_STDERR_BYTES),
            daemon=True,
        )
        stdout_thread.start()
        stderr_thread.start()
        try:
            process.stdin.write(script.encode("utf-8"))
            process.stdin.close()
            process.wait(timeout=self.timeout_seconds)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
            self._kill_container(container_name)
            stdout_thread.join(timeout=1)
            stderr_thread.join(timeout=1)
            return None, "Execution exceeded the time limit.", True, time.perf_counter() - started
        except (BrokenPipeError, OSError):
            process.kill()
            process.wait()
            self._kill_container(container_name)
        stdout_thread.join(timeout=1)
        stderr_thread.join(timeout=1)

        elapsed = time.perf_counter() - started
        if output_exceeded.is_set():
            self._kill_container(container_name)
            return None, "Output exceeded the sandbox limit.", False, elapsed
        stdout = stdout_buffer.decode("utf-8", errors="replace")
        stderr = stderr_buffer.decode("utf-8", errors="replace")
        if process.returncode != 0:
            return None, stderr[-2000:], False, elapsed
        return stdout, stderr[-2000:], False, elapsed

    def _kill_container(self, container_name):
        try:
            subprocess.run(
                [self.docker, "kill", container_name],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=2,
                check=False,
            )
        except (OSError, subprocess.TimeoutExpired):
            pass

    def run_tests(self, source, function_name, test_cases, language="python"):
        if language != "python":
            raise ValueError("Only Python submissions are currently supported.")
        if not isinstance(source, str) or not source.strip() or len(source) > 20_000:
            raise ValueError("Code must contain between 1 and 20,000 characters.")

        marker = f"MICROLEARN_RESULT_{uuid.uuid4().hex}:"
        payload = base64.b64encode(
            json.dumps({"source": source, "function_name": function_name, "cases": test_cases}).encode()
        ).decode()
        script = f'''import base64, json, traceback
payload = json.loads(base64.b64decode("{payload}"))
namespace = {{"__name__": "__learner__"}}
results = []
try:
    exec(compile(payload["source"], "<learner>", "exec"), namespace, namespace)
    function = namespace.get(payload["function_name"])
    if not callable(function):
        raise ValueError("Expected function was not defined.")
    for case in payload["cases"]:
        try:
            actual = function(*case["args"])
            passed = actual == case["expected"]
            results.append({{"id": case["id"], "passed": passed, "actual_output": repr(actual), "expected_output": repr(case["expected"])}})
        except BaseException as error:
            results.append({{"id": case["id"], "passed": False, "actual_output": "", "expected_output": repr(case["expected"]), "error": str(error)[:500]}})
except BaseException as error:
    results = [{{"id": case["id"], "passed": False, "actual_output": "", "expected_output": repr(case["expected"]), "error": str(error)[:500]}} for case in payload["cases"]]
print("{marker}" + json.dumps(results, separators=(",", ":")))
'''
        output, stderr, timed_out, elapsed = self._run(script)
        if timed_out:
            return {
                "passed": False,
                "execution_time_ms": round(elapsed * 1000),
                "test_results": [
                    {
                        "test_case_id": case["id"],
                        "passed": False,
                        "actual_output": "",
                        "expected_output": repr(case["expected"]),
                        "execution_time_ms": round(elapsed * 1000),
                        "error": "Execution exceeded the time limit.",
                    }
                    for case in test_cases
                ],
            }

        result_line = next(
            (line[len(marker):] for line in (output or "").splitlines() if line.startswith(marker)),
            None,
        )
        if result_line is None:
            error_message = stderr.strip() or "The sandbox could not evaluate this submission."
            return {
                "passed": False,
                "execution_time_ms": round(elapsed * 1000),
                "test_results": [
                    {
                        "test_case_id": case["id"],
                        "passed": False,
                        "actual_output": "",
                        "expected_output": repr(case["expected"]),
                        "execution_time_ms": round(elapsed * 1000),
                        "error": error_message,
                    }
                    for case in test_cases
                ],
            }

        test_results = json.loads(result_line)
        elapsed_ms = round(elapsed * 1000)
        for result in test_results:
            result["test_case_id"] = result.pop("id")
            result["execution_time_ms"] = elapsed_ms
        return {
            "passed": bool(test_results) and all(result["passed"] for result in test_results),
            "execution_time_ms": elapsed_ms,
            "test_results": test_results,
        }