import { get } from './client';
import { PerformanceRecord, MasteryPrediction } from '../types';

export const performanceApi = {
  getPerformance: async (): Promise<PerformanceRecord> => {
    return get<PerformanceRecord>('/performance');
  },

  getMasteryPrediction: async (): Promise<MasteryPrediction> => {
    return get<MasteryPrediction>('/performance/mastery');
  },
};
