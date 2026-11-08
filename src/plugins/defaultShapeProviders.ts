import { ShapeProviderRegistry } from "../domain/ShapeProviderRegistry.js";
import { BuiltinShapeProvider } from "./BuiltinShapeProvider.js";

export function createDefaultShapeProviderRegistry(): ShapeProviderRegistry {
  const registry = new ShapeProviderRegistry();
  for (const kind of ["rect", "circle", "ellipse", "line", "text", "g"]) {
    registry.register(new BuiltinShapeProvider(kind));
  }
  return registry;
}
