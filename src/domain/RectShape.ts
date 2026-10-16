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

  protected moveSelf(dx: number, dy: number): void {
    this.xValue += dx;
    this.yValue += dy;
  }

  protected scaleSelf(factor: number): void {
    this.xValue *= factor;
    this.yValue *= factor;
    this.widthValue *= factor;
    this.heightValue *= factor;
  }

  protected setGeometryAttribute(attribute: string, rawValue: ShapeAttributeValue): void {
    const value = RectShape.requireNumber(rawValue, attribute);
    switch (attribute) {
      case "x":
        this.xValue = RectShape.requireFinite(value, attribute);
        return;
      case "y":
        this.yValue = RectShape.requireFinite(value, attribute);
        return;
      case "width":
        this.widthValue = RectShape.requireNonNegative(value, attribute);
        return;
      case "height":
        this.heightValue = RectShape.requireNonNegative(value, attribute);
        return;
      default:
        throw new DomainError(`unknown attribute: ${attribute}`);
    }
  }
}
