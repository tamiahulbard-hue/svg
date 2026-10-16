import assert from "node:assert/strict";
import test from "node:test";

import { DocumentCommandExecutor } from "../dist/application/DocumentCommandExecutor.js";
import { DocumentSession } from "../dist/application/DocumentSession.js";
import { CommandParser } from "../dist/cli/CommandParser.js";

const parser = new CommandParser();
const run = (executor, input) => executor.execute(parser.parse(input));

test("tree displays geometry inline and draws nested branches", () => {
  const session = new DocumentSession();
  const executor = new DocumentCommandExecutor(session);
  run(executor, "init 800 600");
  run(executor, "create g flow");
  run(executor, "create rect start 120 100 160 60 #4a90d9 in flow");
  run(executor, 'create text label 155 135 "Start here" in flow');
  run(executor, "create line arrow 280 130 520 130 black in flow");

  assert.equal(
    run(executor, "tree"),
    [
      "svg (800x600)",
      "└── g#flow",
      "    ├── rect#start x=120 y=100 w=160 h=60 fill=#4a90d9",
      '    ├── text#label (155,135) "Start here"',
      "    └── line#arrow (280,130) -> (520,130) stroke=black",
    ].join("\n"),
  );
  assert.equal(
    run(executor, "tree flow"),
    [
      "g#flow",
      "├── rect#start x=120 y=100 w=160 h=60 fill=#4a90d9",
      '├── text#label (155,135) "Start here"',
      "└── line#arrow (280,130) -> (520,130) stroke=black",
    ].join("\n"),
  );
  assert.equal(run(executor, "tree absent"), "error: no such shape: absent");
});

test("show prints parent and shape attributes, including text content", () => {
  const session = new DocumentSession();
  const executor = new DocumentCommandExecutor(session);
  run(executor, "init");
  run(executor, "create g group");
  run(executor, 'create text caption 10 20 "hello world" in group');

  assert.equal(
    run(executor, "show caption"),
    [
      "text#caption  parent=g#group",
      "  x=10",
      "  y=20",
      '  text="hello world"',
    ].join("\n"),
  );
  assert.equal(run(executor, "show missing"), "error: no such shape: missing");
});

test("help lists the documented commands and display requests do not touch history", () => {
  const session = new DocumentSession();
  const executor = new DocumentCommandExecutor(session);
  run(executor, "init");
  run(executor, "create circle c 1 2 3");
  assert.match(run(executor, "help"), /create ellipse <id> <cx> <cy> <rx> <ry>/);
  assert.match(run(executor, "help"), /undo \| redo/);
  assert.match(run(executor, "help"), /box is not included in this phase/);
  run(executor, "tree");
  run(executor, "show c");
  run(executor, "help");
  assert.equal(run(executor, "undo"), "circle#c creation undone");
});
