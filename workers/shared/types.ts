/** 统一酒店数据格式 */
export interface Hotel {
  name: string;
  price: number;
  rating: number;
  address: string;
  distance: number;
  source: 'meituan' | 'ctrip';
  url: string;
  images: string[];
  facilities: string[];
  roomType: string;
}

/** 酒店搜索请求参数 */
export interface HotelSearchRequest {
  city: string;
  lat?: number;
  lng?: number;
  keyword?: string;
}

/** AI 分析请求 */
export interface AiAnalyzeRequest {
  meituanHotels: Hotel[];
  ctripHotels: Hotel[];
}

/** AI 分析响应 */
export interface AiAnalyzeResponse {
  analysis: string;
  recommendation: string;
  model: string;
}

/** 高德 POI 搜索结果 */
export interface AmapPoiResult {
  id: string;
  name: string;
  type: string;
  address: string;
  location: string;
  distance: string;
  photos?: { title: string; url: string }[];
}

/** API 统一响应格式 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
