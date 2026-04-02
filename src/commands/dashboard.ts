import path from "path";
import { resolveClient } from "../instance-manager.js";
import { handleError } from "../utils/errors.js";

export async function launchDashboard(opts: {
  instance?: string;
  cluster?: string;
  refresh: string;
}): Promise<void> {
  try {
    const refreshInterval = Math.max(5, parseInt(opts.refresh, 10) || 30);

    // TUI bundle is ESM (ink/react are ESM-only), loaded dynamically from CJS.
    const tuiPath = path.join(__dirname, "tui-app.mjs");
    const { renderDashboard } = await import(/* webpackIgnore: true */ tuiPath);

    // Try to resolve an existing instance, but launch TUI either way
    let client = null;
    let instanceName = "";
    try {
      const resolved = await resolveClient({
        instance: opts.instance,
        cluster: opts.cluster,
      });
      client = resolved.client;
      instanceName = resolved.instanceName;
      client.enableReconnection();
    } catch {
      // No instance configured — TUI will show login screen
    }

    await renderDashboard({
      client,
      instanceName: instanceName || undefined,
      clusterName: opts.cluster ?? null,
      refreshInterval,
    });

    client?.disconnect();
    process.exit(0);
  } catch (err) {
    handleError(err);
  }
}
