import assert from "node:assert/strict";
import test from "node:test";

import { CommandParser } from "../dist/cli/CommandParser.js";
import { BoxTypeDecorator } from "../dist/plugins/box/BoxTypeDecorator.js";
import { createRuntime } from "./runtime.mjs";
import { BoxShapeProvider } from "../dist/plugins/box/BoxShapeProvider.js";

const parser = new CommandParser();
const run = (runtime, input) => runtime.executor.execute(parser.parse(input));

test("the box type decorator labels only box rows without changing their identity", () => {
  const runtime = createRuntime();
  runtime.shapeProviders.register(new BoxShapeProvider());
  runtime.treeDecorators.register(new BoxTypeDecorator());
  run(runtime, "init");
  run(runtime, 'create box node 0 0 10 10 "Title"');
  run(runtime, "create g plain");

  assert.equal(
    run(runtime, "tree"),
    [
      "svg (800x600)",
      "├── g#node (box)",
      "│   ├── rect#node-rect x=0 y=0 w=10 h=10 fill=#4a90d9",
      "│   └── text#node-label (20,35) \"Title\"",
      "└── g#plain",
    ].join("\n"),
  );
  assert.equal(run(runtime, "tree node"), [
    "g#node (box)",
    "├── rect#node-rect x=0 y=0 w=10 h=10 fill=#4a90d9",
    "└── text#node-label (20,35) \"Title\"",
  ].join("\n"));
});
