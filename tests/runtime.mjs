import { CommandFactory } from "../dist/application/CommandFactory.js";
import { CommandHistory } from "../dist/application/CommandHistory.js";
import { DocumentCommandExecutor } from "../dist/application/DocumentCommandExecutor.js";
import { DocumentSession } from "../dist/application/DocumentSession.js";
import { ShapeProviderRegistry } from "../dist/domain/ShapeProviderRegistry.js";
import { SvgFileAdapter } from "../dist/infrastructure/SvgFileAdapter.js";
import { SvgXmlCodec } from "../dist/infrastructure/SvgXmlCodec.js";
import { createDefaultShapeProviderRegistry } from "../dist/plugins/defaultShapeProviders.js";

export function createRuntime(session = new DocumentSession(), filePort) {
  const shapeProviders = createDefaultShapeProviderRegistry();
  const adapter = filePort ?? new SvgFileAdapter(new SvgXmlCodec(shapeProviders));
  const executor = new DocumentCommandExecutor(session, adapter, shapeProviders);
  return { session, shapeProviders, filePort: adapter, executor };
}

export function createFileAdapter(shapeProviders = createDefaultShapeProviderRegistry()) {
  return new SvgFileAdapter(new SvgXmlCodec(shapeProviders));
}

export function createCommandFactory(session) {
  return new CommandFactory(
    session,
    new CommandHistory(),
    undefined,
    createDefaultShapeProviderRegistry(),
  );
}

export function createShapeProviderRegistry() {
  return new ShapeProviderRegistry();
}

export { createDefaultShapeProviderRegistry };
