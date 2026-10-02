import { get, post } from './client';
import { Assessment, AssessmentResult } from '../types';

export interface AssessmentSubmissionPayload {
  subtopic_id: string;
  quiz_answers: Record<string, number>; // questionId -> selectedOptionIndex
  coding_answers: Record<string, string>; // problemId -> codeString
}

export const assessmentApi = {
  getAssessment: async (subtopicId: string): Promise<Assessment> => {
    return get<Assessment>(`/assessments/${subtopicId}`);
  },

  submitAssessment: async (payload: AssessmentSubmissionPayload): Promise<AssessmentResult> => {
    return post<AssessmentResult>('/assessments/submit', payload);
  },

  getLatestResult: async (subtopicId: string): Promise<AssessmentResult> => {
    return get<AssessmentResult>(`/assessments/results/${subtopicId}`);
  },
};
