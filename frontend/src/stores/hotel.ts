import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Hotel } from '../../../workers/shared/types';

export const useHotelStore = defineStore('hotel', () => {
  const hotels = ref<Hotel[]>([]);
  const selectedHotels = ref<Hotel[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  function setHotels(data: Hotel[]) {
    hotels.value = data;
  }

  function selectForCompare(hotel: Hotel) {
    if (selectedHotels.value.length >= 4) return;
    if (selectedHotels.value.some((h) => h.name === hotel.name)) return;
    selectedHotels.value.push(hotel);
  }

  function removeFromCompare(hotel: Hotel) {
    selectedHotels.value = selectedHotels.value.filter((h) => h.name !== hotel.name);
  }

  function clearSelection() {
    selectedHotels.value = [];
  }

  return {
    hotels, selectedHotels, loading, error,
    setHotels, selectForCompare, removeFromCompare, clearSelection,
  };
});
