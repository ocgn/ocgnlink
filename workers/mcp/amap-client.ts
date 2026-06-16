const AMAP_BASE_URL = 'https://restapi.amap.com/v3';

export interface AmapPoi {
  name: string;
  address: string;
  location: string;
  type: string;
  distance: string;
  phone?: string;
  website?: string;
  photos?: Array<{ title: string; url: string }>;
}

export interface AmapGeoResult {
  location: string;
  formatted_address: string;
}

export class AmapClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /** 地点搜索 */
  async searchPlaces(keyword: string, city?: string, type?: string): Promise<AmapPoi[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      keywords: keyword,
      offset: '20',
      page: '1',
      extensions: 'all',
    });
    if (city) params.set('city', city);
    if (type) params.set('types', type);

    const response = await fetch(`${AMAP_BASE_URL}/place/text?${params.toString()}`);
    const data = await response.json() as { status: string; pois?: AmapPoi[]; info?: string };

    if (data.status !== '1') {
      throw new Error(`AMap search failed: ${data.info}`);
    }
    return data.pois || [];
  }

  /** 地理编码（地址 -> 坐标） */
  async geocode(address: string, city?: string): Promise<AmapGeoResult[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      address,
      city: city || '',
    });

    const response = await fetch(`${AMAP_BASE_URL}/geocode/geo?${params.toString()}`);
    const data = await response.json() as { status: string; geocodes?: AmapGeoResult[]; info?: string };

    if (data.status !== '1') {
      throw new Error(`AMap geocode failed: ${data.info}`);
    }
    return data.geocodes || [];
  }

  /** 逆地理编码（坐标 -> 地址） */
  async reverseGeocode(lat: number, lng: number): Promise<AmapGeoResult> {
    const params = new URLSearchParams({
      key: this.apiKey,
      location: `${lng},${lat}`,
      extensions: 'base',
    });

    const response = await fetch(`${AMAP_BASE_URL}/geocode/regeo?${params.toString()}`);
    const data = await response.json() as { status: string; regeocode?: { formatted_address: string }; info?: string };

    if (data.status !== '1') {
      throw new Error(`AMap reverse geocode failed: ${data.info}`);
    }

    return {
      location: `${lng},${lat}`,
      formatted_address: data.regeocode?.formatted_address || '',
    };
  }

  /** 周边搜索 */
  async nearbySearch(lat: number, lng: number, radius: number, keyword?: string): Promise<AmapPoi[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      location: `${lng},${lat}`,
      radius: radius.toString(),
      offset: '20',
      page: '1',
      extensions: 'all',
    });
    if (keyword) params.set('keywords', keyword);

    const response = await fetch(`${AMAP_BASE_URL}/place/around?${params.toString()}`);
    const data = await response.json() as { status: string; pois?: AmapPoi[]; info?: string };

    if (data.status !== '1') {
      throw new Error(`AMap nearby search failed: ${data.info}`);
    }
    return data.pois || [];
  }

  /** 路线规划 */
  async routePlan(origin: string, destination: string, mode: 'driving' | 'walking' | 'transit' = 'driving') {
    const params = new URLSearchParams({
      key: this.apiKey,
      origin,
      destination,
      strategy: '0',
      extensions: 'all',
      show_fields: 'cost,tmcs,steps',
    });

    const apiPath = mode === 'driving' ? '/direction/driving'
      : mode === 'walking' ? '/direction/walking'
      : '/direction/transit/integrated';

    const response = await fetch(`${AMAP_BASE_URL}${apiPath}?${params.toString()}`);
    const data = await response.json() as { status: string; route?: unknown; info?: string };

    if (data.status !== '1') {
      throw new Error(`AMap route plan failed: ${data.info}`);
    }
    return data.route;
  }
}
