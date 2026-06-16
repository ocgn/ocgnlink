import apiClient from './client';

export interface MapSearchParams {
  keyword: string;
  city?: string;
  type?: string;
}

export async function searchPlaces(params: MapSearchParams) {
  const response = await apiClient.get('/map/search', { params });
  return response.data.data;
}

export async function geocode(address: string, city?: string) {
  const response = await apiClient.get('/map/geo', { params: { address, city } });
  return response.data.data;
}
