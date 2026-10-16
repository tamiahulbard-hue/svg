import { DocumentSession } from "../DocumentSession.js";
import type { Command } from "../Command.js";

export class InitCommand implements Command {
  readonly historyEffect = "barrier" as const;

  constructor(
    private readonly session: DocumentSession,
    private readonly width = 800,
    private readonly height = 600,
  ) {}

  execute(): string {
    const document = this.session.initialize(this.width, this.height);
    return `canvas ${document.width}x${document.height} created`;
  }

  undo(): string {
    throw new Error("document initialization cannot be undone");
  }
}
