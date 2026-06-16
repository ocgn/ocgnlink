import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface SearchParams {
  city: string;
  keyword?: string;
  lat?: number;
  lng?: number;
}

export const useSearchStore = defineStore('search', () => {
  const params = ref<SearchParams>({ city: '' });
  const loading = ref(false);

  function setSearchParams(newParams: SearchParams) {
    params.value = { ...newParams };
  }

  function setLoading(val: boolean) {
    loading.value = val;
  }

  return { params, loading, setSearchParams, setLoading };
});
