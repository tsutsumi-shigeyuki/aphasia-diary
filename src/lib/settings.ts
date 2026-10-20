import { AppSettings, DEFAULT_SETTINGS } from "./types";

const KEY = "aphasia-diary-settings";

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>) {
  localStorage.setItem(KEY, JSON.stringify({ ...loadSettings(), ...settings }));
}
