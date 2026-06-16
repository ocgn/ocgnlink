import type { Hotel, HotelSearchRequest } from '../../shared/types';

const MEITUAN_H5_SEARCH_URL = 'https://hotel.meituan.com/hotelapi/v1/hotelsearch';

interface MeituanApiResponse {
  data?: {
    searchResult?: {
      list?: Array<{
        poiName?: string;
        lowestPrice?: number;
        avgScore?: number;
        address?: string;
        distance?: number;
        jumpUrl?: string;
        images?: Array<{ url: string }>;
        facilities?: Array<{ name: string }>;
        roomTypeName?: string;
      }>;
    };
  };
  code?: number;
  message?: string;
}

function transformMeituanHotel(item: NonNullable<NonNullable<NonNullable<MeituanApiResponse['data']>['searchResult']>['list']>[number]): Hotel {
  return {
    name: item.poiName || '未知酒店',
    price: item.lowestPrice || 0,
    rating: item.avgScore ? item.avgScore / 10 : 0,
    address: item.address || '',
    distance: item.distance || 0,
    source: 'meituan' as const,
    url: item.jumpUrl || '',
    images: item.images?.map((img) => img.url) || [],
    facilities: item.facilities?.map((f) => f.name) || [],
    roomType: item.roomTypeName || '',
  };
}

export async function fetchMeituanHotels(params: HotelSearchRequest): Promise<Hotel[]> {
  const searchParams = new URLSearchParams({
    city: params.city,
    limit: '20',
  });
  if (params.lat && params.lng) {
    searchParams.set('lat', params.lat.toString());
    searchParams.set('lng', params.lng.toString());
  }
  if (params.keyword) {
    searchParams.set('keyword', params.keyword);
  }

  const response = await fetch(`${MEITUAN_H5_SEARCH_URL}?${searchParams.toString()}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'Referer': 'https://hotel.meituan.com/',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Meituan API error: ${response.status}`);
  }

  const data: MeituanApiResponse = await response.json();

  if (data.code !== undefined && data.code !== 0) {
    console.warn(`Meituan API returned code ${data.code}: ${data.message}`);
    if (data.code === -1) {
      return []; // 反爬触发，返回空
    }
  }

  return data?.data?.searchResult?.list?.map(transformMeituanHotel) || [];
}
