import { DomainError } from "../../domain/DomainError.js";
import { GroupShape } from "../../domain/GroupShape.js";
import type { Shape } from "../../domain/Shape.js";
import { DocumentSession } from "../DocumentSession.js";
import type { Command } from "../Command.js";

export class TreeCommand implements Command {
  readonly historyEffect = "skip" as const;

  constructor(
    private readonly session: DocumentSession,
    private readonly id?: string,
  ) {}

  execute(): string {
    const document = this.session.document;
    if (this.id !== undefined) {
      const shape = document.findShape(this.id);
      if (shape === undefined) {
        throw new DomainError(`no such shape: ${this.id}`);
      }
      return this.renderShape(shape, "", "", true);
    }

    const lines = [`svg (${document.width}x${document.height})`];
    lines.push(...this.renderChildren(document.children, ""));
    return lines.join("\n");
  }

  undo(): string {
    throw new Error("tree display cannot be undone");
  }

  private renderChildren(children: readonly Shape[], prefix: string): string[] {
    const lines: string[] = [];
    children.forEach((shape, index) => {
      const last = index === children.length - 1;
      const branch = last ? "└── " : "├── ";
      const childPrefix = prefix + (last ? "    " : "│   ");
      lines.push(this.renderShape(shape, prefix, branch, false));
      if (shape instanceof GroupShape) {
        lines.push(...this.renderChildren(shape.children, childPrefix));
      }
    });
    return lines;
  }

  private renderShape(shape: Shape, prefix: string, branch: string, includeChildren: boolean): string {
    const lines = [`${prefix}${branch}${shape.treeSummary}`];
    if (includeChildren && shape instanceof GroupShape) {
      lines.push(...this.renderChildren(shape.children, ""));
    }
    return lines.join("\n");
  }
}
