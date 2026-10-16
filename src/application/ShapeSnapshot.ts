import type { Shape } from "../domain/Shape.js";
import { GroupShape } from "../domain/GroupShape.js";
import type { ShapeAttributeValue } from "../domain/Shape.js";

type ShapeState = {
  shape: Shape;
  attributes: Readonly<Record<string, ShapeAttributeValue>>;
};

export class ShapeSnapshot {
  private readonly states: ShapeState[];

  constructor(shape: Shape) {
    this.states = [];
    this.capture(shape);
  }

  restore(): void {
    for (const { shape, attributes } of this.states) {
      for (const attribute of ["fill", "stroke", "stroke-width"]) {
        shape.restoreAttribute(attribute, attributes[attribute]);
      }
      for (const [attribute, value] of Object.entries(attributes)) {
        if (attribute !== "fill" && attribute !== "stroke" && attribute !== "stroke-width") {
          shape.restoreAttribute(attribute, value);
        }
      }
    }
  }

  private capture(shape: Shape): void {
    this.states.push({ shape, attributes: { ...shape.attributes } });
    if (shape instanceof GroupShape) {
      for (const child of shape.children) {
        this.capture(child);
      }
    }
  }
}
