import { DocumentCommandExecutor } from "./application/DocumentCommandExecutor.js";
import { DocumentSession } from "./application/DocumentSession.js";
import { Cli } from "./cli/Cli.js";
import { SvgFileAdapter } from "./infrastructure/SvgFileAdapter.js";

const session = new DocumentSession();
const fileAdapter = new SvgFileAdapter();
const cli = new Cli(new DocumentCommandExecutor(session, fileAdapter));
cli.run();
