from datetime import datetime, timezone
import uuid

from app.utils.db import get_db


class AssessmentService:
    QUIZ_WEIGHT = 0.3
    CODING_WEIGHT = 0.7
    PASSING_SCORE = 85.0

    def __init__(self, db=None, code_runner=None):
        self.db = db or get_db()
        self.results_coll = self.db.get_collection("results")
        self.attempts_coll = self.db.get_collection("assessment_attempts")
        self.code_runner = code_runner

    def get_assessment(self, subtopic_id: str):
        return {
            "id": f"asm_{subtopic_id}",
            "subtopic_id": subtopic_id,
            "title": "Subtopic Final Assessment",
            "quiz_questions": [
                {
                    "id": "q1",
                    "question": "Which expression keeps values greater than or equal to 85?",
                    "options": [
                        "[value for value in scores if value >= 85]",
                        "[value if value >= 85 for value in scores]",
                        "scores.filter(value >= 85)",
                        "[value for value in scores where value >= 85]",
                    ],
                    "correct_option_index": 0,
                    "explanation": "A list comprehension places its condition after the iterable.",
                },
                {
                    "id": "q2",
                    "question": "What is a function's return value used for?",
                    "options": [
                        "It automatically prints the function result.",
                        "It sends a result back to the code that called the function.",
                        "It repeats the function until the result is true.",
                        "It declares a global variable.",
                    ],
                    "correct_option_index": 1,
                    "explanation": "The caller can use the value returned by a function.",
                },
            ],
            "coding_questions": self.get_coding_questions(subtopic_id),
        }

    @staticmethod
    def get_coding_questions(subtopic_id: str):
        return [
            {
                "id": "cq1",
                "subtopic_id": subtopic_id,
                "title": "Filter passing scores",
                "description": "Implement filter_85(scores) to return only integer scores >= 85.",
                "difficulty": "easy",
                "initial_code": "def filter_85(scores):\n    pass\n",
                "language": "python",
                "function_name": "filter_85",
                "test_cases": [
                    {"id": "t1", "args": [[75, 85, 90, 60]], "expected": [85, 90]},
                    {"id": "t2", "args": [[]], "expected": []},
                ],
            },
            {
                "id": "cq2",
                "subtopic_id": subtopic_id,
                "title": "Check an unlock threshold",
                "description": "Implement is_unlocked(score) to return True when score >= 85.",
                "difficulty": "easy",
                "initial_code": "def is_unlocked(score):\n    pass\n",
                "language": "python",
                "function_name": "is_unlocked",
                "test_cases": [
                    {"id": "t1", "args": [84], "expected": False},
                    {"id": "t2", "args": [85], "expected": True},
                    {"id": "t3", "args": [100], "expected": True},
                ],
            },
            {
                "id": "cq3",
                "subtopic_id": subtopic_id,
                "title": "Calculate average study time",
                "description": "Implement average_hours(hours) and return 0.0 for an empty list.",
                "difficulty": "easy",
                "initial_code": "def average_hours(hours):\n    pass\n",
                "language": "python",
                "function_name": "average_hours",
                "test_cases": [
                    {"id": "t1", "args": [[1.0, 3.0]], "expected": 2.0},
                    {"id": "t2", "args": [[]], "expected": 0.0},
                ],
            },
        ]

    def evaluate_assessment(self, user_id: str, payload: dict):
        subtopic_id = payload.get("subtopic_id")
        if not isinstance(subtopic_id, str) or not subtopic_id:
            raise ValueError("A subtopic id is required.")
        if self.code_runner is None:
            raise RuntimeError("The code execution sandbox is not configured.")

        assessment = self.get_assessment(subtopic_id)
        quiz_questions = assessment["quiz_questions"]
        coding_questions = assessment["coding_questions"]
        quiz_answers = payload.get("quiz_answers")
        coding_answers = payload.get("coding_answers")
        expected_quiz_ids = {question["id"] for question in quiz_questions}
        expected_coding_ids = {question["id"] for question in coding_questions}

        if not isinstance(quiz_answers, dict) or set(quiz_answers) != expected_quiz_ids:
            raise ValueError("Answer every quiz question before submitting.")
        if any(type(answer) is not int for answer in quiz_answers.values()):
            raise ValueError("Quiz answers must be selected option indexes.")
        if not isinstance(coding_answers, dict) or set(coding_answers) != expected_coding_ids:
            raise ValueError("Submit code for exactly three coding questions.")
        if any(not isinstance(code, str) or not code.strip() or len(code) > 20_000 for code in coding_answers.values()):
            raise ValueError("Each coding answer must contain at most 20,000 characters of code.")

        correct_quiz_count = sum(
            quiz_answers[question["id"]] == question["correct_option_index"]
            for question in quiz_questions
        )
        quiz_score = round(correct_quiz_count / len(quiz_questions) * 100, 1)

        code_results = []
        for question in coding_questions:
            result = self.code_runner.run_tests(
                coding_answers[question["id"]],
                question["function_name"],
                question["test_cases"],
                question["language"],
            )
            code_results.append({"question_id": question["id"], **result})

        passed_problems = sum(result["passed"] for result in code_results)
        coding_score = round(passed_problems / len(coding_questions) * 100, 1)
        overall_score = round(
            quiz_score * self.QUIZ_WEIGHT + coding_score * self.CODING_WEIGHT,
            1,
        )
        passed = overall_score >= self.PASSING_SCORE
        now = datetime.now(timezone.utc).isoformat()
        result_doc = {
            "id": f"res_{uuid.uuid4().hex}",
            "subtopic_id": subtopic_id,
            "user_id": user_id,
            "overall_score": overall_score,
            "quiz_score": quiz_score,
            "coding_score": coding_score,
            "passed": passed,
            "weak_areas": [
                question["title"]
                for question, result in zip(coding_questions, code_results)
                if not result["passed"]
            ],
            "recommendations": (
                ["Continue to the next unlocked subtopic."]
                if passed
                else ["Review the missed concepts and retry the assessment."]
            ),
            "retry_allowed": not passed,
            "created_at": now,
        }
        attempt = {
            **result_doc,
            "code_results": code_results,
            "quiz_answers": quiz_answers,
        }
        self.attempts_coll.insert_one(attempt)
        self.results_coll.update_one(
            {"user_id": user_id, "subtopic_id": subtopic_id},
            {"$set": result_doc},
            upsert=True,
        )
        return result_doc

    def get_latest_result(self, user_id: str, subtopic_id: str):
        return self.results_coll.find_one(
            {"user_id": user_id, "subtopic_id": subtopic_id}
        )


assessment_service = AssessmentService()