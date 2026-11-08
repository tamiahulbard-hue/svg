import { DomainError } from "../../domain/DomainError.js";
import type { Shape, ShapeAttributeValue } from "../../domain/Shape.js";
import type { AttributeHandler } from "../../application/AttributeHandler.js";
import { BoxShape } from "./BoxShape.js";

export class BoxAttributeHandler implements AttributeHandler {
  readonly name = "box-attributes";

  handles(shape: Shape, attribute: string): boolean {
    return shape instanceof BoxShape && (attribute === "fill" || attribute === "label");
  }

  apply(shape: Shape, attribute: string, value: ShapeAttributeValue): ShapeAttributeValue | undefined {
    const box = this.requireBox(shape);
    if (attribute === "fill") {
      const previous = box.rectangle.fill;
      box.rectangle.setAttribute("fill", value);
      return previous;
    }
    if (attribute === "label") {
      const previous = box.label.text;
      box.label.setAttribute("text", value);
      return previous;
    }
    throw new DomainError(`unsupported box attribute: ${attribute}`);
  }

  successMessage(shape: Shape, attribute: string, value: ShapeAttributeValue): string {
    const box = this.requireBox(shape);
    if (attribute === "fill") {
      return `box#${box.id} fill propagated to rect#${box.rectangle.id}`;
    }
    if (attribute === "label" && typeof value === "string") {
      return `box#${box.id} label updated: ${JSON.stringify(value)}`;
    }
    throw new DomainError(`unsupported box attribute: ${attribute}`);
  }

  undoMessage(
    shape: Shape,
    attribute: string,
    previousValue: ShapeAttributeValue | undefined,
  ): string {
    const box = this.requireBox(shape);
    if (attribute === "fill") {
      return `box#${box.id} fill restored on rect#${box.rectangle.id}`;
    }
    if (attribute === "label" && typeof previousValue === "string") {
      return `box#${box.id} label restored: ${JSON.stringify(previousValue)}`;
    }
    throw new DomainError(`unsupported box attribute: ${attribute}`);
  }

  private requireBox(shape: Shape): BoxShape {
    if (!(shape instanceof BoxShape)) {
      throw new DomainError(`box attribute handler cannot modify shape: ${shape.id}`);
    }
    return shape;
  }
}
