import { CommandHistory } from "../CommandHistory.js";
import type { ExecutableCommand } from "../Command.js";

export class RedoCommand implements ExecutableCommand {
  readonly historyEffect = "skip" as const;

  constructor(private readonly history: CommandHistory) {}

  execute(): string {
    return this.history.redo();
  }

  undo(): string {
    throw new Error("redo command cannot be undone");
  }
}
