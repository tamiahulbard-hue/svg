import { DomainError } from "../../domain/DomainError.js";
import { DocumentSession } from "../DocumentSession.js";
import { ShapePlacement } from "../ShapePlacement.js";
import type { Command } from "../Command.js";

export class ZOrderCommand implements Command {
  readonly historyEffect = "edit" as const;
  private placement: ShapePlacement | undefined;

  constructor(
    private readonly session: DocumentSession,
    private readonly id: string,
    private readonly front: boolean,
  ) {}

  execute(): string {
    const document = this.session.document;
    const shape = document.requireShape(this.id);
    const placement = new ShapePlacement(document, shape);
    if (this.front) {
      document.moveToFront(this.id);
    } else {
      document.moveToBack(this.id);
    }
    this.placement = placement;
    const position = this.front ? "front" : "back";
    return `${shape.kind}#${shape.id} moved to ${position}`;
  }

  undo(): string {
    if (this.placement === undefined) {
      throw new DomainError("cannot undo a z-order change that has not been executed");
    }
    const shape = this.session.document.requireShape(this.id);
    this.placement.restore(this.session.document, shape);
    return `${shape.kind}#${shape.id} z-order restored`;
  }
}
