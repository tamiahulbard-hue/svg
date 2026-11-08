import type { PluginActivationContext } from "../../application/PluginActivationContext.js";
import { BoxAttributeHandler } from "./BoxAttributeHandler.js";
import { BoxShapeProvider } from "./BoxShapeProvider.js";
import { BoxTypeDecorator } from "./BoxTypeDecorator.js";
import { ModifiedStarDecorator } from "./ModifiedStarDecorator.js";

export default {
  activate(context: PluginActivationContext): void {
    context.registerShapeProvider(new BoxShapeProvider());
    context.registerAttributeHandler(new BoxAttributeHandler());
    context.registerTreeDecorator(new BoxTypeDecorator());
    context.registerTreeDecorator(new ModifiedStarDecorator(context.session));
  },
};
