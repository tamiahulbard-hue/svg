import assert from "node:assert/strict";
import test from "node:test";

import { CommandParser } from "../dist/cli/CommandParser.js";
import { createRuntime } from "./runtime.mjs";

const parser = new CommandParser();
const run = (executor, input) => executor.execute(parser.parse(input));

function boxLabelHandler() {
  return {
    name: "box-label",
    handles: (shape, attribute) => shape.kind === "g" && attribute === "label",
    apply(shape, _attribute, value) {
      const label = shape.children.find((child) => child.id === `${shape.id}-label`);
      assert.ok(label);
      const previous = label.attributes.text;
      label.setAttribute("text", value);
      return previous;
    },
  };
}

function createBox(runtime) {
  run(runtime.executor, "init");
  run(runtime.executor, "create g node");
  run(runtime.executor, "create rect node-rect 1 2 3 4 blue in node");
  run(runtime.executor, 'create text node-label 1 2 "before" in node');
}

test("a registered handler modifies its target and participates in undo and redo", () => {
  const runtime = createRuntime(undefined, undefined, [], [], [boxLabelHandler()]);
  createBox(runtime);

  assert.equal(run(runtime.executor, 'set node label "after"'), 'g#node updated: label="after"');
  assert.equal(runtime.session.document.requireShape("node-label").attributes.text, "after");
  run(runtime.executor, "undo");
  assert.equal(runtime.session.document.requireShape("node-label").attributes.text, "before");
  run(runtime.executor, "redo");
  assert.equal(runtime.session.document.requireShape("node-label").attributes.text, "after");
});

test("a partially failing handler rolls back document state and preserves redo history", () => {
  const failingHandler = {
    ...boxLabelHandler(),
    name: "failing-box-label",
    apply(shape, _attribute, value) {
      const label = shape.children.find((child) => child.id === `${shape.id}-label`);
      assert.ok(label);
      label.setAttribute("text", value);
      throw new Error("simulated failure");
    },
  };
  const runtime = createRuntime(undefined, undefined, [], [], [failingHandler]);
  createBox(runtime);
  run(runtime.executor, "create rect pending 0 0 1 1");
  run(runtime.executor, "undo");
  const before = runtime.session.document.requireShape("node-label").attributes.text;

  assert.equal(
    run(runtime.executor, 'set node label "partial"'),
    "error: attribute handler failing-box-label failed: simulated failure",
  );
  assert.equal(runtime.session.document.requireShape("node-label").attributes.text, before);
  assert.equal(run(runtime.executor, "redo"), "rect#pending created");
});

test("multiple matching handlers are rejected and ordinary attributes keep fallback behavior", () => {
  const runtime = createRuntime(undefined, undefined, [], [], [
    boxLabelHandler(),
    { ...boxLabelHandler(), name: "second-box-label" },
  ]);
  createBox(runtime);
  assert.equal(
    run(runtime.executor, 'set node label "after"'),
    "error: multiple attribute handlers for g#node.label",
  );
  assert.equal(runtime.session.document.requireShape("node-label").attributes.text, "before");

  assert.equal(run(runtime.executor, "set node-rect label other"), "error: unknown attribute: label");
  assert.equal(run(runtime.executor, "set node-rect width 10"), "rect#node-rect updated: width=10");
});
