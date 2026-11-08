import { DocumentCommandExecutor } from "./application/DocumentCommandExecutor.js";
import { DocumentSession } from "./application/DocumentSession.js";
import { Cli } from "./cli/Cli.js";
import { SvgFileAdapter } from "./infrastructure/SvgFileAdapter.js";
import { SvgXmlCodec } from "./infrastructure/SvgXmlCodec.js";
import { createDefaultShapeProviderRegistry } from "./plugins/defaultShapeProviders.js";

const session = new DocumentSession();
const shapeProviders = createDefaultShapeProviderRegistry();
const fileAdapter = new SvgFileAdapter(new SvgXmlCodec(shapeProviders));
const cli = new Cli(new DocumentCommandExecutor(session, fileAdapter, shapeProviders));
cli.run();
