<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 class="font-semibold text-gray-900">AI 智能分析</h3>
        <span class="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs font-medium">DeepSeek</span>
      </div>
      <button
        class="px-5 py-2 text-sm font-medium rounded-xl transition-all duration-200"
        :class="hasData && !loading
          ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-sm hover:shadow-md'
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
        :disabled="!hasData || loading"
        @click="handleAnalyze"
      >
        <span class="flex items-center gap-1.5">
          <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ loading ? '分析中...' : '开始分析' }}
        </span>
      </button>
    </div>

    <!-- 提示信息 -->
    <div v-if="!hasData" class="text-sm text-gray-400 text-center py-10">
      <svg class="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      请先搜索酒店数据
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="flex flex-col items-center py-10">
      <div class="relative w-16 h-16 mb-4">
        <div class="absolute inset-0 border-4 border-purple-100 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
        <div class="absolute inset-2 bg-purple-50 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      <span class="text-sm text-gray-500">DeepSeek 正在分析酒店数据...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="text-sm text-center py-10">
      <svg class="w-12 h-12 mx-auto mb-3 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <p class="text-red-500 mb-2">{{ error }}</p>
      <button class="text-sm text-purple-500 hover:text-purple-600 hover:underline" @click="handleAnalyze">重试</button>
    </div>

    <!-- 分析结果 -->
    <div v-else-if="result" class="space-y-4">
      <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
        <div class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {{ result.analysis }}
        </div>
      </div>
      <div v-if="result.recommendation" class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
        <div class="flex items-center gap-2 mb-2">
          <svg class="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
          </svg>
          <span class="text-xs font-semibold text-amber-700">推荐结论</span>
        </div>
        <p class="text-sm text-amber-900">{{ result.recommendation }}</p>
      </div>
      <div class="text-xs text-gray-400 text-right">
        由 DeepSeek 模型生成 · {{ result.model }}
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
const loading = ref(false);
const error = ref<string | null>(null);
const result = ref<AiAnalyzeResponse | null>(null);

const hasData = computed(() => hotelStore.hotels.length > 0);

async function handleAnalyze() {
  loading.value = true;
  error.value = null;
  result.value = null;

  try {
    const data = await analyzeHotels(hotelStore.hotels, [], 'deepseek');
    result.value = data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'AI 分析失败';
  } finally {
    loading.value = false;
  }
}
</script>
