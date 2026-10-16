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

  get treeSummary(): string {
    return `${this.identity} (${this.xValue},${this.yValue}) ${JSON.stringify(this.textValue)}${this.styleSummary}`;
  }

  protected get additionalAttributes(): Readonly<Record<string, ShapeAttributeValue>> {
    return { text: this.textValue };
  }

  protected moveSelf(dx: number, dy: number): void {
    const x = TextShape.requireFinite(this.xValue + dx, "x");
    const y = TextShape.requireFinite(this.yValue + dy, "y");
    this.xValue = x;
    this.yValue = y;
  }

  protected scaleSelf(factor: number): void {
    const x = TextShape.requireFinite(this.xValue * factor, "x");
    const y = TextShape.requireFinite(this.yValue * factor, "y");
    this.xValue = x;
    this.yValue = y;
  }

  protected setGeometryAttribute(attribute: string, value: ShapeAttributeValue): void {
    if (attribute === "text") {
      if (typeof value !== "string") {
        throw new DomainError("attribute text must be a string");
      }
      this.textValue = value;
      return;
    }

    switch (attribute) {
      case "x":
        this.xValue = TextShape.requireFinite(TextShape.requireNumber(value, attribute), attribute);
        return;
      case "y":
        this.yValue = TextShape.requireFinite(TextShape.requireNumber(value, attribute), attribute);
        return;
      default:
        throw new DomainError(`unknown attribute: ${attribute}`);
    }
  }
}
