import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PluginConfigEntry } from "./PluginLoader.js";

const extension = import.meta.url.endsWith(".ts") ? "ts" : "js";
const pluginDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "plugins");

export const CODE_PLUGINS: readonly PluginConfigEntry[] = [
  { module: join(pluginDirectory, "stats", `index.${extension}`) },
  { module: join(pluginDirectory, "dir", `index.${extension}`) },
  { module: join(pluginDirectory, "box", `index.${extension}`) },
];
