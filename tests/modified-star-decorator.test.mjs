import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { CommandParser } from "../dist/cli/CommandParser.js";
import { BoxShapeProvider } from "../dist/plugins/box/BoxShapeProvider.js";
import { BoxTypeDecorator } from "../dist/plugins/box/BoxTypeDecorator.js";
import { ModifiedStarDecorator } from "../dist/plugins/box/ModifiedStarDecorator.js";
import { createRuntime } from "./runtime.mjs";

const parser = new CommandParser();
const run = (runtime, input) => runtime.executor.execute(parser.parse(input));

function registerDecorators(runtime) {
  runtime.treeDecorators.register(new BoxTypeDecorator());
  runtime.treeDecorators.register(
    new ModifiedStarDecorator(runtime.session),
  );
}

test("modified-star compares content to the last saved document through undo and redo", () => {
  const runtime = createRuntime();
  registerDecorators(runtime);
  run(runtime, "init");
  run(runtime, "create rect r 0 0 10 10");
  assert.match(run(runtime, "tree"), /rect#r x=0 y=0 w=10 h=10 \*/);

  const directory = mkdtempSync(join(tmpdir(), "svg-modified-star-"));
  const file = join(directory, "saved.svg");
  try {
    run(runtime, `save "${file}"`);
    assert.doesNotMatch(run(runtime, "tree"), /\*/);

    run(runtime, "set r fill blue");
    assert.match(run(runtime, "tree"), /rect#r .*fill=blue \*/);
    run(runtime, "undo");
    assert.doesNotMatch(run(runtime, "tree"), /\*/);
    run(runtime, "redo");
    assert.match(run(runtime, "tree"), /rect#r .*fill=blue \*/);

    run(runtime, `save "${file}"`);
    assert.doesNotMatch(run(runtime, "tree"), /\*/);
    run(runtime, "set r x 5");
    assert.match(run(runtime, "tree"), /rect#r x=5 .* \*/);
    run(runtime, "undo");
    assert.doesNotMatch(run(runtime, "tree"), /\*/);

    run(runtime, "set r x 5");
    run(runtime, `read "${file}"`);
    assert.doesNotMatch(run(runtime, "tree"), /\*/);
    run(runtime, "canvas 400 300");
    assert.match(run(runtime, "tree"), /rect#r .* \*/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("modified-star marks new nodes and structural parent changes, not attribute ancestors", () => {
  const runtime = createRuntime();
  runtime.shapeProviders.register(new BoxShapeProvider());
  registerDecorators(runtime);
  run(runtime, "init");
  const directory = mkdtempSync(join(tmpdir(), "svg-modified-star-tree-"));
  const file = join(directory, "saved.svg");
  try {
    run(runtime, 'create box parent 0 0 40 30 "Parent"');
    run(runtime, `save "${file}"`);
    run(runtime, "create rect child 1 2 3 4 in parent");
    const added = run(runtime, "tree");
    assert.match(added, /g#parent \(box\) \*/);
    assert.match(added, /rect#child .* \*/);

    run(runtime, `save "${file}"`);
    run(runtime, "set child fill red");
    const editedChild = run(runtime, "tree");
    assert.match(editedChild, /rect#child .*fill=red \*/);
    assert.doesNotMatch(editedChild, /g#parent \(box\) \*/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
