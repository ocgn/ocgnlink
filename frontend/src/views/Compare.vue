<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h2 class="text-xl font-bold text-gray-900">酒店对比</h2>
        <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
          {{ hotelStore.selectedHotels.length }} 家酒店
        </span>
      </div>
      <button
          v-if="hotelStore.selectedHotels.length > 0"
          class="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          @click="hotelStore.clearSelection()"
      >
        清除所有
      </button>
    </div>

    <!-- 无选择状态 -->
    <div v-if="hotelStore.selectedHotels.length === 0" class="text-center py-20">
      <svg class="w-20 h-20 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="text-gray-400 mb-3">还没有选择任何酒店</p>
      <router-link to="/"
                   class="px-5 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors inline-block">
        去搜索
      </router-link>
    </div>

    <!-- 对比卡片 -->
    <template v-else>
      <div class="grid gap-5" :class="gridClass">
        <div
            v-for="hotel in hotelStore.selectedHotels"
            :key="hotel.name"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          <!-- 图片 -->
          <div class="relative h-52 bg-gradient-to-br from-blue-50 to-indigo-50">
            <img
                v-if="hotel.images.length > 0"
                :src="hotel.images[0]"
                :alt="hotel.name"
                class="w-full h-full object-cover"
            />
            <div v-else class="flex items-center justify-center h-full text-gray-300">
              <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <button
                class="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-50 transition-colors shadow-sm"
                @click="hotelStore.removeFromCompare(hotel)"
            >
              <svg class="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor"
                   viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <!-- 价格标签 -->
            <div class="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm">
              <span class="text-2xl font-bold text-red-500">¥{{ hotel.price }}</span>
              <span class="text-xs text-gray-400">/晚</span>
            </div>
          </div>

          <div class="p-5">
            <h3 class="font-semibold text-gray-900 text-lg mb-3">{{ hotel.name }}</h3>

            <!-- 详情表格 -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-400">评分</span>
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span class="font-medium text-gray-700">{{ hotel.rating.toFixed(1) }}</span>
                </span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-400">地址</span>
                <span class="text-gray-600 text-right max-w-[60%] truncate">{{ hotel.address }}</span>
              </div>
              <div v-if="hotel.lat && hotel.lng"
                   class="my-2 rounded-lg overflow-hidden border border-gray-100 group relative">
                <a :href="getMapLink(hotel.lng, hotel.lat, hotel.name)" target="_blank" rel="noopener noreferrer"
                   title="在高德地图中查看位置">
                  <img
                      :src="getStaticMapUrl(hotel.lng, hotel.lat, hotel.name, '400*120', '14')"
                      :alt="hotel.name + '位置'"
                      class="w-full h-24 object-cover"
                      loading="lazy"
                  />
                  <div
                      class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/5">
                    <span
                        class="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-xs text-blue-600">在高德地图中查看</span>
                  </div>
                </a>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-400">距离</span>
                <span class="text-gray-600">{{
                    hotel.distance > 1000 ? (hotel.distance / 1000).toFixed(1) + 'km' : hotel.distance + 'm'
                  }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-400">房型</span>
                <span class="text-gray-600">{{ hotel.roomType || '—' }}</span>
              </div>
            </div>

            <!-- 设施 -->
            <div class="mt-4 pt-4 border-t border-gray-50">
              <span class="text-xs text-gray-400 mb-2 block">设施</span>
              <div class="flex flex-wrap gap-1.5">
                <span
                    v-for="facility in hotel.facilities.slice(0, 6)"
                    :key="facility"
                    class="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs"
                >
                  {{ facility }}
                </span>
                <span v-if="hotel.facilities.length === 0" class="text-xs text-gray-300">暂无信息</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI 分析 -->
      <div class="mt-8">
        <AiPanel/>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import AiPanel from '@/components/AiPanel.vue';
import {getStaticMapUrl, getMapLink} from '@/api/map';
import {useHotelStore} from '@/stores/hotel';

const hotelStore = useHotelStore();

const gridClass = computed(() => {
  const count = hotelStore.selectedHotels.length;
  if (count <= 1) return 'grid-cols-1 max-w-md mx-auto';
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
  if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
});
</script>
