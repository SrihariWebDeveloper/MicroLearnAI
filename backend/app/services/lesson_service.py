from app.utils.db import get_db

class LessonService:
    def __init__(self):
        self.db = get_db()
        self.lessons_coll = self.db.get_collection("lessons")

    def get_lesson(self, subtopic_id: str):
        lesson = self.lessons_coll.find_one({"subtopic_id": subtopic_id})
        if not lesson:
            lesson = {
                "id": f"les_{subtopic_id}",
                "subtopic_id": subtopic_id,
                "title": "Control Structures & Iteration Logic",
                "overview": "Master conditional execution branches and looping algorithms in modern Python applications.",
                "key_concepts": [
                    "If-Else branching conditions",
                    "For-in iterator protocols",
                    "While condition loops",
                    "List comprehensions and generator expressions"
                ],
                "detailed_content": "### Understanding Control Flow\n\nControl structures direct the execution flow of code based on dynamic runtime conditions.\n\n#### 1. Conditional Branching\nUsing `if`, `elif`, and `else` keywords allows your microservice logic to make state decisions dynamically.\n\n#### 2. Iteration Protocols\nPython loops iterate over iterable objects such as lists, dictionaries, or custom generators efficiently.\n\n```python\n# Example of List Comprehension\nscores = [78, 85, 92, 64, 89]\npassing_scores = [s for s in scores if s >= 85]\nprint('Passing:', passing_scores)\n```",
                "code_examples": [
                    {
                        "title": "Filtering Assessment Scores",
                        "language": "python",
                        "code": "def evaluate_mastery(scores: list[int]) -> dict:\n    passed = [s for s in scores if s >= 85]\n    avg = sum(scores) / len(scores) if scores else 0\n    return {\n        'passing_count': len(passed),\n        'average_score': round(avg, 2),\n        'is_mastered': avg >= 85\n    }\n\nprint(evaluate_mastery([90, 88, 82]))",
                        "explanation": "Demonstrates list comprehension filtering and calculating 85% passing threshold logic."
                    }
                ],
                "summary": "Control structures allow your python backend to dynamically adapt based on evaluation rules.",
                "video_script": "[00:00] Welcome to Control Structures in MicroLearn AI. Today we examine conditional logic and iteration algorithms..."
            }
        return lesson

    def get_coding_problem(self, subtopic_id: str):
        return {
            "id": f"prob_{subtopic_id}",
            "subtopic_id": subtopic_id,
            "title": "Filter High-Mastery Quiz Scores",
            "description": "Write a python function `filter_passing_scores(scores: list[int]) -> list[int]` that takes a list of integer assessment scores and returns only scores greater than or equal to 85.",
            "difficulty": "easy",
            "language": "python",
            "initial_code": "def filter_passing_scores(scores: list[int]) -> list[int]:\n    # Implement your filtering algorithm here\n    pass\n",
            "test_cases": [
                {"id": "t1", "input": "[75, 85, 90, 60]", "expected_output": "[85, 90]"},
                {"id": "t2", "input": "[88, 92, 95]", "expected_output": "[88, 92, 95]"},
                {"id": "t3", "input": "[40, 50, 60]", "expected_output": "[]"}
            ],
            "solution_hint": "Use a list comprehension: [s for s in scores if s >= 85]"
        }

    def evaluate_code(self, problem_id: str, code: str, language: str):
        # Code execution service (mocked sandbox for development phase 3)
        return {
            "id": "sub-201",
            "problem_id": problem_id,
            "code": code,
            "language": language,
            "status": "passed",
            "execution_time_ms": 38,
            "memory_kb": 12400,
            "test_results": [
                {"test_case_id": "t1", "passed": True, "actual_output": "[85, 90]", "expected_output": "[85, 90]", "execution_time_ms": 12},
                {"test_case_id": "t2", "passed": True, "actual_output": "[88, 92, 95]", "expected_output": "[88, 92, 95]", "execution_time_ms": 13},
                {"test_case_id": "t3", "passed": True, "actual_output": "[]", "expected_output": "[]", "execution_time_ms": 13}
            ]
        }

lesson_service = LessonService()
