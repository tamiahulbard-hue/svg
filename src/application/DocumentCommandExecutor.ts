import { DomainError } from "../domain/DomainError.js";
import { CommandFactory } from "./CommandFactory.js";
import { CommandHistory } from "./CommandHistory.js";
import { DocumentSession } from "./DocumentSession.js";
import type { CommandExecutor } from "./CommandExecutor.js";

export class DocumentCommandExecutor implements CommandExecutor {
  private readonly commandFactory: CommandFactory;
  private readonly history: CommandHistory;

  constructor(private readonly session = new DocumentSession()) {
    this.history = new CommandHistory();
    this.commandFactory = new CommandFactory(session, this.history);
  }

  execute(tokens: readonly string[]): string {
    try {
      return this.history.execute(this.commandFactory.create(tokens));
    } catch (error) {
      if (error instanceof DomainError) {
        return `error: ${error.message}`;
      }
      throw error;
    }
  }
}
