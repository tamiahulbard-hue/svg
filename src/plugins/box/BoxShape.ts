import { GroupShape } from "../../domain/GroupShape.js";
import type { Shape } from "../../domain/Shape.js";
import { RectShape } from "../../domain/RectShape.js";
import { TextShape } from "../../domain/TextShape.js";

export class BoxShape extends GroupShape {
  override readonly kind = "box";

  constructor(
    id: string,
    private readonly rectangleValue: RectShape,
    private readonly labelValue: TextShape,
    additionalChildren: readonly Shape[] = [],
  ) {
    super(id);
    this.addChild(rectangleValue);
    this.addChild(labelValue);
    for (const child of additionalChildren) {
      this.addChild(child);
    }
  }

  override get identity(): string {
    return `g#${this.id}`;
  }

  override get creationSummary(): string {
    return `box#${this.id} created (g#${this.id} + rect#${this.rectangleValue.id} + text#${this.labelValue.id})`;
  }

  get rectangle(): RectShape {
    return this.rectangleValue;
  }

  get label(): TextShape {
    return this.labelValue;
  }

  override get canUngroup(): boolean {
    return false;
  }

  protected override isRequiredChild(child: Shape): boolean {
    return child === this.rectangleValue || child === this.labelValue;
  }
}
