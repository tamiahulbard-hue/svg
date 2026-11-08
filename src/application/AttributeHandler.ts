import type { Shape, ShapeAttributeValue } from "../domain/Shape.js";

export interface AttributeHandler {
  readonly name: string;
  handles(shape: Shape, attribute: string): boolean;
  apply(shape: Shape, attribute: string, value: ShapeAttributeValue): ShapeAttributeValue | undefined;
}
