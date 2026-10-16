import { DomainError } from "../../domain/DomainError.js";
import type { Shape } from "../../domain/Shape.js";
import { DocumentSession } from "../DocumentSession.js";
import { ShapeSnapshot } from "../ShapeSnapshot.js";
import type { Command } from "../Command.js";

export class MoveCommand implements Command {
  readonly historyEffect = "edit" as const;
  private shape: Shape | undefined;
  private snapshot: ShapeSnapshot | undefined;

  constructor(
    private readonly session: DocumentSession,
    private readonly id: string,
    private readonly dx: number,
    private readonly dy: number,
  ) {}

  execute(): string {
    const shape = this.session.document.requireShape(this.id);
    const snapshot = new ShapeSnapshot(shape);
    try {
      shape.move(this.dx, this.dy);
    } catch (error) {
      snapshot.restore();
      throw error;
    }
    this.shape = shape;
    this.snapshot = snapshot;
    const geometry = shape.geometryAttributes;
    const x = geometry.x ?? geometry.cx ?? geometry.x1;
    const y = geometry.y ?? geometry.cy ?? geometry.y1;
    const result = x === undefined || y === undefined
      ? `moved by (${this.dx},${this.dy})`
      : `moved to (${x},${y})`;
    return `${shape.kind}#${shape.id} ${result}`;
  }

  undo(): string {
    if (this.shape === undefined || this.snapshot === undefined) {
      throw new DomainError("cannot undo a move that has not been executed");
    }
    this.snapshot.restore();
    return `${this.shape.kind}#${this.shape.id} moved back`;
  }
}
