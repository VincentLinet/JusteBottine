import { context } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === "development";

const log = {
  name: "log-rebuild",
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length > 0) {
        console.log("❌ Build failed");
      } else {
        console.log("✅ Rebuilt at", new Date().toLocaleTimeString("FR-fr"));
      }
    });
  }
};

const ctx = await context({
  entryPoints: {
    main: "./src/app.js"
  },
  outdir: "dist",
  outbase: ".",
  outExtension: { ".js": ".cjs" },
  bundle: true,
  platform: "node",
  format: "cjs",
  sourcemap: isDev,
  target: "node20",

  alias: {
    "@/messages": path.resolve(__dirname, "messages"),
    "@/command": path.resolve(__dirname, "src/command"),
    "@/commands": path.resolve(__dirname, "src/commands"),
    "@/core": path.resolve(__dirname, "src/core"),
    "@/events": path.resolve(__dirname, "src/events"),
    "@/libs": path.resolve(__dirname, "src/libs"),
    "@/models": path.resolve(__dirname, "src/models"),
    "@/services": path.resolve(__dirname, "src/services"),
    "@/templates": path.resolve(__dirname, "src/templates")
  },
  external: ["node-cron"],
  plugins: [log]
});

if (isDev) {
  await ctx.watch();
  console.log("👀 Watching for changes...");
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
