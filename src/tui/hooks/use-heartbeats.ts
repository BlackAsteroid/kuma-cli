import { useState, useEffect, useCallback } from "react";
import type { KumaClient, Heartbeat } from "../../client.js";

export interface UseHeartbeatsResult {
  heartbeats: Heartbeat[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useHeartbeats(client: KumaClient, monitorId: number | null): UseHeartbeatsResult {
  const [heartbeats, setHeartbeats] = useState<Heartbeat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBeats = useCallback(async () => {
    if (monitorId === null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await client.getHeartbeatList(monitorId, 24);
      setHeartbeats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setHeartbeats([]);
    } finally {
      setLoading(false);
    }
  }, [client, monitorId]);

  const refresh = useCallback(() => {
    void fetchBeats();
  }, [fetchBeats]);

  useEffect(() => {
    void fetchBeats();
  }, [fetchBeats]);

  return { heartbeats, loading, error, refresh };
}
