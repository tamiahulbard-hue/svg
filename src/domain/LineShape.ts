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

  protected moveSelf(dx: number, dy: number): void {
    this.x1Value += dx;
    this.y1Value += dy;
    this.x2Value += dx;
    this.y2Value += dy;
  }

  protected scaleSelf(factor: number): void {
    this.x1Value *= factor;
    this.y1Value *= factor;
    this.x2Value *= factor;
    this.y2Value *= factor;
  }

  protected setGeometryAttribute(attribute: string, rawValue: ShapeAttributeValue): void {
    const value = LineShape.requireNumber(rawValue, attribute);
    switch (attribute) {
      case "x1":
        this.x1Value = LineShape.requireFinite(value, attribute);
        return;
      case "y1":
        this.y1Value = LineShape.requireFinite(value, attribute);
        return;
      case "x2":
        this.x2Value = LineShape.requireFinite(value, attribute);
        return;
      case "y2":
        this.y2Value = LineShape.requireFinite(value, attribute);
        return;
      default:
        throw new DomainError(`unknown attribute: ${attribute}`);
    }
  }
}
