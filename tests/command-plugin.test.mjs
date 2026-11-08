import assert from "node:assert/strict";
import test from "node:test";

import { DomainError } from "../dist/domain/DomainError.js";
import { CommandRegistry } from "../dist/application/CommandRegistry.js";
import { DocumentSession } from "../dist/application/DocumentSession.js";
import { CommandParser } from "../dist/cli/CommandParser.js";
import { createRuntime } from "./runtime.mjs";

const parser = new CommandParser();
const run = (executor, input) => executor.execute(parser.parse(input));

class PingPlugin {
  name = "ping";
  helpText = "respond with a status message";

  create(arguments_, context) {
    if (arguments_.length !== 0) {
      throw new DomainError("usage: ping");
    }
    return {
      historyEffect: "skip",
      execute: () => `pong (${context.session.constructor.name})`,
      undo: () => {
        throw new Error("ping cannot be undone");
      },
    };
  }
}

test("registered command implementations are dispatched and listed in help", () => {
  const session = new DocumentSession();
  const executor = createRuntime(session, undefined, [new PingPlugin()]).executor;

  assert.equal(run(executor, "ping"), "pong (DocumentSession)");
  assert.match(run(executor, "help"), /Plugins:\n  ping  respond with a status message/);
  assert.equal(run(executor, "ping extra"), "error: usage: ping");
});

test("disabled commands remain unknown and do not appear in help", () => {
  const executor = createRuntime().executor;

  assert.equal(run(executor, "ping"), "error: unknown command: ping");
  assert.doesNotMatch(run(executor, "help"), /ping/);
});

test("duplicate command registrations are rejected before dispatch", () => {
  const registry = new CommandRegistry();
  registry.register(new PingPlugin());

  assert.throws(
    () => registry.register(new PingPlugin()),
    /duplicate registration: commands\/ping/,
  );
});
