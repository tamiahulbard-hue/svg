import { DomainError } from "../../domain/DomainError.js";
import { GroupShape } from "../../domain/GroupShape.js";
import { DocumentSession } from "../DocumentSession.js";
import { ShapePlacement } from "../ShapePlacement.js";
import type { Command } from "../Command.js";

export class ReparentCommand implements Command {
  readonly historyEffect = "edit" as const;
  private placement: ShapePlacement | undefined;

  constructor(
    private readonly session: DocumentSession,
    private readonly parentId: string,
    private readonly id: string,
  ) {}

  execute(): string {
    const document = this.session.document;
    const parent = document.requireShape(this.parentId);
    if (!(parent instanceof GroupShape)) {
      throw new DomainError(`not a container: ${this.parentId}`);
    }
    const shape = document.requireShape(this.id);
    const placement = new ShapePlacement(document, shape);
    document.reparentShape(this.id, this.parentId);
    this.placement = placement;
    return `${shape.kind}#${shape.id} moved to g#${this.parentId}`;
  }

  undo(): string {
    const placement = this.placement;
    if (placement === undefined) {
      throw new DomainError("cannot undo a reparent that has not been executed");
    }
    const shape = this.session.document.requireShape(this.id);
    placement.restore(this.session.document, shape);
    return `${shape.kind}#${shape.id} restored to its previous parent`;
  }
}
