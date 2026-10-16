import { DomainError } from "./DomainError.js";
import { GroupShape } from "./GroupShape.js";
import { Shape } from "./Shape.js";

export class SvgDocument {
  private readonly rootShapes: Shape[] = [];
  private widthValue: number;
  private heightValue: number;

  constructor(width = 800, height = 600) {
    this.widthValue = SvgDocument.requireCanvasSize(width, "width");
    this.heightValue = SvgDocument.requireCanvasSize(height, "height");
  }

  get width(): number {
    return this.widthValue;
  }

  get height(): number {
    return this.heightValue;
  }

  get children(): readonly Shape[] {
    return [...this.rootShapes];
  }

  setCanvasSize(width: number, height: number): void {
    const nextWidth = SvgDocument.requireCanvasSize(width, "width");
    const nextHeight = SvgDocument.requireCanvasSize(height, "height");
    this.widthValue = nextWidth;
    this.heightValue = nextHeight;
  }

  findShape(id: string): Shape | undefined {
    return this.allShapes().find((shape) => shape.id === id);
  }

  requireShape(id: string): Shape {
    const shape = this.findShape(id);
    if (shape === undefined) {
      throw new DomainError(`no such shape: ${id}`);
    }
    return shape;
  }

  allShapes(): Shape[] {
    const result: Shape[] = [];
    const visit = (shape: Shape): void => {
      result.push(shape);
      if (shape instanceof GroupShape) {
        for (const child of shape.children) {
          visit(child);
        }
      }
    };

    for (const shape of this.rootShapes) {
      visit(shape);
    }
    return result;
  }

  addShape(shape: Shape, parentId?: string, index?: number): void {
    const existingShapes = new Set(this.allShapes());
    const subtree = SvgDocument.collectSubtree(shape);
    const ids = new Set<string>();

    for (const member of subtree) {
      if (ids.has(member.id) || this.findShape(member.id) !== undefined) {
        throw new DomainError(`id already exists: ${member.id}`);
      }
      if (existingShapes.has(member)) {
        throw new DomainError(`shape is already in this document: ${member.id}`);
      }
      ids.add(member.id);
    }
    if (shape.parent !== null) {
      throw new DomainError(`shape ${shape.id} must be detached before insertion`);
    }

    const parent = parentId === undefined ? undefined : this.requireContainer(parentId);
    if (parent !== undefined && subtree.includes(parent)) {
      throw new DomainError(`cannot add container ${shape.id} to its own descendant`);
    }
    const destination = parent?.children;
    const insertionIndex = index ?? destination?.length ?? this.rootShapes.length;
    SvgDocument.validateIndex(insertionIndex, destination?.length ?? this.rootShapes.length);

    if (parent === undefined) {
      this.rootShapes.splice(insertionIndex, 0, shape);
    } else {
      parent.addChild(shape, insertionIndex);
    }
  }

  removeShape(id: string): Shape {
    const shape = this.requireShape(id);
    const parent = shape.parent;
    if (parent instanceof GroupShape) {
      parent.removeChild(shape);
    } else {
      const index = this.rootShapes.indexOf(shape);
      if (index < 0) {
        throw new DomainError(`shape ${id} is not attached to this document`);
      }
      this.rootShapes.splice(index, 1);
    }
    return shape;
  }

  reparentShape(id: string, parentId?: string, index?: number): void {
    const shape = this.requireShape(id);
    const targetParent = parentId === undefined ? undefined : this.requireContainer(parentId);
    const sourceParent = shape.parent instanceof GroupShape ? shape.parent : undefined;
    const sourceSiblings = sourceParent?.children ?? this.rootShapes;
    const targetSiblings = targetParent?.children ?? this.rootShapes;
    const sameSiblings = sourceSiblings === targetSiblings ||
      (sourceParent !== undefined && sourceParent === targetParent);
    const targetLengthAfterRemoval = targetSiblings.length - (sameSiblings ? 1 : 0);
    const insertionIndex = index ?? targetLengthAfterRemoval;

    if (
      targetParent === shape ||
      (shape instanceof GroupShape && targetParent !== undefined && shape.contains(targetParent))
    ) {
      throw new DomainError(`cannot move container ${id} into its own descendant`);
    }
    SvgDocument.validateIndex(insertionIndex, targetLengthAfterRemoval);

    if (sourceParent !== undefined) {
      sourceParent.removeChild(shape);
    } else {
      const sourceIndex = this.rootShapes.indexOf(shape);
      if (sourceIndex < 0) {
        throw new DomainError(`shape ${id} is not attached to this document`);
      }
      this.rootShapes.splice(sourceIndex, 1);
    }

    if (targetParent === undefined) {
      this.rootShapes.splice(insertionIndex, 0, shape);
    } else {
      targetParent.addChild(shape, insertionIndex);
    }
  }

  private requireContainer(id: string): GroupShape {
    const shape = this.requireShape(id);
    if (!(shape instanceof GroupShape)) {
      throw new DomainError(`not a container: ${id}`);
    }
    return shape;
  }

  private static collectSubtree(root: Shape): Shape[] {
    const result: Shape[] = [];
    const visit = (shape: Shape): void => {
      result.push(shape);
      if (shape instanceof GroupShape) {
        for (const child of shape.children) {
          visit(child);
        }
      }
    };
    visit(root);
    return result;
  }

  private static validateIndex(index: number, length: number): void {
    if (!Number.isInteger(index) || index < 0 || index > length) {
      throw new DomainError("child index out of range");
    }
  }

  private static requireCanvasSize(value: number, name: string): number {
    if (!Number.isFinite(value) || value <= 0) {
      throw new DomainError(`canvas ${name} must be a positive finite number`);
    }
    return value;
  }
}
