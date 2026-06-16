<template>
  <div
    class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4"
    :class="{ 'ring-2 ring-blue-400': selected }"
  >
    <!-- 图片 -->
    <div class="relative h-40 bg-gray-100 rounded-md overflow-hidden mb-3">
      <img
        v-if="hotel.images.length > 0"
        :src="hotel.images[0]"
        :alt="hotel.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <div v-else class="flex items-center justify-center h-full text-gray-400 text-sm">
        暂无图片
      </div>
      <span
        class="absolute top-2 right-2 px-2 py-0.5 rounded text-xs text-white font-medium"
        :class="hotel.source === 'meituan' ? 'bg-yellow-500' : 'bg-blue-500'"
      >
        {{ hotel.source === 'meituan' ? '美团' : '携程' }}
      </span>
    </div>

    <!-- 信息 -->
    <h3 class="font-medium text-sm line-clamp-2 mb-1">{{ hotel.name }}</h3>
    <div class="flex items-center gap-2 text-sm mb-1">
      <span class="text-lg font-bold text-red-500">¥{{ hotel.price }}</span>
      <span class="text-gray-400 text-xs">/晚</span>
    </div>
    <div class="flex items-center gap-1 text-sm text-gray-500 mb-1">
      <span class="text-yellow-400">★</span>
      <span>{{ hotel.rating.toFixed(1) }}</span>
      <span class="mx-1">·</span>
      <span v-if="hotel.distance > 0">{{ hotel.distance }}m</span>
    </div>
    <p class="text-xs text-gray-400 truncate">{{ hotel.address }}</p>

    <!-- 操作 -->
    <div class="mt-3 flex gap-2">
      <button
        class="flex-1 px-3 py-1.5 text-sm border border-blue-500 text-blue-500 rounded hover:bg-blue-50"
        :disabled="selected"
        @click="$emit('select', hotel)"
      >
        {{ selected ? '已选择' : '对比' }}
      </button>
      <a
        :href="hotel.url"
        target="_blank"
        rel="noopener noreferrer"
        class="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
      >
        查看原文
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Hotel } from '../../../workers/shared/types';

defineProps<{
  hotel: Hotel;
  selected?: boolean;
}>();

defineEmits<{
  select: [hotel: Hotel];
}>();
</script>
