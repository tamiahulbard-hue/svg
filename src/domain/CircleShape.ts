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
    const cx = CircleShape.requireFinite(this.cxValue + dx, "cx");
    const cy = CircleShape.requireFinite(this.cyValue + dy, "cy");
    this.cxValue = cx;
    this.cyValue = cy;
  }

  protected scaleSelf(factor: number): void {
    const cx = CircleShape.requireFinite(this.cxValue * factor, "cx");
    const cy = CircleShape.requireFinite(this.cyValue * factor, "cy");
    const radius = CircleShape.requireNonNegative(this.radiusValue * factor, "r");
    this.cxValue = cx;
    this.cyValue = cy;
    this.radiusValue = radius;
  }

  protected setGeometryAttribute(attribute: string, rawValue: ShapeAttributeValue): void {
    switch (attribute) {
      case "cx":
        this.cxValue = CircleShape.requireFinite(CircleShape.requireNumber(rawValue, attribute), attribute);
        return;
      case "cy":
        this.cyValue = CircleShape.requireFinite(CircleShape.requireNumber(rawValue, attribute), attribute);
        return;
      case "r":
        this.radiusValue = CircleShape.requireNonNegative(CircleShape.requireNumber(rawValue, attribute), attribute);
        return;
      default:
        throw new DomainError(`unknown attribute: ${attribute}`);
    }
  }
}
