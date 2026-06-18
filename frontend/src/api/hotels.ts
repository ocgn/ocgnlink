import type { Hotel } from '../../../workers/shared/types';
import apiClient from "@/api/client";

export interface SearchHotelsParams {
  city: string;
  keyword?: string;
}

export interface HotelSearchResult {
  hotels: Hotel[];
  source: string;
  total: number;
}

export async function searchHotels(params: SearchHotelsParams): Promise<HotelSearchResult> {
  const response = await apiClient.post('/hotels/search', params);
  return response.data.data;
}
