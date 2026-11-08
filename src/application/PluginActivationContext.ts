import type { AttributeHandler } from "./AttributeHandler.js";
import type { Command } from "./Command.js";
import type { DirectoryAccess } from "./DirectoryAccess.js";
import type { DocumentSession } from "./DocumentSession.js";
import type { SvgFilePort } from "./SvgFilePort.js";
import type { TreeDecorator } from "./TreeDecorator.js";
import type { ShapeProvider } from "../domain/ShapeProvider.js";

export interface PluginActivationContext {
  readonly session: DocumentSession;
  readonly filePort: SvgFilePort | undefined;
  readonly directoryAccess: DirectoryAccess;
  registerShapeProvider(provider: ShapeProvider): void;
  registerCommand(command: Command): void;
  registerTreeDecorator(decorator: TreeDecorator): void;
  registerAttributeHandler(handler: AttributeHandler): void;
}
