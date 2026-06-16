import apiClient from './client';
import { CONFIG } from '@/config';

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

/** 高德静态地图（通过 Workers 代理） */
export function getStaticMapUrl(lng: number, lat: number, name?: string, size = '400*160', zoom = '15'): string {
  const params = new URLSearchParams({
    lng: lng.toString(),
    lat: lat.toString(),
    size,
    zoom,
  });
  if (name) params.set('name', name);
  return `${CONFIG.apiBaseUrl}/map/static?${params.toString()}`;
}

/** 高德地图网页版链接 */
export function getMapLink(lng: number, lat: number, name?: string): string {
  if (name) {
    return `https://ditu.amap.com/search?query=${encodeURIComponent(name)}&location=${lng},${lat}`;
  }
  return `https://ditu.amap.com/search?location=${lng},${lat}`;
}
