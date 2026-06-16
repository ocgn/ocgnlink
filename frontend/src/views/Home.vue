<template>
  <div class="flex flex-col items-center justify-center px-4" style="min-height: calc(100vh - 57px);">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">酒店对比</h1>
      <p class="text-gray-500">一站式对比美团和携程酒店数据，AI 智能推荐</p>
    </div>
    <div class="w-full max-w-xl">
      <SearchBar />
    </div>
    <div class="mt-12 grid grid-cols-3 gap-6 max-w-2xl text-center text-sm">
      <div class="p-4 bg-white rounded-lg shadow-sm border">
        <div class="text-2xl mb-1">🔍</div>
        <div class="font-medium">搜索</div>
        <div class="text-gray-400 mt-1">输入目的地即可搜索</div>
      </div>
      <div class="p-4 bg-white rounded-lg shadow-sm border">
        <div class="text-2xl mb-1">📊</div>
        <div class="font-medium">对比</div>
        <div class="text-gray-400 mt-1">美团携程数据并排展示</div>
      </div>
      <div class="p-4 bg-white rounded-lg shadow-sm border">
        <div class="text-2xl mb-1">🤖</div>
        <div class="font-medium">AI 推荐</div>
        <div class="text-gray-400 mt-1">智能分析给出最佳选择</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SearchBar from '@/components/SearchBar.vue';
</script>
