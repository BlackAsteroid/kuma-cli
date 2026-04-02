import React from "react";
import { render } from "ink";
import type { KumaClient } from "../client.js";
import { App } from "./app.js";

export interface DashboardOptions {
  client?: KumaClient | null;
  instanceName?: string;
  clusterName?: string | null;
  refreshInterval: number;
}

export async function renderDashboard(opts: DashboardOptions): Promise<void> {
  // Enter alternate screen buffer (like vim/htop)
  process.stdout.write("\x1b[?1049h");
  process.stdout.write("\x1b[H\x1b[2J"); // Clear screen and move cursor to top

  const restoreScreen = () => {
    process.stdout.write("\x1b[?1049l");
  };

  // Restore on unexpected exit
  process.on("exit", restoreScreen);
  process.on("SIGINT", () => { restoreScreen(); process.exit(0); });
  process.on("SIGTERM", () => { restoreScreen(); process.exit(0); });

  const { waitUntilExit } = render(
    <App
      client={opts.client}
      instanceName={opts.instanceName}
      clusterName={opts.clusterName}
      refreshInterval={opts.refreshInterval}
    />
  );

  await waitUntilExit();
  restoreScreen();
}
