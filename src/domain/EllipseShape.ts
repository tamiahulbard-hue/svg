import { DomainError } from "./DomainError.js";
import { Shape, type ShapeAttributeValue } from "./Shape.js";

export class EllipseShape extends Shape {
  constructor(
    id: string,
    private cxValue: number,
    private cyValue: number,
    private rxValue: number,
    private ryValue: number,
    style: { fill?: string; stroke?: string; strokeWidth?: number } = {},
  ) {
    super(id, "ellipse", style);
    this.cxValue = EllipseShape.requireFinite(this.cxValue, "cx");
    this.cyValue = EllipseShape.requireFinite(this.cyValue, "cy");
    this.rxValue = EllipseShape.requireNonNegative(this.rxValue, "rx");
    this.ryValue = EllipseShape.requireNonNegative(this.ryValue, "ry");
  }

  get geometryAttributes(): Readonly<Record<string, number>> {
    return { cx: this.cxValue, cy: this.cyValue, rx: this.rxValue, ry: this.ryValue };
  }

  protected moveSelf(dx: number, dy: number): void {
    this.cxValue += dx;
    this.cyValue += dy;
  }

  protected scaleSelf(factor: number): void {
    this.cxValue *= factor;
    this.cyValue *= factor;
    this.rxValue *= factor;
    this.ryValue *= factor;
  }

  protected setGeometryAttribute(attribute: string, rawValue: ShapeAttributeValue): void {
    const value = EllipseShape.requireNumber(rawValue, attribute);
    switch (attribute) {
      case "cx":
        this.cxValue = EllipseShape.requireFinite(value, attribute);
        return;
      case "cy":
        this.cyValue = EllipseShape.requireFinite(value, attribute);
        return;
      case "rx":
        this.rxValue = EllipseShape.requireNonNegative(value, attribute);
        return;
      case "ry":
        this.ryValue = EllipseShape.requireNonNegative(value, attribute);
        return;
      default:
        throw new DomainError(`unknown attribute: ${attribute}`);
    }
  }
}
