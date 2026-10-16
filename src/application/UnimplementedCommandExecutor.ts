import type { CommandExecutor } from "./CommandExecutor.js";

export class UnimplementedCommandExecutor implements CommandExecutor {
  execute(_input: string): string {
    return "error: commands are not implemented yet";
  }
}
