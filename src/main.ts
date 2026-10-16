import { DocumentCommandExecutor } from "./application/DocumentCommandExecutor.js";
import { Cli } from "./cli/Cli.js";

const cli = new Cli(new DocumentCommandExecutor());
cli.run();
