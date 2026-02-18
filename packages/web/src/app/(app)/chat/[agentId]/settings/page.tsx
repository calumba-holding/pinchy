"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function AgentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState({ name: "", model: "", systemPrompt: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/agents/${params.agentId}`)
      .then((r) => r.json())
      .then(setAgent)
      .finally(() => setLoading(false));
  }, [params.agentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/agents/${params.agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agent),
    });
    router.push(`/chat/${params.agentId}`);
  }

  if (loading) return <div className="p-8">Laden...</div>;

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Agent Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">Name</label>
          <input
            id="name"
            value={agent.name}
            onChange={(e) => setAgent({ ...agent, name: e.target.value })}
            className="mt-1 block w-full rounded border p-2"
          />
        </div>
        <div>
          <label htmlFor="model" className="block text-sm font-medium">Model</label>
          <input
            id="model"
            value={agent.model}
            onChange={(e) => setAgent({ ...agent, model: e.target.value })}
            className="mt-1 block w-full rounded border p-2"
          />
        </div>
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium">System Prompt</label>
          <textarea
            id="prompt"
            value={agent.systemPrompt || ""}
            onChange={(e) => setAgent({ ...agent, systemPrompt: e.target.value })}
            rows={5}
            className="mt-1 block w-full rounded border p-2"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-black text-white px-4 py-2 hover:bg-gray-800"
        >
          Speichern
        </button>
      </form>
    </div>
  );
}
