import { DomainError } from "../domain/DomainError.js";
import type { Command } from "./Command.js";

export class CommandHistory {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];
  private blockedByDocumentOperation = false;

  execute(command: Command): string {
    const result = command.execute();

    if (command.historyEffect === "barrier") {
      this.undoStack.length = 0;
      this.redoStack.length = 0;
      this.blockedByDocumentOperation = true;
    } else if (command.historyEffect === "edit") {
      this.undoStack.push(command);
      this.redoStack.length = 0;
      this.blockedByDocumentOperation = false;
    }

    return result;
  }

  undo(): string {
    this.requireHistoryAvailable();
    const command = this.undoStack[this.undoStack.length - 1];
    if (command === undefined) {
      throw new DomainError("nothing to undo");
    }

    const result = command.undo();
    this.undoStack.pop();
    this.redoStack.push(command);
    return result;
  }

  redo(): string {
    this.requireHistoryAvailable();
    const command = this.redoStack[this.redoStack.length - 1];
    if (command === undefined) {
      throw new DomainError("nothing to redo");
    }

    const result = command.execute();
    this.redoStack.pop();
    this.undoStack.push(command);
    return result;
  }

  private requireHistoryAvailable(): void {
    if (this.blockedByDocumentOperation) {
      throw new DomainError("undo not allowed after io command");
    }
  }
}
