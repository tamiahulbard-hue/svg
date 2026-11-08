import { resolve } from "node:path";
import { DocumentCommandExecutor } from "./application/DocumentCommandExecutor.js";
import { DocumentSession } from "./application/DocumentSession.js";
import { AttributeHandlerRegistry } from "./application/AttributeHandlerRegistry.js";
import { CommandRegistry } from "./application/CommandRegistry.js";
import { TreeDecoratorRegistry } from "./application/TreeDecoratorRegistry.js";
import { Cli } from "./cli/Cli.js";
import { PluginLoader } from "./assembly/PluginLoader.js";
import { CODE_PLUGINS } from "./assembly/codePlugins.js";
import { createDefaultShapeProviderRegistry } from "./plugins/defaultShapeProviders.js";
import { registerBuiltinCommands } from "./plugins/BuiltinCommandPlugin.js";
import { NodeDirectoryAdapter } from "./infrastructure/NodeDirectoryAdapter.js";
import { SvgFileAdapter } from "./infrastructure/SvgFileAdapter.js";
import { SvgXmlCodec } from "./infrastructure/SvgXmlCodec.js";

const session = new DocumentSession();
const shapeProviders = createDefaultShapeProviderRegistry();
const fileAdapter = new SvgFileAdapter(new SvgXmlCodec(shapeProviders));
const commandRegistry = new CommandRegistry();
registerBuiltinCommands(commandRegistry);
const treeDecorators = new TreeDecoratorRegistry();
const attributeHandlers = new AttributeHandlerRegistry();
const directoryAccess = new NodeDirectoryAdapter();
const pluginLoader = new PluginLoader(
  {
    shapeProviders,
    commands: commandRegistry,
    decorators: treeDecorators,
    attributes: attributeHandlers,
  },
  { session, filePort: fileAdapter, directoryAccess },
);

const arguments_ = process.argv.slice(2);
const pluginErrors = arguments_.length === 0
  ? await pluginLoader.load(CODE_PLUGINS, resolve("plugins.config.json"))
  : arguments_.length === 2 && arguments_[0] === "--config"
    ? await pluginLoader.loadConfig(resolve(arguments_[1]!))
    : ["error: invalid plugin config"];

for (const error of pluginErrors) {
  console.error(error);
}

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
