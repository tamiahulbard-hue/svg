import { DomainError } from "./DomainError.js";
import { Shape, type ShapeAttributeValue } from "./Shape.js";

export class TextShape extends Shape {
  constructor(
    id: string,
    private xValue: number,
    private yValue: number,
    private textValue: string,
    style: { fill?: string; stroke?: string; strokeWidth?: number } = {},
  ) {
    super(id, "text", style);
    this.xValue = TextShape.requireFinite(this.xValue, "x");
    this.yValue = TextShape.requireFinite(this.yValue, "y");
  }

  get text(): string {
    return this.textValue;
  }

  get geometryAttributes(): Readonly<Record<string, number>> {
    return { x: this.xValue, y: this.yValue };
  }

  protected get additionalAttributes(): Readonly<Record<string, ShapeAttributeValue>> {
    return { text: this.textValue };
  }

  protected moveSelf(dx: number, dy: number): void {
    this.xValue += dx;
    this.yValue += dy;
  }

  protected scaleSelf(factor: number): void {
    this.xValue *= factor;
    this.yValue *= factor;
  }

  protected setGeometryAttribute(attribute: string, value: ShapeAttributeValue): void {
    if (attribute === "text") {
      if (typeof value !== "string") {
        throw new DomainError("attribute text must be a string");
      }
      this.textValue = value;
      return;
    }

    const numericValue = TextShape.requireNumber(value, attribute);
    switch (attribute) {
      case "x":
        this.xValue = TextShape.requireFinite(numericValue, attribute);
        return;
      case "y":
        this.yValue = TextShape.requireFinite(numericValue, attribute);
        return;
      default:
        throw new DomainError(`unknown attribute: ${attribute}`);
    }
  }
}
