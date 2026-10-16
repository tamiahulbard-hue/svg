import { CommandHistory } from "../CommandHistory.js";
import type { Command } from "../Command.js";

export class RedoCommand implements Command {
  readonly historyEffect = "skip" as const;

  constructor(private readonly history: CommandHistory) {}

  execute(): string {
    return this.history.redo();
  }

  undo(): string {
    throw new Error("redo command cannot be undone");
  }
}
