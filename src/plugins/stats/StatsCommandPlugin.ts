import { DomainError } from "../../domain/DomainError.js";
import { GroupShape } from "../../domain/GroupShape.js";
import type { Shape } from "../../domain/Shape.js";
import type { Command, CommandContext, ExecutableCommand } from "../../application/Command.js";

class StatsCommand implements ExecutableCommand {
  readonly historyEffect = "skip" as const;

  constructor(private readonly context: CommandContext) {}

  execute(): string {
    const counts = new Map<string, number>();
    let containers = 0;
    let total = 0;

    const visit = (shape: Shape): void => {
      if (shape instanceof GroupShape) {
        containers += 1;
        for (const child of shape.children) {
          visit(child);
        }
        return;
      }

      total += 1;
      counts.set(shape.kind, (counts.get(shape.kind) ?? 0) + 1);
    };

    for (const shape of this.context.session.document.children) {
      visit(shape);
    }

    const types = [...counts].map(([kind, count]) => `${kind}: ${count}`);
    const totals = `(total ${total}, containers ${containers})`;
    return types.length === 0 ? totals : `${types.join("  ")}  ${totals}`;
  }

  undo(): string {
    throw new Error("stats command cannot be undone");
  }
}

export class StatsCommandPlugin implements Command {
  readonly name = "stats";
  readonly helpText = "count leaf shapes and containers";

  create(arguments_: readonly string[], context: CommandContext): ExecutableCommand {
    if (arguments_.length > 0) {
      throw new DomainError("usage: stats");
    }
    return new StatsCommand(context);
  }
}
