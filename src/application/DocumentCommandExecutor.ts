import { DomainError } from "../domain/DomainError.js";
import { CommandFactory } from "./CommandFactory.js";
import { CommandHistory } from "./CommandHistory.js";
import { DocumentSession } from "./DocumentSession.js";
import type { CommandExecutor } from "./CommandExecutor.js";
import type { SvgFilePort } from "./SvgFilePort.js";

export class DocumentCommandExecutor implements CommandExecutor {
  private readonly commandFactory: CommandFactory;
  private readonly history: CommandHistory;

  constructor(
    private readonly session = new DocumentSession(),
    filePort?: SvgFilePort,
  ) {
    this.history = new CommandHistory();
    this.commandFactory = new CommandFactory(session, this.history, filePort);
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
