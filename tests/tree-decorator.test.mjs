import assert from "node:assert/strict";
import test from "node:test";

import { CommandParser } from "../dist/cli/CommandParser.js";
import { TreeDecoratorRegistry } from "../dist/application/TreeDecoratorRegistry.js";
import { createRuntime } from "./runtime.mjs";

const parser = new CommandParser();
const run = (executor, input) => executor.execute(parser.parse(input));

test("registered decorators append independent labels in registration order", () => {
  const runtime = createRuntime(undefined, undefined, [], [
    { name: "first", decorate: (shape) => shape.kind === "rect" ? "[first]" : undefined },
    { name: "second", decorate: (shape) => shape.kind === "rect" ? "(second)" : undefined },
  ]);
  run(runtime.executor, "init");
  run(runtime.executor, "create rect r 1 2 3 4");

  assert.equal(
    run(runtime.executor, "tree"),
    [
      "svg (800x600)",
      "└── rect#r x=1 y=2 w=3 h=4 [first] (second)",
    ].join("\n"),
  );
});

test("invalid decorator labels are reported and duplicate names are rejected", () => {
  const invalid = createRuntime(undefined, undefined, [], [
    { name: "bad", decorate: () => "line one\nline two" },
  ]);
  run(invalid.executor, "init");
  run(invalid.executor, "create rect r 1 2 3 4");
  assert.equal(run(invalid.executor, "tree"), "error: invalid tree decorator output: bad");

  const registry = new TreeDecoratorRegistry();
  const decorator = { name: "same", decorate: () => undefined };
  registry.register(decorator);
  assert.throws(
    () => registry.register(decorator),
    /duplicate registration: decorators\/same/,
  );
});
