import { GroupShape } from "../../domain/GroupShape.js";
import type { Shape } from "../../domain/Shape.js";
import { DocumentSession } from "../DocumentSession.js";
import type { Command } from "../Command.js";

export class DeleteCommand implements Command {
  readonly historyEffect = "edit" as const;
  private shape: Shape | undefined;
  private parentId: string | undefined;
  private index = -1;

  constructor(private readonly session: DocumentSession, private readonly id: string) {}

  execute(): string {
    const document = this.session.document;
    const shape = document.requireShape(this.id);
    const parent = shape.parent;
    const siblings = parent instanceof GroupShape ? parent.children : document.children;
    this.parentId = parent instanceof GroupShape ? parent.id : undefined;
    this.index = siblings.indexOf(shape);
    this.shape = document.removeShape(this.id);
    return `${shape.kind}#${shape.id} deleted`;
  }

  undo(): string {
    if (this.shape === undefined) {
      throw new Error("cannot undo a deletion that has not been executed");
    }
    this.session.document.addShape(this.shape, this.parentId, this.index);
    return `${this.shape.kind}#${this.shape.id} restored`;
  }
}
