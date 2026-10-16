import assert from "node:assert/strict";
import test from "node:test";

import { CircleShape } from "../dist/domain/CircleShape.js";
import { DomainError } from "../dist/domain/DomainError.js";
import { EllipseShape } from "../dist/domain/EllipseShape.js";
import { GroupShape } from "../dist/domain/GroupShape.js";
import { LineShape } from "../dist/domain/LineShape.js";
import { RectShape } from "../dist/domain/RectShape.js";
import { SvgDocument } from "../dist/domain/SvgDocument.js";
import { TextShape } from "../dist/domain/TextShape.js";

test("shape implementations expose their geometry and supported attributes", () => {
  const rect = new RectShape("r", 1, 2, 3, 4, { fill: "#fff" });
  rect.setAttribute("width", 12);
  rect.setAttribute("stroke-width", 2);
  assert.deepEqual(rect.attributes, {
    x: 1,
    y: 2,
    width: 12,
    height: 4,
    fill: "#fff",
    "stroke-width": 2,
  });

  const circle = new CircleShape("c", 10, 20, 5);
  circle.move(2, -3);
  assert.deepEqual(circle.geometryAttributes, { cx: 12, cy: 17, r: 5 });

  const ellipse = new EllipseShape("e", 2, 3, 4, 5);
  ellipse.scale(2);
  assert.deepEqual(ellipse.geometryAttributes, { cx: 4, cy: 6, rx: 8, ry: 10 });

  const line = new LineShape("l", 1, 2, 3, 4);
  line.move(-1, 1);
  assert.deepEqual(line.geometryAttributes, { x1: 0, y1: 3, x2: 2, y2: 5 });

  const text = new TextShape("t", 5, 6, "label");
  text.setAttribute("text", "new label");
  text.scale(2);
  assert.deepEqual(text.attributes, { x: 10, y: 12, text: "new label" });

  assert.throws(() => rect.setAttribute("rx", 2), /unknown attribute: rx/);
  assert.throws(() => circle.setAttribute("r", -1), /r must not be negative/);
  assert.throws(() => line.scale(0), /scale factor must be positive/);
});

test("groups apply move, scale, and common attributes recursively", () => {
  const outer = new GroupShape("outer");
  const inner = new GroupShape("inner");
  const rect = new RectShape("rect", 10, 20, 30, 40);
  const text = new TextShape("text", 12, 24, "hello");
  inner.addChild(rect);
  inner.addChild(text);
  outer.addChild(inner);

  outer.move(5, -2);
  outer.scale(2);
  outer.setAttribute("fill", "blue");

  assert.deepEqual(rect.geometryAttributes, { x: 30, y: 36, width: 60, height: 80 });
  assert.deepEqual(text.geometryAttributes, { x: 34, y: 44 });
  assert.equal(outer.fill, "blue");
  assert.equal(rect.fill, undefined);
  assert.deepEqual(outer.children, [inner]);
});

test("group child ordering uses final indices and rejects invalid moves without mutation", () => {
  const group = new GroupShape("group");
  const shapes = ["a", "b", "c"].map((id) => new RectShape(id, 0, 0, 1, 1));
  for (const shape of shapes) {
    group.addChild(shape);
  }

  group.addChild(shapes[0], 2);
  assert.deepEqual(group.children.map((shape) => shape.id), ["b", "c", "a"]);
  assert.throws(() => group.addChild(shapes[0], 3), /child index out of range/);
  assert.deepEqual(group.children.map((shape) => shape.id), ["b", "c", "a"]);
});

test("document enforces case-sensitive unique ids and supports lookup", () => {
  const document = new SvgDocument();
  const container = new GroupShape("Group");
  document.addShape(container);
  document.addShape(new RectShape("shape", 0, 0, 10, 10), "Group");

  assert.equal(document.requireShape("shape").parent, container);
  assert.equal(document.findShape("Shape"), undefined);
  assert.throws(() => document.addShape(new CircleShape("shape", 0, 0, 1)), /id already exists: shape/);
  assert.throws(() => document.addShape(new CircleShape("other", 0, 0, 1), "shape"), /not a container: shape/);
  assert.deepEqual(document.allShapes().map((shape) => shape.id), ["Group", "shape"]);
});

test("document reparents shapes while preserving order and rejects cycles atomically", () => {
  const document = new SvgDocument();
  const first = new GroupShape("first");
  const second = new GroupShape("second");
  const a = new RectShape("a", 0, 0, 1, 1);
  const b = new RectShape("b", 0, 0, 1, 1);
  document.addShape(first);
  document.addShape(second);
  document.addShape(a, "first");
  document.addShape(b, "first");

  document.reparentShape("a", "second");
  assert.deepEqual(first.children.map((shape) => shape.id), ["b"]);
  assert.deepEqual(second.children.map((shape) => shape.id), ["a"]);

  document.reparentShape("second", "first");
  assert.throws(
    () => document.reparentShape("first", "second"),
    /cannot move container first into its own descendant/,
  );
  assert.deepEqual(document.children.map((shape) => shape.id), ["first"]);
  assert.deepEqual(first.children.map((shape) => shape.id), ["b", "second"]);
  assert.deepEqual(second.children.map((shape) => shape.id), ["a"]);
});

test("removing and re-adding a subtree preserves its internal hierarchy", () => {
  const document = new SvgDocument();
  const group = new GroupShape("group");
  group.addChild(new CircleShape("circle", 1, 2, 3));
  document.addShape(group);

  const removed = document.removeShape("group");
  assert.equal(document.findShape("circle"), undefined);
  document.addShape(removed);
  assert.equal(document.requireShape("circle").parent, group);
  assert.deepEqual(document.allShapes().map((shape) => shape.id), ["group", "circle"]);
});

test("invalid canvas size and shape values do not change document state", () => {
  const document = new SvgDocument(400, 200);
  assert.throws(() => document.setCanvasSize(0, 300), DomainError);
  assert.deepEqual([document.width, document.height], [400, 200]);
  assert.throws(() => new RectShape("invalid", 0, 0, -1, 10), /width must not be negative/);
  assert.throws(() => new TextShape("", 0, 0, "empty id"), /shape id cannot be empty/);
});
