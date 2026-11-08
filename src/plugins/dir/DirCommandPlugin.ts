import { DomainError } from "../../domain/DomainError.js";
import type { Command, CommandContext, ExecutableCommand } from "../../application/Command.js";
import type { DirectoryAccess, DirectoryEntry } from "../../application/DirectoryAccess.js";

class DirCommand implements ExecutableCommand {
  readonly historyEffect = "skip" as const;

  constructor(private readonly directoryAccess: DirectoryAccess) {}

  execute(): string {
    const path = this.directoryAccess.currentWorkingDirectory();
    const result = this.directoryAccess.readDirectory(path);
    if (!result.success) {
      return `error: cannot read directory: ${path}`;
    }
    const visibleEntries = result.entries.filter((entry) => entry.name !== "." && entry.name !== "..");
    if (visibleEntries.length === 0) {
      return "(empty directory)";
    }

    const directories = visibleEntries
      .filter((entry) => entry.type === "directory")
      .sort((left, right) => this.compareNames(left, right));
    const files = visibleEntries
      .filter((entry) => entry.type !== "directory")
      .sort((left, right) => this.compareNames(left, right));

    return [
      ...directories.map((entry) => `[DIR]  ${entry.name}`),
      ...files.map((entry) => `[FILE] ${entry.name}`),
    ].join("\n");
  }

  undo(): string {
    throw new Error("dir command cannot be undone");
  }

  private compareNames(left: DirectoryEntry, right: DirectoryEntry): number {
    return left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
  }
}

export class DirCommandPlugin implements Command {
  readonly name = "dir";
  readonly helpText = "list the current working directory";

  create(arguments_: readonly string[], context: CommandContext): ExecutableCommand {
    if (arguments_.length > 0) {
      throw new DomainError("usage: dir");
    }
    return new DirCommand(context.directoryAccess);
  }
}
