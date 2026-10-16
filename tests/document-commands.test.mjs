import assert from "node:assert/strict";
import test from "node:test";

import { CommandParser } from "../dist/cli/CommandParser.js";
import { CommandFactory } from "../dist/application/CommandFactory.js";
import { DocumentCommandExecutor } from "../dist/application/DocumentCommandExecutor.js";
import { DocumentSession } from "../dist/application/DocumentSession.js";

const parser = new CommandParser();
const execute = (executor, input) => executor.execute(parser.parse(input));

test("init and canvas commands manage the current document", () => {
  const executor = new DocumentCommandExecutor();

  assert.equal(execute(executor, "canvas"), "error: no document. use 'init' or 'read' first");
  assert.equal(execute(executor, "init"), "canvas 800x600 created");
  assert.equal(execute(executor, "canvas"), "canvas 800x600");
  assert.equal(execute(executor, "canvas 400 240"), "canvas resized to 400x240");
  assert.equal(execute(executor, "canvas 320"), "canvas resized to 320x240");
  assert.equal(execute(executor, "init 640 480"), "canvas 640x480 created");
  assert.equal(execute(executor, "canvas"), "canvas 640x480");
});

test("invalid document commands return errors and preserve document state", () => {
  const executor = new DocumentCommandExecutor();
  const session = new DocumentSession();
  const commands = new DocumentCommandExecutor(session);

  assert.equal(execute(commands, "init 500 300"), "canvas 500x300 created");
  assert.match(execute(commands, "init 0 300"), /^error: canvas width must be a positive finite number$/);
  assert.match(execute(commands, "canvas NaN 400"), /^error: width must be a finite number$/);
  assert.match(execute(commands, "canvas 10 20 30"), /^error: usage: canvas$/);
  assert.deepEqual([session.document.width, session.document.height], [500, 300]);
  assert.match(execute(commands, "unknown"), /^error: unknown command: unknown$/);
});

test("canvas size queries are display-only while changes are history barriers", () => {
  const session = new DocumentSession();
  session.initialize();
  const factory = new CommandFactory(session);

  assert.equal(factory.create(parser.parse("canvas")).historyEffect, "skip");
  assert.equal(factory.create(parser.parse("canvas 400 300")).historyEffect, "barrier");
  assert.equal(factory.create(parser.parse("init")).historyEffect, "barrier");
});
