"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";
import { useWsRuntime } from "@/hooks/use-ws-runtime";

interface ChatProps {
  agentId: string;
  agentName: string;
}

export function Chat({ agentId, agentName }: ChatProps) {
  const { runtime, isConnected } = useWsRuntime(agentId);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-col h-full">
        <header className="p-4 border-b flex items-center justify-between">
          <h1 className="font-bold">{agentName}</h1>
          <span
            className={`text-xs ${isConnected ? "text-green-600" : "text-destructive"}`}
          >
            {isConnected ? "Verbunden" : "Getrennt"}
          </span>
        </header>
        <div className="flex-1">
          <Thread />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}
