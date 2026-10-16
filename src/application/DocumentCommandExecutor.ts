import { DomainError } from "../domain/DomainError.js";
import { CommandFactory } from "./CommandFactory.js";
import { DocumentSession } from "./DocumentSession.js";
import type { CommandExecutor } from "./CommandExecutor.js";

export class DocumentCommandExecutor implements CommandExecutor {
  private readonly commandFactory: CommandFactory;

  constructor(private readonly session = new DocumentSession()) {
    this.commandFactory = new CommandFactory(session);
  }

  execute(tokens: readonly string[]): string {
    try {
      return this.commandFactory.create(tokens).execute();
    } catch (error) {
      if (error instanceof DomainError) {
        return `error: ${error.message}`;
      }
      throw error;
    }
  }
}
