import { DomainError } from "../domain/DomainError.js";
import { DocumentSession } from "./DocumentSession.js";
import type { CommandExecutor } from "./CommandExecutor.js";

export class DocumentCommandExecutor implements CommandExecutor {
  constructor(private readonly session = new DocumentSession()) {}

  execute(input: string): string {
    const [name, ...arguments_] = input.trim().split(/\s+/);

    try {
      switch (name) {
        case "init":
          return this.initialize(arguments_);
        case "canvas":
          return this.canvas(arguments_);
        default:
          return `error: unknown command: ${name}`;
      }
    } catch (error) {
      if (error instanceof DomainError) {
        return `error: ${error.message}`;
      }
      throw error;
    }
  }

  private initialize(arguments_: string[]): string {
    if (arguments_.length > 2) {
      throw new DomainError("usage: init [width] [height]");
    }
    const width = arguments_[0] === undefined ? 800 : this.parseDimension(arguments_[0], "width");
    const height = arguments_[1] === undefined ? 600 : this.parseDimension(arguments_[1], "height");
    const document = this.session.initialize(width, height);
    return `canvas ${document.width}x${document.height} created`;
  }

  private canvas(arguments_: string[]): string {
    if (arguments_.length === 0) {
      const document = this.session.document;
      return `canvas ${document.width}x${document.height}`;
    }
    if (arguments_.length > 2) {
      throw new DomainError("usage: canvas [width] [height]");
    }

    const current = this.session.document;
    const width = arguments_[0] === undefined
      ? current.width
      : this.parseDimension(arguments_[0], "width");
    const height = arguments_[1] === undefined
      ? current.height
      : this.parseDimension(arguments_[1], "height");
    const document = this.session.resizeCanvas(width, height);
    return `canvas resized to ${document.width}x${document.height}`;
  }

  private parseDimension(value: string, name: string): number {
    const dimension = Number(value);
    if (value.trim().length === 0 || !Number.isFinite(dimension)) {
      throw new DomainError(`${name} must be a finite number`);
    }
    return dimension;
  }
}
