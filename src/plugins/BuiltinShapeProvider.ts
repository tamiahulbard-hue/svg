import { DomainError } from "../domain/DomainError.js";
import type { Shape } from "../domain/Shape.js";
import type { ShapeProvider, SvgShapeElement, SvgShapeEncoding } from "../domain/ShapeProvider.js";
import { CircleShape } from "../domain/CircleShape.js";
import { EllipseShape } from "../domain/EllipseShape.js";
import { GroupShape } from "../domain/GroupShape.js";
import { LineShape } from "../domain/LineShape.js";
import { RectShape } from "../domain/RectShape.js";
import { TextShape } from "../domain/TextShape.js";

export class BuiltinShapeProvider implements ShapeProvider {
  constructor(readonly kind: string) {}

  get acceptsChildren(): boolean {
    return this.kind === "g";
  }

  create(id: string, parameters: readonly string[]): Shape {
    switch (this.kind) {
      case "rect":
        this.requireCount(parameters, 4, 5);
        return new RectShape(
          id,
          this.number(parameters[0], "x"),
          this.number(parameters[1], "y"),
          this.number(parameters[2], "width"),
          this.number(parameters[3], "height"),
          parameters[4] === undefined ? {} : { fill: parameters[4] },
        );
      case "circle":
        this.requireCount(parameters, 3, 4);
        return new CircleShape(
          id,
          this.number(parameters[0], "cx"),
          this.number(parameters[1], "cy"),
          this.number(parameters[2], "r"),
          parameters[3] === undefined ? {} : { fill: parameters[3] },
        );
      case "ellipse":
        this.requireCount(parameters, 4, 5);
        return new EllipseShape(
          id,
          this.number(parameters[0], "cx"),
          this.number(parameters[1], "cy"),
          this.number(parameters[2], "rx"),
          this.number(parameters[3], "ry"),
          parameters[4] === undefined ? {} : { fill: parameters[4] },
        );
      case "line":
        this.requireCount(parameters, 4, 5);
        return new LineShape(
          id,
          this.number(parameters[0], "x1"),
          this.number(parameters[1], "y1"),
          this.number(parameters[2], "x2"),
          this.number(parameters[3], "y2"),
          parameters[4] === undefined ? {} : { stroke: parameters[4] },
        );
      case "text":
        this.requireCount(parameters, 3);
        return new TextShape(
          id,
          this.number(parameters[0], "x"),
          this.number(parameters[1], "y"),
          this.required(parameters[2], "text"),
        );
      case "g":
        this.requireCount(parameters, 0);
        return new GroupShape(id);
      default:
        throw new DomainError(`unsupported built-in shape: ${this.kind}`);
    }
  }

  matchesSvg(element: SvgShapeElement): boolean {
    return element.name === this.kind;
  }

  readSvg(id: string, element: SvgShapeElement): Shape {
    const attributes = element.attributes;
    switch (this.kind) {
      case "rect":
        return new RectShape(
          id,
          this.xmlNumber(attributes.x, "x"),
          this.xmlNumber(attributes.y, "y"),
          this.xmlNumber(attributes.width, "width"),
          this.xmlNumber(attributes.height, "height"),
        );
      case "circle":
        return new CircleShape(
          id,
          this.xmlNumber(attributes.cx, "cx"),
          this.xmlNumber(attributes.cy, "cy"),
          this.xmlNumber(attributes.r, "r"),
        );
      case "ellipse":
        return new EllipseShape(
          id,
          this.xmlNumber(attributes.cx, "cx"),
          this.xmlNumber(attributes.cy, "cy"),
          this.xmlNumber(attributes.rx, "rx"),
          this.xmlNumber(attributes.ry, "ry"),
        );
      case "line":
        return new LineShape(
          id,
          this.xmlNumber(attributes.x1, "x1"),
          this.xmlNumber(attributes.y1, "y1"),
          this.xmlNumber(attributes.x2, "x2"),
          this.xmlNumber(attributes.y2, "y2"),
        );
      case "text":
        return new TextShape(
          id,
          this.xmlNumber(attributes.x, "x"),
          this.xmlNumber(attributes.y, "y"),
          element.text,
        );
      case "g": {
        const group = new GroupShape(id);
        for (const child of element.children) {
          group.addChild(child);
        }
        return group;
      }
      default:
        throw new DomainError(`unsupported built-in shape: ${this.kind}`);
    }
  }

  writeSvg(shape: Shape): SvgShapeEncoding {
    const attributes: Record<string, string> = {};
    for (const [name, value] of Object.entries(shape.attributes)) {
      if (name !== "text") {
        attributes[name] = String(value);
      }
    }
    const encoding: {
      name: string;
      attributes: Readonly<Record<string, string>>;
      text?: string;
      children?: readonly Shape[];
    } = {
      name: this.kind,
      attributes,
    };
    if (this.kind === "text") {
      encoding.text = String(shape.attributes.text ?? "");
    }
    if (shape instanceof GroupShape) {
      encoding.children = shape.children;
    }
    return encoding;
  }

  private requireCount(parameters: readonly string[], min: number, max = min): void {
    if (parameters.length < min || parameters.length > max) {
      throw new DomainError(`invalid parameters for ${this.kind}`);
    }
  }

  private required(value: string | undefined, name: string): string {
    if (value === undefined) {
      throw new DomainError(`missing ${name}`);
    }
    return value;
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

  private xmlNumber(value: string | undefined, name: string): number {
    if (value === undefined) {
      return 0;
    }
    const match = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.exec(value.trim());
    if (match === null) {
      throw new DomainError(`invalid SVG ${name}: ${value}`);
    }
    const parsed = Number(match[0]);
    if (!Number.isFinite(parsed)) {
      throw new DomainError(`invalid SVG ${name}: ${value}`);
    }
    return parsed;
  }
}
