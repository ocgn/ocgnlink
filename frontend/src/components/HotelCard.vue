<template>
  <div
      class="group bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden"
      :class="{ 'ring-2 ring-blue-500 shadow-blue-100': selected }"
  >
    <!-- 图片 -->
    <div class="relative h-32 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
      <img
          v-if="hotel.images.length > 0"
          :src="hotel.images[0]"
          :alt="hotel.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
      />
      <div v-else class="flex items-center justify-center h-full text-gray-300">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      </div>
      <!-- 价格标签 -->
      <div class="absolute bottom-1.5 left-1.5 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 shadow-sm">
        <span class="text-sm font-bold text-red-500">¥{{ hotel.price }}</span>
      </div>
    </div>

    <!-- 信息 -->
    <div class="p-3">
      <h3 class="font-medium text-sm text-gray-900 truncate mb-1.5">{{ hotel.name }}</h3>

      <div class="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
        <div class="flex items-center gap-0.5">
          <svg class="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <span class="font-medium text-gray-700">{{ hotel.rating.toFixed(1) }}</span>
        </div>
        <span v-if="hotel.distance > 0">{{ hotel.distance > 1000 ? (hotel.distance / 1000).toFixed(1) + 'km' : hotel.distance + 'm' }}</span>
      </div>

      <p class="text-xs text-gray-400 truncate mb-1.5">{{ hotel.address }}</p>

      <!-- 房型/设施 -->
      <div class="flex items-center gap-1 mb-1.5">
        <span class="text-xs text-gray-400">{{ hotel.roomType }}</span>
        <span v-if="hotel.facilities.length > 0" class="text-xs text-gray-300">·</span>
        <span v-if="hotel.facilities.length > 0" class="text-xs text-gray-400 truncate">{{ hotel.facilities.slice(0, 2).join(' · ') }}</span>
      </div>

      <!-- 位置地图 -->
      <div v-if="hotel.lat && hotel.lng" class="mb-2 rounded-md overflow-hidden border border-gray-50 group relative">
        <a :href="getMapLink(hotel.lng, hotel.lat, hotel.name)" target="_blank" rel="noopener noreferrer">
          <img
              :src="getStaticMapUrl(hotel.lng, hotel.lat, hotel.name, '400*100', '14')"
              :alt="hotel.name + '位置'"
              class="w-full h-14 object-cover"
              loading="lazy"
          />
          <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 flex items-center justify-center">
            <span class="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded text-xs text-blue-600">查看地图</span>
          </div>
        </a>
      </div>

      <!-- 操作 -->
      <button
          class="w-full py-1.5 text-xs font-medium rounded-md transition-colors duration-200"
          :class="selected
          ? 'bg-green-50 text-green-600 border border-green-200'
          : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'"
          @click="$emit('select', hotel)"
      >
        <span class="flex items-center justify-center gap-1">
          <svg v-if="selected" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          {{ selected ? '已添加' : '加入对比' }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {Hotel} from '../../../workers/shared/types';
import {getStaticMapUrl, getMapLink} from '@/api/map';

defineProps<{
  hotel: Hotel;
  selected?: boolean;
}>();

defineEmits<{
  select: [hotel: Hotel];
}>();
</script>
