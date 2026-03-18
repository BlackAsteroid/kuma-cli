#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_commander = require("commander");

// src/commands/login.ts
var import_enquirer = __toESM(require("enquirer"));

// src/client.ts
var import_socket = require("socket.io-client");
var KumaClient = class {
  constructor(url) {
    this.url = url;
    this.socket = (0, import_socket.io)(url, {
      transports: ["websocket"],
      reconnection: false,
      timeout: 1e4
    });
  }
  /**
   * Wait for a server-pushed event (not a callback response).
   * Used for events the server pushes after authentication (monitorList, etc.).
   */
  waitFor(event, timeoutMs = 1e4) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeoutMs);
      this.socket.once(event, (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }
  async connect() {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Connection timeout \u2014 is Kuma running?"));
      }, 1e4);
      this.socket.once("connect", () => {
        clearTimeout(timer);
        resolve();
      });
      this.socket.once("connect_error", (err) => {
        clearTimeout(timer);
        reject(new Error(`Connection failed: ${err.message}`));
      });
    });
  }
  // BUG-01 fix: use Socket.IO acknowledgement callbacks instead of waitFor()
  async login(username, password) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Login timeout")),
        1e4
      );
      this.socket.emit(
        "login",
        { username, password },
        (result) => {
          clearTimeout(timer);
          resolve(result);
        }
      );
    });
  }
  // BUG-01 fix: loginByToken also uses callback pattern
  async loginByToken(token) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Login timeout")),
        1e4
      );
      this.socket.emit("loginByToken", token, (result) => {
        clearTimeout(timer);
        resolve(result.ok);
      });
    });
  }
  async getMonitorList() {
    this.socket.emit("getMonitorList");
    return this.waitFor("monitorList");
  }
  // BUG-01 fix: addMonitor uses callback, not a separate event
  // BUG-03 fix: include required fields accepted_statuscodes, maxretries, retryInterval
  async addMonitor(monitor) {
    const payload = {
      accepted_statuscodes: ["200-299"],
      maxretries: 1,
      retryInterval: 60,
      ...monitor
    };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Add monitor timeout")),
        1e4
      );
      this.socket.emit(
        "add",
        payload,
        (result) => {
          clearTimeout(timer);
          if (!result.ok) {
            reject(new Error(result.msg ?? "Failed to add monitor"));
            return;
          }
          resolve({ id: result.monitorID });
        }
      );
    });
  }
  // BUG-01 fix: editMonitor uses callback pattern (consistent with all other mutations)
  // BUG-04 fix: check result.ok and throw on failure
  async editMonitor(id, monitor) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Edit monitor timeout")),
        1e4
      );
      this.socket.emit(
        "editMonitor",
        { ...monitor, id },
        (result) => {
          clearTimeout(timer);
          if (!result.ok) {
            reject(new Error(result.msg ?? "Operation failed"));
            return;
          }
          resolve();
        }
      );
    });
  }
  // BUG-01 fix: deleteMonitor uses callback
  // BUG-04 fix: check result.ok and throw on failure
  async deleteMonitor(id) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Delete monitor timeout")),
        1e4
      );
      this.socket.emit(
        "deleteMonitor",
        id,
        (result) => {
          clearTimeout(timer);
          if (!result.ok) {
            reject(new Error(result.msg ?? "Operation failed"));
            return;
          }
          resolve();
        }
      );
    });
  }
  // BUG-01 fix: pauseMonitor uses callback
  // BUG-04 fix: check result.ok and throw on failure
  async pauseMonitor(id) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Pause monitor timeout")),
        1e4
      );
      this.socket.emit(
        "pauseMonitor",
        id,
        (result) => {
          clearTimeout(timer);
          if (!result.ok) {
            reject(new Error(result.msg ?? "Operation failed"));
            return;
          }
          resolve();
        }
      );
    });
  }
  // BUG-01 fix: resumeMonitor uses callback
  // BUG-04 fix: check result.ok and throw on failure
  async resumeMonitor(id) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Resume monitor timeout")),
        1e4
      );
      this.socket.emit(
        "resumeMonitor",
        id,
        (result) => {
          clearTimeout(timer);
          if (!result.ok) {
            reject(new Error(result.msg ?? "Operation failed"));
            return;
          }
          resolve();
        }
      );
    });
  }
  async getHeartbeatList(monitorId, period) {
    this.socket.emit("getHeartbeatList", monitorId, period ?? 24);
    const result = await this.waitFor("heartbeatList");
    return result.data ?? [];
  }
  async getStatusPageList() {
    this.socket.emit("getStatusPageList");
    return this.waitFor("statusPageList");
  }
  disconnect() {
    this.socket.disconnect();
  }
};
async function createAuthenticatedClient(url, token) {
  const client = new KumaClient(url);
  await client.connect();
  const ok = await client.loginByToken(token);
  if (!ok) {
    client.disconnect();
    throw new Error("Session expired. Run `kuma login` again.");
  }
  return client;
}

// src/config.ts
var import_conf = __toESM(require("conf"));
var conf = new import_conf.default({
  projectName: "kuma-cli",
  schema: {
    url: { type: "string" },
    token: { type: "string" }
  }
});
function getConfig() {
  const url = conf.get("url");
  const token = conf.get("token");
  if (!url || !token) return null;
  return { url, token };
}
function saveConfig(config) {
  conf.set("url", config.url);
  conf.set("token", config.token);
}
function clearConfig() {
  conf.clear();
}
function getConfigPath() {
  return conf.path;
}

// src/utils/output.ts
var import_chalk = __toESM(require("chalk"));
var import_cli_table3 = __toESM(require("cli-table3"));
var STATUS_LABELS = {
  0: import_chalk.default.red("\u25CF DOWN"),
  1: import_chalk.default.green("\u25CF UP"),
  2: import_chalk.default.yellow("\u25CF PENDING"),
  3: import_chalk.default.gray("\u25CF MAINTENANCE")
};
function statusLabel(status) {
  return STATUS_LABELS[status] ?? import_chalk.default.gray("\u25CF UNKNOWN");
}
function createTable(head) {
  return new import_cli_table3.default({
    head: head.map((h) => import_chalk.default.cyan(h)),
    style: { head: [], border: [] },
    chars: {
      top: "\u2500",
      "top-mid": "\u252C",
      "top-left": "\u256D",
      "top-right": "\u256E",
      bottom: "\u2500",
      "bottom-mid": "\u2534",
      "bottom-left": "\u2570",
      "bottom-right": "\u256F",
      left: "\u2502",
      "left-mid": "\u251C",
      mid: "\u2500",
      "mid-mid": "\u253C",
      right: "\u2502",
      "right-mid": "\u2524",
      middle: "\u2502"
    }
  });
}
function success(msg) {
  console.log(import_chalk.default.green("\u2705 " + msg));
}
function error(msg) {
  console.error(import_chalk.default.red("\u274C " + msg));
}
function warn(msg) {
  console.warn(import_chalk.default.yellow("\u26A0\uFE0F  " + msg));
}
function formatUptime(uptime) {
  if (uptime === void 0 || uptime === null) return import_chalk.default.gray("\u2014");
  const pct = (uptime * 100).toFixed(1);
  const n = parseFloat(pct);
  if (n >= 99) return import_chalk.default.green(`${pct}%`);
  if (n >= 95) return import_chalk.default.yellow(`${pct}%`);
  return import_chalk.default.red(`${pct}%`);
}
function formatPing(ping) {
  if (!ping) return import_chalk.default.gray("\u2014");
  if (ping < 200) return import_chalk.default.green(`${ping}ms`);
  if (ping < 500) return import_chalk.default.yellow(`${ping}ms`);
  return import_chalk.default.red(`${ping}ms`);
}
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString();
}

// src/utils/errors.ts
function handleError(err, exitCode = 1) {
  if (err instanceof Error) {
    error(err.message);
  } else {
    error(String(err));
  }
  process.exit(exitCode);
}
function requireAuth() {
  error("Not authenticated. Run: kuma login <url>");
  process.exit(1);
}

// src/commands/login.ts
var { prompt } = import_enquirer.default;
function loginCommand(program2) {
  program2.command("login <url>").description("Authenticate with Uptime Kuma and save session").action(async (url) => {
    try {
      const normalizedUrl = url.replace(/\/$/, "");
      const answers = await prompt([
        {
          type: "input",
          name: "username",
          message: "Username:"
        },
        {
          type: "password",
          name: "password",
          message: "Password:"
        }
      ]);
      const { username, password } = answers;
      const client = new KumaClient(normalizedUrl);
      await client.connect();
      const result = await client.login(username, password);
      client.disconnect();
      if (!result.ok || !result.token) {
        error(result.msg ?? "Login failed");
        process.exit(1);
      }
      saveConfig({ url: normalizedUrl, token: result.token });
      success(`Logged in as ${username} \u2192 ${normalizedUrl}`);
    } catch (err) {
      handleError(err);
    }
  });
}

// src/commands/logout.ts
function logoutCommand(program2) {
  program2.command("logout").description("Clear saved session credentials").action(() => {
    const config = getConfig();
    if (!config) {
      warn("Not currently logged in.");
      return;
    }
    clearConfig();
    success("Logged out. Run `kuma login <url>` to authenticate again.");
  });
}

// src/commands/monitors.ts
var import_enquirer2 = __toESM(require("enquirer"));
var { prompt: prompt2 } = import_enquirer2.default;
var MONITOR_TYPES = [
  "http",
  "tcp",
  "ping",
  "dns",
  "push",
  "steam",
  "mqtt",
  "sqlserver",
  "postgres",
  "mysql",
  "mongodb",
  "radius",
  "redis"
];
function monitorsCommand(program2) {
  const monitors = program2.command("monitors").description("Manage monitors");
  monitors.command("list").description("List all monitors").option("--json", "Output raw JSON").action(async (opts) => {
    const config = getConfig();
    if (!config) requireAuth();
    try {
      const client = await createAuthenticatedClient(
        config.url,
        config.token
      );
      const monitorMap = await client.getMonitorList();
      client.disconnect();
      const list = Object.values(monitorMap);
      if (opts.json) {
        console.log(JSON.stringify(list, null, 2));
        return;
      }
      if (list.length === 0) {
        console.log("No monitors found.");
        return;
      }
      const table = createTable([
        "ID",
        "Name",
        "Type",
        "URL / Host",
        "Status",
        "Uptime 24h",
        "Ping"
      ]);
      list.forEach((m) => {
        const target = m.url ?? (m.hostname ? `${m.hostname}:${m.port}` : "\u2014");
        const status = m.heartbeat ? statusLabel(m.heartbeat.status) : m.active ? statusLabel(2) : "\u23F8 Paused";
        table.push([
          String(m.id),
          m.name,
          m.type,
          target,
          status,
          formatUptime(m.uptime),
          formatPing(m.heartbeat?.ping)
        ]);
      });
      console.log(table.toString());
      console.log(`
${list.length} monitor(s) total`);
    } catch (err) {
      handleError(err);
    }
  });
  monitors.command("add").description("Add a new monitor").option("--name <name>", "Monitor name").option("--type <type>", "Monitor type (http, tcp, ping, ...)").option("--url <url>", "URL or hostname to monitor").option("--interval <seconds>", "Check interval in seconds", "60").action(
    async (opts) => {
      const config = getConfig();
      if (!config) requireAuth();
      try {
        const answers = await prompt2([
          ...!opts.name ? [{ type: "input", name: "name", message: "Monitor name:" }] : [],
          ...!opts.type ? [
            {
              type: "select",
              name: "type",
              message: "Monitor type:",
              choices: MONITOR_TYPES
            }
          ] : [],
          ...!opts.url ? [
            {
              type: "input",
              name: "url",
              message: "URL or hostname:"
            }
          ] : []
        ]);
        const name = opts.name ?? answers.name;
        const type = opts.type ?? answers.type;
        const url = opts.url ?? answers.url;
        const interval = parseInt(opts.interval ?? "60", 10);
        const client = await createAuthenticatedClient(
          config.url,
          config.token
        );
        const result = await client.addMonitor({ name, type, url, interval });
        client.disconnect();
        success(`Monitor "${name}" created (ID: ${result.id})`);
      } catch (err) {
        handleError(err);
      }
    }
  );
  monitors.command("update <id>").description("Update an existing monitor's settings").option("--name <name>", "New monitor name").option("--url <url>", "New URL or hostname").option("--interval <seconds>", "New check interval in seconds").action(
    async (id, opts) => {
      const config = getConfig();
      if (!config) requireAuth();
      const patch = {};
      if (opts.name) patch.name = opts.name;
      if (opts.url) patch.url = opts.url;
      if (opts.interval) patch.interval = parseInt(opts.interval, 10);
      if (Object.keys(patch).length === 0) {
        error("No fields to update. Use --name, --url, or --interval.");
        process.exit(1);
      }
      try {
        const client = await createAuthenticatedClient(
          config.url,
          config.token
        );
        await client.editMonitor(parseInt(id, 10), patch);
        client.disconnect();
        success(`Monitor ${id} updated`);
      } catch (err) {
        handleError(err);
      }
    }
  );
  monitors.command("delete <id>").description("Delete a monitor").option("--force", "Skip confirmation").action(async (id, opts) => {
    const config = getConfig();
    if (!config) requireAuth();
    try {
      if (!opts.force) {
        const { confirm } = await prompt2({
          type: "confirm",
          name: "confirm",
          message: `Delete monitor ${id}?`,
          initial: false
        });
        if (!confirm) {
          console.log("Aborted.");
          return;
        }
      }
      const client = await createAuthenticatedClient(
        config.url,
        config.token
      );
      await client.deleteMonitor(parseInt(id, 10));
      client.disconnect();
      success(`Monitor ${id} deleted`);
    } catch (err) {
      handleError(err);
    }
  });
  monitors.command("pause <id>").description("Pause a monitor").action(async (id) => {
    const config = getConfig();
    if (!config) requireAuth();
    try {
      const client = await createAuthenticatedClient(
        config.url,
        config.token
      );
      await client.pauseMonitor(parseInt(id, 10));
      client.disconnect();
      success(`Monitor ${id} paused`);
    } catch (err) {
      handleError(err);
    }
  });
  monitors.command("resume <id>").description("Resume a monitor").action(async (id) => {
    const config = getConfig();
    if (!config) requireAuth();
    try {
      const client = await createAuthenticatedClient(
        config.url,
        config.token
      );
      await client.resumeMonitor(parseInt(id, 10));
      client.disconnect();
      success(`Monitor ${id} resumed`);
    } catch (err) {
      handleError(err);
    }
  });
}

// src/commands/heartbeat.ts
function heartbeatCommand(program2) {
  program2.command("heartbeat <monitor-id>").description("View recent heartbeats for a monitor").option("--limit <n>", "Number of heartbeats to show", "20").option("--json", "Output raw JSON").action(async (monitorId, opts) => {
    const config = getConfig();
    if (!config) requireAuth();
    try {
      const client = await createAuthenticatedClient(
        config.url,
        config.token
      );
      const heartbeats = await client.getHeartbeatList(
        parseInt(monitorId, 10)
      );
      client.disconnect();
      const limit = parseInt(opts.limit ?? "20", 10);
      const recent = heartbeats.slice(-limit).reverse();
      if (opts.json) {
        console.log(JSON.stringify(recent, null, 2));
        return;
      }
      if (recent.length === 0) {
        console.log("No heartbeats found.");
        return;
      }
      const table = createTable(["Time", "Status", "Ping", "Message"]);
      recent.forEach((hb) => {
        table.push([
          formatDate(hb.time),
          statusLabel(hb.status),
          formatPing(hb.ping),
          hb.msg ?? "\u2014"
        ]);
      });
      console.log(table.toString());
      console.log(`
Showing last ${recent.length} heartbeat(s)`);
    } catch (err) {
      handleError(err);
    }
  });
}

// src/commands/status-pages.ts
var import_chalk2 = __toESM(require("chalk"));
function statusPagesCommand(program2) {
  const sp = program2.command("status-pages").description("Manage status pages");
  sp.command("list").description("List all status pages").option("--json", "Output raw JSON").action(async (opts) => {
    const config = getConfig();
    if (!config) requireAuth();
    try {
      const client = await createAuthenticatedClient(
        config.url,
        config.token
      );
      const pages = await client.getStatusPageList();
      client.disconnect();
      const list = Object.values(pages);
      if (opts.json) {
        console.log(JSON.stringify(list, null, 2));
        return;
      }
      if (list.length === 0) {
        console.log("No status pages found.");
        return;
      }
      const table = createTable(["ID", "Title", "Slug", "Published", "URL"]);
      list.forEach((page) => {
        const url = `${config.url}/status/${page.slug}`;
        table.push([
          String(page.id),
          page.title,
          page.slug,
          page.published ? import_chalk2.default.green("Yes") : import_chalk2.default.gray("No"),
          url
        ]);
      });
      console.log(table.toString());
    } catch (err) {
      handleError(err);
    }
  });
}

// src/index.ts
var import_chalk3 = __toESM(require("chalk"));
var program = new import_commander.Command();
program.name("kuma").description("CLI for managing Uptime Kuma via Socket.IO API").version("0.1.0").addHelpText(
  "after",
  `
${import_chalk3.default.dim("Examples:")}
  ${import_chalk3.default.cyan("kuma login https://kuma.example.com")}
  ${import_chalk3.default.cyan("kuma monitors list")}
  ${import_chalk3.default.cyan('kuma monitors add --name "My API" --type http --url https://api.example.com')}
  ${import_chalk3.default.cyan("kuma heartbeat 1")}
  ${import_chalk3.default.cyan("kuma logout")}

${import_chalk3.default.dim("Config stored at:")} ${import_chalk3.default.yellow(getConfigPath())}
`
);
program.command("status").description("Show current connection config").action(() => {
  const config = getConfig();
  if (!config) {
    console.log(import_chalk3.default.yellow("Not logged in. Run: kuma login <url>"));
  } else {
    console.log(import_chalk3.default.green("\u2705 Logged in"));
    console.log(`   URL:   ${import_chalk3.default.cyan(config.url)}`);
    console.log(
      `   Token: ${import_chalk3.default.dim(config.token.slice(0, 8) + "..." + config.token.slice(-4))}`
    );
    console.log(`   Config: ${import_chalk3.default.dim(getConfigPath())}`);
  }
});
loginCommand(program);
logoutCommand(program);
monitorsCommand(program);
heartbeatCommand(program);
statusPagesCommand(program);
program.parse(process.argv);
