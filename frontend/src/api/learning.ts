import { get, post } from './client';
import { Lesson, CodingProblem, CodeSubmission } from '../types';

export const learningApi = {
  getLesson: async (subtopicId: string): Promise<Lesson> => {
    return get<Lesson>(`/learning/lessons/${subtopicId}`);
  },

  generateLesson: async (subtopicId: string): Promise<Lesson> => {
    return post<Lesson>(`/learning/lessons/${subtopicId}/generate`);
  },

  getCodingProblem: async (subtopicId: string): Promise<CodingProblem> => {
    return get<CodingProblem>(`/learning/labs/${subtopicId}`);
  },

  submitCode: async (problemId: string, code: string, language: string): Promise<CodeSubmission> => {
    return post<CodeSubmission>('/learning/labs/submit', { problem_id: problemId, code, language });
  },

  completeLesson: async (subtopicId: string): Promise<{ success: boolean }> => {
    return post<{ success: boolean }>(`/learning/lessons/${subtopicId}/complete`);
  },
};
