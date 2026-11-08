import assert from "node:assert/strict";
import test from "node:test";
import { isSvgFile } from "../out/svgFilePredicate.js";

test("SVG files are recognized without changing their path", () => {
  assert.equal(isSvgFile("/workspace/example.svg", true), true);
  assert.equal(isSvgFile("/workspace/example.SVG", true), true);
});

test("directories and non-SVG files are not decorated", () => {
  assert.equal(isSvgFile("/workspace/example.svg", false), false);
  assert.equal(isSvgFile("/workspace/example.txt", true), false);
  assert.equal(isSvgFile("/workspace/folder", false), false);
});
