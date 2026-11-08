import assert from "node:assert/strict";
import test from "node:test";

import { CommandParser } from "../dist/cli/CommandParser.js";
import { BoxAttributeHandler } from "../dist/plugins/box/BoxAttributeHandler.js";
import { BoxShapeProvider } from "../dist/plugins/box/BoxShapeProvider.js";
import { createRuntime } from "./runtime.mjs";

const parser = new CommandParser();
const run = (runtime, input) => runtime.executor.execute(parser.parse(input));

function boxRuntime() {
  const runtime = createRuntime();
  runtime.shapeProviders.register(new BoxShapeProvider());
  runtime.attributeHandlers.register(new BoxAttributeHandler());
  return runtime;
}

test("box fill propagates to its rectangle and label changes target its text", () => {
  const runtime = boxRuntime();
  run(runtime, "init");
  run(runtime, 'create box node 10 20 100 50 "Before"');
  const box = runtime.session.document.requireShape("node");

  assert.equal(
    run(runtime, "set node fill #f5a623"),
    "box#node fill propagated to rect#node-rect",
  );
  assert.equal(box.rectangle.fill, "#f5a623");
  assert.equal(run(runtime, "undo"), "box#node fill restored on rect#node-rect");
  assert.equal(box.rectangle.fill, "#4a90d9");
  assert.equal(run(runtime, "redo"), "box#node fill propagated to rect#node-rect");
  assert.equal(box.rectangle.fill, "#f5a623");

  assert.equal(
    run(runtime, 'set node label "After label"'),
    'box#node label updated: "After label"',
  );
  assert.equal(box.label.text, "After label");
  assert.equal(run(runtime, "undo"), 'box#node label restored: "Before"');
  assert.equal(box.label.text, "Before");
  assert.equal(run(runtime, "redo"), 'box#node label updated: "After label"');
  assert.equal(box.label.text, "After label");
});

test("box handler matches only its supported attributes and ordinary shapes keep defaults", () => {
  const handler = new BoxAttributeHandler();
  const runtime = boxRuntime();
  run(runtime, "init");
  run(runtime, 'create box node 0 0 10 10 "Title"');

  const box = runtime.session.document.requireShape("node");
  const rectangle = runtime.session.document.requireShape("node-rect");
  assert.equal(handler.handles(box, "fill"), true);
  assert.equal(handler.handles(box, "label"), true);
  assert.equal(handler.handles(box, "stroke"), false);
  assert.equal(handler.handles(rectangle, "fill"), false);
  assert.equal(run(runtime, "set node stroke blue"), 'box#node updated: stroke="blue"');
  assert.equal(box.stroke, "blue");
  assert.equal(run(runtime, "set node-rect fill green"), 'rect#node-rect updated: fill="green"');
  assert.equal(rectangle.fill, "green");
  assert.equal(run(runtime, "set node label"), "error: usage: set");
});
