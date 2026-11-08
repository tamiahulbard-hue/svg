import type { ShapeProviderRegistry } from "../../domain/ShapeProviderRegistry.js";
import type { Shape } from "../../domain/Shape.js";
import { DocumentSession } from "../DocumentSession.js";
import type { ExecutableCommand } from "../Command.js";

export class CreateCommand implements ExecutableCommand {
  readonly historyEffect = "edit" as const;
  private readonly shape: Shape;

  constructor(
    private readonly session: DocumentSession,
    private readonly type: string,
    private readonly id: string,
    private readonly parameters: readonly string[],
    private readonly parentId: string | undefined,
    shapeProviders: ShapeProviderRegistry,
  ) {
    this.shape = shapeProviders.create(type, id, parameters);
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
