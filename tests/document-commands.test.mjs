import assert from "node:assert/strict";
import test from "node:test";

import { DocumentCommandExecutor } from "../dist/application/DocumentCommandExecutor.js";
import { DocumentSession } from "../dist/application/DocumentSession.js";

test("init and canvas commands manage the current document", () => {
  const executor = new DocumentCommandExecutor();

  assert.equal(executor.execute("canvas"), "error: no document. use 'init' or 'read' first");
  assert.equal(executor.execute("init"), "canvas 800x600 created");
  assert.equal(executor.execute("canvas"), "canvas 800x600");
  assert.equal(executor.execute("canvas 400 240"), "canvas resized to 400x240");
  assert.equal(executor.execute("canvas 320"), "canvas resized to 320x240");
  assert.equal(executor.execute("init 640 480"), "canvas 640x480 created");
  assert.equal(executor.execute("canvas"), "canvas 640x480");
});

test("invalid document commands return errors and preserve document state", () => {
  const executor = new DocumentCommandExecutor();
  const session = new DocumentSession();
  const commands = new DocumentCommandExecutor(session);

  assert.equal(commands.execute("init 500 300"), "canvas 500x300 created");
  assert.match(commands.execute("init 0 300"), /^error: canvas width must be a positive finite number$/);
  assert.match(commands.execute("canvas NaN 400"), /^error: width must be a finite number$/);
  assert.match(commands.execute("canvas 10 20 30"), /^error: usage: canvas \[width\] \[height\]$/);
  assert.deepEqual([session.document.width, session.document.height], [500, 300]);
  assert.match(commands.execute("create"), /^error: unknown command: create$/);
});
