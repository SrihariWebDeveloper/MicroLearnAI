import { get, post } from './client';
import { Roadmap, Subtopic } from '../types';

export const roadmapApi = {
  getRoadmap: async (): Promise<Roadmap | null> => {
    return get<Roadmap | null>('/roadmap');
  },

  generateRoadmap: async (profile: Record<string, unknown>): Promise<Roadmap> => {
    return post<Roadmap>('/roadmap/generate', profile);
  },

  getSubtopic: async (subtopicId: string): Promise<Subtopic> => {
    return get<Subtopic>(`/roadmap/subtopics/${subtopicId}`);
  },
};
