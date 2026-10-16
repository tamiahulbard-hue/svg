import assert from "node:assert/strict";
import test from "node:test";

import { CommandFactory } from "../dist/application/CommandFactory.js";
import { DocumentCommandExecutor } from "../dist/application/DocumentCommandExecutor.js";
import { DocumentSession } from "../dist/application/DocumentSession.js";
import { CommandParser } from "../dist/cli/CommandParser.js";
import { GroupShape } from "../dist/domain/GroupShape.js";
import { SvgDocument } from "../dist/domain/SvgDocument.js";

const parser = new CommandParser();
const tokens = (input) => parser.parse(input);
const run = (executor, input) => executor.execute(tokens(input));

test("parser preserves quoted whitespace and handles quoted escapes", () => {
  assert.deepEqual(tokens('create text label 2 3 "two words"'), [
    "create",
    "text",
    "label",
    "2",
    "3",
    "two words",
  ]);
  assert.deepEqual(tokens('set label text "say \\"hi\\""'), [
    "set",
    "label",
    "text",
    'say "hi"',
  ]);
  assert.deepEqual(tokens('read "C:\\Users\\Name\\diagram.svg"'), [
    "read",
    "C:\\Users\\Name\\diagram.svg",
  ]);
  assert.throws(() => tokens('create text label 0 0 "unfinished'), /unterminated quoted argument/);
});

test("create supports six built-in shapes and optional container placement", () => {
  const session = new DocumentSession();
  const executor = new DocumentCommandExecutor(session);
  run(executor, "init 400 200");
  assert.equal(run(executor, "create g node"), "g#node created");
  assert.equal(run(executor, "create rect r 1 2 30 40 red in node"), "rect#r created in g#node");
  assert.equal(run(executor, "create circle c 10 20 5 blue"), "circle#c created");
  assert.equal(run(executor, "create ellipse e 5 6 7 8"), "ellipse#e created");
  assert.equal(run(executor, "create line l 0 1 2 3 black in node"), "line#l created in g#node");
  assert.equal(run(executor, 'create text t 4 5 "hello world" in node'), "text#t created in g#node");

  assert.deepEqual(session.document.allShapes().map((shape) => shape.id), [
    "node",
    "r",
    "l",
    "t",
    "c",
    "e",
  ]);
  assert.equal(run(executor, "create box b 0 0 1 1 title"), "error: unknown shape type: box (is the plugin loaded?)");
});

test("edit commands change shape geometry and attributes and reject invalid commands atomically", () => {
  const session = new DocumentSession();
  const executor = new DocumentCommandExecutor(session);
  run(executor, "init");
  run(executor, "create g node");
  run(executor, "create rect rect1 10 20 30 40 #fff in node");

  assert.equal(run(executor, "move rect1 3 -2"), "rect#rect1 moved to (13,18)");
  assert.equal(run(executor, "scale rect1 2"), "rect#rect1 scaled by 2");
  assert.equal(run(executor, "set rect1 width 80"), "rect#rect1 updated: width=80");
  assert.equal(run(executor, 'set rect1 fill "#123456"'), 'rect#rect1 updated: fill="#123456"');
  assert.deepEqual(session.document.requireShape("rect1").attributes, {
    x: 26,
    y: 36,
    width: 80,
    height: 80,
    fill: "#123456",
  });

  assert.equal(run(executor, "scale rect1 0"), "error: scale factor must be positive");
  assert.equal(run(executor, "set rect1 width -2"), "error: width must not be negative");
  assert.equal(run(executor, 'set rect1 text "invalid"'), "error: unknown attribute: text");
  assert.equal(run(executor, "move missing 1 2"), "error: no such shape: missing");
  assert.deepEqual(session.document.requireShape("rect1").attributes, {
    x: 26,
    y: 36,
    width: 80,
    height: 80,
    fill: "#123456",
  });
});

test("failed recursive movement restores every previously changed child", () => {
  const session = new DocumentSession();
  const executor = new DocumentCommandExecutor(session);
  run(executor, "init");
  run(executor, "create g group");
  run(executor, "create rect safe 0 0 1 1 in group");
  run(executor, "create rect overflow 1e308 0 1 1 in group");

  assert.equal(run(executor, "move group 1e308 0"), "error: x must be a finite number");
  assert.equal(session.document.requireShape("safe").geometryAttributes.x, 0);
  assert.equal(session.document.requireShape("overflow").geometryAttributes.x, 1e308);
});

test("group, ungroup, addto, front, back, and delete preserve hierarchy and order", () => {
  const session = new DocumentSession();
  const executor = new DocumentCommandExecutor(session);
  run(executor, "init");
  run(executor, "create g parent");
  run(executor, "create rect a 0 0 1 1 in parent");
  run(executor, "create circle b 1 1 1 in parent");
  run(executor, "create ellipse c 2 2 1 1 in parent");
  run(executor, "front a");
  assert.deepEqual(session.document.requireShape("parent").children.map((shape) => shape.id), ["b", "c", "a"]);
  run(executor, "back a");
  assert.deepEqual(session.document.requireShape("parent").children.map((shape) => shape.id), ["a", "b", "c"]);

  assert.equal(run(executor, "group pair b c"), "g#pair created with 2 children");
  assert.deepEqual(session.document.requireShape("parent").children.map((shape) => shape.id), ["a", "pair"]);
  assert.equal(run(executor, "ungroup pair"), "g#pair ungrouped (2 children)");
  assert.deepEqual(session.document.requireShape("parent").children.map((shape) => shape.id), ["a", "b", "c"]);

  run(executor, "create g other");
  assert.equal(run(executor, "addto other b"), "circle#b moved to g#other");
  assert.equal(session.document.requireShape("b").parent.id, "other");
  assert.equal(run(executor, "delete c"), "ellipse#c deleted");
  assert.equal(session.document.findShape("c"), undefined);
});

test("composite ancestor selection and invalid destinations leave the tree unchanged", () => {
  const session = new DocumentSession();
  const executor = new DocumentCommandExecutor(session);
  run(executor, "init");
  run(executor, "create g outer");
  run(executor, "create g inner in outer");
  run(executor, "create rect leaf 0 0 1 1 in inner");

  assert.equal(
    run(executor, "group bad outer leaf"),
    "error: cannot group a container into its own descendant: outer",
  );
  assert.equal(run(executor, "addto leaf leaf"), "error: not a container: leaf");
  assert.deepEqual(session.document.allShapes().map((shape) => shape.id), ["outer", "inner", "leaf"]);
  assert.equal(session.document.requireShape("leaf").parent.id, "inner");
});

test("command objects expose undo for structural edits", () => {
  const session = new DocumentSession();
  const factory = new CommandFactory(session);
  session.initialize();
  const document = session.document;
  const createGroup = factory.create(tokens("create g group"));
  createGroup.execute();
  const createShape = factory.create(tokens("create rect shape 1 2 3 4"));
  createShape.execute();
  const placement = factory.create(tokens("addto group shape"));
  placement.execute();
  assert.equal(document.requireShape("shape").parent.id, "group");
  placement.undo();
  assert.equal(document.requireShape("shape").parent, null);

  const deletion = factory.create(tokens("delete shape"));
  deletion.execute();
  assert.equal(document.findShape("shape"), undefined);
  deletion.undo();
  assert.equal(document.requireShape("shape").parent, null);

  const groupCommand = factory.create(tokens("group bundle group shape"));
  assert.match(groupCommand.execute(), /created with 2 children/);
  groupCommand.undo();
  assert.deepEqual(document.children.map((shape) => shape.id), ["group", "shape"]);
  assert.ok(document.requireShape("group") instanceof GroupShape);
  assert.ok(document instanceof SvgDocument);
});
