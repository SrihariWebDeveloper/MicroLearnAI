import { get, post } from './client';
import { Recommendation } from '../types';

export const recommendationsApi = {
  getRecommendations: async (): Promise<Recommendation[]> => {
    return get<Recommendation[]>('/recommendations');
  },

  dismissRecommendation: async (id: string): Promise<{ success: boolean }> => {
    return post<{ success: boolean }>(`/recommendations/${id}/dismiss`);
  },
};
