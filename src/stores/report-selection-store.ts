import { create } from 'zustand';

interface ReportSelectionState {
  selectedId?: string;
  manuallySelected: boolean;
  selectAutomatically: (selectedId: string) => void;
  selectManually: (selectedId: string) => void;
  clear: () => void;
}

export const useReportSelectionStore = create<ReportSelectionState>((set) => ({
  selectedId: undefined,
  manuallySelected: false,
  selectAutomatically: (selectedId) => set((state) => state.manuallySelected ? state : { selectedId }),
  selectManually: (selectedId) => set({ selectedId, manuallySelected: true }),
  clear: () => set({ selectedId: undefined, manuallySelected: false }),
}));
