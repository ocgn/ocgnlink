<template>
  <div class="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border">
    <input
      v-model="city"
      type="text"
      placeholder="城市（如：北京）"
      class="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      @keyup.enter="handleSearch"
    />
    <input
      v-model="keyword"
      type="text"
      placeholder="酒店名称或地标（可选）"
      class="flex-[2] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      @keyup.enter="handleSearch"
    />
    <button
      class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      :disabled="!city.trim()"
      @click="handleSearch"
    >
      搜索
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const city = ref('');
const keyword = ref('');

function handleSearch() {
  if (!city.value.trim()) return;
  const query: Record<string, string> = { city: city.value.trim() };
  if (keyword.value.trim()) query.keyword = keyword.value.trim();
  router.push({ name: 'Search', query });
}
</script>
