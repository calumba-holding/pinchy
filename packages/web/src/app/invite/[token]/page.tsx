"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function InviteClaimPage() {
  const { token } = useParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/invite/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create account");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <Image src="/pinchy-logo.png" alt="Pinchy" width={80} height={85} priority />

        <Card className="w-full">
          {success ? (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <CheckCircle2 className="size-12 text-primary" />
                </div>
                <CardTitle>Account created!</CardTitle>
                <CardDescription>You can now sign in with your credentials.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/login")} className="w-full">
                  Continue to sign in
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>You&apos;ve been invited to Pinchy</CardTitle>
                <CardDescription>Set up your account to get started.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && <p className="text-destructive">{error}</p>}

                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" type="text" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required minLength={8} />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Creating account..." : "Create account"}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
