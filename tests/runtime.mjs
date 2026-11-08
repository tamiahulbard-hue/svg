import { CommandFactory } from "../dist/application/CommandFactory.js";
import { CommandHistory } from "../dist/application/CommandHistory.js";
import { DocumentCommandExecutor } from "../dist/application/DocumentCommandExecutor.js";
import { DocumentSession } from "../dist/application/DocumentSession.js";
import { CommandRegistry } from "../dist/application/CommandRegistry.js";
import { registerBuiltinCommands } from "../dist/plugins/BuiltinCommandPlugin.js";
import { ShapeProviderRegistry } from "../dist/domain/ShapeProviderRegistry.js";
import { SvgFileAdapter } from "../dist/infrastructure/SvgFileAdapter.js";
import { SvgXmlCodec } from "../dist/infrastructure/SvgXmlCodec.js";
import { createDefaultShapeProviderRegistry } from "../dist/plugins/defaultShapeProviders.js";

export function createRuntime(
  session = new DocumentSession(),
  filePort,
  additionalCommands = [],
) {
  const shapeProviders = createDefaultShapeProviderRegistry();
  const adapter = filePort ?? new SvgFileAdapter(new SvgXmlCodec(shapeProviders));
  const commandRegistry = new CommandRegistry();
  registerBuiltinCommands(commandRegistry);
  for (const command of additionalCommands) {
    commandRegistry.register(command);
  }
  const executor = new DocumentCommandExecutor(session, adapter, shapeProviders, commandRegistry);
  return { session, shapeProviders, filePort: adapter, commandRegistry, executor };
}

export function createFileAdapter(shapeProviders = createDefaultShapeProviderRegistry()) {
  return new SvgFileAdapter(new SvgXmlCodec(shapeProviders));
}

export function createCommandFactory(session) {
  const history = new CommandHistory();
  const shapeProviders = createDefaultShapeProviderRegistry();
  const commandRegistry = new CommandRegistry();
  registerBuiltinCommands(commandRegistry);
  return new CommandFactory(
    { session, history, filePort: undefined, shapeProviders, commandRegistry },
  );
}

export function createShapeProviderRegistry() {
  return new ShapeProviderRegistry();
}

export { createDefaultShapeProviderRegistry };
