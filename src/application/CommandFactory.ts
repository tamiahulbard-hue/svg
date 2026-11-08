import { DomainError } from "../domain/DomainError.js";
import type { CommandContext, ExecutableCommand } from "./Command.js";

export class CommandFactory {
  constructor(private readonly context: CommandContext) {}

  create(tokens: readonly string[]): ExecutableCommand {
    const [name, ...arguments_] = tokens;
    if (name === undefined) {
      throw new DomainError("empty command");
    }

    const command = this.context.commandRegistry.create(name, arguments_, this.context);
    if (command === undefined) {
      throw new DomainError(`unknown command: ${name}`);
    }
    return command;
  }
}
