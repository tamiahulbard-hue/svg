import { DomainError } from "../../domain/DomainError.js";
import { DocumentSession } from "../DocumentSession.js";
import type { SvgFilePort } from "../SvgFilePort.js";
import type { Command } from "../Command.js";

export class ReadCommand implements Command {
  readonly historyEffect = "barrier" as const;

  constructor(
    private readonly session: DocumentSession,
    private readonly filePort: SvgFilePort | undefined,
    private readonly path: string,
  ) {}

  execute(): string {
    if (this.filePort === undefined) {
      throw new DomainError("SVG file adapter is not configured");
    }
    const loaded = this.filePort.read(this.path);
    this.session.load(loaded.document, this.path);
    const summary = `read ${this.path} (${loaded.elementCount} elements)`;
    return [...loaded.warnings, summary].join("\n");
  }

  undo(): string {
    throw new Error("read operations cannot be undone");
  }
}
