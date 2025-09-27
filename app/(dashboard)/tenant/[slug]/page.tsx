"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function TenantDashboard() {
  const params = useParams();
  const slug = params?.slug as string;

  const [tenant, setTenant] = useState<{ title: string; subscriptionPlan: string } | null>(null);

  useEffect(() => {
    async function fetchTenant() {
      try {
        const res = await fetch(`/api/tenant/${slug}`);
        const data = await res.json();
        if (res.ok) {
          setTenant(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchTenant();
  }, [slug]);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Tenant Dashboard - {slug}</h1>

      {tenant && (
        <div className="flex items-center space-x-4">
          <p className="text-lg font-medium">Current Plan:</p>
          <Badge
            variant={tenant.subscriptionPlan === "pro" ? "secondary" : "outline"}
          >
            {tenant.subscriptionPlan.toUpperCase()}
          </Badge>
        </div>
      )}

      <div className="mt-6">
        <Link href={`/tenant/${slug}/upgrade`}>
          <Button>
            {tenant?.subscriptionPlan === "pro" ? "Manage Plan" : "Upgrade to Pro"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
