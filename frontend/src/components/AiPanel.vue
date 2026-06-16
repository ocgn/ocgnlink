<template>
  <div class="bg-white rounded-lg shadow-sm border p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium">AI 分析</h3>
      <div class="flex gap-2">
        <select
          v-model="provider"
          class="text-sm border rounded px-2 py-1"
        >
          <option value="openai">OpenAI</option>
          <option value="claude">Claude</option>
          <option value="deepseek">DeepSeek</option>
        </select>
        <button
          class="px-4 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          :disabled="!hasData || loading"
          @click="handleAnalyze"
        >
          {{ loading ? '分析中...' : '开始分析' }}
        </button>
      </div>
    </div>

    <!-- 提示信息 -->
    <div v-if="!hasData" class="text-sm text-gray-400 text-center py-8">
      请先搜索酒店数据
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="flex flex-col items-center py-8">
      <span class="text-sm text-gray-500">AI 正在分析对比数据...</span>
      <div class="mt-2 w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="text-sm text-red-500 text-center py-8">
      {{ error }}
    </div>

    <!-- 分析结果 -->
    <div v-else-if="result" class="prose prose-sm max-w-none">
      <div class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {{ result.analysis }}
      </div>
      <div v-if="result.recommendation" class="mt-4 p-3 bg-purple-50 rounded-md border border-purple-100">
        <span class="text-xs font-medium text-purple-600">推荐结论</span>
        <p class="text-sm text-purple-900 mt-1">{{ result.recommendation }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { analyzeHotels } from '@/api/ai';
import { useHotelStore } from '@/stores/hotel';
import type { AiAnalyzeResponse } from '../../../workers/shared/types';

const hotelStore = useHotelStore();
const provider = ref('openai');
const loading = ref(false);
const error = ref<string | null>(null);
const result = ref<AiAnalyzeResponse | null>(null);

const hasData = computed(() => hotelStore.hotels.length > 0);

async function handleAnalyze() {
  loading.value = true;
  error.value = null;
  result.value = null;

  try {
    const meituanHotels = hotelStore.hotels.filter((h) => h.source === 'meituan');
    const ctripHotels = hotelStore.hotels.filter((h) => h.source === 'ctrip');
    const data = await analyzeHotels(meituanHotels, ctripHotels, provider.value);
    result.value = data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'AI 分析失败';
  } finally {
    loading.value = false;
  }
}
</script>
