import { UnimplementedCommandExecutor } from "./application/UnimplementedCommandExecutor.js";
import { Cli } from "./cli/Cli.js";

const cli = new Cli(new UnimplementedCommandExecutor());
cli.run();
