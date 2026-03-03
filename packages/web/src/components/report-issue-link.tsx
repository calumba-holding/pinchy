"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import { buildGitHubIssueUrl, fetchDiagnostics } from "@/lib/github-issue";

interface ReportIssueLinkProps {
  error: string;
  statusCode?: number;
}

export function ReportIssueLink({ error, statusCode }: ReportIssueLinkProps) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      let diagnostics;
      try {
        diagnostics = (await fetchDiagnostics()) ?? undefined;
      } catch {
        // Diagnostics fetch failed — continue without them
      }

      const url = buildGitHubIssueUrl({
        error,
        statusCode,
        page: pathname,
        diagnostics,
      });
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 cursor-pointer disabled:opacity-50 shrink-0"
    >
      {loading ? <Loader2 className="size-3 animate-spin" /> : <ExternalLink className="size-3" />}
      Report this issue
    </button>
  );
}
