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

  get treeSummary(): string {
    return `${this.identity} cx=${this.cxValue} cy=${this.cyValue} rx=${this.rxValue} ry=${this.ryValue}${this.styleSummary}`;
  }

  protected moveSelf(dx: number, dy: number): void {
    const cx = EllipseShape.requireFinite(this.cxValue + dx, "cx");
    const cy = EllipseShape.requireFinite(this.cyValue + dy, "cy");
    this.cxValue = cx;
    this.cyValue = cy;
  }

  protected scaleSelf(factor: number): void {
    const cx = EllipseShape.requireFinite(this.cxValue * factor, "cx");
    const cy = EllipseShape.requireFinite(this.cyValue * factor, "cy");
    const rx = EllipseShape.requireNonNegative(this.rxValue * factor, "rx");
    const ry = EllipseShape.requireNonNegative(this.ryValue * factor, "ry");
    this.cxValue = cx;
    this.cyValue = cy;
    this.rxValue = rx;
    this.ryValue = ry;
  }

  protected setGeometryAttribute(attribute: string, rawValue: ShapeAttributeValue): void {
    switch (attribute) {
      case "cx":
        this.cxValue = EllipseShape.requireFinite(EllipseShape.requireNumber(rawValue, attribute), attribute);
        return;
      case "cy":
        this.cyValue = EllipseShape.requireFinite(EllipseShape.requireNumber(rawValue, attribute), attribute);
        return;
      case "rx":
        this.rxValue = EllipseShape.requireNonNegative(EllipseShape.requireNumber(rawValue, attribute), attribute);
        return;
      case "ry":
        this.ryValue = EllipseShape.requireNonNegative(EllipseShape.requireNumber(rawValue, attribute), attribute);
        return;
      default:
        throw new DomainError(`unknown attribute: ${attribute}`);
    }
  }
}
