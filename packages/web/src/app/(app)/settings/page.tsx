"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "anthropic_api_key", value: apiKey }),
    });
    setSaved(true);
    setApiKey("");
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">LLM Provider</h2>
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium">
            Anthropic API Key
          </label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="mt-1 block w-full rounded border p-2"
          />
        </div>
        <button
          onClick={handleSave}
          className="rounded bg-black text-white px-4 py-2 hover:bg-gray-800"
        >
          Speichern
        </button>
        {saved && <p className="text-green-600">Gespeichert!</p>}
      </section>
    </div>
  );
}
