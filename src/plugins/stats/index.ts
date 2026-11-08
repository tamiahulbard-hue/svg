import type { PluginActivationContext } from "../../application/PluginActivationContext.js";
import { StatsCommandPlugin } from "./StatsCommandPlugin.js";

export default {
  activate(context: PluginActivationContext): void {
    context.registerCommand(new StatsCommandPlugin());
  },
};
