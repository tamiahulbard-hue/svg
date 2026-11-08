import { GroupShape } from "../../domain/GroupShape.js";
import type { Shape } from "../../domain/Shape.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
import type { DocumentSession } from "../../application/DocumentSession.js";
import type { TreeDecorator } from "../../application/TreeDecorator.js";

type ShapeState = {
  kind: string;
  attributes: readonly (readonly [string, string | number])[];
  parentId: string | null;
  siblingIndex: number;
  childIds: readonly string[];
  canvasSize?: readonly [number, number];
};

export class ModifiedStarDecorator implements TreeDecorator {
  readonly name = "modified-star";
  private savedStates: Map<string, ShapeState> | undefined;
  private readonly unsubscribe: () => void;

  constructor(private readonly session: DocumentSession) {
    this.unsubscribe = session.subscribe((event) => {
      if (event.type === "initialized") {
        this.savedStates = undefined;
        return;
      }
      this.capture(event.document);
    });
  }

  decorate(shape: Shape): string | undefined {
    const savedState = this.savedStates?.get(shape.id);
    if (savedState === undefined) {
      return "*";
    }

    return this.sameState(
      this.state(shape, this.session.document),
      savedState,
    )
      ? undefined
      : "*";
  }

  dispose(): void {
    this.unsubscribe();
  }

  private capture(document: SvgDocument): void {
    this.savedStates = new Map(
      document.allShapes().map((shape) => [shape.id, this.state(shape, document)]),
    );
  }

  private sameState(left: ShapeState, right: ShapeState): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  private state(shape: Shape, document: SvgDocument): ShapeState {
    const siblings = shape.parent instanceof GroupShape
      ? shape.parent.children
      : document.children;
    const attributes = Object.entries(shape.attributes)
      .sort(([left], [right]) => left.localeCompare(right));
    const state: ShapeState = {
      kind: shape.kind,
      attributes,
      parentId: shape.parent?.id ?? null,
      siblingIndex: siblings.indexOf(shape),
      childIds: shape instanceof GroupShape
        ? shape.children.map((child) => child.id)
        : [],
    };
    if (shape.parent === null) {
      state.canvasSize = [document.width, document.height];
    }
    return state;
  }
}
