import { DomainError } from "./DomainError.js";
import { Shape, type ShapeAttributeValue } from "./Shape.js";

export class LineShape extends Shape {
  constructor(
    id: string,
    private x1Value: number,
    private y1Value: number,
    private x2Value: number,
    private y2Value: number,
    style: { fill?: string; stroke?: string; strokeWidth?: number } = {},
  ) {
    super(id, "line", style);
    this.x1Value = LineShape.requireFinite(this.x1Value, "x1");
    this.y1Value = LineShape.requireFinite(this.y1Value, "y1");
    this.x2Value = LineShape.requireFinite(this.x2Value, "x2");
    this.y2Value = LineShape.requireFinite(this.y2Value, "y2");
  }

  get geometryAttributes(): Readonly<Record<string, number>> {
    return {
      x1: this.x1Value,
      y1: this.y1Value,
      x2: this.x2Value,
      y2: this.y2Value,
    };
  }

  get treeSummary(): string {
    return `${this.identity} (${this.x1Value},${this.y1Value}) -> (${this.x2Value},${this.y2Value})${this.styleSummary}`;
  }

  protected moveSelf(dx: number, dy: number): void {
    const x1 = LineShape.requireFinite(this.x1Value + dx, "x1");
    const y1 = LineShape.requireFinite(this.y1Value + dy, "y1");
    const x2 = LineShape.requireFinite(this.x2Value + dx, "x2");
    const y2 = LineShape.requireFinite(this.y2Value + dy, "y2");
    this.x1Value = x1;
    this.y1Value = y1;
    this.x2Value = x2;
    this.y2Value = y2;
  }

  protected scaleSelf(factor: number): void {
    const x1 = LineShape.requireFinite(this.x1Value * factor, "x1");
    const y1 = LineShape.requireFinite(this.y1Value * factor, "y1");
    const x2 = LineShape.requireFinite(this.x2Value * factor, "x2");
    const y2 = LineShape.requireFinite(this.y2Value * factor, "y2");
    this.x1Value = x1;
    this.y1Value = y1;
    this.x2Value = x2;
    this.y2Value = y2;
  }

  protected setGeometryAttribute(attribute: string, rawValue: ShapeAttributeValue): void {
    switch (attribute) {
      case "x1":
        this.x1Value = LineShape.requireFinite(LineShape.requireNumber(rawValue, attribute), attribute);
        return;
      case "y1":
        this.y1Value = LineShape.requireFinite(LineShape.requireNumber(rawValue, attribute), attribute);
        return;
      case "x2":
        this.x2Value = LineShape.requireFinite(LineShape.requireNumber(rawValue, attribute), attribute);
        return;
      case "y2":
        this.y2Value = LineShape.requireFinite(LineShape.requireNumber(rawValue, attribute), attribute);
        return;
      default:
        throw new DomainError(`unknown attribute: ${attribute}`);
    }
  }
}
