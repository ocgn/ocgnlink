import type { Hotel, HotelSearchRequest } from '../../shared/types';

const CTRIP_H5_SEARCH_URL = 'https://m.ctrip.com/restapi/soa2/13444/json/searchHotel';

interface CtripApiResponse {
  hotelList?: Array<{
    hotelName?: string;
    showPrice?: number;
    starRating?: number;
    commentScore?: number;
    address?: string;
    distance?: number;
    detailUrl?: string;
    imgList?: Array<{ url: string }>;
    facilityList?: Array<{ name: string }>;
    roomName?: string;
  }>;
  status?: number;
  msg?: string;
}

function transformCtripHotel(item: NonNullable<CtripApiResponse['hotelList']>[number]): Hotel {
  return {
    name: item.hotelName || '未知酒店',
    price: item.showPrice || 0,
    rating: item.commentScore ? item.commentScore / 10 : (item.starRating || 0),
    address: item.address || '',
    distance: item.distance || 0,
    source: 'ctrip' as const,
    url: item.detailUrl || '',
    images: item.imgList?.map((img) => img.url) || [],
    facilities: item.facilityList?.map((f) => f.name) || [],
    roomType: item.roomName || '',
  };
}

export async function fetchCtripHotels(params: HotelSearchRequest): Promise<Hotel[]> {
  const body = JSON.stringify({
    city: params.city,
    lat: params.lat,
    lng: params.lng,
    keyword: params.keyword || '',
    pageSize: 20,
    pageNo: 1,
    sort: 'default',
  });

  const response = await fetch(CTRIP_H5_SEARCH_URL, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'Referer': 'https://m.ctrip.com/',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Ctrip API error: ${response.status}`);
  }

  const data: CtripApiResponse = await response.json();

  if (data.status !== undefined && data.status !== 0) {
    console.warn(`Ctrip API returned status ${data.status}: ${data.msg}`);
    if (data.status === -1) {
      return []; // 反爬触发，返回空
    }
  }

  return data.hotelList?.map(transformCtripHotel) || [];
}
