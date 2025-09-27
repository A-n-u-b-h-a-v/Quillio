"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function UpgradePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/tenant/${slug}/upgrade`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setMessage(data.message);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
      <h1 className="text-2xl font-bold">Upgrade Subscription</h1>
      <p className="text-gray-600">
        Upgrade your tenant <span className="font-semibold">{slug}</span> to{" "}
        <span className="font-semibold">Pro Plan</span>.
      </p>
      <Button
        onClick={handleUpgrade}
        disabled={loading}
        className="px-6 py-3 text-lg"
      >
        {loading ? "Upgrading..." : "Upgrade to Pro"}
      </Button>

      {message && (
        <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
      )}
    </div>
  );
}
