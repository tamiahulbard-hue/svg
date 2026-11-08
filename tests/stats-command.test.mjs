import assert from "node:assert/strict";
import test from "node:test";

import { CommandParser } from "../dist/cli/CommandParser.js";
import { StatsCommandPlugin } from "../dist/plugins/stats/StatsCommandPlugin.js";
import { createRuntime } from "./runtime.mjs";

const parser = new CommandParser();
const run = (executor, input) => executor.execute(parser.parse(input));

test("stats counts leaves in depth-first first-seen type order and counts containers", () => {
  const runtime = createRuntime(undefined, undefined, [new StatsCommandPlugin()]);
  run(runtime.executor, "init");
  run(runtime.executor, "create g outer");
  run(runtime.executor, "create rect r1 0 0 1 1 in outer");
  run(runtime.executor, "create g inner in outer");
  run(runtime.executor, "create circle c1 0 0 1 in inner");
  run(runtime.executor, "create rect r2 0 0 1 1");
  run(runtime.executor, 'create text t1 0 0 "label"');

  assert.equal(run(runtime.executor, "stats"), "rect: 2  circle: 1  text: 1  (total 4, containers 2)");
  assert.match(run(runtime.executor, "help"), /stats  count leaf shapes and containers/);
});

test("stats formats an empty canvas and does not affect undo history", () => {
  const runtime = createRuntime(undefined, undefined, [new StatsCommandPlugin()]);
  run(runtime.executor, "init");
  assert.equal(run(runtime.executor, "stats"), "(total 0, containers 0)");

  run(runtime.executor, "create rect r 0 0 1 1");
  assert.equal(run(runtime.executor, "stats"), "rect: 1  (total 1, containers 0)");
  assert.equal(run(runtime.executor, "undo"), "rect#r creation undone");
  assert.equal(run(runtime.executor, "stats"), "(total 0, containers 0)");
});

test("disabled stats is unknown and invalid arguments are rejected", () => {
  assert.equal(run(createRuntime().executor, "stats"), "error: unknown command: stats");

  const runtime = createRuntime(undefined, undefined, [new StatsCommandPlugin()]);
  assert.equal(run(runtime.executor, "stats extra"), "error: usage: stats");
});
