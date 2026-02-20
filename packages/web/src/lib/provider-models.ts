import { PROVIDERS, type ProviderName } from "@/lib/providers";
import { getSetting } from "@/lib/settings";

export interface ModelInfo {
  id: string;
  name: string;
}

export interface ProviderModels {
  id: ProviderName;
  name: string;
  models: ModelInfo[];
}

const FALLBACK_MODELS: Record<ProviderName, ModelInfo[]> = {
  anthropic: [
    { id: "anthropic/claude-opus-4-6", name: "Claude Opus 4.6" },
    { id: "anthropic/claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
    { id: "anthropic/claude-haiku-4-5-20251001", name: "Claude Haiku 4.5" },
  ],
  openai: [
    { id: "openai/gpt-4o", name: "GPT-4o" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "openai/o1", name: "o1" },
  ],
  google: [
    { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash" },
    { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  ],
};

async function fetchAnthropicModels(apiKey: string): Promise<ModelInfo[]> {
  const response = await fetch("https://api.anthropic.com/v1/models", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
  });

  if (!response.ok) {
    return FALLBACK_MODELS.anthropic;
  }

  const data = await response.json();
  return data.data.map((model: { id: string; display_name: string }) => ({
    id: `anthropic/${model.id}`,
    name: model.display_name,
  }));
}

async function fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    return FALLBACK_MODELS.openai;
  }

  const data = await response.json();
  return data.data
    .filter((model: { id: string }) => {
      return model.id.startsWith("gpt-") || model.id.startsWith("o");
    })
    .map((model: { id: string }) => ({
      id: `openai/${model.id}`,
      name: model.id,
    }));
}

async function fetchGoogleModels(apiKey: string): Promise<ModelInfo[]> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);

  if (!response.ok) {
    return FALLBACK_MODELS.google;
  }

  const data = await response.json();
  return data.models
    .filter((model: { supportedGenerationMethods: string[] }) =>
      model.supportedGenerationMethods?.includes("generateContent")
    )
    .map((model: { name: string; displayName: string }) => ({
      id: `google/${model.name.replace("models/", "")}`,
      name: model.displayName,
    }));
}

export async function fetchProviderModels(): Promise<ProviderModels[]> {
  const results: ProviderModels[] = [];

  for (const [providerName, config] of Object.entries(PROVIDERS)) {
    const provider = providerName as ProviderName;
    const apiKey = await getSetting(config.settingsKey);

    if (!apiKey) {
      continue;
    }

    let models: ModelInfo[];

    try {
      switch (provider) {
        case "anthropic":
          models = await fetchAnthropicModels(apiKey);
          break;
        case "openai":
          models = await fetchOpenAIModels(apiKey);
          break;
        case "google":
          models = await fetchGoogleModels(apiKey);
          break;
      }
    } catch {
      models = FALLBACK_MODELS[provider];
    }

    results.push({
      id: provider,
      name: config.name,
      models,
    });
  }

  return results;
}
