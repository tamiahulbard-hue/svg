import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { DocumentCommandExecutor } from "../dist/application/DocumentCommandExecutor.js";
import { DocumentSession } from "../dist/application/DocumentSession.js";
import { CommandParser } from "../dist/cli/CommandParser.js";
import { GroupShape } from "../dist/domain/GroupShape.js";
import { SvgFileAdapter } from "../dist/infrastructure/SvgFileAdapter.js";
import { SvgXmlCodec } from "../dist/infrastructure/SvgXmlCodec.js";

const parser = new CommandParser();
const run = (executor, input) => executor.execute(parser.parse(input));
const withTempDirectory = (action) => {
  const directory = mkdtempSync(join(tmpdir(), "svg-editor-"));
  try {
    action(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
};

test("SVG write/read round trip preserves canvas, styles, text, nesting, and transforms", () => {
  withTempDirectory((directory) => {
    const path = join(directory, "diagram with spaces.svg");
    const session = new DocumentSession();
    const adapter = new SvgFileAdapter();
    const executor = new DocumentCommandExecutor(session, adapter);
    run(executor, "init 400 200");
    run(executor, "create g flow");
    run(executor, "create rect start 10 20 100 50 #abc in flow");
    run(executor, 'create text label 15 40 "A & B < C" in flow');
    run(executor, "set start stroke black");
    run(executor, "set start stroke-width 2");
    assert.match(run(executor, `save "${path}"`), /saved to .*diagram with spaces\.svg \(3 elements\)/);

    const serialized = readFileSync(path, "utf8");
    assert.match(serialized, /A &amp; B &lt; C/);
    assert.match(serialized, /stroke-width="2"/);

    const newSession = new DocumentSession();
    const newExecutor = new DocumentCommandExecutor(newSession, adapter);
    assert.match(run(newExecutor, `read "${path}"`), /^read .*diagram with spaces\.svg \(3 elements\)$/);
    assert.deepEqual(newSession.document.allShapes().map((shape) => shape.id), [
      "flow",
      "start",
      "label",
    ]);
    assert.equal(newSession.document.width, 400);
    assert.equal(newSession.document.height, 200);
    assert.equal(newSession.document.requireShape("label").attributes.text, "A & B < C");
    assert.equal(newSession.document.requireShape("start").attributes["stroke-width"], 2);

    const group = newSession.document.requireShape("flow");
    assert.ok(group instanceof GroupShape);
    group.setTransform("translate(10,20) scale(2)");
    const transformedPath = join(directory, "transformed.svg");
    adapter.write(transformedPath, newSession.document);
    const reread = adapter.read(transformedPath).document;
    assert.equal(reread.requireShape("flow").attributes.transform, "translate(10,20) scale(2)");
  });
});

test("reader assigns unique IDs and reports each missing ID", () => {
  const loaded = new SvgXmlCodec().parse(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
      <rect x="0" y="0" width="10" height="20"/>
      <rect id="rect1" x="1" y="2" width="3" height="4"/>
      <g><circle cx="1" cy="2" r="3"/></g>
    </svg>
  `);

  assert.deepEqual(loaded.warnings, [
    "warning: assigned id rect2 to unnamed <rect>",
    "warning: assigned id g1 to unnamed <g>",
    "warning: assigned id circle1 to unnamed <circle>",
  ]);
  assert.deepEqual(loaded.document.allShapes().map((shape) => shape.id), [
    "rect2",
    "rect1",
    "g1",
    "circle1",
  ]);
});

test("read errors do not replace the current document or unblock history", () => {
  withTempDirectory((directory) => {
    const badPath = join(directory, "invalid.svg");
    writeFileSync(badPath, "<svg><g></svg>", "utf8");
    const session = new DocumentSession();
    const executor = new DocumentCommandExecutor(session, new SvgFileAdapter());
    run(executor, "init");
    run(executor, "create rect original 0 0 1 1");
    const previous = session.document;

    assert.match(run(executor, `read "${badPath}"`), /^error: invalid SVG XML:/);
    assert.equal(session.document, previous);
    assert.equal(run(executor, "undo"), "rect#original creation undone");
  });
});

test("missing files, unsupported XML features, and unwritable paths report errors", () => {
  withTempDirectory((directory) => {
    const adapter = new SvgFileAdapter();
    const session = new DocumentSession();
    const executor = new DocumentCommandExecutor(session, adapter);
    run(executor, "init");

    const missingPath = join(directory, "missing.svg");
    assert.equal(run(executor, `read "${missingPath}"`), `error: cannot read file: ${missingPath}`);
    assert.match(
      run(executor, "read"),
      /error: usage: read/,
    );
    assert.equal(
      run(executor, `save "${directory}"`),
      `error: cannot write file: ${directory}`,
    );

    const doctypePath = join(directory, "doctype.svg");
    writeFileSync(
      doctypePath,
      '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg"><text>&xxe;</text></svg>',
      "utf8",
    );
    assert.match(run(executor, `read "${doctypePath}"`), /DOCTYPE declarations are not supported/);
    assert.equal(run(executor, "undo"), "error: undo not allowed after io command");
  });
});

test("read assigns the default save path and save without a path reuses it", () => {
  withTempDirectory((directory) => {
    const path = join(directory, "in.svg");
    writeFileSync(
      path,
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><circle id="c" cx="1" cy="2" r="3"/></svg>',
      "utf8",
    );
    const session = new DocumentSession();
    const executor = new DocumentCommandExecutor(session, new SvgFileAdapter());
    assert.match(run(executor, `read "${path}"`), /read .*in\.svg \(1 elements\)/);
    assert.match(run(executor, "save"), new RegExp(`saved to .*in\\.svg \\(1 elements\\)`));
    assert.equal(run(executor, "undo"), "error: undo not allowed after io command");
  });
});
