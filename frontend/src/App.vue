<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <router-link to="/" class="text-xl font-bold text-blue-600">
          酒店对比
        </router-link>
        <nav class="text-sm text-gray-500">
          美团 vs 携程
        </nav>
      </div>
    </header>
    <main class="flex-1">
      <router-view />
    </main>
  </div>
</template>
