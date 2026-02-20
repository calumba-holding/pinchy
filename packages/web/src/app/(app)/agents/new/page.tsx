"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TemplateSelector } from "@/components/template-selector";
import { DirectoryPicker } from "@/components/directory-picker";
import { ArrowLeft } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
}

interface Directory {
  path: string;
  name: string;
}

const agentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type AgentFormValues = z.infer<typeof agentFormSchema>;

export default function NewAgentPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedDirs, setSelectedDirs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: { name: "" },
  });

  const fetchData = useCallback(async () => {
    const [templatesRes, dirsRes] = await Promise.all([
      fetch("/api/templates"),
      fetch("/api/data-directories"),
    ]);
    if (templatesRes.ok) {
      const data = await templatesRes.json();
      setTemplates(data.templates);
    }
    if (dirsRes.ok) {
      const data = await dirsRes.json();
      setDirectories(data.directories);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const needsDirectories = selectedTemplate === "knowledge-base";

  async function onSubmit(values: AgentFormValues) {
    setError(null);

    if (needsDirectories && selectedDirs.length === 0) {
      setError("Select at least one directory");
      return;
    }

    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        name: values.name.trim(),
        templateId: selectedTemplate,
      };

      if (needsDirectories) {
        body.pluginConfig = { allowed_paths: selectedDirs };
      }

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create agent");
        return;
      }

      const agent = await res.json();
      router.push(`/chat/${agent.id}`);
    } catch {
      setError("Failed to create agent");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Create New Agent</h1>

      {!selectedTemplate ? (
        <TemplateSelector templates={templates} onSelect={setSelectedTemplate} />
      ) : (
        <>
          <button
            type="button"
            onClick={() => setSelectedTemplate(null)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to templates
          </button>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    New {templates.find((t) => t.id === selectedTemplate)?.name ?? "Agent"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. HR Knowledge Base" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {needsDirectories && (
                    <div>
                      <p className="text-sm font-medium">Directories the agent can read</p>
                      <div className="mt-2">
                        <DirectoryPicker
                          directories={directories}
                          selected={selectedDirs}
                          onChange={setSelectedDirs}
                        />
                      </div>
                    </div>
                  )}

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </>
      )}
    </div>
  );
}
