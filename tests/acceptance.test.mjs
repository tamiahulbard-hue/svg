import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { DocumentCommandExecutor } from "../dist/application/DocumentCommandExecutor.js";
import { DocumentSession } from "../dist/application/DocumentSession.js";
import { CommandParser } from "../dist/cli/CommandParser.js";
import { SvgFileAdapter } from "../dist/infrastructure/SvgFileAdapter.js";

const parser = new CommandParser();
const run = (executor, input) => executor.execute(parser.parse(input));
const withTempDirectory = (action) => {
  const directory = mkdtempSync(join(tmpdir(), "svg-editor-acceptance-"));
  try {
    action(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
};

test("phase sample session supports edit, undo/redo, grouping, IO, and missing IDs", () => {
  withTempDirectory((directory) => {
    const session = new DocumentSession();
    const executor = new DocumentCommandExecutor(session, new SvgFileAdapter());
    run(executor, "init 800 600");
    run(executor, "create rect bg 0 0 800 600 #ffffff");
    run(executor, 'create text title 20 40 "My Diagram"');
    run(executor, "create circle c1 100 100 20 red");
    run(executor, "create rect box 200 80 60 60 #3366ff");
    assert.equal(run(executor, "group markers c1 box"), "g#markers created with 2 children");
    assert.match(run(executor, "tree"), /└── g#markers\n    ├── circle#c1 cx=100 cy=100 r=20 fill=red/);

    assert.equal(run(executor, "move c1 30 0"), "circle#c1 moved to (130,100)");
    assert.equal(run(executor, "undo"), "circle#c1 moved back to (100,100)");
    assert.equal(run(executor, "redo"), "circle#c1 moved to (130,100)");
    assert.equal(run(executor, 'set title text "My Diagram v2"'), 'text#title updated: text="My Diagram v2"');
    assert.equal(run(executor, "undo"), 'text#title updated: text="My Diagram"');
    assert.equal(
      run(executor, "group bad c1 markers"),
      "error: cannot group a container into its own descendant: markers",
    );
    assert.equal(run(executor, "delete box"), "rect#box deleted");
    assert.equal(run(executor, "undo"), "rect#box restored into g#markers");

    const outputPath = join(directory, "demo.svg");
    assert.equal(run(executor, `save "${outputPath}"`), `saved to ${outputPath} (5 elements)`);
    assert.equal(run(executor, "undo"), "error: undo not allowed after io command");

    const inputPath = join(directory, "other.svg");
    writeFileSync(
      inputPath,
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">',
        '<rect x="0" y="0" width="400" height="300" fill="#ffffff"/>',
        '<text id="t1" x="10" y="290">imported</text>',
        '<circle id="c1" cx="50" cy="50" r="10"/>',
        '<g id="g1"><rect id="r2" x="0" y="0" width="10" height="10"/><circle id="c2" cx="5" cy="5" r="2"/></g>',
        '<ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>',
        "</svg>",
      ].join(""),
      "utf8",
    );
    assert.equal(
      run(executor, `read "${inputPath}"`),
      [
        "warning: assigned id rect1 to unnamed <rect>",
        `read ${inputPath} (7 elements)`,
      ].join("\n"),
    );
    assert.equal(session.document.width, 400);
    assert.deepEqual(session.document.allShapes().map((shape) => shape.id), [
      "rect1",
      "t1",
      "c1",
      "g1",
      "r2",
      "c2",
      "e1",
    ]);
  });
});

test("two-node flowchart case constructs nested nodes and saves eight SVG elements", () => {
  withTempDirectory((directory) => {
    const session = new DocumentSession();
    const executor = new DocumentCommandExecutor(session, new SvgFileAdapter());
    run(executor, "init 800 600");
    run(executor, "create g flowchart");
    run(executor, "create g node1 in flowchart");
    run(executor, "create rect start 120 100 160 60 #4a90d9 in node1");
    run(executor, 'create text start-label 155 135 "开始" in node1');
    run(executor, "create g node2 in flowchart");
    run(executor, "create rect process 520 100 160 60 #f5a623 in node2");
    run(executor, 'create text process-label 545 135 "处理数据" in node2');
    run(executor, "create line arrow1 280 130 520 130 black in flowchart");

    assert.equal(run(executor, "move node2 0 100"), "g#node2 moved by (0,100)");
    assert.equal(run(executor, "undo"), "g#node2 moved back by (0,-100)");
    assert.equal(run(executor, 'set process-label text "处理数据 v2"'), 'text#process-label updated: text="处理数据 v2"');
    assert.match(run(executor, "tree"), /└── line#arrow1 \(280,130\) -> \(520,130\) stroke=black/);
    assert.equal(
      run(executor, `save "${join(directory, "flowchart.svg")}"`),
      `saved to ${join(directory, "flowchart.svg")} (8 elements)`,
    );
  });
});
