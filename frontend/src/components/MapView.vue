<template>
  <div class="relative w-full h-full min-h-[300px] bg-gray-100 rounded-lg overflow-hidden">
    <div ref="mapContainer" class="w-full h-full"></div>
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
      <span class="text-gray-500">地图加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import AMapLoader from '@amap/amap-jsapi-loader';
import { CONFIG } from '@/config';

const props = defineProps<{
  center?: { lat: number; lng: number };
  markers?: Array<{ lat: number; lng: number; name: string }>;
  zoom?: number;
}>();

const emit = defineEmits<{
  centerChange: [center: { lat: number; lng: number }];
}>();

const mapContainer = ref<HTMLDivElement>();
const loading = ref(true);
let map: any = null;
let markersList: any[] = [];

async function initMap() {
  if (!mapContainer.value) return;

  try {
    const AMap = await AMapLoader.load({
      key: CONFIG.amapJsKey,
      version: CONFIG.amapJsVersion,
    });

    map = new AMap.Map(mapContainer.value, {
      zoom: props.zoom || 15,
      center: props.center ? [props.center.lng, props.center.lat] : [116.397428, 39.90923],
      viewMode: '2D',
    });

    loading.value = false;

    map.on('moveend', () => {
      if (map) {
        const center = map.getCenter();
        emit('centerChange', { lat: center.getLat(), lng: center.getLng() });
      }
    });

    updateMarkers();
  } catch (err) {
    console.error('AMap load failed:', err);
    loading.value = false;
  }
}

function updateMarkers() {
  if (!map || !props.markers) return;

  // 清除旧标记
  markersList.forEach((m) => map?.remove(m));
  markersList = [];

  AMapLoader.load({ key: CONFIG.amapJsKey, version: CONFIG.amapJsVersion }).then((AMap: any) => {
    props.markers?.forEach((loc) => {
      const marker = new AMap.Marker({
        position: [loc.lng, loc.lat],
        title: loc.name,
        label: { content: loc.name, direction: 'top' },
      });
      map?.add(marker);
      markersList.push(marker);
    });
  });
}

watch(() => props.markers, updateMarkers, { deep: true });

onMounted(initMap);
</script>
