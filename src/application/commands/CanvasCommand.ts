import { DocumentSession } from "../DocumentSession.js";
import type { Command } from "../Command.js";

export class CanvasCommand implements Command {
  constructor(
    private readonly session: DocumentSession,
    private readonly width?: number,
    private readonly height?: number,
  ) {}

  get historyEffect(): "barrier" | "skip" {
    return this.width === undefined && this.height === undefined ? "skip" : "barrier";
  }

  execute(): string {
    const document = this.session.document;
    if (this.width === undefined && this.height === undefined) {
      return `canvas ${document.width}x${document.height}`;
    }
    document.setCanvasSize(this.width ?? document.width, this.height ?? document.height);
    return `canvas resized to ${document.width}x${document.height}`;
  }

  undo(): string {
    throw new Error("canvas changes cannot be undone");
  }
}
