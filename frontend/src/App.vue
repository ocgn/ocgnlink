<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <router-link to="/" class="flex items-center gap-2 text-xl font-bold text-blue-600">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Hotel comparison
        </router-link>
        <nav class="flex items-center gap-4 text-sm text-gray-400"></nav>
      </div>
    </header>
    <main class="flex-1">
      <router-view />
    </main>
  </div>
</template>
