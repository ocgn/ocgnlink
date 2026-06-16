<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <!-- 搜索栏 -->
    <div class="mb-6">
      <SearchBar />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex flex-col items-center py-20">
      <div class="relative w-16 h-16 mb-4">
        <div class="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
        <div class="absolute inset-2 bg-blue-50 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </div>
      <span class="text-gray-500">正在搜索酒店数据...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="text-center py-20">
      <svg class="w-16 h-16 mx-auto mb-4 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <p class="text-red-500 mb-3">{{ error }}</p>
      <button class="px-5 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors" @click="fetchData">
        重试
      </button>
    </div>

    <!-- 搜索结果 -->
    <template v-else>
      <!-- 统计栏 -->
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-900">酒店列表</h2>
          <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
            {{ hotelStore.hotels.length }} 个结果
          </span>
          <span v-if="dataSource === 'amap'" class="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs">
            高德 POI 数据
          </span>
        </div>
        <!-- 排序 -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-400">排序：</span>
          <button
            v-for="opt in sortOptions"
            :key="opt.key"
            class="px-3 py-1.5 text-sm rounded-lg transition-all duration-200"
            :class="sortBy === opt.key
              ? 'bg-gray-900 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-100'"
            @click="sortBy = opt.key"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- 已选择对比条 -->
      <div v-if="hotelStore.selectedHotels.length > 0" class="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex items-center justify-between">
            <span class="text-sm text-blue-700">
              已选择 <strong>{{ hotelStore.selectedHotels.length }}</strong> 家酒店进行对比
            </span>
            <div class="flex gap-2">
              <button
                class="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                @click="hotelStore.clearSelection()"
              >
                清除
              </button>
              <router-link
                to="/compare"
                class="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                去对比 →
              </router-link>
            </div>
          </div>

          <!-- 酒店网格 -->
          <div v-if="sortedHotels.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <HotelCard
              v-for="hotel in sortedHotels"
              :key="hotel.name"
              :hotel="hotel"
              :selected="isSelected(hotel)"
              @select="selectHotel"
            />
          </div>

          <!-- 空结果 -->
          <div v-else class="text-center py-16">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p class="text-gray-400">未找到相关酒店</p>
          </div>

      <!-- AI 分析面板 -->
      <div class="mt-8">
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
import AiPanel from '@/components/AiPanel.vue';
import { useHotelStore } from '@/stores/hotel';
import { searchHotels } from '@/api/hotels';
import type { Hotel } from '../../../workers/shared/types';

const route = useRoute();
const hotelStore = useHotelStore();

const loading = ref(false);
const error = ref<string | null>(null);
const dataSource = ref('');
const sortBy = ref<string>('default');

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

async function fetchData() {
  const city = route.query.city as string;
  const keyword = route.query.keyword as string;

  if (!city) return;

  loading.value = true;
  error.value = null;

  try {
    const result = await searchHotels({ city, keyword });
    hotelStore.setHotels(result.hotels);
    dataSource.value = result.source;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '搜索失败';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>
