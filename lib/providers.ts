export type Provider = "anthropic" | "google" | "openrouter";

export interface ModelOption {
  id: string;
  label: string;
}

export const ANTHROPIC_MODELS: ModelOption[] = [
  { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
];

export const GOOGLE_MODELS: ModelOption[] = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
];

export interface ChatSettings {
  provider: Provider;
  apiKey: string;
  modelId: string;
}

export const DEFAULT_SETTINGS: ChatSettings = {
  provider: "anthropic",
  apiKey: "",
  modelId: "claude-sonnet-4-6",
};

export const SETTINGS_KEY = "brain_chat_settings";

export function loadSettings(): ChatSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      provider: parsed.provider ?? DEFAULT_SETTINGS.provider,
      apiKey: parsed.apiKey ?? "",
      modelId: parsed.modelId ?? DEFAULT_SETTINGS.modelId,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ChatSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getProviderLabel(provider: Provider): string {
  switch (provider) {
    case "anthropic":
      return "Anthropic";
    case "google":
      return "Google Gemini";
    case "openrouter":
      return "OpenRouter";
  }
}
