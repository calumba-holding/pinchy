"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderKeyForm } from "@/components/provider-key-form";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  function handleSuccess() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>LLM Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <ProviderKeyForm onSuccess={handleSuccess} submitLabel="Save" />
          {saved && <p className="text-green-600 mt-4">Settings saved!</p>}
        </CardContent>
      </Card>
    </div>
  );
}
