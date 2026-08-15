import { useQuery } from '@tanstack/react-query';
import { getPublicData, getPublicDataHealth } from '@/lib/api/client';
import type { PublicDataParams, PublicDataService } from '@/types/public-data';

function useService(service: PublicDataService, params: PublicDataParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['public-data', service, params],
    queryFn: async () => {
      const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('공공데이터 응답 시간이 초과되었습니다.')), 8_000));
      return Promise.race([getPublicData(service, params), timeout]);
    },
    enabled,
    staleTime: 5 * 60_000,
    retry: 0,
  });
}
export const useWeatherAlert = (params?: PublicDataParams) => useService('weather-alert', params);
export const useShortTermForecast = (params?: PublicDataParams, enabled = true) => useService('short-term-forecast', params, enabled);
export const useWaveObservation = (params?: PublicDataParams, enabled = true) => useService('wave-observation', params, enabled);
export const useTidalCurrent = (params?: PublicDataParams) => useService('tidal-current', params);
export const useTidalObservation = (params?: PublicDataParams, enabled = true) => useService('tidal-observation', params, enabled);
export const useTideForecast = (params?: PublicDataParams, enabled = true) => useService('tide-forecast', params, enabled);
export const useOceanBuoy = (params?: PublicDataParams, enabled = true) => useService('ocean-buoy', params, enabled);
export const useMarineForecast = (params?: PublicDataParams) => useService('marine-forecast', params);
export const usePublicDataHealth = () => useQuery({ queryKey: ['public-data', 'health'], queryFn: getPublicDataHealth, staleTime: 60_000, retry: 1 });
