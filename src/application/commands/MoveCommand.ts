import { DomainError } from "../../domain/DomainError.js";
import type { Shape } from "../../domain/Shape.js";
import { DocumentSession } from "../DocumentSession.js";
import { ShapeSnapshot } from "../ShapeSnapshot.js";
import type { Command } from "../Command.js";

export class MoveCommand implements Command {
  readonly historyEffect = "edit" as const;
  private shape: Shape | undefined;
  private snapshot: ShapeSnapshot | undefined;
  private previousPosition: { x: number; y: number } | undefined;

  constructor(
    private readonly session: DocumentSession,
    private readonly id: string,
    private readonly dx: number,
    private readonly dy: number,
  ) {}

  execute(): string {
    const shape = this.session.document.requireShape(this.id);
    const snapshot = new ShapeSnapshot(shape);
    const geometry = shape.geometryAttributes;
    const x = geometry.x ?? geometry.cx ?? geometry.x1;
    const y = geometry.y ?? geometry.cy ?? geometry.y1;
    this.previousPosition = x === undefined || y === undefined ? undefined : { x, y };
    try {
      shape.move(this.dx, this.dy);
    } catch (error) {
      snapshot.restore();
      throw error;
    }
    this.shape = shape;
    this.snapshot = snapshot;
    const movedGeometry = shape.geometryAttributes;
    const movedX = movedGeometry.x ?? movedGeometry.cx ?? movedGeometry.x1;
    const movedY = movedGeometry.y ?? movedGeometry.cy ?? movedGeometry.y1;
    const result = movedX === undefined || movedY === undefined
      ? `moved by (${this.dx},${this.dy})`
      : `moved to (${movedX},${movedY})`;
    return `${shape.kind}#${shape.id} ${result}`;
  }

  undo(): string {
    if (this.shape === undefined || this.snapshot === undefined) {
      throw new DomainError("cannot undo a move that has not been executed");
    }
    this.snapshot.restore();
    const position = this.previousPosition === undefined
      ? `moved back by (${-this.dx},${-this.dy})`
      : `moved back to (${this.previousPosition.x},${this.previousPosition.y})`;
    return `${this.shape.kind}#${this.shape.id} ${position}`;
  }
}
