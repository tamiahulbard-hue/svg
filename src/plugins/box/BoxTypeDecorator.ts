import type { Shape } from "../../domain/Shape.js";
import type { TreeDecorator } from "../../application/TreeDecorator.js";

export class BoxTypeDecorator implements TreeDecorator {
  readonly name = "box-type";

  decorate(shape: Shape): string | undefined {
    return shape.kind === "box" ? "(box)" : undefined;
  }
}
