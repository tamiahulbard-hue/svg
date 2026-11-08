import { DomainError } from "../../domain/DomainError.js";
import type { Shape } from "../../domain/Shape.js";
import type {
  ShapeProvider,
  SvgShapeElement,
  SvgShapeEncoding,
} from "../../domain/ShapeProvider.js";
import { RectShape } from "../../domain/RectShape.js";
import { TextShape } from "../../domain/TextShape.js";
import { BoxShape } from "./BoxShape.js";

const BOX_KIND = "box";
const BOX_FILL = "#4a90d9";

export class BoxShapeProvider implements ShapeProvider {
  readonly kind = BOX_KIND;
  readonly acceptsChildren = true;

  create(id: string, parameters: readonly string[]): Shape {
    if (parameters.length !== 5) {
      throw new DomainError("invalid parameters for box");
    }
    const x = this.number(parameters[0], "x");
    const y = this.number(parameters[1], "y");
    const width = this.number(parameters[2], "width");
    const height = this.number(parameters[3], "height");
    const rectangle = new RectShape(`${id}-rect`, x, y, width, height, { fill: BOX_FILL });
    const label = new TextShape(`${id}-label`, x + 20, y + 35, parameters[4]!);
    return new BoxShape(id, rectangle, label);
  }

  matchesSvg(element: SvgShapeElement): boolean {
    return element.name === "g" && element.attributes["data-kind"] === BOX_KIND;
  }

  readSvg(id: string, element: SvgShapeElement): Shape {
    const [rectangle, label, ...additionalChildren] = element.children;
    if (
      !(rectangle instanceof RectShape)
      || rectangle.id !== `${id}-rect`
      || !(label instanceof TextShape)
      || label.id !== `${id}-label`
    ) {
      throw new DomainError(`invalid box ${id}: expected rect#${id}-rect and text#${id}-label`);
    }
    return new BoxShape(id, rectangle, label, additionalChildren);
  }

  writeSvg(shape: Shape): SvgShapeEncoding {
    if (!(shape instanceof BoxShape)) {
      throw new DomainError(`box provider cannot serialize shape: ${shape.id}`);
    }
    const attributes: Record<string, string> = { "data-kind": BOX_KIND };
    for (const [name, value] of Object.entries(shape.attributes)) {
      attributes[name] = String(value);
    }
    return {
      name: "g",
      attributes,
      children: shape.children,
    };
  }

  private number(value: string | undefined, name: string): number {
    if (value === undefined || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
      throw new DomainError(`${name} must be a finite number`);
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new DomainError(`${name} must be a finite number`);
    }
    return parsed;
  }
}
