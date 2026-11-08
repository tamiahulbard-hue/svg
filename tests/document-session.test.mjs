import assert from "node:assert/strict";
import test from "node:test";

import { DocumentSession } from "../dist/application/DocumentSession.js";
import { SvgDocument } from "../dist/domain/SvgDocument.js";

test("document session publishes initialized, loaded, and saved baselines", () => {
  const session = new DocumentSession();
  const events = [];
  const unsubscribe = session.subscribe((event) => events.push(event));
  const initialized = session.initialize(320, 240);
  session.markSaved("saved.svg");
  const loaded = new SvgDocument(640, 480);
  session.load(loaded, "loaded.svg");
  unsubscribe();
  session.initialize();

  assert.deepEqual(
    events.map(({ type, document }) => [type, document.width, document.height]),
    [
      ["initialized", 320, 240],
      ["saved", 320, 240],
      ["loaded", 640, 480],
    ],
  );
  assert.equal(session.document.width, 800);
  assert.equal(initialized.width, 320);
});
