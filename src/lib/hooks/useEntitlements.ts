"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../auth-store";
import { platformApi } from "../platform-api";

export function useEntitlements() {
  const { user, token, setAuth } = useAuthStore();
  const currentTenantId = user?.vbo_tenant_id || user?.tenant_id;

  return useQuery({
    queryKey: ["platform-entitlements", currentTenantId],
    queryFn: async () => {
      if (!token || !currentTenantId) return null;
      try {
        const subscriptions = await platformApi.getSubscriptions(currentTenantId);
        // Extract all active features from all subscriptions
        const activeFeatures: string[] = [];
        const appMappings: Record<string, string> = { ...(user?.app_mappings || {}) };

        subscriptions.forEach((sub) => {
          if (sub.status === "ACTIVE" || sub.status === "TRIAL") {
            appMappings[sub.product_id] = sub.tenant_id;
            if (Array.isArray(sub.features)) {
              activeFeatures.push(...sub.features);
            }
          }
        });

        // Update auth-store with fresh entitlements
        if (user) {
          setAuth(
            {
              ...user,
              app_mappings: appMappings,
              features: Array.from(new Set([...(Array.isArray(user.features) ? user.features : []), ...activeFeatures])),
            },
            token
          );
        }

        return { subscriptions, features: activeFeatures, appMappings };
      } catch (err) {
        console.warn("Failed to poll entitlements:", err);
        return null;
      }
    },
    enabled: Boolean(token && currentTenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
