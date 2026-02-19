import { writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { PROVIDERS, type ProviderName } from "@/lib/providers";

const CONFIG_PATH = process.env.OPENCLAW_CONFIG_PATH || "/openclaw-config/openclaw.json";

interface OpenClawConfigParams {
  provider: ProviderName;
  apiKey: string;
  model: string;
}

export function writeOpenClawConfig({ provider, apiKey, model }: OpenClawConfigParams) {
  const config = {
    gateway: { mode: "local" },
    env: {
      [PROVIDERS[provider].envVar]: apiKey,
    },
    agents: {
      defaults: {
        model: { primary: model },
      },
    },
  };

  const dir = dirname(CONFIG_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}
