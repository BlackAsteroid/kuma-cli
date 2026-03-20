# Config Export & Import

The Kuma CLI provides powerful export and import commands to help you backup your configuration, move it between instances, or version-control your monitoring setup.

## Exporting Config

To backup your monitors and their notifications:
```bash
kuma config export --output backup.yaml
```

The output file will contain:
- Monitor definitions (name, type, interval, url, etc.)
- Notification channel definitions

### Filtering Exports

If you only want to export monitors for a specific environment or customer, use the `--tag` flag:
```bash
kuma config export --tag "Production" --output prod-backup.json
```

*Note: When you use `--tag`, only notifications that are attached to those matching monitors will be included in the export.*

### Security

Passwords, tokens, and webhooks in notification configs are automatically obfuscated with `********` to prevent leaking secrets into version control.

## Importing Config

You can restore a previously exported file:
```bash
kuma config import backup.yaml
```

### Dry Run

Before making changes, you can preview what the import will do:
```bash
kuma config import backup.yaml --dry-run
```

### Conflict Resolution

If a monitor or notification in the backup file already exists in Kuma (matched by name):
- **Skip** (default): Existing items are ignored.
  ```bash
  kuma config import backup.yaml --on-conflict skip
  ```
- **Update**: Existing items are overwritten with the definitions from the file.
  ```bash
  kuma config import backup.yaml --on-conflict update
  ```

## JSON / Piping

You can also pipe the export straight to `stdout` instead of a file by using `-` for the output path, which is especially useful for CI/CD pipelines:
```bash
kuma config export --output - --json > state.json
```
