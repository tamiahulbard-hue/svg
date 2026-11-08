import { DocumentCommandExecutor } from "./application/DocumentCommandExecutor.js";
import { DocumentSession } from "./application/DocumentSession.js";
import { Cli } from "./cli/Cli.js";
import { SvgFileAdapter } from "./infrastructure/SvgFileAdapter.js";
import { SvgXmlCodec } from "./infrastructure/SvgXmlCodec.js";
import { createDefaultShapeProviderRegistry } from "./plugins/defaultShapeProviders.js";
import { CommandRegistry } from "./application/CommandRegistry.js";
import { registerBuiltinCommands } from "./plugins/BuiltinCommandPlugin.js";
import { TreeDecoratorRegistry } from "./application/TreeDecoratorRegistry.js";
import { AttributeHandlerRegistry } from "./application/AttributeHandlerRegistry.js";
import { StatsCommandPlugin } from "./plugins/stats/StatsCommandPlugin.js";
import { DirCommandPlugin } from "./plugins/dir/DirCommandPlugin.js";
import { NodeDirectoryAdapter } from "./infrastructure/NodeDirectoryAdapter.js";
import { BoxShapeProvider } from "./plugins/box/BoxShapeProvider.js";

const session = new DocumentSession();
const shapeProviders = createDefaultShapeProviderRegistry();
shapeProviders.register(new BoxShapeProvider());
const fileAdapter = new SvgFileAdapter(new SvgXmlCodec(shapeProviders));
const commandRegistry = new CommandRegistry();
registerBuiltinCommands(commandRegistry);
commandRegistry.register(new StatsCommandPlugin());
commandRegistry.register(new DirCommandPlugin());
const treeDecorators = new TreeDecoratorRegistry();
const attributeHandlers = new AttributeHandlerRegistry();
const directoryAccess = new NodeDirectoryAdapter();
const cli = new Cli(
  new DocumentCommandExecutor(
    session,
    fileAdapter,
    shapeProviders,
    commandRegistry,
    treeDecorators,
    attributeHandlers,
    directoryAccess,
  ),
);
cli.run();
