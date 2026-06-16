import apiClient from './client';
import type { Hotel } from '../../../workers/shared/types';

export async function analyzeHotels(meituanHotels: Hotel[], ctripHotels: Hotel[], provider = 'openai') {
  const response = await apiClient.post('/ai/analyze', {
    meituanHotels,
    ctripHotels,
    provider,
  });
  return response.data.data;
}
