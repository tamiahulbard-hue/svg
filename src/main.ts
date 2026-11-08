import { DocumentCommandExecutor } from "./application/DocumentCommandExecutor.js";
import { DocumentSession } from "./application/DocumentSession.js";
import { Cli } from "./cli/Cli.js";
import { SvgFileAdapter } from "./infrastructure/SvgFileAdapter.js";
import { SvgXmlCodec } from "./infrastructure/SvgXmlCodec.js";
import { createDefaultShapeProviderRegistry } from "./plugins/defaultShapeProviders.js";
import { CommandRegistry } from "./application/CommandRegistry.js";
import { registerBuiltinCommands } from "./plugins/BuiltinCommandPlugin.js";

const session = new DocumentSession();
const shapeProviders = createDefaultShapeProviderRegistry();
const fileAdapter = new SvgFileAdapter(new SvgXmlCodec(shapeProviders));
const commandRegistry = new CommandRegistry();
registerBuiltinCommands(commandRegistry);
const cli = new Cli(new DocumentCommandExecutor(session, fileAdapter, shapeProviders, commandRegistry));
cli.run();
