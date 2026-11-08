import { DomainError } from "../domain/DomainError.js";
import type { ExecutableCommand } from "../application/Command.js";
import type { CommandHistory } from "../application/CommandHistory.js";
import type { DocumentSession } from "../application/DocumentSession.js";
import type { SvgFilePort } from "../application/SvgFilePort.js";
import { CanvasCommand } from "../application/commands/CanvasCommand.js";
import { CreateCommand } from "../application/commands/CreateCommand.js";
import { DeleteCommand } from "../application/commands/DeleteCommand.js";
import { GroupCommand } from "../application/commands/GroupCommand.js";
import { InitCommand } from "../application/commands/InitCommand.js";
import { MoveCommand } from "../application/commands/MoveCommand.js";
import { ReparentCommand } from "../application/commands/ReparentCommand.js";
import { ScaleCommand } from "../application/commands/ScaleCommand.js";
import { SetCommand } from "../application/commands/SetCommand.js";
import { UngroupCommand } from "../application/commands/UngroupCommand.js";
import { ZOrderCommand } from "../application/commands/ZOrderCommand.js";
import { UndoCommand } from "../application/commands/UndoCommand.js";
import { RedoCommand } from "../application/commands/RedoCommand.js";
import { ReadCommand } from "../application/commands/ReadCommand.js";
import { SaveCommand } from "../application/commands/SaveCommand.js";
import { TreeCommand } from "../application/commands/TreeCommand.js";
import { ShowCommand } from "../application/commands/ShowCommand.js";
import { HelpCommand } from "../application/commands/HelpCommand.js";
import type { ShapeProviderRegistry } from "../domain/ShapeProviderRegistry.js";
import type { CommandRegistry } from "../application/CommandRegistry.js";
import type { TreeDecoratorRegistry } from "../application/TreeDecoratorRegistry.js";
import type { AttributeHandlerRegistry } from "../application/AttributeHandlerRegistry.js";
import type { DirectoryAccess } from "../application/DirectoryAccess.js";

const PHASE_ONE_SHAPE_KINDS = new Set(["rect", "circle", "ellipse", "line", "text", "g"]);

export class BuiltinCommandCatalog {
  constructor(
    private readonly session: DocumentSession,
    private readonly history: CommandHistory,
    private readonly filePort: SvgFilePort | undefined,
    private readonly shapeProviders: ShapeProviderRegistry,
    private readonly commandRegistry: CommandRegistry,
    private readonly treeDecorators: TreeDecoratorRegistry,
    private readonly attributeHandlers: AttributeHandlerRegistry,
    private readonly directoryAccess: DirectoryAccess,
  ) {}

  create(tokens: readonly string[]): ExecutableCommand {
    const [name, ...arguments_] = tokens;
    if (name === undefined) {
      throw new DomainError("empty command");
    }

    switch (name) {
      case "undo":
        this.requireCount(name, arguments_, 0);
        return new UndoCommand(this.history);
      case "redo":
        this.requireCount(name, arguments_, 0);
        return new RedoCommand(this.history);
      case "init":
        this.requireCount(name, arguments_, 0, 2);
        return new InitCommand(
          this.session,
          arguments_[0] === undefined ? 800 : this.number(arguments_[0], "width"),
          arguments_[1] === undefined ? 600 : this.number(arguments_[1], "height"),
        );
      case "canvas":
        this.requireCount(name, arguments_, 0, 2);
        return new CanvasCommand(
          this.session,
          arguments_[0] === undefined ? undefined : this.number(arguments_[0], "width"),
          arguments_[1] === undefined ? undefined : this.number(arguments_[1], "height"),
        );
      case "read":
        this.requireCount(name, arguments_, 1);
        return new ReadCommand(
          this.session,
          this.filePort,
          this.required(arguments_, 0, "file"),
        );
      case "save":
        this.requireCount(name, arguments_, 0, 1);
        return new SaveCommand(this.session, this.filePort, arguments_[0]);
      case "tree":
        this.requireCount(name, arguments_, 0, 1);
        return new TreeCommand(this.session, arguments_[0], this.treeDecorators);
      case "show":
        this.requireCount(name, arguments_, 1);
        return new ShowCommand(this.session, this.required(arguments_, 0, "id"));
      case "help":
        this.requireCount(name, arguments_, 0);
        return new HelpCommand(
          this.commandRegistry.additionalHelp,
          this.shapeProviders.kinds.filter((kind) => !PHASE_ONE_SHAPE_KINDS.has(kind)),
        );
      case "create":
        return this.createShape(arguments_);
      case "delete":
        this.requireCount(name, arguments_, 1);
        return new DeleteCommand(this.session, this.required(arguments_, 0, "id"));
      case "move":
        this.requireCount(name, arguments_, 3);
        return new MoveCommand(
          this.session,
          this.required(arguments_, 0, "id"),
          this.number(this.required(arguments_, 1, "dx"), "dx"),
          this.number(this.required(arguments_, 2, "dy"), "dy"),
        );
      case "scale":
        this.requireCount(name, arguments_, 2);
        return new ScaleCommand(
          this.session,
          this.required(arguments_, 0, "id"),
          this.number(this.required(arguments_, 1, "factor"), "factor"),
        );
      case "set":
        return this.setShapeAttribute(arguments_);
      case "group":
        this.requireCount(name, arguments_, 3, Number.POSITIVE_INFINITY);
        return new GroupCommand(
          this.session,
          this.required(arguments_, 0, "new group id"),
          arguments_.slice(1),
        );
      case "ungroup":
        this.requireCount(name, arguments_, 1);
        return new UngroupCommand(this.session, this.required(arguments_, 0, "id"));
      case "addto":
        this.requireCount(name, arguments_, 2);
        return new ReparentCommand(
          this.session,
          this.required(arguments_, 0, "container id"),
          this.required(arguments_, 1, "id"),
        );
      case "front":
      case "back":
        this.requireCount(name, arguments_, 1);
        return new ZOrderCommand(
          this.session,
          this.required(arguments_, 0, "id"),
          name === "front",
        );
      default:
        throw new DomainError(`unknown command: ${name}`);
    }
  }

  private createShape(arguments_: readonly string[]): ExecutableCommand {
    if (arguments_.length < 2) {
      throw new DomainError("usage: create <type> <id> [parameters...] [in <containerId>]");
    }

    let parentId: string | undefined;
    let end = arguments_.length;
    if (arguments_[end - 2] === "in") {
      parentId = arguments_[end - 1];
      if (parentId === undefined || parentId.length === 0) {
        throw new DomainError("usage: create <type> <id> [parameters...] in <containerId>");
      }
      end -= 2;
    }
    if (end < 2) {
      throw new DomainError("usage: create <type> <id> [parameters...] [in <containerId>]");
    }
    const type = this.required(arguments_, 0, "type");
    const id = this.required(arguments_, 1, "id");
    return new CreateCommand(
      this.session,
      type,
      id,
      arguments_.slice(2, end),
      parentId,
      this.shapeProviders,
    );
  }

  private setShapeAttribute(arguments_: readonly string[]): ExecutableCommand {
    this.requireCount("set", arguments_, 3);
    const id = this.required(arguments_, 0, "id");
    const attribute = this.required(arguments_, 1, "attribute");
    const rawValue = this.required(arguments_, 2, "value");
    const shape = this.session.document.requireShape(id);

    if (attribute === "fill" || attribute === "stroke" || attribute === "text") {
      return new SetCommand(this.session, id, attribute, rawValue, this.attributeHandlers);
    }
    if (attribute === "stroke-width" || typeof shape.attributes[attribute] === "number") {
      return new SetCommand(
        this.session,
        id,
        attribute,
        this.number(rawValue, attribute),
        this.attributeHandlers,
      );
    }
    return new SetCommand(this.session, id, attribute, rawValue, this.attributeHandlers);
  }

  private requireCount(name: string, arguments_: readonly string[], min: number, max = min): void {
    if (arguments_.length < min || arguments_.length > max) {
      throw new DomainError(`usage: ${name}`);
    }
  }

  private required(arguments_: readonly string[], index: number, name: string): string {
    const value = arguments_[index];
    if (value === undefined || value.length === 0) {
      throw new DomainError(`missing ${name}`);
    }
    return value;
  }

  private number(value: string, name: string): number {
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
      throw new DomainError(`${name} must be a finite number`);
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new DomainError(`${name} must be a finite number`);
    }
    return parsed;
  }
}
