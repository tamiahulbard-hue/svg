import { createInterface } from "node:readline";
import type { CommandExecutor } from "../application/CommandExecutor.js";

export class Cli {
  constructor(private readonly commandExecutor: CommandExecutor) {}

  run(): void {
    const terminal = process.stdin.isTTY === true;
    const readline = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal,
    });

    console.log("svg-editor 0.1 - type 'help' for commands");
    readline.setPrompt("svg> ");
    readline.prompt();

    readline.on("line", (input) => {
      const command = input.trim();

      if (command === "exit" || command === "quit") {
        readline.close();
        return;
      }

      if (command.length > 0 && !command.startsWith("#")) {
        console.log(this.commandExecutor.execute(command));
      }

      readline.prompt();
    });
  }
}
