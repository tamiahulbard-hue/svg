import type { AttributeHandler } from "../application/AttributeHandler.js";
import type { Command } from "../application/Command.js";
import type { DirectoryAccess } from "../application/DirectoryAccess.js";
import type { DocumentSession } from "../application/DocumentSession.js";
import type { PluginActivationContext } from "../application/PluginActivationContext.js";
import type { SvgFilePort } from "../application/SvgFilePort.js";
import type { TreeDecorator } from "../application/TreeDecorator.js";
import type { ShapeProvider } from "../domain/ShapeProvider.js";
import { DomainError } from "../domain/DomainError.js";

export type PluginContributions = {
  readonly shapes: readonly ShapeProvider[];
  readonly commands: readonly Command[];
  readonly decorators: readonly TreeDecorator[];
  readonly attributes: readonly AttributeHandler[];
};

export class StagedPluginContext implements PluginActivationContext {
  private readonly shapes: ShapeProvider[] = [];
  private readonly commands: Command[] = [];
  private readonly decorators: TreeDecorator[] = [];
  private readonly attributes: AttributeHandler[] = [];

  constructor(
    readonly session: DocumentSession,
    readonly filePort: SvgFilePort | undefined,
    readonly directoryAccess: DirectoryAccess,
  ) {}

  registerShapeProvider(provider: ShapeProvider): void {
    if (typeof provider?.kind !== "string" || provider.kind.length === 0) {
      throw new DomainError("shape provider kind cannot be empty");
    }
    this.shapes.push(provider);
  }

  registerCommand(command: Command): void {
    if (typeof command?.name !== "string" || command.name.length === 0) {
      throw new DomainError("command name cannot be empty");
    }
    this.commands.push(command);
  }

  registerTreeDecorator(decorator: TreeDecorator): void {
    if (typeof decorator?.name !== "string" || decorator.name.length === 0) {
      throw new DomainError("tree decorator name cannot be empty");
    }
    this.decorators.push(decorator);
  }

  registerAttributeHandler(handler: AttributeHandler): void {
    if (typeof handler?.name !== "string" || handler.name.length === 0) {
      throw new DomainError("attribute handler name cannot be empty");
    }
    this.attributes.push(handler);
  }

  get contributions(): PluginContributions {
    return {
      shapes: [...this.shapes],
      commands: [...this.commands],
      decorators: [...this.decorators],
      attributes: [...this.attributes],
    };
  }
}
