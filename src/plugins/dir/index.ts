import type { PluginActivationContext } from "../../assembly/PluginContext.js";
import { DirCommandPlugin } from "./DirCommandPlugin.js";

export default {
  activate(context: PluginActivationContext): void {
    context.registerCommand(new DirCommandPlugin());
  },
};
