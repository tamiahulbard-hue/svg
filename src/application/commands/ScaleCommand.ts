import { DomainError } from "../../domain/DomainError.js";
import type { Shape } from "../../domain/Shape.js";
import { DocumentSession } from "../DocumentSession.js";
import { ShapeSnapshot } from "../ShapeSnapshot.js";
import type { Command } from "../Command.js";

export class ScaleCommand implements Command {
  readonly historyEffect = "edit" as const;
  private shape: Shape | undefined;
  private snapshot: ShapeSnapshot | undefined;

  constructor(
    private readonly session: DocumentSession,
    private readonly id: string,
    private readonly factor: number,
  ) {}

  execute(): string {
    const shape = this.session.document.requireShape(this.id);
    const snapshot = new ShapeSnapshot(shape);
    try {
      shape.scale(this.factor);
    } catch (error) {
      snapshot.restore();
      throw error;
    }
    this.shape = shape;
    this.snapshot = snapshot;
    return `${shape.kind}#${shape.id} scaled by ${this.factor}`;
  }

  undo(): string {
    if (this.shape === undefined || this.snapshot === undefined) {
      throw new DomainError("cannot undo a scale that has not been executed");
    }
    this.snapshot.restore();
    return `${this.shape.kind}#${this.shape.id} scale undone`;
  }
}
