import { useQuery } from '@tanstack/react-query';
import { getPublicData, getPublicDataHealth } from '@/lib/api/client';
import type { PublicDataParams, PublicDataService } from '@/types/public-data';

function useService(service: PublicDataService, params: PublicDataParams = {}, enabled = true) {
  return useQuery({ queryKey: ['public-data', service, params], queryFn: () => getPublicData(service, params), enabled, staleTime: 5 * 60_000, retry: 1 });
}
export const useWeatherAlert = (params?: PublicDataParams) => useService('weather-alert', params);
export const useShortTermForecast = (params?: PublicDataParams, enabled = true) => useService('short-term-forecast', params, enabled);
export const useWaveObservation = (params?: PublicDataParams) => useService('wave-observation', params);
export const useTidalCurrent = (params?: PublicDataParams) => useService('tidal-current', params);
export const useTidalObservation = (params?: PublicDataParams) => useService('tidal-observation', params);
export const useTideForecast = (params?: PublicDataParams, enabled = true) => useService('tide-forecast', params, enabled);
export const useOceanBuoy = (params?: PublicDataParams) => useService('ocean-buoy', params);
export const useMarineForecast = (params?: PublicDataParams) => useService('marine-forecast', params);
export const usePublicDataHealth = () => useQuery({ queryKey: ['public-data', 'health'], queryFn: getPublicDataHealth, staleTime: 60_000, retry: 1 });
