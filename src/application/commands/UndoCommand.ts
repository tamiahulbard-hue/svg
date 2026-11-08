import { CommandHistory } from "../CommandHistory.js";
import type { ExecutableCommand } from "../Command.js";

export class UndoCommand implements ExecutableCommand {
  readonly historyEffect = "skip" as const;

  constructor(private readonly history: CommandHistory) {}

  execute(): string {
    return this.history.undo();
  }

  undo(): string {
    throw new Error("undo command cannot be undone");
  }
}
