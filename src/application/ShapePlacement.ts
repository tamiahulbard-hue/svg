import { GroupShape } from "../domain/GroupShape.js";
import type { Shape } from "../domain/Shape.js";
import { SvgDocument } from "../domain/SvgDocument.js";

export class ShapePlacement {
  readonly parentId: string | undefined;
  readonly index: number;

  constructor(document: SvgDocument, shape: Shape) {
    const parent = shape.parent;
    const siblings = parent instanceof GroupShape ? parent.children : document.children;
    this.parentId = parent instanceof GroupShape ? parent.id : undefined;
    this.index = siblings.indexOf(shape);
    if (this.index < 0) {
      throw new Error(`shape ${shape.id} is not attached to its document`);
    }
  }

  restore(document: SvgDocument, shape: Shape): void {
    if (document.findShape(shape.id) === undefined) {
      document.addShape(shape, this.parentId, this.index);
      return;
    }
    document.reparentShape(shape.id, this.parentId, this.index);
  }
}
