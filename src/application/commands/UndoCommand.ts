import { CommandHistory } from "../CommandHistory.js";
import type { Command } from "../Command.js";

export class UndoCommand implements Command {
  readonly historyEffect = "skip" as const;

  constructor(private readonly history: CommandHistory) {}

  execute(): string {
    return this.history.undo();
  }

  undo(): string {
    throw new Error("undo command cannot be undone");
  }
}
