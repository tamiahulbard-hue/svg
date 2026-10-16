import { DomainError } from "../../domain/DomainError.js";
import { DocumentSession } from "../DocumentSession.js";
import type { Command } from "../Command.js";

export class ShowCommand implements Command {
  readonly historyEffect = "skip" as const;

  constructor(private readonly session: DocumentSession, private readonly id: string) {}

  execute(): string {
    const shape = this.session.document.findShape(this.id);
    if (shape === undefined) {
      throw new DomainError(`no such shape: ${this.id}`);
    }

    const parent = shape.parent;
    const details = Object.entries(shape.attributes).map(([name, value]) => {
      const formatted = name === "text" ? JSON.stringify(value) : value;
      return `  ${name}=${formatted}`;
    });
    return [`${shape.identity}  parent=${parent?.identity ?? "svg"}`, ...details].join("\n");
  }

  undo(): string {
    throw new Error("show display cannot be undone");
  }
}
