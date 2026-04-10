import { Command } from "commander";
import chalk from "chalk";
import * as fs from "fs";
import { NotificationPayload } from "../client.js";
import { resolveClient } from "../instance-manager.js";
import { createTable, isJsonMode, jsonOut, success, error, getJsonInput } from "../utils/output.js";
import { handleError } from "../utils/errors.js";

/**
 * Security fix #1: Resolve a flag value from the environment if it looks like an env var.
 * Supports two safe patterns:
 *   - "$VAR_NAME" → reads process.env.VAR_NAME
 *   - "-"         → reads from stdin (first line)
 *
 * This prevents webhook URLs and tokens from appearing in shell history, ps aux output,
 * and CI/CD logs. Users should pass secrets via env vars:
 *   DISCORD_WEBHOOK=https://... kuma notifications create --type discord --discord-webhook '$DISCORD_WEBHOOK'
 */
function resolveSecret(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;

  // $VAR_NAME — read from environment
  if (value.startsWith("$")) {
    const varName = value.slice(1);
    const resolved = process.env[varName];
    if (!resolved) {
      // Don't throw here — let the per-type validation handle "missing required field"
      return undefined;
    }
    return resolved;
  }

  // "-" — read from stdin (blocks until newline)
  if (value === "-") {
    try {
      const buf = Buffer.alloc(4096);
      const n = fs.readSync(0, buf, 0, buf.length, null);
      return buf.toString("utf8", 0, n).trim();
    } catch {
      return undefined;
    }
  }

  return value;
}

export function notificationsCommand(program: Command): void {
  const notifications = program
    .command("notifications")
    .description("Manage notification channels (Discord, Telegram, webhook, ...)")
    .addHelpText(
      "after",
      `
${chalk.dim("Subcommands:")}
  ${chalk.cyan("notifications list")}                     List all notification channels
  ${chalk.cyan("notifications create --type discord ...")} Create a new notification channel
  ${chalk.cyan("notifications delete <id>")}              Delete a notification channel

${chalk.dim("Run")} ${chalk.cyan("kuma notifications <subcommand> --help")} ${chalk.dim("for examples.")}
`
    );

  // ── LIST ────────────────────────────────────────────────────────────────────
  notifications
    .command("list")
    .description("List all configured notification channels with their IDs and types")
    .option("--json", "Output as JSON ({ ok, data })")
    .option("--instance <name>", "Target a specific instance")
    .addHelpText(
      "after",
      `
${chalk.dim("Examples:")}
  ${chalk.cyan("kuma notifications list")}
  ${chalk.cyan("kuma notifications list --json")}
  ${chalk.cyan("kuma notifications list --json | jq '.data[] | {id, name}'")}
`
    )
    .action(async (opts: { json?: boolean; instance?: string }) => {
      const json = isJsonMode(opts);

      try {
        const { client } = await resolveClient(opts);
        const list = await client.getNotificationList();
        client.disconnect();

        if (json) {
          // Enrich with parsed config so consumers can see the type
          const enriched = list.map((n) => {
            try {
              const parsed = JSON.parse(n.config) as Record<string, unknown>;
              return { ...n, config: parsed };
            } catch {
              return n;
            }
          });
          jsonOut(enriched);
        }

        if (list.length === 0) {
          console.log("No notification channels configured.");
          return;
        }

        const table = createTable(["ID", "Name", "Type", "Default", "Active"]);
        list.forEach((n) => {
          let type = "—";
          try {
            const parsed = JSON.parse(n.config) as { type?: string };
            type = parsed.type ?? "—";
          } catch {
            // ignore
          }
          table.push([
            String(n.id),
            n.name,
            type,
            n.isDefault ? chalk.green("Yes") : chalk.gray("No"),
            n.active ? chalk.green("Yes") : chalk.red("No"),
          ]);
        });

        console.log(table.toString());
        console.log(`\n${list.length} notification channel(s)`);
      } catch (err) {
        handleError(err, opts);
      }
    });

  // ── CREATE ──────────────────────────────────────────────────────────────────
  notifications
    .command("create")
    .description("Create a new notification channel")
    .option("--type <type>", "Notification type: discord, telegram, slack, webhook, ...")
    .option("--name <name>", "Friendly name for this notification channel")
    // Discord
    .option("--discord-webhook <url|$VAR>", "Discord webhook URL — pass value or env var name like '$DISCORD_WEBHOOK'")
    .option("--discord-username <name>", "Discord bot display name (optional)")
    // Telegram
    .option("--telegram-token <token|$VAR>", "Telegram bot token — pass value or env var name like '$TELEGRAM_TOKEN'")
    .option("--telegram-chat-id <id>", "Telegram chat ID (required for --type telegram)")
    // Slack
    .option("--slack-webhook <url|$VAR>", "Slack webhook URL — pass value or env var name like '$SLACK_WEBHOOK'")
    // Generic webhook
    .option("--webhook-url <url|$VAR>", "Webhook URL — pass value or env var name like '$WEBHOOK_URL'")
    .option("--webhook-content-type <type>", "Webhook content type (default: application/json)", "application/json")
    // Common flags
    .option("--default", "Enable this notification by default on all new monitors")
    .option("--apply-existing", "Apply this notification to all existing monitors immediately")
    .option("--input-json <json>", "Input notification data as JSON string (overrides other flags)")
    .option("--json", "Output as JSON ({ ok, data })")
    .option("--instance <name>", "Target a specific instance")
    .addHelpText(
      "after",
      `
${chalk.dim("Examples:")}
  ${chalk.cyan("kuma notifications create --type discord --name \"Alerts\" --discord-webhook '$DISCORD_WEBHOOK'")}
  ${chalk.cyan("kuma notifications create --type telegram --name \"TG\" --telegram-token '$TELEGRAM_TOKEN' --telegram-chat-id -100...")}
  ${chalk.cyan("kuma notifications create --type webhook --name \"My Hook\" --webhook-url '$WEBHOOK_URL'")}
  ${chalk.cyan("kuma notifications create --type discord --name \"Default\" --discord-webhook '$DISCORD_WEBHOOK' --default --apply-existing")}

${chalk.dim("⚠️  Security: never pass secrets as literal flag values — use env vars:")}
  ${chalk.cyan("export DISCORD_WEBHOOK=https://discord.com/api/webhooks/...")}
  ${chalk.cyan("kuma notifications create --type discord --name \"Alerts\" --discord-webhook '\\$DISCORD_WEBHOOK'")}

${chalk.dim("Supported types:")}
  discord, telegram, slack, webhook, gotify, ntfy, pushover, matrix, mattermost, teams ...
  (full list at https://uptime.kuma.pet/docs)
`
    )
    .action(async (opts: {
      type: string;
      name: string;
      discordWebhook?: string;
      discordUsername?: string;
      telegramToken?: string;
      telegramChatId?: string;
      slackWebhook?: string;
      webhookUrl?: string;
      webhookContentType?: string;
      default?: boolean;
      applyExisting?: boolean;
      json?: boolean;
      instance?: string;
      inputJson?: string;
    }) => {
      const json = isJsonMode(opts);
      const inputData = await getJsonInput(opts.inputJson);

      let name = opts.name;
      let type = opts.type;
      let isDefault = opts.default ?? false;
      let applyExisting = opts.applyExisting ?? false;

      // Extract provider-specific fields from opts first
      let discordWebhook = resolveSecret(opts.discordWebhook);
      let discordUsername = opts.discordUsername;
      let telegramToken = resolveSecret(opts.telegramToken);
      let telegramChatId = opts.telegramChatId;
      let slackWebhook = resolveSecret(opts.slackWebhook);
      let webhookUrl = resolveSecret(opts.webhookUrl);
      let webhookContentType = opts.webhookContentType ?? "application/json";

      if (inputData) {
        name = inputData.name ?? name;
        type = inputData.type ?? type;
        if (inputData.default !== undefined) isDefault = !!inputData.default;
        if (inputData.applyExisting !== undefined) applyExisting = !!inputData.applyExisting;
        
        // Map common JSON keys to payload fields
        discordWebhook = inputData.discordWebhook ?? inputData.discordWebhookUrl ?? discordWebhook;
        discordUsername = inputData.discordUsername ?? discordUsername;
        telegramToken = inputData.telegramToken ?? inputData.telegramBotToken ?? telegramToken;
        telegramChatId = inputData.telegramChatId ?? inputData.telegramChatID ?? telegramChatId;
        slackWebhook = inputData.slackWebhook ?? inputData.slackwebhookURL ?? slackWebhook;
        webhookUrl = inputData.webhookUrl ?? inputData.webhookURL ?? webhookUrl;
        webhookContentType = inputData.webhookContentType ?? webhookContentType;
      }

      if (!name || !type) {
        handleError(new Error("Notification name and type are required."), opts);
      }

      // Build the notification payload
      const payload: any = {
        name,
        type,
        isDefault,
        active: true,
        applyExisting,
      };

      switch (type.toLowerCase()) {
        case "discord":
          if (!discordWebhook) {
            handleError(new Error("discordWebhook is required for type discord"), opts);
          }
          payload.discordWebhookUrl = discordWebhook;
          if (discordUsername) payload.discordUsername = discordUsername;
          break;

        case "telegram":
          if (!telegramToken || !telegramChatId) {
            handleError(new Error("telegramToken and telegramChatId are required for type telegram"), opts);
          }
          payload.telegramBotToken = telegramToken;
          payload.telegramChatID = telegramChatId;
          break;

        case "slack":
          if (!slackWebhook) {
            handleError(new Error("slackWebhook is required for type slack"), opts);
          }
          payload.slackwebhookURL = slackWebhook;
          break;

        case "webhook":
          if (!webhookUrl) {
            handleError(new Error("webhookUrl is required for type webhook"), opts);
          }
          payload.webhookURL = webhookUrl;
          payload.webhookContentType = webhookContentType;
          break;

        default:
          // For other types, merge additional fields from inputData if present
          if (inputData) {
            Object.assign(payload, inputData);
            // Ensure core fields are preserved
            payload.name = name;
            payload.type = type;
            payload.isDefault = isDefault;
            payload.active = true;
            payload.applyExisting = applyExisting;
          }

          if (!json) {
            console.log(chalk.yellow(
              `⚠️  Type "${type}" may require additional fields not exposed as flags.\n` +
              `   The notification will be created but may need manual config in the UI.`
            ));
          }
      }

      try {
        const { client } = await resolveClient(opts);
        const id = await client.addNotification(payload);
        client.disconnect();

        if (json) {
          jsonOut({ id, name, type });
        }

        success(`Notification "${name}" created (ID: ${id})`);
      } catch (err) {
        handleError(err, opts);
      }
    });

  // ── DELETE ──────────────────────────────────────────────────────────────────
  notifications
    .command("delete <id>")
    .description("Permanently delete a notification channel")
    .option("--force", "Skip the confirmation prompt")
    .option("--json", "Output as JSON ({ ok, data })")
    .option("--instance <name>", "Target a specific instance")
    .addHelpText(
      "after",
      `
${chalk.dim("Examples:")}
  ${chalk.cyan("kuma notifications delete 3")}
  ${chalk.cyan("kuma notifications delete 3 --force")}
  ${chalk.cyan("kuma notifications delete 3 --json")}
`
    )
    .action(async (id: string, opts: { force?: boolean; json?: boolean; instance?: string }) => {
      const json = isJsonMode(opts);
      const notifId = parseInt(id, 10);

      if (isNaN(notifId) || notifId <= 0) {
        handleError(new Error(`Invalid notification ID: "${id}". Must be a positive integer.`), opts);
      }

      if (!opts.force && !json) {
        const enquirer = await import("enquirer");
        const { prompt } = enquirer.default as any;
        const { confirm } = (await prompt({
          type: "confirm",
          name: "confirm",
          message: `Delete notification ${id}?`,
          initial: false,
        })) as { confirm: boolean };
        if (!confirm) {
          console.log("Aborted.");
          return;
        }
      }

      try {
        const { client } = await resolveClient(opts);
        await client.deleteNotification(notifId);
        client.disconnect();

        if (json) {
          jsonOut({ id: notifId, deleted: true });
        }

        success(`Notification ${id} deleted`);
      } catch (err) {
        handleError(err, opts);
      }
    });
}
