"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EXPLANATIONS: Record<string, string> = {
  "SOUL.md":
    "This is your agent's personality and identity. Describe who the agent is, how it should behave, and what values it represents. The agent reads this file at the start of every conversation.",
  "USER.md":
    "This is context about the people and organization the agent works with. Include relevant details like team structure, timezone, communication preferences, or domain-specific knowledge.",
};

interface AgentSettingsFileProps {
  agentId: string;
  filename: "SOUL.md" | "USER.md";
  content: string;
}

export function AgentSettingsFile({
  agentId,
  filename,
  content: initialContent,
}: AgentSettingsFileProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSave() {
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/agents/${agentId}/files/${filename}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFeedback({
          type: "error",
          message: data.error || "Failed to save file",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: "Saved. Changes will apply to your next conversation.",
      });
    } catch {
      setFeedback({ type: "error", message: "Failed to save file" });
    } finally {
      setSaving(false);
    }
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    setFeedback(null);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{EXPLANATIONS[filename]}</p>

      <Textarea
        className="font-mono min-h-[15rem]"
        rows={15}
        value={content}
        onChange={handleContentChange}
      />

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>

      {feedback && (
        <p
          className={
            feedback.type === "success" ? "text-sm text-green-600" : "text-sm text-red-600"
          }
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
