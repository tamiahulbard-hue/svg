import type { DocumentSession } from "./DocumentSession.js";
import type { SvgFilePort } from "./SvgFilePort.js";
import type { ShapeProviderRegistry } from "../domain/ShapeProviderRegistry.js";
import type { CommandHistory } from "./CommandHistory.js";
import type { CommandRegistry } from "./CommandRegistry.js";
import type { TreeDecoratorRegistry } from "./TreeDecoratorRegistry.js";
import type { AttributeHandlerRegistry } from "./AttributeHandlerRegistry.js";
import type { DirectoryAccess } from "./DirectoryAccess.js";

export interface ExecutableCommand {
  readonly historyEffect: "edit" | "barrier" | "skip";
  execute(): string;
  undo(): string;
}

export interface CommandContext {
  readonly session: DocumentSession;
  readonly history: CommandHistory;
  readonly filePort: SvgFilePort | undefined;
  readonly shapeProviders: ShapeProviderRegistry;
  readonly commandRegistry: CommandRegistry;
  readonly treeDecorators: TreeDecoratorRegistry;
  readonly attributeHandlers: AttributeHandlerRegistry;
  readonly directoryAccess: DirectoryAccess;
}

export interface Command {
  readonly name: string;
  readonly helpText: string;
  create(arguments_: readonly string[], context: CommandContext): ExecutableCommand;
}
