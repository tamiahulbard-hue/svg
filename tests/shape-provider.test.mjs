import assert from "node:assert/strict";
import test from "node:test";

import { Shape } from "../dist/domain/Shape.js";
import { DomainError } from "../dist/domain/DomainError.js";
import { ShapeProviderRegistry } from "../dist/domain/ShapeProviderRegistry.js";
import { SvgXmlCodec } from "../dist/infrastructure/SvgXmlCodec.js";
import { BuiltinShapeProvider } from "../dist/plugins/BuiltinShapeProvider.js";
import { createDefaultShapeProviderRegistry } from "../dist/plugins/defaultShapeProviders.js";

class DiamondShape extends Shape {
  constructor(id) {
    super(id, "diamond");
  }

  get geometryAttributes() {
    return {};
  }

  get treeSummary() {
    return this.identity;
  }

  moveSelf() {}
  scaleSelf() {}

  setGeometryAttribute(attribute) {
    throw new DomainError(`unknown attribute: ${attribute}`);
  }
}

class DiamondProvider {
  kind = "diamond";
  acceptsChildren = false;

  create(id, parameters) {
    assert.equal(parameters.length, 0);
    return new DiamondShape(id);
  }

  matchesSvg(element) {
    return element.name === "diamond";
  }

  readSvg(id) {
    return new DiamondShape(id);
  }

  writeSvg() {
    return { name: "diamond", attributes: {} };
  }
}

test("the default provider assembly registers all six Phase 1 shapes", () => {
  const registry = createDefaultShapeProviderRegistry();

  assert.deepEqual(registry.kinds, ["rect", "circle", "ellipse", "line", "text", "g"]);
  assert.equal(registry.create("rect", "r", ["1", "2", "3", "4"]).kind, "rect");
  assert.throws(
    () => registry.create("missing", "x", []),
    /unknown shape type: missing \(is the plugin loaded\?\)/,
  );
});

test("provider names are unique and duplicate registration is rejected", () => {
  const registry = createDefaultShapeProviderRegistry();

  assert.throws(
    () => registry.register(new BuiltinShapeProvider("rect")),
    /duplicate shape provider: rect/,
  );
});

test("a separately registered shape provider participates in SVG read and write", () => {
  const registry = createDefaultShapeProviderRegistry();
  registry.register(new DiamondProvider());
  const codec = new SvgXmlCodec(registry);

  const parsed = codec.parse('<svg xmlns="http://www.w3.org/2000/svg"><diamond id="d1"/></svg>');
  assert.equal(parsed.document.requireShape("d1").kind, "diamond");
  assert.match(codec.serialize(parsed.document), /<diamond id="d1"\/>/);
});

test("an explicit data-kind provider takes precedence and falls back when absent", () => {
  const registry = createDefaultShapeProviderRegistry();
  const boxProvider = {
    kind: "box",
    acceptsChildren: true,
    create() {
      throw new Error("not used");
    },
    matchesSvg(element) {
      return element.name === "g" && element.attributes["data-kind"] === "box";
    },
    readSvg() {
      throw new Error("not used");
    },
    writeSvg() {
      throw new Error("not used");
    },
  };
  const element = {
    name: "g",
    attributes: { "data-kind": "box" },
    text: "",
    children: [],
  };
  registry.register(boxProvider);

  assert.equal(registry.providerForSvg(element), boxProvider);
  assert.equal(
    createDefaultShapeProviderRegistry().providerForSvg(element).kind,
    "g",
  );
});
