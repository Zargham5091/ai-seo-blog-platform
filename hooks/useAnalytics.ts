import { useState, useEffect } from "react";

interface DashboardStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalViews: number;
  avgSEOScore: number;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics?type=dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStats(d.data);
        else setError(d.error);
      })
      .catch(() => setError("Failed to load stats"))
      .finally(() => setIsLoading(false));
  }, []);

  return { stats, isLoading, error };
}

export function useSuperAdminStats() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics?type=super_admin")
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.data); })
      .finally(() => setIsLoading(false));
  }, []);

  return { stats, isLoading };
}
