import { createInterface } from "node:readline";
import type { CommandExecutor } from "../application/CommandExecutor.js";
import { CommandParser, CommandParseError } from "./CommandParser.js";

export class Cli {
  constructor(
    private readonly commandExecutor: CommandExecutor,
    private readonly commandParser = new CommandParser(),
  ) {}

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
        try {
          const tokens = this.commandParser.parse(command);
          if (tokens.length > 0) {
            console.log(this.commandExecutor.execute(tokens));
          }
        } catch (error) {
          if (!(error instanceof CommandParseError)) {
            throw error;
          }
          console.log(`error: ${error.message}`);
        }
      }

      readline.prompt();
    });
  }
}
