import { DomainError } from "../../domain/DomainError.js";
import type { Shape, ShapeAttributeValue } from "../../domain/Shape.js";
import { DocumentSession } from "../DocumentSession.js";
import { ShapeSnapshot } from "../ShapeSnapshot.js";
import type { Command } from "../Command.js";

export class SetCommand implements Command {
  readonly historyEffect = "edit" as const;
  private shape: Shape | undefined;
  private snapshot: ShapeSnapshot | undefined;
  private previousValue: ShapeAttributeValue | undefined;

  constructor(
    private readonly session: DocumentSession,
    private readonly id: string,
    private readonly attribute: string,
    private readonly value: ShapeAttributeValue,
  ) {}

  execute(): string {
    const shape = this.session.document.requireShape(this.id);
    const snapshot = new ShapeSnapshot(shape);
    this.previousValue = shape.attributes[this.attribute];
    shape.setAttribute(this.attribute, this.value);
    this.shape = shape;
    this.snapshot = snapshot;
    const formatted = typeof this.value === "string" ? `"${this.value}"` : this.value;
    return `${shape.kind}#${shape.id} updated: ${this.attribute}=${formatted}`;
  }

  undo(): string {
    if (this.shape === undefined || this.snapshot === undefined) {
      throw new DomainError("cannot undo an attribute change that has not been executed");
    }
    this.snapshot.restore();
    if (this.previousValue === undefined) {
      return `${this.shape.kind}#${this.shape.id} updated: ${this.attribute} cleared`;
    }
    const formatted = typeof this.previousValue === "string"
      ? JSON.stringify(this.previousValue)
      : this.previousValue;
    return `${this.shape.kind}#${this.shape.id} updated: ${this.attribute}=${formatted}`;
  }
}
