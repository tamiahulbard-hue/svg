import { DomainError } from "./DomainError.js";
import { Shape, setShapeParent, type ShapeAttributeValue } from "./Shape.js";

export class GroupShape extends Shape {
  private readonly childrenValue: Shape[] = [];

  constructor(id: string, style: { fill?: string; stroke?: string; strokeWidth?: number } = {}) {
    super(id, "g", style);
  }

  get children(): readonly Shape[] {
    return [...this.childrenValue];
  }

  get geometryAttributes(): Readonly<Record<string, number>> {
    return {};
  }

  addChild(child: Shape, index?: number): void {
    if (child === this || (child instanceof GroupShape && child.contains(this))) {
      throw new DomainError(`cannot add container ${child.id} to its own descendant`);
    }

    const oldParent = child.parent;
    const oldIndex = oldParent instanceof GroupShape
      ? oldParent.childrenValue.indexOf(child)
      : -1;
    const alreadyChild = oldParent === this && oldIndex >= 0;
    const insertionIndex = index ?? this.childrenValue.length - (alreadyChild ? 1 : 0);
    const resultingLength = this.childrenValue.length - (alreadyChild ? 1 : 0);
    if (!Number.isInteger(insertionIndex) || insertionIndex < 0 || insertionIndex > resultingLength) {
      throw new DomainError("child index out of range");
    }

    if (alreadyChild) {
      this.childrenValue.splice(oldIndex, 1);
    } else if (oldParent instanceof GroupShape) {
      oldParent.removeChild(child);
    }

    this.childrenValue.splice(insertionIndex, 0, child);
    child[setShapeParent](this);
  }

  removeChild(child: Shape): number {
    const index = this.childrenValue.indexOf(child);
    if (index < 0) {
      throw new DomainError(`shape ${child.id} is not a child of ${this.id}`);
    }
    this.childrenValue.splice(index, 1);
    child[setShapeParent](null);
    return index;
  }

  contains(shape: Shape): boolean {
    return this.childrenValue.some(
      (child) => child === shape || (child instanceof GroupShape && child.contains(shape)),
    );
  }

  protected moveSelf(dx: number, dy: number): void {
    for (const child of this.childrenValue) {
      child.move(dx, dy);
    }
  }

  protected scaleSelf(factor: number): void {
    for (const child of this.childrenValue) {
      child.scale(factor);
    }
  }

  protected setGeometryAttribute(attribute: string, _value: ShapeAttributeValue): void {
    throw new DomainError(`unknown attribute: ${attribute}`);
  }
}
