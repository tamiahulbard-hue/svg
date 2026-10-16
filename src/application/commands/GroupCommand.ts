import { DomainError } from "../../domain/DomainError.js";
import { GroupShape } from "../../domain/GroupShape.js";
import type { Shape } from "../../domain/Shape.js";
import { DocumentSession } from "../DocumentSession.js";
import { ShapePlacement } from "../ShapePlacement.js";
import type { Command } from "../Command.js";

type SelectedShape = {
  shape: Shape;
  placement: ShapePlacement;
};

export class GroupCommand implements Command {
  readonly historyEffect = "edit" as const;
  private selected: SelectedShape[] = [];
  private group: GroupShape | undefined;
  private groupParentId: string | undefined;
  private groupIndex = -1;

  constructor(
    private readonly session: DocumentSession,
    private readonly newId: string,
    private readonly ids: readonly string[],
  ) {}

  execute(): string {
    const document = this.session.document;
    if (this.ids.length < 2) {
      throw new DomainError("group requires at least two shapes");
    }
    if (new Set(this.ids).size !== this.ids.length) {
      throw new DomainError("group targets must be unique");
    }
    if (document.findShape(this.newId) !== undefined) {
      throw new DomainError(`id already exists: ${this.newId}`);
    }
    const group = new GroupShape(this.newId);

    const shapes = this.ids.map((id) => document.requireShape(id));
    for (const candidate of shapes) {
      if (
        candidate instanceof GroupShape &&
        shapes.some((other) => candidate !== other && candidate.contains(other))
      ) {
        throw new DomainError(`cannot group a container into its own descendant: ${candidate.id}`);
      }
    }
    const selected = shapes.map((shape) => ({
      shape,
      placement: new ShapePlacement(document, shape),
    }));

    const first = selected[0];
    if (first === undefined) {
      throw new DomainError("group requires at least two shapes");
    }
    this.groupParentId = first.placement.parentId;
    const sameParentBefore = selected.filter(
      (candidate) =>
        candidate.placement.parentId === first.placement.parentId &&
        candidate.placement.index < first.placement.index,
    ).length;
    this.groupIndex = first.placement.index - sameParentBefore;

    for (const candidate of [...selected].sort((a, b) => b.placement.index - a.placement.index)) {
      document.removeShape(candidate.shape.id);
    }

    document.addShape(group, this.groupParentId, this.groupIndex);
    for (const candidate of selected) {
      group.addChild(candidate.shape);
    }
    this.selected = selected;
    this.group = group;
    return `g#${group.id} created with ${selected.length} children`;
  }

  undo(): string {
    const document = this.session.document;
    const group = this.group;
    if (group === undefined) {
      throw new DomainError("cannot undo a group that has not been created");
    }
    document.removeShape(group.id);
    for (const child of [...group.children]) {
      group.removeChild(child);
    }
    for (const candidate of [...this.selected].sort(
      (a, b) => a.placement.index - b.placement.index,
    )) {
      candidate.placement.restore(document, candidate.shape);
    }
    return `g#${group.id} grouping undone`;
  }
}
