<template>
  <form @submit.prevent="doSearch" class="flex items-center gap-2 p-1.5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-300">
    <!-- 城市下拉 -->
    <div class="relative w-36">
      <input
        v-model="cityInput"
        type="text"
        placeholder="城市"
        class="w-full px-3 py-2.5 bg-gray-50 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm transition-all"
        @focus="cityOpen = true"
        @input="onCityInput"
        @keydown.down.prevent="cityIdx < filteredCities.length - 1 ? cityIdx++ : null"
        @keydown.up.prevent="cityIdx > 0 ? cityIdx-- : null"
        @keydown.enter.prevent="selectCity"
        @keydown.escape="cityOpen = false"
        @blur="onCityBlur"
      />
      <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
      <div
        v-if="cityOpen && filteredCities.length > 0"
        class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-56 overflow-y-auto"
      >
        <button
          v-for="(c, i) in filteredCities"
          :key="c"
          type="button"
          class="w-full px-3 py-2 text-sm text-left transition-colors flex items-center gap-2"
          :class="i === cityIdx ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'"
          @mousedown.prevent="pickCity(c)"
        >
          <svg v-if="c === citySelected" class="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span :class="c === citySelected ? 'font-medium' : ''">{{ c }}</span>
        </button>
      </div>
    </div>

    <!-- 地标下拉 -->
    <div class="relative flex-1">
      <input
        ref="kwRef"
        v-model="kwInput"
        type="text"
        placeholder="酒店或地标"
        class="w-full px-3 py-2.5 bg-gray-50 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm transition-all"
        @focus="kwOpen = true"
        @input="onKwInput"
        @keydown.down.prevent="kwIdx < filteredLks.length - 1 ? kwIdx++ : null"
        @keydown.up.prevent="kwIdx > 0 ? kwIdx-- : null"
        @keydown.enter.prevent="selectLk"
        @keydown.escape="kwOpen = false"
        @blur="onKwBlur"
      />
      <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
      <div
        v-if="kwOpen && filteredLks.length > 0"
        class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-56 overflow-y-auto"
      >
        <button
          v-for="(lm, i) in filteredLks"
          :key="lm.name"
          type="button"
          class="w-full px-3 py-2 text-sm text-left transition-colors flex items-center gap-2"
          :class="i === kwIdx ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'"
          @mousedown.prevent="pickLk(lm.name)"
        >
          <span>{{ lm.icon }}</span>
          <span>{{ lm.name }}</span>
          <span class="text-xs text-gray-400 ml-auto">{{ lm.tag }}</span>
        </button>
      </div>
    </div>

    <button
      type="submit"
      class="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium flex-shrink-0"
    >
      <span class="flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        搜索
      </span>
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const CITIES = [
  '北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '西安', '重庆', '南京',
  '苏州', '天津', '长沙', '郑州', '东莞', '青岛', '沈阳', '宁波', '昆明', '大连',
  '厦门', '合肥', '佛山', '福州', '哈尔滨', '济南', '温州', '长春', '石家庄', '常州',
  '泉州', '南宁', '贵阳', '南昌', '太原', '烟台', '嘉兴', '南通', '金华', '珠海',
  '惠州', '徐州', '海口', '乌鲁木齐', '绍兴', '中山', '台州', '兰州', '三亚', '无锡',
  '呼和浩特', '银川', '西宁', '拉萨', '桂林', '丽江', '大理', '洛阳', '黄山', '张家界',
];

interface Lk { name: string; icon: string; tag: string; city: string }

const LANDMARKS: Lk[] = [
  { name: '天安门广场', icon: '🏛️', tag: '地标', city: '北京' },
  { name: '故宫博物院', icon: '🏯', tag: '景点', city: '北京' },
  { name: '王府井', icon: '🛍️', tag: '商圈', city: '北京' },
  { name: '三里屯', icon: '🌃', tag: '商圈', city: '北京' },
  { name: '国贸', icon: '🏢', tag: '商圈', city: '北京' },
  { name: '西单', icon: '🛍️', tag: '商圈', city: '北京' },
  { name: '南锣鼓巷', icon: '🏘️', tag: '景点', city: '北京' },
  { name: '颐和园', icon: '🌳', tag: '景点', city: '北京' },
  { name: '八达岭长城', icon: '🧱', tag: '景点', city: '北京' },
  { name: '东方明珠', icon: '🗼', tag: '地标', city: '上海' },
  { name: '外滩', icon: '🌉', tag: '景点', city: '上海' },
  { name: '南京路步行街', icon: '🛍️', tag: '商圈', city: '上海' },
  { name: '陆家嘴', icon: '🏢', tag: '商圈', city: '上海' },
  { name: '迪士尼', icon: '🎢', tag: '景点', city: '上海' },
  { name: '广州塔', icon: '🗼', tag: '地标', city: '广州' },
  { name: '珠江新城', icon: '🏢', tag: '商圈', city: '广州' },
  { name: '长隆', icon: '🐼', tag: '景点', city: '广州' },
  { name: '华强北', icon: '💻', tag: '商圈', city: '深圳' },
  { name: '世界之窗', icon: '🌍', tag: '景点', city: '深圳' },
  { name: '春熙路', icon: '🛍️', tag: '商圈', city: '成都' },
  { name: '宽窄巷子', icon: '🏘️', tag: '景点', city: '成都' },
  { name: '大熊猫基地', icon: '🐼', tag: '景点', city: '成都' },
  { name: '西湖', icon: '🏞️', tag: '景点', city: '杭州' },
  { name: '灵隐寺', icon: '🙏', tag: '景点', city: '杭州' },
  { name: '大雁塔', icon: '🗼', tag: '景点', city: '西安' },
  { name: '钟楼', icon: '🏛️', tag: '地标', city: '西安' },
  { name: '兵马俑', icon: '🏺', tag: '景点', city: '西安' },
  { name: '黄鹤楼', icon: '🏯', tag: '景点', city: '武汉' },
  { name: '户部巷', icon: '🍜', tag: '美食', city: '武汉' },
  { name: '洪崖洞', icon: '🏮', tag: '景点', city: '重庆' },
  { name: '解放碑', icon: '🗽', tag: '地标', city: '重庆' },
  { name: '夫子庙', icon: '🏛️', tag: '景点', city: '南京' },
  { name: '鼓浪屿', icon: '🏝️', tag: '景点', city: '厦门' },
  { name: '栈桥', icon: '🌉', tag: '景点', city: '青岛' },
  { name: '丽江古城', icon: '🏘️', tag: '景点', city: '丽江' },
  { name: '大理古城', icon: '🏘️', tag: '景点', city: '大理' },
  { name: '布达拉宫', icon: '🏛️', tag: '景点', city: '拉萨' },
  { name: '橘子洲', icon: '🏞️', tag: '景点', city: '长沙' },
  { name: '三亚海滩', icon: '🏖️', tag: '景点', city: '三亚' },
  { name: '黄山', icon: '⛰️', tag: '景点', city: '黄山' },
  { name: '张家界', icon: '🏔️', tag: '景点', city: '张家界' },
  { name: '冰雪大世界', icon: '❄️', tag: '景点', city: '哈尔滨' },
];

const router = useRouter();
const route = useRoute();

// City
const cityInput = ref('');
const citySelected = ref('');
const cityOpen = ref(false);
const cityIdx = ref(0);

// Landmark
const kwRef = ref<HTMLInputElement | null>(null);
const kwInput = ref('');
const kwOpen = ref(false);
const kwIdx = ref(0);

// 过滤城市
const filteredCities = computed(() => {
  const q = cityInput.value.trim().toLowerCase();
  if (!q) return CITIES;
  return CITIES.filter((c) => c.toLowerCase().includes(q));
});

// 过滤地标（按选中城市+输入文字）
const filteredLks = computed(() => {
  let list = LANDMARKS;
  if (citySelected.value) {
    list = list.filter((l) => l.city === citySelected.value);
  }
  const q = kwInput.value.trim().toLowerCase();
  if (q) {
    list = list.filter((l) => l.name.toLowerCase().includes(q) || l.tag.includes(q));
  }
  return list;
});

function onCityInput() {
  cityOpen.value = true;
  cityIdx.value = 0;
  citySelected.value = '';
}

function onCityBlur() {
  setTimeout(() => cityOpen.value = false, 160);
}

function onKwBlur() {
  setTimeout(() => kwOpen.value = false, 160);
}

function pickCity(name: string) {
  cityInput.value = name;
  citySelected.value = name;
  cityOpen.value = false;
  // 自动弹出地标下拉
  kwOpen.value = true;
  kwIdx.value = 0;
  setTimeout(() => kwRef.value?.focus(), 50);
}

function selectCity() {
  const c = filteredCities.value[cityIdx.value];
  if (c) pickCity(c);
}

function onKwInput() {
  kwOpen.value = true;
  kwIdx.value = 0;
}

function pickLk(name: string) {
  kwInput.value = name;
  kwOpen.value = false;
}

function selectLk() {
  const lm = filteredLks.value[kwIdx.value];
  if (lm) pickLk(lm.name);
}

// URL 恢复
onMounted(() => {
  const c = (route.query.city as string) || '';
  cityInput.value = c;
  citySelected.value = c;
  kwInput.value = (route.query.keyword as string) || '';
});

function doSearch() {
  const c = cityInput.value.trim();
  if (!c) return;
  citySelected.value = c;
  const q: Record<string, string> = { city: c };
  if (kwInput.value.trim()) q.keyword = kwInput.value.trim();
  router.push({ path: '/search', query: q });
}
</script>
