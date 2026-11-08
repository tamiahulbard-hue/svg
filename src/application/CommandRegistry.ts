import { DomainError } from "../domain/DomainError.js";
import type { Command, CommandContext, ExecutableCommand } from "./Command.js";

export class CommandRegistry {
  private readonly commands = new Map<string, Command>();

  register(command: Command): void {
    if (command.name.length === 0) {
      throw new DomainError("command name cannot be empty");
    }
    if (this.commands.has(command.name)) {
      throw new DomainError(`duplicate registration: commands/${command.name}`);
    }
    this.commands.set(command.name, command);
  }

  create(
    name: string,
    arguments_: readonly string[],
    context: CommandContext,
  ): ExecutableCommand | undefined {
    return this.commands.get(name)?.create(arguments_, context);
  }

  get additionalHelp(): string {
    const commands = [...this.commands.values()].filter((command) => command.helpText.length > 0);
    if (commands.length === 0) {
      return "";
    }
    return [
      "Plugins:",
      ...commands.map((command) => `  ${command.name}  ${command.helpText}`),
    ].join("\n");
  }

  get names(): readonly string[] {
    return [...this.commands.keys()];
  }
}
