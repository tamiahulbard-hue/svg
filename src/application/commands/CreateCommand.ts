import { DomainError } from "../../domain/DomainError.js";
import { ShapeFactory } from "../../domain/ShapeFactory.js";
import type { Shape } from "../../domain/Shape.js";
import { DocumentSession } from "../DocumentSession.js";
import type { Command } from "../Command.js";

export class CreateCommand implements Command {
  readonly historyEffect = "edit" as const;
  private readonly shape: Shape;

  constructor(
    private readonly session: DocumentSession,
    private readonly type: string,
    private readonly id: string,
    private readonly parameters: readonly string[],
    private readonly parentId?: string,
  ) {
    this.shape = ShapeFactory.create(type, id, parameters);
  }

  execute(): string {
    const document = this.session.document;
    document.addShape(this.shape, this.parentId);
    const parentDescription = this.parentId === undefined
      ? ""
      : ` in g#${this.parentId}`;
    return `${this.shape.kind}#${this.shape.id} created${parentDescription}`;
  }

  undo(): string {
    this.session.document.removeShape(this.id);
    return `${this.shape.kind}#${this.id} creation undone`;
  }
}
