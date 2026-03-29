import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encryptedStorage } from '../storage/encryptedStorage';

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────

export type LuggageSize = 'carry-on' | 'checked';
export type TransportPreference = 'transit' | 'taxi' | 'any';
export type BufferLevel = 'tight' | 'normal' | 'relaxed';

export interface Settings {
  luggageSize: LuggageSize;
  transportPreference: TransportPreference;
  bufferLevel: BufferLevel;
}

interface SettingsStore {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
}

// ─────────────────────────────────────────────
// 기본값
// ─────────────────────────────────────────────

const DEFAULT_SETTINGS: Settings = {
  luggageSize: 'carry-on',
  transportPreference: 'any',
  bufferLevel: 'normal',
};

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
    }),
    {
      name: 'tripframe-settings',
      storage: createJSONStorage(() => encryptedStorage),
    },
  ),
);
