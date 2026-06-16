<template>
  <div class="max-w-6xl mx-auto px-4 py-4">
    <!-- 搜索栏 -->
    <div class="mb-4">
      <SearchBar />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex flex-col items-center py-16">
      <div class="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      <span class="mt-3 text-gray-500">正在搜索酒店数据...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="text-center py-16">
      <p class="text-red-500 mb-2">{{ error }}</p>
      <button class="text-blue-500 hover:underline" @click="fetchData">重试</button>
    </div>

    <!-- 搜索结果 -->
    <template v-else>
      <!-- 数据源状态 -->
      <div class="flex gap-4 mb-4 text-sm text-gray-500">
        <span :class="sources.meituan ? 'text-green-500' : 'text-red-400'">
          美团 {{ sources.meituan ? '✓' : '✗' }}
        </span>
        <span :class="sources.ctrip ? 'text-green-500' : 'text-red-400'">
          携程 {{ sources.ctrip ? '✓' : '✗' }}
        </span>
        <span class="text-gray-400">共 {{ hotelStore.hotels.length }} 个结果</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- 左侧：地图 -->
        <div class="lg:col-span-1 h-[400px] lg:sticky lg:top-4">
          <MapView
            :markers="mapMarkers"
            :center="mapCenter"
            @center-change="handleCenterChange"
          />
        </div>

        <!-- 右侧：酒店列表 -->
        <div class="lg:col-span-2">
          <!-- 筛选/排序 -->
          <div class="mb-3 flex items-center gap-2 text-sm">
            <button
              v-for="opt in sortOptions"
              :key="opt.key"
              class="px-3 py-1 rounded-full border"
              :class="sortBy === opt.key ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-50'"
              @click="sortBy = opt.key"
            >
              {{ opt.label }}
            </button>
          </div>

          <!-- 酒店网格 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <HotelCard
              v-for="hotel in sortedHotels"
              :key="`${hotel.source}-${hotel.name}`"
              :hotel="hotel"
              :selected="isSelected(hotel)"
              @select="selectHotel"
            />
          </div>
        </div>
      </div>

      <!-- AI 分析面板 -->
      <div class="mt-6">
        <AiPanel />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SearchBar from '@/components/SearchBar.vue';
import HotelCard from '@/components/HotelCard.vue';
import MapView from '@/components/MapView.vue';
import AiPanel from '@/components/AiPanel.vue';
import { useHotelStore } from '@/stores/hotel';
import { searchHotels } from '@/api/hotels';
import type { Hotel } from '../../../workers/shared/types';

const route = useRoute();
const hotelStore = useHotelStore();

const loading = ref(false);
const error = ref<string | null>(null);
const sources = ref({ meituan: false, ctrip: false });
const sortBy = ref<string>('default');
const mapCenter = ref<{ lat: number; lng: number } | undefined>(undefined);

const mapMarkers = computed(() =>
  hotelStore.hotels.map((h) => ({
    name: h.name,
    lat: 0,
    lng: 0,
  }))
);

const sortOptions = [
  { key: 'default', label: '默认' },
  { key: 'price_asc', label: '价格最低' },
  { key: 'price_desc', label: '价格最高' },
  { key: 'rating', label: '评分最高' },
];

const sortedHotels = computed(() => {
  const list = [...hotelStore.hotels];
  switch (sortBy.value) {
    case 'price_asc': return list.sort((a, b) => a.price - b.price);
    case 'price_desc': return list.sort((a, b) => b.price - a.price);
    case 'rating': return list.sort((a, b) => b.rating - a.rating);
    default: return list;
  }
});

function isSelected(hotel: Hotel) {
  return hotelStore.selectedHotels.some((h) => h.name === hotel.name);
}

function selectHotel(hotel: Hotel) {
  hotelStore.selectForCompare(hotel);
}

function handleCenterChange(center: { lat: number; lng: number }) {
  mapCenter.value = center;
}

async function fetchData() {
  const city = route.query.city as string;
  const keyword = route.query.keyword as string;

  if (!city) return;

  loading.value = true;
  error.value = null;

  try {
    const result = await searchHotels({ city, keyword });
    hotelStore.setHotels(result.hotels);
    sources.value = result.sources;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '搜索失败';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>
