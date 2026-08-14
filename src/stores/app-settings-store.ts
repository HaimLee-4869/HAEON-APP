import { create } from 'zustand';
interface AppSettings { sensitivity: '낮음' | '보통' | '높음'; riskNotifications: boolean; nightMode: boolean; activityStart: string; activityEnd: string; setRiskNotifications: (value: boolean) => void; setNightMode: (value: boolean) => void }
export const useAppSettingsStore = create<AppSettings>((set) => ({ sensitivity: '보통', riskNotifications: true, nightMode: true, activityStart: '06:00', activityEnd: '20:00', setRiskNotifications: (riskNotifications) => set({ riskNotifications }), setNightMode: (nightMode) => set({ nightMode }) }));
