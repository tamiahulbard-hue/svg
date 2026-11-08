import { DomainError } from "../domain/DomainError.js";
import { CommandFactory } from "./CommandFactory.js";
import { CommandHistory } from "./CommandHistory.js";
import { DocumentSession } from "./DocumentSession.js";
import type { CommandExecutor } from "./CommandExecutor.js";
import type { SvgFilePort } from "./SvgFilePort.js";
import type { ShapeProviderRegistry } from "../domain/ShapeProviderRegistry.js";
import { CommandRegistry } from "./CommandRegistry.js";
import type { CommandContext } from "./Command.js";
import { TreeDecoratorRegistry } from "./TreeDecoratorRegistry.js";
import { AttributeHandlerRegistry } from "./AttributeHandlerRegistry.js";

export class DocumentCommandExecutor implements CommandExecutor {
  private readonly commandFactory: CommandFactory;
  private readonly history: CommandHistory;

  constructor(
    private readonly session: DocumentSession,
    filePort: SvgFilePort | undefined,
    shapeProviders: ShapeProviderRegistry,
    commandRegistry = new CommandRegistry(),
    treeDecorators = new TreeDecoratorRegistry(),
    attributeHandlers = new AttributeHandlerRegistry(),
  ) {
    this.history = new CommandHistory();
    const context: CommandContext = {
      session,
      history: this.history,
      filePort,
      shapeProviders,
      commandRegistry,
      treeDecorators,
      attributeHandlers,
    };
    this.commandFactory = new CommandFactory(context);
  }

  execute(tokens: readonly string[]): string {
    try {
      return this.history.execute(this.commandFactory.create(tokens));
    } catch (error) {
      if (error instanceof DomainError) {
        return `error: ${error.message}`;
      }
      throw error;
    }
  }
}
