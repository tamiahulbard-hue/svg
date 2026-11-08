import type { Command, CommandContext, ExecutableCommand } from "../application/Command.js";
import type { CommandRegistry } from "../application/CommandRegistry.js";
import { BuiltinCommandCatalog } from "./BuiltinCommandCatalog.js";

const BUILTIN_COMMAND_NAMES = [
  "undo",
  "redo",
  "init",
  "canvas",
  "read",
  "save",
  "tree",
  "show",
  "help",
  "create",
  "delete",
  "move",
  "scale",
  "set",
  "group",
  "ungroup",
  "addto",
  "front",
  "back",
] as const;

class BuiltinCommand implements Command {
  readonly helpText = "";

  constructor(readonly name: string) {}

  create(arguments_: readonly string[], context: CommandContext): ExecutableCommand {
    const catalog = new BuiltinCommandCatalog(
      context.session,
      context.history,
      context.filePort,
      context.shapeProviders,
      context.commandRegistry,
      context.treeDecorators,
      context.attributeHandlers,
      context.directoryAccess,
    );
    return catalog.create([this.name, ...arguments_]);
  }
}

export function registerBuiltinCommands(registry: CommandRegistry): void {
  for (const name of BUILTIN_COMMAND_NAMES) {
    registry.register(new BuiltinCommand(name));
  }
}
