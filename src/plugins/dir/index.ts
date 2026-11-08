import type { PluginActivationContext } from "../../application/PluginActivationContext.js";
import { DirCommandPlugin } from "./DirCommandPlugin.js";

export default {
  activate(context: PluginActivationContext): void {
    context.registerCommand(new DirCommandPlugin());
  },
};
