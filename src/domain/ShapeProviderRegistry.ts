import { DomainError } from "./DomainError.js";
import type { Shape } from "./Shape.js";
import type { ShapeProvider, SvgShapeElement, SvgShapeEncoding } from "./ShapeProvider.js";

export class ShapeProviderRegistry {
  private readonly providers = new Map<string, ShapeProvider>();

  register(provider: ShapeProvider): void {
    if (this.providers.has(provider.kind)) {
      throw new DomainError(`duplicate shape provider: ${provider.kind}`);
    }
    this.providers.set(provider.kind, provider);
  }

  create(kind: string, id: string, parameters: readonly string[]): Shape {
    const provider = this.providers.get(kind);
    if (provider === undefined) {
      throw new DomainError(`unknown shape type: ${kind} (is the plugin loaded?)`);
    }
    return provider.create(id, parameters);
  }

  readSvg(id: string, element: SvgShapeElement): Shape {
    const provider = this.providerForSvg(element);
    return provider.readSvg(id, element);
  }

  providerForSvg(element: SvgShapeElement): ShapeProvider {
    const declaredKind = element.attributes["data-kind"];
    if (declaredKind !== undefined) {
      const declaredProvider = this.providers.get(declaredKind);
      if (declaredProvider?.matchesSvg(element) === true) {
        return declaredProvider;
      }
    }

    const matches = [...this.providers.values()].filter((provider) => provider.matchesSvg(element));
    if (matches.length === 0) {
      throw new DomainError(`unsupported SVG element: <${element.name}>`);
    }
    if (matches.length > 1) {
      throw new DomainError(`ambiguous SVG element provider: <${element.name}>`);
    }
    return matches[0]!;
  }

  writeSvg(shape: Shape): SvgShapeEncoding {
    const provider = this.providers.get(shape.kind);
    if (provider === undefined) {
      throw new DomainError(`no shape provider registered for: ${shape.kind}`);
    }
    return provider.writeSvg(shape);
  }

  get kinds(): readonly string[] {
    return [...this.providers.keys()];
  }
}
