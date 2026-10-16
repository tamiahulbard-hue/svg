import { DomainError } from "./DomainError.js";
import { Shape, type ShapeAttributeValue } from "./Shape.js";

export class RectShape extends Shape {
  constructor(
    id: string,
    private xValue: number,
    private yValue: number,
    private widthValue: number,
    private heightValue: number,
    style: { fill?: string; stroke?: string; strokeWidth?: number } = {},
  ) {
    super(id, "rect", style);
    this.xValue = RectShape.requireFinite(this.xValue, "x");
    this.yValue = RectShape.requireFinite(this.yValue, "y");
    this.widthValue = RectShape.requireNonNegative(this.widthValue, "width");
    this.heightValue = RectShape.requireNonNegative(this.heightValue, "height");
  }

  get geometryAttributes(): Readonly<Record<string, number>> {
    return {
      x: this.xValue,
      y: this.yValue,
      width: this.widthValue,
      height: this.heightValue,
    };
  }

  get treeSummary(): string {
    return `${this.identity} x=${this.xValue} y=${this.yValue} w=${this.widthValue} h=${this.heightValue}${this.styleSummary}`;
  }

  protected moveSelf(dx: number, dy: number): void {
    const x = RectShape.requireFinite(this.xValue + dx, "x");
    const y = RectShape.requireFinite(this.yValue + dy, "y");
    this.xValue = x;
    this.yValue = y;
  }

  protected scaleSelf(factor: number): void {
    const x = RectShape.requireFinite(this.xValue * factor, "x");
    const y = RectShape.requireFinite(this.yValue * factor, "y");
    const width = RectShape.requireNonNegative(this.widthValue * factor, "width");
    const height = RectShape.requireNonNegative(this.heightValue * factor, "height");
    this.xValue = x;
    this.yValue = y;
    this.widthValue = width;
    this.heightValue = height;
  }

  protected setGeometryAttribute(attribute: string, rawValue: ShapeAttributeValue): void {
    switch (attribute) {
      case "x":
        this.xValue = RectShape.requireFinite(RectShape.requireNumber(rawValue, attribute), attribute);
        return;
      case "y":
        this.yValue = RectShape.requireFinite(RectShape.requireNumber(rawValue, attribute), attribute);
        return;
      case "width":
        this.widthValue = RectShape.requireNonNegative(RectShape.requireNumber(rawValue, attribute), attribute);
        return;
      case "height":
        this.heightValue = RectShape.requireNonNegative(RectShape.requireNumber(rawValue, attribute), attribute);
        return;
      default:
        throw new DomainError(`unknown attribute: ${attribute}`);
    }
  }
}
