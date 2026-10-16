import { DomainError } from "./DomainError.js";

export type ShapeKind = "rect" | "circle" | "ellipse" | "line" | "text" | "g";
export type ShapeAttributeValue = string | number;
export const setShapeParent = Symbol("setShapeParent");

export abstract class Shape {
  private fillValue: string | undefined;
  private strokeValue: string | undefined;
  private strokeWidthValue: number | undefined;
  private parentValue: Shape | null = null;

  protected constructor(
    readonly id: string,
    readonly kind: ShapeKind,
    style: { fill?: string; stroke?: string; strokeWidth?: number } = {},
  ) {
    if (id.length === 0) {
      throw new DomainError("shape id cannot be empty");
    }

    this.fillValue = style.fill;
    this.strokeValue = style.stroke;
    if (style.strokeWidth !== undefined) {
      this.strokeWidthValue = Shape.requireNonNegative(style.strokeWidth, "stroke-width");
    }
  }

  get parent(): Shape | null {
    return this.parentValue;
  }

  get fill(): string | undefined {
    return this.fillValue;
  }

  get stroke(): string | undefined {
    return this.strokeValue;
  }

  get strokeWidth(): number | undefined {
    return this.strokeWidthValue;
  }

  get attributes(): Readonly<Record<string, ShapeAttributeValue>> {
    const attributes: Record<string, ShapeAttributeValue> = {
      ...this.geometryAttributes,
    };

    if (this.fillValue !== undefined) {
      attributes.fill = this.fillValue;
    }
    if (this.strokeValue !== undefined) {
      attributes.stroke = this.strokeValue;
    }
    if (this.strokeWidthValue !== undefined) {
      attributes["stroke-width"] = this.strokeWidthValue;
    }

    Object.assign(attributes, this.additionalAttributes);
    return attributes;
  }

  abstract get geometryAttributes(): Readonly<Record<string, number>>;
  abstract get treeSummary(): string;

  get identity(): string {
    return `${this.kind}#${this.id}`;
  }

  protected get styleSummary(): string {
    const styles = [
      this.fill === undefined ? undefined : `fill=${this.fill}`,
      this.stroke === undefined ? undefined : `stroke=${this.stroke}`,
      this.strokeWidth === undefined ? undefined : `stroke-width=${this.strokeWidth}`,
    ].filter((value): value is string => value !== undefined);
    return styles.length === 0 ? "" : ` ${styles.join(" ")}`;
  }

  protected get additionalAttributes(): Readonly<Record<string, ShapeAttributeValue>> {
    return {};
  }

  move(dx: number, dy: number): void {
    Shape.requireFinite(dx, "dx");
    Shape.requireFinite(dy, "dy");
    this.moveSelf(dx, dy);
  }

  scale(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new DomainError("scale factor must be positive");
    }
    this.scaleSelf(factor);
  }

  setAttribute(attribute: string, value: ShapeAttributeValue): void {
    if (attribute === "fill" || attribute === "stroke") {
      if (typeof value !== "string") {
        throw new DomainError(`attribute ${attribute} must be a string`);
      }
      if (attribute === "fill") {
        this.fillValue = value;
      } else {
        this.strokeValue = value;
      }
      return;
    }

    if (attribute === "stroke-width") {
      if (typeof value !== "number") {
        throw new DomainError("attribute stroke-width must be numeric");
      }
      this.strokeWidthValue = Shape.requireNonNegative(value, attribute);
      return;
    }

    this.setGeometryAttribute(attribute, value);
  }

  restoreAttribute(attribute: string, value: ShapeAttributeValue | undefined): void {
    if (value !== undefined) {
      this.setAttribute(attribute, value);
      return;
    }

    switch (attribute) {
      case "fill":
        this.fillValue = undefined;
        return;
      case "stroke":
        this.strokeValue = undefined;
        return;
      case "stroke-width":
        this.strokeWidthValue = undefined;
        return;
      default:
        throw new DomainError(`cannot clear attribute: ${attribute}`);
    }
  }

  [setShapeParent](parent: Shape | null): void {
    this.parentValue = parent;
  }

  protected abstract moveSelf(dx: number, dy: number): void;
  protected abstract scaleSelf(factor: number): void;
  protected abstract setGeometryAttribute(attribute: string, value: ShapeAttributeValue): void;

  protected static requireFinite(value: number, name: string): number {
    if (!Number.isFinite(value)) {
      throw new DomainError(`${name} must be a finite number`);
    }
    return value;
  }

  protected static requireNumber(value: ShapeAttributeValue, name: string): number {
    if (typeof value !== "number") {
      throw new DomainError(`attribute ${name} must be numeric`);
    }
    return value;
  }

  protected static requireNonNegative(value: number, name: string): number {
    Shape.requireFinite(value, name);
    if (value < 0) {
      throw new DomainError(`${name} must not be negative`);
    }
    return value;
  }
}
