import unittest

from app.services.assessment_service import AssessmentService
from app.utils.db import MongoDatabaseManager


class StubCodeRunner:
    def __init__(self, outcomes):
        self.outcomes = iter(outcomes)

    def run_tests(self, source, function_name, test_cases, language):
        passed = next(self.outcomes)
        return {"passed": passed, "test_results": []}


class AssessmentScoringTests(unittest.TestCase):
    def payload(self):
        return {
            "subtopic_id": "subtopic-1",
            "quiz_answers": {"q1": 0, "q2": 1},
            "coding_answers": {
                "cq1": "def filter_85(scores): return [score for score in scores if score >= 85]",
                "cq2": "def is_unlocked(score): return score >= 85",
                "cq3": "def average_hours(hours): return sum(hours) / len(hours) if hours else 0.0",
            },
        }

    def service(self, outcomes):
        return AssessmentService(
            db=MongoDatabaseManager(use_memory=True),
            code_runner=StubCodeRunner(outcomes),
        )

    def test_exactly_three_coding_questions_and_no_empty_answer_pass(self):
        assessment = self.service([]).get_assessment("subtopic-1")
        self.assertEqual(len(assessment["coding_questions"]), 3)

        payload = self.payload()
        payload["quiz_answers"] = {}
        with self.assertRaisesRegex(ValueError, "Answer every quiz"):
            self.service([]).evaluate_assessment("learner-1", payload)

    def test_correct_quiz_and_three_passing_problems_pass_at_100(self):
        result = self.service([True, True, True]).evaluate_assessment(
            "learner-1", self.payload()
        )
        self.assertEqual(result["quiz_score"], 100)
        self.assertEqual(result["coding_score"], 100)
        self.assertEqual(result["overall_score"], 100)
        self.assertTrue(result["passed"])

    def test_failed_code_submission_cannot_become_a_passing_score(self):
        result = self.service([False, False, False]).evaluate_assessment(
            "learner-1", self.payload()
        )
        self.assertEqual(result["coding_score"], 0)
        self.assertEqual(result["overall_score"], 30)
        self.assertFalse(result["passed"])
        self.assertTrue(result["retry_allowed"])

    def test_only_two_passing_code_problems_do_not_reach_threshold(self):
        result = self.service([True, True, False]).evaluate_assessment(
            "learner-1", self.payload()
        )
        self.assertEqual(result["overall_score"], 76.7)
        self.assertFalse(result["passed"])


if __name__ == "__main__":
    unittest.main()