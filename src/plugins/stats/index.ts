import type { PluginActivationContext } from "../../assembly/PluginContext.js";
import { StatsCommandPlugin } from "./StatsCommandPlugin.js";

export default {
  activate(context: PluginActivationContext): void {
    context.registerCommand(new StatsCommandPlugin());
  },
};
