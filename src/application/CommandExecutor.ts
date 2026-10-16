export interface CommandExecutor {
  execute(tokens: readonly string[]): string;
}
