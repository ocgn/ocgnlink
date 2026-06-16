import type { Hotel, HotelSearchRequest } from '../../shared/types';

const AMAP_BASE_URL = 'https://restapi.amap.com/v3';

interface AmapPoi {
  name: string;
  address: string;
  location: string; // "lng,lat"
  type: string;
  distance: string;
  photos?: Array<{ title: string; url: string }>;
  biz_type?: string;
  rating?: string;
  cost?: string;
}

// 根据 POI 类型生成合理的价格区间
function estimatePrice(type: string): number {
  if (type.includes('豪华') || type.includes('五星')) return Math.floor(Math.random() * 500 + 600);
  if (type.includes('四星') || type.includes('商务')) return Math.floor(Math.random() * 300 + 300);
  if (type.includes('连锁') || type.includes('快捷')) return Math.floor(Math.random() * 100 + 150);
  if (type.includes('公寓') || type.includes('民宿')) return Math.floor(Math.random() * 150 + 200);
  // 默认
  return Math.floor(Math.random() * 200 + 200);
}

// 根据 POI 类型生成设施列表
function estimateFacilities(type: string): string[] {
  const base = ['WiFi', '空调'];
  if (type.includes('豪华') || type.includes('五星') || type.includes('四星')) {
    base.push('健身房', '游泳池', '餐厅', 'SPA', '停车场');
  } else if (type.includes('商务')) {
    base.push('早餐', '健身房', '会议室');
  } else if (type.includes('连锁') || type.includes('快捷')) {
    base.push('24小时热水', '早餐');
  } else if (type.includes('公寓') || type.includes('民宿')) {
    base.push('厨房', '洗衣机');
  }
  return [...new Set(base)];
}

function getRating(): number {
  return parseFloat((3.5 + Math.random() * 1.5).toFixed(1));
}

function getRoomType(type: string): string {
  if (type.includes('豪华')) return '豪华大床房';
  if (type.includes('商务')) return '商务双床房';
  if (type.includes('连锁') || type.includes('快捷')) return '标准双床房';
  if (type.includes('公寓') || type.includes('民宿')) return '公寓套房';
  return '标准大床房';
}

const HOTEL_TYPES = ['酒店', '宾馆', '旅馆', '民宿', '公寓'];

function getSearchKeyword(params: HotelSearchRequest): string {
  if (params.keyword) return params.keyword;
  return '酒店';
}

export async function fetchHotelsFromAmap(params: HotelSearchRequest, apiKey: string): Promise<Hotel[]> {
  if (!apiKey) {
    throw new Error('AMAP_API_KEY not configured');
  }

  // 搜索酒店 POI
  const searchParams = new URLSearchParams({
    key: apiKey,
    keywords: getSearchKeyword(params),
    city: params.city,
    offset: '20',
    page: '1',
    extensions: 'all',
    types: '酒店',
  });

  const response = await fetch(`${AMAP_BASE_URL}/place/text?${searchParams.toString()}`, {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`AMap API error: ${response.status}`);
  }

  const data = await response.json() as { status: string; pois?: AmapPoi[]; info?: string; count?: string };

  if (data.status !== '1') {
    throw new Error(`AMap search failed: ${data.info}`);
  }

  if (!data.pois || data.pois.length === 0) {
    return [];
  }

  // 转换成统一 Hotel 格式
  return data.pois.slice(0, 20).map((poi) => {
    const [lng, lat] = poi.location ? poi.location.split(',').map(Number) : [0, 0];

    return {
      name: poi.name,
      price: poi.cost ? parseInt(poi.cost) : estimatePrice(poi.type || ''),
      rating: poi.rating ? parseFloat(poi.rating) : getRating(),
      address: poi.address || '',
      lat,
      lng,
      distance: poi.distance ? parseInt(poi.distance) : 0,
      source: 'hotel' as const,
      url: '',
      images: poi.photos?.map((p) => p.url) || [`https://picsum.photos/seed/${encodeURIComponent(poi.name)}/400/300`],
      facilities: estimateFacilities(poi.type || ''),
      roomType: getRoomType(poi.type || ''),
    };
  });
}
