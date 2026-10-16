import { DomainError } from "../../domain/DomainError.js";
import { GroupShape } from "../../domain/GroupShape.js";
import type { Shape } from "../../domain/Shape.js";
import { DocumentSession } from "../DocumentSession.js";
import { ShapePlacement } from "../ShapePlacement.js";
import type { Command } from "../Command.js";

export class UngroupCommand implements Command {
  readonly historyEffect = "edit" as const;
  private group: GroupShape | undefined;
  private children: Shape[] = [];
  private placement: ShapePlacement | undefined;

  constructor(private readonly session: DocumentSession, private readonly id: string) {}

  execute(): string {
    const document = this.session.document;
    const shape = document.requireShape(this.id);
    if (!(shape instanceof GroupShape)) {
      throw new DomainError(`not a container: ${this.id}`);
    }
    const placement = new ShapePlacement(document, shape);
    const children = document.ungroupShape(this.id);
    this.group = shape;
    this.children = children;
    this.placement = placement;
    return `g#${this.id} ungrouped (${children.length} children)`;
  }

  undo(): string {
    const group = this.group;
    const placement = this.placement;
    if (group === undefined || placement === undefined) {
      throw new DomainError("cannot undo an ungroup that has not been executed");
    }
    const document = this.session.document;
    placement.restore(document, group);
    for (const child of this.children) {
      document.reparentShape(child.id, group.id);
    }
    return `g#${this.id} restored`;
  }
}
