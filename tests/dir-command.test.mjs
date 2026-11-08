import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { CommandParser } from "../dist/cli/CommandParser.js";
import { DirCommandPlugin } from "../dist/plugins/dir/DirCommandPlugin.js";
import { NodeDirectoryAdapter } from "../dist/infrastructure/NodeDirectoryAdapter.js";
import { createRuntime } from "./runtime.mjs";

const parser = new CommandParser();
const run = (executor, input) => executor.execute(parser.parse(input));

class FakeDirectoryAccess {
  result = { success: true, entries: [] };
  paths = [];

  currentWorkingDirectory() {
    return "C:\\fixed-workdir";
  }

  readDirectory(path) {
    this.paths.push(path);
    return this.result;
  }
}

test("dir groups directories before files and sorts each group stably", () => {
  const access = new FakeDirectoryAccess();
  access.result = {
    success: true,
    entries: [
      { name: "zeta", type: "directory" },
      { name: "beta.txt", type: "file" },
      { name: ".hidden", type: "file" },
      { name: "alpha", type: "directory" },
      { name: "link", type: "other" },
      { name: "socket", type: "other" },
      { name: ".", type: "directory" },
      { name: "..", type: "directory" },
    ],
  };
  const runtime = createRuntime(undefined, undefined, [new DirCommandPlugin()], [], [], access);

  assert.equal(
    run(runtime.executor, "dir"),
    [
      "[DIR]  alpha",
      "[DIR]  zeta",
      "[FILE] .hidden",
      "[FILE] beta.txt",
      "[FILE] link",
      "[FILE] socket",
    ].join("\n"),
  );
  assert.deepEqual(access.paths, ["C:\\fixed-workdir"]);
  assert.match(run(runtime.executor, "help"), /dir  list the current working directory/);
});

test("dir handles an empty directory, read failure, and argument errors", () => {
  const access = new FakeDirectoryAccess();
  const runtime = createRuntime(undefined, undefined, [new DirCommandPlugin()], [], [], access);
  assert.equal(run(runtime.executor, "dir"), "(empty directory)");
  access.result = {
    success: true,
    entries: [
      { name: ".", type: "directory" },
      { name: "..", type: "directory" },
    ],
  };
  assert.equal(run(runtime.executor, "dir"), "(empty directory)");

  access.result = { success: false };
  assert.equal(
    run(runtime.executor, "dir"),
    "error: cannot read directory: C:\\fixed-workdir",
  );
  assert.match(run(runtime.executor, "help"), /dir  list the current working directory/);
  assert.equal(run(runtime.executor, "dir extra"), "error: usage: dir");
  assert.equal(run(createRuntime().executor, "dir"), "error: unknown command: dir");
});

test("dir works without a document and preserves undo and redo on success or failure", () => {
  const access = new FakeDirectoryAccess();
  const runtime = createRuntime(undefined, undefined, [new DirCommandPlugin()], [], [], access);
  assert.equal(run(runtime.executor, "dir"), "(empty directory)");

  run(runtime.executor, "init");
  run(runtime.executor, "create rect r 0 0 1 1");
  run(runtime.executor, "undo");
  const document = runtime.session.document;
  assert.equal(run(runtime.executor, "dir"), "(empty directory)");
  assert.equal(runtime.session.document, document);
  assert.equal(run(runtime.executor, "redo"), "rect#r created");

  run(runtime.executor, "undo");
  access.result = { success: false };
  assert.equal(run(runtime.executor, "dir"), "error: cannot read directory: C:\\fixed-workdir");
  assert.equal(runtime.session.document, document);
  assert.equal(run(runtime.executor, "redo"), "rect#r created");
});

test("the Node adapter reads a fixed real directory and reports absent paths", () => {
  const directory = mkdtempSync(join(tmpdir(), "svg-dir-plugin-"));
  try {
    mkdirSync(join(directory, "docs"));
    mkdirSync(join(directory, "plugins"));
    writeFileSync(join(directory, "demo.svg"), "<svg/>");
    writeFileSync(join(directory, "package.json"), "{}");
    writeFileSync(join(directory, ".hidden"), "hidden");

    const adapter = new NodeDirectoryAdapter(() => directory);
    const runtime = createRuntime(undefined, undefined, [new DirCommandPlugin()], [], [], adapter);
    assert.equal(
      run(runtime.executor, "dir"),
      [
        "[DIR]  docs",
        "[DIR]  plugins",
        "[FILE] .hidden",
        "[FILE] demo.svg",
        "[FILE] package.json",
      ].join("\n"),
    );
    assert.deepEqual(adapter.readDirectory(join(directory, "missing")), { success: false });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
