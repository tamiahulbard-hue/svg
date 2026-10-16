import { DomainError } from "../domain/DomainError.js";
import { DocumentSession } from "./DocumentSession.js";
import type { Command } from "./Command.js";
import { CanvasCommand } from "./commands/CanvasCommand.js";
import { CreateCommand } from "./commands/CreateCommand.js";
import { DeleteCommand } from "./commands/DeleteCommand.js";
import { GroupCommand } from "./commands/GroupCommand.js";
import { InitCommand } from "./commands/InitCommand.js";
import { MoveCommand } from "./commands/MoveCommand.js";
import { ReparentCommand } from "./commands/ReparentCommand.js";
import { ScaleCommand } from "./commands/ScaleCommand.js";
import { SetCommand } from "./commands/SetCommand.js";
import { UngroupCommand } from "./commands/UngroupCommand.js";
import { ZOrderCommand } from "./commands/ZOrderCommand.js";

export class CommandFactory {
  constructor(private readonly session: DocumentSession) {}

  create(tokens: readonly string[]): Command {
    const [name, ...arguments_] = tokens;
    if (name === undefined) {
      throw new DomainError("empty command");
    }

    switch (name) {
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
        this.requireCount(name, arguments_, 3);
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

  private createShape(arguments_: readonly string[]): Command {
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
    return new CreateCommand(this.session, type, id, arguments_.slice(2, end), parentId);
  }

  private setShapeAttribute(arguments_: readonly string[]): Command {
    this.requireCount("set", arguments_, 3);
    const id = this.required(arguments_, 0, "id");
    const attribute = this.required(arguments_, 1, "attribute");
    const rawValue = this.required(arguments_, 2, "value");
    const shape = this.session.document.requireShape(id);

    if (attribute === "fill" || attribute === "stroke" || attribute === "text") {
      return new SetCommand(this.session, id, attribute, rawValue);
    }
    if (attribute === "stroke-width" || typeof shape.attributes[attribute] === "number") {
      return new SetCommand(this.session, id, attribute, this.number(rawValue, attribute));
    }
    return new SetCommand(this.session, id, attribute, rawValue);
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
