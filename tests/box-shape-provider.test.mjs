import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { CommandParser } from "../dist/cli/CommandParser.js";
import { GroupShape } from "../dist/domain/GroupShape.js";
import { SvgXmlCodec } from "../dist/infrastructure/SvgXmlCodec.js";
import { BoxShape } from "../dist/plugins/box/BoxShape.js";
import { BoxShapeProvider } from "../dist/plugins/box/BoxShapeProvider.js";
import { createRuntime } from "./runtime.mjs";

const parser = new CommandParser();
const run = (runtime, input) => runtime.executor.execute(parser.parse(input));

function boxRuntime() {
  const runtime = createRuntime();
  runtime.shapeProviders.register(new BoxShapeProvider());
  return runtime;
}

test("box creates a protected composite with derived child IDs and the documented summary", () => {
  const provider = new BoxShapeProvider();
  const box = provider.create("n1", ["120", "100", "160", "60", "开始"]);

  assert.ok(box instanceof BoxShape);
  assert.equal(box.kind, "box");
  assert.equal(box.identity, "g#n1");
  assert.equal(box.creationSummary, "box#n1 created (g#n1 + rect#n1-rect + text#n1-label)");
  assert.deepEqual(box.children.map((child) => child.id), ["n1-rect", "n1-label"]);
  assert.equal(box.rectangle.fill, "#4a90d9");
  assert.deepEqual(box.label.geometryAttributes, { x: 140, y: 135 });
  assert.equal(box.label.text, "开始");
  assert.equal(box.canUngroup, false);
  assert.throws(() => provider.create("bad", ["1", "2", "3"]), /invalid parameters for box/);
});

test("box supports nesting and refuses ungrouping or detaching required parts", () => {
  const runtime = boxRuntime();
  run(runtime, "init");
  assert.equal(
    run(runtime, 'create box outer 0 0 100 50 "Outer"'),
    "box#outer created (g#outer + rect#outer-rect + text#outer-label)",
  );
  assert.equal(
    run(runtime, 'create box inner 10 10 40 20 "Inner" in outer'),
    "box#inner created (g#inner + rect#inner-rect + text#inner-label) in g#outer",
  );
  assert.match(run(runtime, "tree"), /g#outer/);
  assert.match(run(runtime, "tree"), /g#inner/);
  assert.equal(run(runtime, "ungroup outer"), "error: cannot ungroup composite shape: outer");
  assert.equal(run(runtime, "delete outer-rect"), "error: cannot remove required child outer-rect from outer");
  assert.equal(run(runtime, "addto inner outer-rect"), "error: cannot remove required child outer-rect from outer");
  assert.equal(run(runtime, "delete inner"), "box#inner deleted");
  assert.equal(run(runtime, "undo"), "box#inner restored into g#outer");
});

test("box IDs are validated atomically against the existing document", () => {
  const runtime = boxRuntime();
  run(runtime, "init");
  run(runtime, "create rect n1-label 0 0 1 1");

  assert.equal(
    run(runtime, 'create box n1 0 0 10 10 "Title"'),
    "error: id already exists: n1-label",
  );
  assert.equal(runtime.session.document.findShape("n1"), undefined);
  assert.equal(runtime.session.document.findShape("n1-rect"), undefined);
  assert.ok(runtime.session.document.findShape("n1-label"));
});

test("box SVG round-trips with the plugin and degrades to a plain group without it", () => {
  const runtime = boxRuntime();
  run(runtime, "init");
  run(runtime, 'create box n1 120 100 160 60 "开始"');
  run(runtime, 'create box n2 10 20 30 40 "Nested" in n1');
  const codec = new SvgXmlCodec(runtime.shapeProviders);
  const xml = codec.serialize(runtime.session.document);
  const restored = codec.parse(xml).document;
  const restoredBox = restored.requireShape("n1");
  assert.ok(restoredBox instanceof BoxShape);
  assert.equal(restoredBox.children[2].kind, "box");
  assert.deepEqual(restored.allShapes().map((shape) => shape.id), [
    "n1",
    "n1-rect",
    "n1-label",
    "n2",
    "n2-rect",
    "n2-label",
  ]);
  assert.match(xml, /<g id="n1" data-kind="box">/);

  const fallbackRuntime = createRuntime();
  const fallbackCodec = new SvgXmlCodec(fallbackRuntime.shapeProviders);
  const fallbackDocument = fallbackCodec.parse(xml).document;
  assert.ok(fallbackDocument.requireShape("n1") instanceof GroupShape);
  assert.equal(fallbackDocument.requireShape("n1").kind, "g");
  assert.equal(fallbackDocument.findShape("n2-rect")?.kind, "rect");
});

test("malformed box SVG is rejected without replacing the open document", () => {
  const runtime = boxRuntime();
  run(runtime, "init");
  run(runtime, "create rect existing 0 0 10 10");
  const currentDocument = runtime.session.document;
  const directory = mkdtempSync(join(tmpdir(), "svg-box-invalid-"));
  const file = join(directory, "broken.svg");
  try {
    const invalidChildren = [
      '<rect id="broken-rect"/>',
      '<text id="broken-label"/><rect id="broken-rect"/>',
      '<circle id="broken-rect"/><text id="broken-label"/>',
      '<rect id="other"/><text id="broken-label"/>',
    ];
    for (const children of invalidChildren) {
      writeFileSync(
        file,
        `<svg xmlns="http://www.w3.org/2000/svg"><g id="broken" data-kind="box">${children}</g></svg>`,
      );
      assert.match(run(runtime, `read "${file}"`), /error: invalid box broken:/);
      assert.equal(runtime.session.document, currentDocument);
      assert.ok(runtime.session.document.findShape("existing"));
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
