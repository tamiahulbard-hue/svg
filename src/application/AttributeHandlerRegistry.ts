import { DomainError } from "../domain/DomainError.js";
import type { Shape } from "../domain/Shape.js";
import type { AttributeHandler } from "./AttributeHandler.js";

export class AttributeHandlerRegistry {
  private readonly handlers = new Map<string, AttributeHandler>();

  register(handler: AttributeHandler): void {
    if (handler.name.length === 0) {
      throw new DomainError("attribute handler name cannot be empty");
    }
    if (this.handlers.has(handler.name)) {
      throw new DomainError(`duplicate registration: attributes/${handler.name}`);
    }
    this.handlers.set(handler.name, handler);
  }

  resolve(shape: Shape, attribute: string): AttributeHandler | undefined {
    const matches = [...this.handlers.values()].filter((handler) =>
      handler.handles(shape, attribute));
    if (matches.length > 1) {
      throw new DomainError(
        `multiple attribute handlers for ${shape.kind}#${shape.id}.${attribute}`,
      );
    }
    return matches[0];
  }

  get names(): readonly string[] {
    return [...this.handlers.keys()];
  }
}
