import { DomainError } from "./DomainError.js";
import { Shape, type ShapeAttributeValue } from "./Shape.js";

export class CircleShape extends Shape {
  constructor(
    id: string,
    private cxValue: number,
    private cyValue: number,
    private radiusValue: number,
    style: { fill?: string; stroke?: string; strokeWidth?: number } = {},
  ) {
    super(id, "circle", style);
    this.cxValue = CircleShape.requireFinite(this.cxValue, "cx");
    this.cyValue = CircleShape.requireFinite(this.cyValue, "cy");
    this.radiusValue = CircleShape.requireNonNegative(this.radiusValue, "r");
  }

  get geometryAttributes(): Readonly<Record<string, number>> {
    return { cx: this.cxValue, cy: this.cyValue, r: this.radiusValue };
  }

  protected moveSelf(dx: number, dy: number): void {
    this.cxValue += dx;
    this.cyValue += dy;
  }

  protected scaleSelf(factor: number): void {
    this.cxValue *= factor;
    this.cyValue *= factor;
    this.radiusValue *= factor;
  }

  protected setGeometryAttribute(attribute: string, rawValue: ShapeAttributeValue): void {
    const value = CircleShape.requireNumber(rawValue, attribute);
    switch (attribute) {
      case "cx":
        this.cxValue = CircleShape.requireFinite(value, attribute);
        return;
      case "cy":
        this.cyValue = CircleShape.requireFinite(value, attribute);
        return;
      case "r":
        this.radiusValue = CircleShape.requireNonNegative(value, attribute);
        return;
      default:
        throw new DomainError(`unknown attribute: ${attribute}`);
    }
  }
}
