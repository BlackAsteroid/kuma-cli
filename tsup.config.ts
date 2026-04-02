import { defineConfig } from "tsup";

export default defineConfig([
  // Main CLI bundle (CJS) — no ink/react dependency
  {
    entry: ["src/index.ts"],
    format: ["cjs"],
    target: "node20",
    clean: true,
    minify: false,
    noExternal: [/.*/],
    external: ["./tui-app.mjs", "ink", "react", "react/jsx-runtime", "ink-text-input", "react-devtools-core"],
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
  // TUI bundle (ESM) — ink/react are ESM-only
  {
    entry: { "tui-app": "src/tui/render.tsx" },
    format: ["esm"],
    target: "node20",
    clean: false,
    minify: false,
    noExternal: [/.*/],
    // Shim require() for CJS deps bundled into ESM (e.g. socket.io-client)
    banner: {
      js: 'import { createRequire as __$$createRequire } from "module"; const require = __$$createRequire(import.meta.url);',
    },
    esbuildOptions(options) {
      options.platform = "node";
      options.external = [...(options.external ?? []), "react-devtools-core"];
    },
  },
]);
