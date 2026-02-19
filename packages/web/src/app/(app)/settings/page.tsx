"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderKeyForm } from "@/components/provider-key-form";

interface ProviderStatus {
  defaultProvider: string | null;
  providers: Record<string, { configured: boolean }>;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/providers");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>LLM Provider</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ProviderKeyForm
              onSuccess={fetchStatus}
              submitLabel="Save"
              configuredProviders={status?.providers}
              defaultProvider={status?.defaultProvider}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
