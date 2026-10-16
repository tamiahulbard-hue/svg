import { CircleShape } from "./CircleShape.js";
import { DomainError } from "./DomainError.js";
import { EllipseShape } from "./EllipseShape.js";
import { GroupShape } from "./GroupShape.js";
import { LineShape } from "./LineShape.js";
import { RectShape } from "./RectShape.js";
import { Shape, type ShapeKind } from "./Shape.js";
import { TextShape } from "./TextShape.js";

type ShapeBuilder = (id: string, parameters: readonly string[]) => Shape;

export class ShapeFactory {
  private static readonly builders: Readonly<Record<ShapeKind, ShapeBuilder>> = {
    rect: (id, parameters) => {
      ShapeFactory.requireCount("rect", parameters, 4, 5);
      return new RectShape(
        id,
        ShapeFactory.number(parameters[0], "x"),
        ShapeFactory.number(parameters[1], "y"),
        ShapeFactory.number(parameters[2], "width"),
        ShapeFactory.number(parameters[3], "height"),
        parameters[4] === undefined ? {} : { fill: parameters[4] },
      );
    },
    circle: (id, parameters) => {
      ShapeFactory.requireCount("circle", parameters, 3, 4);
      return new CircleShape(
        id,
        ShapeFactory.number(parameters[0], "cx"),
        ShapeFactory.number(parameters[1], "cy"),
        ShapeFactory.number(parameters[2], "r"),
        parameters[3] === undefined ? {} : { fill: parameters[3] },
      );
    },
    ellipse: (id, parameters) => {
      ShapeFactory.requireCount("ellipse", parameters, 4, 5);
      return new EllipseShape(
        id,
        ShapeFactory.number(parameters[0], "cx"),
        ShapeFactory.number(parameters[1], "cy"),
        ShapeFactory.number(parameters[2], "rx"),
        ShapeFactory.number(parameters[3], "ry"),
        parameters[4] === undefined ? {} : { fill: parameters[4] },
      );
    },
    line: (id, parameters) => {
      ShapeFactory.requireCount("line", parameters, 4, 5);
      return new LineShape(
        id,
        ShapeFactory.number(parameters[0], "x1"),
        ShapeFactory.number(parameters[1], "y1"),
        ShapeFactory.number(parameters[2], "x2"),
        ShapeFactory.number(parameters[3], "y2"),
        parameters[4] === undefined ? {} : { stroke: parameters[4] },
      );
    },
    text: (id, parameters) => {
      ShapeFactory.requireCount("text", parameters, 3);
      return new TextShape(
        id,
        ShapeFactory.number(parameters[0], "x"),
        ShapeFactory.number(parameters[1], "y"),
        parameters[2],
      );
    },
    g: (id, parameters) => {
      ShapeFactory.requireCount("g", parameters, 0);
      return new GroupShape(id);
    },
  };

  static create(type: string, id: string, parameters: readonly string[]): Shape {
    if (!Object.hasOwn(ShapeFactory.builders, type)) {
      throw new DomainError(`unknown shape type: ${type} (is the plugin loaded?)`);
    }
    return ShapeFactory.builders[type as ShapeKind](id, parameters);
  }

  private static requireCount(type: string, parameters: readonly string[], min: number, max = min): void {
    if (parameters.length < min || parameters.length > max) {
      throw new DomainError(`invalid parameters for ${type}`);
    }
  }

  private static number(value: string | undefined, name: string): number {
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
