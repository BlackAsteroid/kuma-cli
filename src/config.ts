import Conf from "conf";

interface KumaConfig {
  url: string;
  token: string;
}

export interface InstanceConfig {
  url: string;
  token: string;
}

export interface ClusterConfig {
  instances: string[];
}

interface KumaStore {
  url: string;
  token: string;
  instances?: Record<string, InstanceConfig>;
  clusters?: Record<string, ClusterConfig>;
}

const conf = new Conf<KumaStore>({
  projectName: "kuma-cli",
  schema: {
    url: { type: "string" },
    token: { type: "string" },
    instances: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          url: { type: "string" },
          token: { type: "string" },
        },
        required: ["url", "token"],
      },
    },
    clusters: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          instances: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["instances"],
      },
    },
  },
});

export function getConfig(): KumaConfig | null {
  const url = conf.get("url");
  const token = conf.get("token");
  if (!url || !token) return null;
  return { url, token };
}

export function saveConfig(config: KumaConfig): void {
  conf.set("url", config.url);
  conf.set("token", config.token);
}

export function clearConfig(): void {
  conf.clear();
}

export function getConfigPath(): string {
  return conf.path;
}

// ---------------------------------------------------------------------------
// Multi-instance / Cluster helpers
// ---------------------------------------------------------------------------

export function getInstanceConfig(name: string): InstanceConfig | null {
  const instances = conf.get("instances");
  if (!instances) return null;
  return instances[name] ?? null;
}

export function getClusterConfig(name: string): ClusterConfig | null {
  const clusters = conf.get("clusters");
  if (!clusters) return null;
  return clusters[name] ?? null;
}
