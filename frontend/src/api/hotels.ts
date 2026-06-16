import apiClient from './client';
import type { Hotel } from '../../../workers/shared/types';

export interface SearchHotelsParams {
  city: string;
  keyword?: string;
  lat?: number;
  lng?: number;
}

export interface HotelSearchResult {
  hotels: Hotel[];
  sources: {
    meituan: boolean;
    ctrip: boolean;
  };
}

export async function searchHotels(params: SearchHotelsParams): Promise<HotelSearchResult> {
  const response = await apiClient.post('/hotels/search', params);
  return response.data.data;
}
