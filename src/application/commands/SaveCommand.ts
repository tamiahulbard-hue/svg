import { DomainError } from "../../domain/DomainError.js";
import { DocumentSession } from "../DocumentSession.js";
import type { SvgFilePort } from "../SvgFilePort.js";
import type { Command } from "../Command.js";

export class SaveCommand implements Command {
  readonly historyEffect = "barrier" as const;

  constructor(
    private readonly session: DocumentSession,
    private readonly filePort: SvgFilePort | undefined,
    private readonly requestedPath?: string,
  ) {}

  execute(): string {
    if (this.filePort === undefined) {
      throw new DomainError("SVG file adapter is not configured");
    }
    const document = this.session.document;
    const path = this.requestedPath ?? this.session.path;
    if (path === undefined || path.length === 0) {
      throw new DomainError("no save path. use 'save <file.svg>'");
    }
    const elementCount = this.filePort.write(path, document);
    this.session.markSaved(path);
    return `saved to ${path} (${elementCount} elements)`;
  }

  undo(): string {
    throw new Error("save operations cannot be undone");
  }
}
