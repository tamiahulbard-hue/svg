import assert from "node:assert/strict";
import test from "node:test";

import { DocumentCommandExecutor } from "../dist/application/DocumentCommandExecutor.js";
import { DocumentSession } from "../dist/application/DocumentSession.js";
import { CommandParser } from "../dist/cli/CommandParser.js";

const parser = new CommandParser();
const run = (executor, input) => executor.execute(parser.parse(input));

test("successful edits undo and redo, and redo survives failed edits", () => {
  const session = new DocumentSession();
  const executor = new DocumentCommandExecutor(session);
  run(executor, "init");
  assert.equal(run(executor, "create rect r 1 2 3 4"), "rect#r created");
  assert.equal(run(executor, "undo"), "rect#r creation undone");
  assert.equal(session.document.findShape("r"), undefined);

  assert.equal(
    run(executor, "create box r 0 0 1 1"),
    "error: unknown shape type: box (is the plugin loaded?)",
  );
  assert.equal(run(executor, "redo"), "rect#r created");
  assert.ok(session.document.findShape("r"));
});

test("a new successful edit after undo clears redo while display commands do not", () => {
  const session = new DocumentSession();
  const executor = new DocumentCommandExecutor(session);
  run(executor, "init");
  run(executor, "create rect a 0 0 1 1");
  run(executor, "create rect b 0 0 1 1");
  run(executor, "undo");
  assert.equal(run(executor, "canvas"), "canvas 800x600");
  assert.equal(run(executor, "redo"), "rect#b created");
  run(executor, "undo");
  run(executor, "create circle c 0 0 1");
  assert.equal(run(executor, "redo"), "error: nothing to redo");
});

test("document commands create a history barrier until the next edit", () => {
  const session = new DocumentSession();
  const executor = new DocumentCommandExecutor(session);
  run(executor, "init");
  run(executor, "create rect first 0 0 1 1");
  run(executor, "init 200 100");
  assert.equal(run(executor, "undo"), "error: undo not allowed after io command");
  assert.equal(run(executor, "redo"), "error: undo not allowed after io command");

  run(executor, "create circle next 5 5 2");
  assert.equal(run(executor, "undo"), "circle#next creation undone");
  assert.equal(run(executor, "undo"), "error: nothing to undo");
  assert.equal(session.document.findShape("first"), undefined);
});

test("grouping is a single undo unit and redo restores the composite", () => {
  const session = new DocumentSession();
  const executor = new DocumentCommandExecutor(session);
  run(executor, "init");
  run(executor, "create rect a 0 0 1 1");
  run(executor, "create circle b 1 1 1");
  run(executor, "group pair a b");
  assert.deepEqual(session.document.children.map((shape) => shape.id), ["pair"]);

  assert.equal(run(executor, "undo"), "g#pair grouping undone");
  assert.deepEqual(session.document.children.map((shape) => shape.id), ["a", "b"]);
  assert.match(run(executor, "redo"), /g#pair created with 2 children/);
  assert.deepEqual(session.document.children.map((shape) => shape.id), ["pair"]);
});

test("move, scale, set, delete, reparent, and z-order each undo as one edit", () => {
  const session = new DocumentSession();
  const executor = new DocumentCommandExecutor(session);
  run(executor, "init");
  run(executor, "create g left");
  run(executor, "create g right");
  run(executor, "create rect r 10 20 30 40 in left");

  assert.equal(run(executor, "move r 5 -3"), "rect#r moved to (15,17)");
  assert.deepEqual(session.document.requireShape("r").geometryAttributes, {
    x: 15,
    y: 17,
    width: 30,
    height: 40,
  });
  assert.equal(run(executor, "undo"), "rect#r moved back to (10,20)");
  assert.deepEqual(session.document.requireShape("r").geometryAttributes, {
    x: 10,
    y: 20,
    width: 30,
    height: 40,
  });
  assert.equal(run(executor, "redo"), "rect#r moved to (15,17)");
  run(executor, "scale r 2");
  run(executor, "undo");
  assert.deepEqual(session.document.requireShape("r").geometryAttributes, {
    x: 15,
    y: 17,
    width: 30,
    height: 40,
  });

  run(executor, "set r fill blue");
  run(executor, "undo");
  assert.equal(session.document.requireShape("r").fill, undefined);
  run(executor, "redo");
  assert.equal(session.document.requireShape("r").fill, "blue");

  run(executor, "addto right r");
  run(executor, "undo");
  assert.equal(session.document.requireShape("r").parent.id, "left");
  run(executor, "front r");
  run(executor, "undo");
  assert.equal(session.document.requireShape("r").parent.id, "left");

  run(executor, "delete r");
  assert.equal(run(executor, "undo"), "rect#r restored into g#left");
  assert.equal(session.document.requireShape("r").parent.id, "left");
  run(executor, "redo");
  assert.equal(session.document.findShape("r"), undefined);
});
