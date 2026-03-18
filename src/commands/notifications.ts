import { Command } from "commander";
import chalk from "chalk";
import { createAuthenticatedClient, NotificationPayload } from "../client.js";
import { getConfig } from "../config.js";
import { createTable, isJsonMode, jsonOut, success, error } from "../utils/output.js";
import { handleError, requireAuth } from "../utils/errors.js";

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
    .addHelpText(
      "after",
      `
${chalk.dim("Examples:")}
  ${chalk.cyan("kuma notifications list")}
  ${chalk.cyan("kuma notifications list --json")}
  ${chalk.cyan("kuma notifications list --json | jq '.data[] | {id, name}'")}
`
    )
    .action(async (opts: { json?: boolean }) => {
      const config = getConfig();
      if (!config) requireAuth(opts);

      const json = isJsonMode(opts);

      try {
        const client = await createAuthenticatedClient(config!.url, config!.token);
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
    .requiredOption("--type <type>", "Notification type: discord, telegram, slack, webhook, ...")
    .requiredOption("--name <name>", "Friendly name for this notification channel")
    // Discord
    .option("--discord-webhook <url>", "Discord webhook URL (required for --type discord)")
    .option("--discord-username <name>", "Discord bot display name (optional)")
    // Telegram
    .option("--telegram-token <token>", "Telegram bot token (required for --type telegram)")
    .option("--telegram-chat-id <id>", "Telegram chat ID (required for --type telegram)")
    // Slack
    .option("--slack-webhook <url>", "Slack webhook URL (required for --type slack)")
    // Generic webhook
    .option("--webhook-url <url>", "Webhook URL (required for --type webhook)")
    .option("--webhook-content-type <type>", "Webhook content type (default: application/json)", "application/json")
    // Common flags
    .option("--default", "Enable this notification by default on all new monitors")
    .option("--apply-existing", "Apply this notification to all existing monitors immediately")
    .option("--json", "Output as JSON ({ ok, data })")
    .addHelpText(
      "after",
      `
${chalk.dim("Examples:")}
  ${chalk.cyan("kuma notifications create --type discord --name \"Alerts\" --discord-webhook https://discord.com/api/webhooks/...")}
  ${chalk.cyan("kuma notifications create --type telegram --name \"TG\" --telegram-token 123:ABC --telegram-chat-id -100...")}
  ${chalk.cyan("kuma notifications create --type webhook --name \"My Hook\" --webhook-url https://example.com/hook")}
  ${chalk.cyan("kuma notifications create --type discord --name \"Default\" --discord-webhook $URL --default --apply-existing")}

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
    }) => {
      const config = getConfig();
      if (!config) requireAuth(opts);

      const json = isJsonMode(opts);

      // Build the notification payload
      const payload: NotificationPayload = {
        name: opts.name,
        type: opts.type,
        isDefault: opts.default ?? false,
        active: true,
        applyExisting: opts.applyExisting ?? false,
      };

      // Attach provider-specific fields
      switch (opts.type.toLowerCase()) {
        case "discord":
          if (!opts.discordWebhook) {
            handleError(new Error("--discord-webhook is required for --type discord"), opts);
          }
          payload.discordWebhookUrl = opts.discordWebhook;
          if (opts.discordUsername) payload.discordUsername = opts.discordUsername;
          break;

        case "telegram":
          if (!opts.telegramToken || !opts.telegramChatId) {
            handleError(new Error("--telegram-token and --telegram-chat-id are required for --type telegram"), opts);
          }
          payload.telegramBotToken = opts.telegramToken;
          payload.telegramChatID = opts.telegramChatId;
          break;

        case "slack":
          if (!opts.slackWebhook) {
            handleError(new Error("--slack-webhook is required for --type slack"), opts);
          }
          payload.slackwebhookURL = opts.slackWebhook;
          break;

        case "webhook":
          if (!opts.webhookUrl) {
            handleError(new Error("--webhook-url is required for --type webhook"), opts);
          }
          payload.webhookURL = opts.webhookUrl;
          payload.webhookContentType = opts.webhookContentType ?? "application/json";
          break;

        default:
          // For other types (ntfy, gotify, etc.), the user can pass any field
          // via env vars or future --extra flags. We ship the payload as-is.
          if (!json) {
            console.log(chalk.yellow(
              `⚠️  Type "${opts.type}" may require additional fields not exposed as flags.\n` +
              `   The notification will be created but may need manual config in the UI.`
            ));
          }
      }

      try {
        const client = await createAuthenticatedClient(config!.url, config!.token);
        const id = await client.addNotification(payload);
        client.disconnect();

        if (json) {
          jsonOut({ id, name: opts.name, type: opts.type });
        }

        success(`Notification "${opts.name}" created (ID: ${id})`);
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
    .addHelpText(
      "after",
      `
${chalk.dim("Examples:")}
  ${chalk.cyan("kuma notifications delete 3")}
  ${chalk.cyan("kuma notifications delete 3 --force")}
  ${chalk.cyan("kuma notifications delete 3 --json")}
`
    )
    .action(async (id: string, opts: { force?: boolean; json?: boolean }) => {
      const config = getConfig();
      if (!config) requireAuth(opts);

      const json = isJsonMode(opts);
      const notifId = parseInt(id, 10);

      if (isNaN(notifId)) {
        handleError(new Error(`Invalid notification ID: ${id}`), opts);
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
        const client = await createAuthenticatedClient(config!.url, config!.token);
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
