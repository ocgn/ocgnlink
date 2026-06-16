<template>
  <div class="max-w-6xl mx-auto px-4 py-4">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-medium">酒店对比</h2>
      <button
        v-if="hotelStore.selectedHotels.length > 0"
        class="text-sm text-gray-500 hover:text-red-500"
        @click="hotelStore.clearSelection()"
      >
        清除所有
      </button>
    </div>

    <!-- 无选择状态 -->
    <div v-if="hotelStore.selectedHotels.length === 0" class="text-center py-16">
      <p class="text-gray-400 mb-2">还没有选择任何酒店</p>
      <router-link to="/" class="text-blue-500 hover:underline">返回搜索</router-link>
    </div>

    <!-- 对比表格 -->
    <template v-else>
      <!-- 酒店卡片横向排列 -->
      <div class="grid gap-4" :class="gridClass">
        <div
          v-for="hotel in hotelStore.selectedHotels"
          :key="`${hotel.source}-${hotel.name}`"
          class="bg-white rounded-lg shadow-sm border p-4"
        >
          <div class="flex items-center justify-between mb-2">
            <span
              class="px-2 py-0.5 rounded text-xs text-white font-medium"
              :class="hotel.source === 'meituan' ? 'bg-yellow-500' : 'bg-blue-500'"
            >
              {{ hotel.source === 'meituan' ? '美团' : '携程' }}
            </span>
            <button
              class="text-gray-400 hover:text-red-500 text-sm"
              @click="hotelStore.removeFromCompare(hotel)"
            >
              ✕
            </button>
          </div>

          <img
            v-if="hotel.images.length > 0"
            :src="hotel.images[0]"
            :alt="hotel.name"
            class="w-full h-48 object-cover rounded-md mb-3"
          />

          <h3 class="font-medium mb-1">{{ hotel.name }}</h3>

          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b">
                <td class="py-2 text-gray-400 w-20">价格</td>
                <td class="py-2 text-xl text-red-500 font-bold">¥{{ hotel.price }}</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 text-gray-400">评分</td>
                <td class="py-2">
                  <span class="text-yellow-400">★</span>
                  {{ hotel.rating.toFixed(1) }}
                </td>
              </tr>
              <tr class="border-b">
                <td class="py-2 text-gray-400">地址</td>
                <td class="py-2 text-gray-600 text-xs">{{ hotel.address }}</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 text-gray-400">距离</td>
                <td class="py-2">{{ hotel.distance }}m</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 text-gray-400">房型</td>
                <td class="py-2">{{ hotel.roomType || '—' }}</td>
              </tr>
              <tr>
                <td class="py-2 text-gray-400">设施</td>
                <td class="py-2">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="facility in hotel.facilities.slice(0, 5)"
                      :key="facility"
                      class="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                    >
                      {{ facility }}
                    </span>
                    <span v-if="hotel.facilities.length > 5" class="text-xs text-gray-400">
                      +{{ hotel.facilities.length - 5 }}
                    </span>
                    <span v-if="hotel.facilities.length === 0" class="text-gray-400">—</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <a
            :href="hotel.url"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 block text-center text-sm text-blue-500 hover:underline"
          >
            查看原文 →
          </a>
        </div>
      </div>

      <!-- AI 分析 -->
      <div class="mt-6">
        <AiPanel />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AiPanel from '@/components/AiPanel.vue';
import { useHotelStore } from '@/stores/hotel';

const hotelStore = useHotelStore();

const gridClass = computed(() => {
  const count = hotelStore.selectedHotels.length;
  if (count <= 2) return 'grid-cols-1 sm:grid-cols-2';
  if (count <= 3) return 'grid-cols-1 sm:grid-cols-3';
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
});
</script>
