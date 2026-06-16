<template>
  <div class="flex flex-col items-center justify-center px-4" style="min-height: calc(100vh - 57px);">
    <div class="text-center mb-10">
      <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-200">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h1 class="text-4xl font-bold text-gray-900 mb-3">Hotel comparison</h1>
      <p class="text-gray-500 text-lg">Search and compare hotels with AI recommendations</p>
    </div>

    <div class="w-full max-w-xl mb-12">
      <SearchBar />
    </div>

    <div class="grid grid-cols-3 gap-6 max-w-2xl">
      <div class="p-5 bg-white rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md hover:border-blue-100 transition-all duration-300">
        <div class="w-10 h-10 mx-auto mb-3 rounded-lg bg-blue-50 flex items-center justify-center">
          <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div class="font-medium text-sm text-gray-900 mb-1">搜索</div>
        <div class="text-xs text-gray-400">输入目的地搜索酒店</div>
      </div>
      <div class="p-5 bg-white rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md hover:border-blue-100 transition-all duration-300">
        <div class="w-10 h-10 mx-auto mb-3 rounded-lg bg-green-50 flex items-center justify-center">
          <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="font-medium text-sm text-gray-900 mb-1">对比</div>
        <div class="text-xs text-gray-400">多酒店并排对比细节</div>
      </div>
      <div class="p-5 bg-white rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md hover:border-purple-100 transition-all duration-300">
        <div class="w-10 h-10 mx-auto mb-3 rounded-lg bg-purple-50 flex items-center justify-center">
          <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div class="font-medium text-sm text-gray-900 mb-1">AI 推荐</div>
        <div class="text-xs text-gray-400">DeepSeek 智能分析</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SearchBar from '@/components/SearchBar.vue';
</script>
