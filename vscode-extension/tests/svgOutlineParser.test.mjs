import assert from "node:assert/strict";
import test from "node:test";
import { parseSvgOutline } from "../out/svgOutlineParser.js";

test("parses nested elements, ids, and elements without ids with source ranges", () => {
  const source = [
    "<svg>",
    '  <g id="flow">',
    '    <rect id="start"/>',
    "    <text>Begin</text>",
    "  </g>",
    "</svg>",
  ].join("\n");
  const [svg] = parseSvgOutline(source);

  assert.ok(svg);
  assert.equal(svg.name, "svg");
  assert.equal(svg.children[0]?.name, "g");
  assert.equal(svg.children[0]?.id, "flow");
  assert.deepEqual(
    svg.children[0]?.children.map(({ name, id }) => [name, id]),
    [["rect", "start"], ["text", undefined]],
  );
  assert.equal(source.slice(svg.children[0]?.children[0]?.startOffset, svg.children[0]?.children[0]?.endOffset), '<rect id="start"/>');
});

test("ignores markup-like text in comments and handles entity-escaped text", () => {
  const nodes = parseSvgOutline(
    "<svg><!-- <rect id='fake'/> --><text>&lt;rect&gt;</text></svg>",
  );

  assert.deepEqual(nodes[0]?.children.map(({ name }) => name), ["text"]);
});

test("returns no symbols for incomplete or malformed XML", () => {
  assert.deepEqual(parseSvgOutline("<svg><g><rect></svg>"), []);
  assert.deepEqual(parseSvgOutline("<svg><rect"), []);
});

test("each parse reflects the latest edited document text", () => {
  const before = parseSvgOutline("<svg><rect id='before'/></svg>");
  const after = parseSvgOutline("<svg><circle id='after'/></svg>");

  assert.equal(before[0]?.children[0]?.name, "rect");
  assert.equal(after[0]?.children[0]?.name, "circle");
  assert.equal(after[0]?.children[0]?.id, "after");
});
