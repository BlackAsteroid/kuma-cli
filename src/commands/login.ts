import { Command } from "commander";
import enquirer from "enquirer";
import { KumaClient } from "../client.js";
import { saveConfig } from "../config.js";
import { success, error, isJsonMode, jsonOut } from "../utils/output.js";
import { handleError } from "../utils/errors.js";
import chalk from "chalk";

const { prompt } = enquirer as any;

export function loginCommand(program: Command): void {
  program
    .command("login <url>")
    .description(
      "Authenticate with an Uptime Kuma instance and save the session token locally"
    )
    .option("--json", "Output as JSON ({ ok, data })")
    .option("--as <alias>", "Save this instance under a custom alias (default: derived from hostname)")
    .addHelpText(
      "after",
      `
${chalk.dim("Examples:")}
  ${chalk.cyan("kuma login https://kuma.example.com")}
  ${chalk.cyan("  Saves as 'kuma-example-com' (auto-derived from hostname)")}

  ${chalk.cyan("kuma login https://kuma.example.com --as my-server")}
  ${chalk.cyan("  Saves as 'my-server' (custom alias you choose)")}

${chalk.dim("Multi-instance workflow:")}
  ${chalk.cyan("kuma login https://kuma1.example.com --as server1")}
  ${chalk.cyan("kuma login https://kuma2.example.com --as server2")}
  ${chalk.cyan("kuma instances list")}     ${chalk.dim("# See all saved instances")}
  ${chalk.cyan("kuma use server1")}        ${chalk.dim("# Switch active instance")}

${chalk.dim("Notes:")}
  The --as alias is how you reference this instance in other commands
  (e.g. --instance server1, or when creating clusters).
  Credentials are never stored — only the session token is saved.
  Token location: run ${chalk.cyan("kuma status")} to see the config path.
`
    )
    .action(async (url: string, opts: { json?: boolean; as?: string }) => {
      const json = isJsonMode(opts);

      try {
        // Normalize URL
        const normalizedUrl = url.replace(/\/$/, "");

        // Fix #2: Warn when connecting over plain HTTP — credentials will be in cleartext
        if (!normalizedUrl.startsWith("https://")) {
          if (json) {
            // In JSON mode, surface as a warning but don't block — caller decides
            console.log(JSON.stringify({
              warning: "Connecting over HTTP. Credentials will be transmitted in cleartext. Use HTTPS in production."
            }));
          } else {
            console.warn(chalk.yellow(
              "⚠️  Warning: connecting over HTTP. Your credentials will be sent in cleartext.\n" +
              "   Use https:// in production environments."
            ));
          }
        }

        const answers = await prompt([
          {
            type: "input",
            name: "username",
            message: "Username:",
          },
          {
            type: "password",
            name: "password",
            message: "Password:",
          },
        ]);

        const { username, password } = answers as {
          username: string;
          password: string;
        };

        const client = new KumaClient(normalizedUrl);
        await client.connect();

        const result = await client.login(username, password);
        client.disconnect();

        if (!result.ok || !result.token) {
          const msg = result.msg ?? "Login failed";
          if (json) {
            jsonOut({ error: msg });
          }
          error(msg);
          process.exit(1);
        }

        const instanceName = saveConfig({ url: normalizedUrl, token: result.token }, opts.as);

        if (json) {
          jsonOut({ url: normalizedUrl, username, instanceName });
        }

        success(`Logged in to ${normalizedUrl} as "${instanceName}"`);
      } catch (err) {
        handleError(err, opts);
      }
    });
}
