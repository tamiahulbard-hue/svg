import { DomainError } from "../domain/DomainError.js";
import type { Shape } from "../domain/Shape.js";
import type { TreeDecorator } from "./TreeDecorator.js";

export class TreeDecoratorRegistry {
  private readonly decorators = new Map<string, TreeDecorator>();

  register(decorator: TreeDecorator): void {
    if (decorator.name.length === 0) {
      throw new DomainError("tree decorator name cannot be empty");
    }
    if (this.decorators.has(decorator.name)) {
      throw new DomainError(`duplicate registration: decorators/${decorator.name}`);
    }
    this.decorators.set(decorator.name, decorator);
  }

  suffix(shape: Shape): string {
    const labels: string[] = [];
    for (const decorator of this.decorators.values()) {
      const label = decorator.decorate(shape);
      if (label === undefined) {
        continue;
      }
      if (typeof label !== "string" || /[\r\n]/.test(label)) {
        throw new DomainError(`invalid tree decorator output: ${decorator.name}`);
      }
      if (label.trim().length === 0) {
        continue;
      }
      labels.push(label);
    }
    return labels.length === 0 ? "" : ` ${labels.join(" ")}`;
  }

  get names(): readonly string[] {
    return [...this.decorators.keys()];
  }
}
