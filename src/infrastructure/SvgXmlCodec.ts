import { SaxesParser } from "saxes";
import { DomainError } from "../domain/DomainError.js";
import { GroupShape } from "../domain/GroupShape.js";
import { ShapeFactory } from "../domain/ShapeFactory.js";
import type { Shape, ShapeKind } from "../domain/Shape.js";
import { SvgDocument } from "../domain/SvgDocument.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

type SvgNode = {
  name: string;
  namespace: string;
  attributes: Record<string, string>;
  children: SvgNode[];
  text: string;
};

type ParsedDocument = {
  document: SvgDocument;
  warnings: string[];
  elementCount: number;
};

export class SvgXmlCodec {
  parse(source: string): ParsedDocument {
    const root = this.parseXml(source);
    if (root.name !== "svg" || (root.namespace !== "" && root.namespace !== SVG_NAMESPACE)) {
      throw new DomainError("document root must be an SVG element");
    }

    const dimensions = this.canvasDimensions(root);
    const document = new SvgDocument(dimensions.width, dimensions.height);
    const reservedIds = this.collectDeclaredIds(root);
    const warnings: string[] = [];
    const counters = new Map<string, number>();

    for (const child of root.children) {
      document.addShape(this.createShape(child, reservedIds, counters, warnings));
    }

    return {
      document,
      warnings,
      elementCount: document.allShapes().length,
    };
  }

  serialize(document: SvgDocument): string {
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="${SVG_NAMESPACE}" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}">`,
    ];

    for (const child of document.children) {
      this.serializeShape(child, 1, lines);
    }
    lines.push("</svg>");
    return `${lines.join("\n")}\n`;
  }

  private parseXml(source: string): SvgNode {
    const stack: SvgNode[] = [];
    let root: SvgNode | undefined;
    let parseError: Error | undefined;
    const parser = new SaxesParser({ xmlns: true });

    parser.on("doctype", () => {
      parseError ??= new DomainError("DOCTYPE declarations are not supported");
    });
    parser.on("error", (error) => {
      parseError ??= error;
    });
    parser.on("opentag", (tag) => {
      const attributes: Record<string, string> = {};
      for (const [name, value] of Object.entries(tag.attributes)) {
        attributes[name] = value.value;
      }
      const node: SvgNode = {
        name: tag.local,
        namespace: tag.uri,
        attributes,
        children: [],
        text: "",
      };
      const parent = stack[stack.length - 1];
      if (parent === undefined) {
        if (root !== undefined) {
          parseError ??= new DomainError("SVG file has multiple root elements");
        } else {
          root = node;
        }
      } else {
        parent.children.push(node);
      }
      stack.push(node);
    });
    parser.on("text", (text) => {
      const node = stack[stack.length - 1];
      if (node !== undefined) {
        node.text += text;
      }
    });
    parser.on("cdata", (text) => {
      const node = stack[stack.length - 1];
      if (node !== undefined) {
        node.text += text;
      }
    });
    parser.on("closetag", () => {
      stack.pop();
    });
    parser.write(source).close();

    if (parseError !== undefined) {
      throw new DomainError(`invalid SVG XML: ${parseError.message}`);
    }
    if (root === undefined || stack.length !== 0) {
      throw new DomainError("invalid SVG XML: missing root element");
    }
    return root;
  }

  private canvasDimensions(root: SvgNode): { width: number; height: number } {
    const viewBox = root.attributes.viewBox?.trim().split(/[\s,]+/).map(Number);
    const fallbackWidth = viewBox?.length === 4 ? viewBox[2] : 800;
    const fallbackHeight = viewBox?.length === 4 ? viewBox[3] : 600;
    const width = this.dimension(root.attributes.width, fallbackWidth, "width");
    const height = this.dimension(root.attributes.height, fallbackHeight, "height");
    return { width, height };
  }

  private dimension(value: string | undefined, fallback: number, name: string): number {
    if (value === undefined) {
      return fallback;
    }
    const match = /^([+]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(?:px)?$/i.exec(value.trim());
    if (match?.[1] === undefined) {
      throw new DomainError(`invalid SVG canvas ${name}: ${value}`);
    }
    const parsed = Number(match[1]);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new DomainError(`invalid SVG canvas ${name}: ${value}`);
    }
    return parsed;
  }

  private collectDeclaredIds(root: SvgNode): Set<string> {
    const ids = new Set<string>();
    const visit = (node: SvgNode): void => {
      const id = node.attributes.id;
      if (id !== undefined) {
        if (id.length === 0) {
          throw new DomainError("SVG element id cannot be empty");
        }
        if (ids.has(id)) {
          throw new DomainError(`id already exists: ${id}`);
        }
        ids.add(id);
      }
      for (const child of node.children) {
        visit(child);
      }
    };
    for (const child of root.children) {
      visit(child);
    }
    return ids;
  }

  private createShape(
    node: SvgNode,
    reservedIds: Set<string>,
    counters: Map<string, number>,
    warnings: string[],
  ): Shape {
    if (node.namespace !== "" && node.namespace !== SVG_NAMESPACE) {
      throw new DomainError(`unsupported SVG namespace on <${node.name}>`);
    }
    if (!["rect", "circle", "ellipse", "line", "text", "g"].includes(node.name)) {
      throw new DomainError(`unsupported SVG element: <${node.name}>`);
    }
    if (node.text.trim().length > 0 && node.name !== "text") {
      throw new DomainError(`unexpected text content in <${node.name}>`);
    }
    if (node.name === "text" && node.children.length > 0) {
      throw new DomainError("nested elements in <text> are not supported");
    }

    const id = node.attributes.id ?? this.assignId(node.name, reservedIds, counters, warnings);
    const shape = this.createElement(node, id);
    if (shape instanceof GroupShape && node.attributes.transform !== undefined) {
      shape.setTransform(node.attributes.transform);
    }
    if (node.attributes.fill !== undefined) {
      shape.setAttribute("fill", node.attributes.fill);
    }
    if (node.attributes.stroke !== undefined) {
      shape.setAttribute("stroke", node.attributes.stroke);
    }
    const strokeWidth = node.attributes["stroke-width"];
    if (strokeWidth !== undefined) {
      shape.setAttribute("stroke-width", this.number(strokeWidth, "stroke-width"));
    }

    if (shape instanceof GroupShape) {
      for (const child of node.children) {
        shape.addChild(this.createShape(child, reservedIds, counters, warnings));
      }
    }
    return shape;
  }

  private createElement(node: SvgNode, id: string): Shape {
    const attributes = node.attributes;
    const parameters: Record<ShapeKind, string[]> = {
      rect: [
        this.attribute(attributes, "x", "0"),
        this.attribute(attributes, "y", "0"),
        this.attribute(attributes, "width", "0"),
        this.attribute(attributes, "height", "0"),
      ],
      circle: [
        this.attribute(attributes, "cx", "0"),
        this.attribute(attributes, "cy", "0"),
        this.attribute(attributes, "r", "0"),
      ],
      ellipse: [
        this.attribute(attributes, "cx", "0"),
        this.attribute(attributes, "cy", "0"),
        this.attribute(attributes, "rx", "0"),
        this.attribute(attributes, "ry", "0"),
      ],
      line: [
        this.attribute(attributes, "x1", "0"),
        this.attribute(attributes, "y1", "0"),
        this.attribute(attributes, "x2", "0"),
        this.attribute(attributes, "y2", "0"),
      ],
      text: [
        this.attribute(attributes, "x", "0"),
        this.attribute(attributes, "y", "0"),
        node.text,
      ],
      g: [],
    };
    return ShapeFactory.create(node.name, id, parameters[node.name as ShapeKind]);
  }

  private assignId(
    tag: string,
    reservedIds: Set<string>,
    counters: Map<string, number>,
    warnings: string[],
  ): string {
    let sequence = (counters.get(tag) ?? 0) + 1;
    let id = `${tag}${sequence}`;
    while (reservedIds.has(id)) {
      sequence += 1;
      id = `${tag}${sequence}`;
    }
    counters.set(tag, sequence);
    reservedIds.add(id);
    warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`);
    return id;
  }

  private attribute(attributes: Record<string, string>, name: string, fallback: string): string {
    return attributes[name] ?? fallback;
  }

  private number(value: string, name: string): number {
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
      throw new DomainError(`invalid SVG ${name}: ${value}`);
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new DomainError(`invalid SVG ${name}: ${value}`);
    }
    return parsed;
  }

  private serializeShape(shape: Shape, depth: number, lines: string[]): void {
    const indentation = "  ".repeat(depth);
    const attributes = [`id="${this.escapeAttribute(shape.id)}"`];
    for (const [name, value] of Object.entries(shape.attributes)) {
      if (name === "text") {
        continue;
      }
      attributes.push(`${name}="${this.escapeAttribute(String(value))}"`);
    }
    const start = `${indentation}<${shape.kind} ${attributes.join(" ")}`;

    if (shape instanceof GroupShape) {
      if (shape.children.length === 0) {
        lines.push(`${start}/>`);
        return;
      }
      lines.push(`${start}>`);
      for (const child of shape.children) {
        this.serializeShape(child, depth + 1, lines);
      }
      lines.push(`${indentation}</g>`);
      return;
    }

    if (shape.kind === "text") {
      lines.push(`${start}>${this.escapeText(shape.attributes.text as string)}</text>`);
    } else {
      lines.push(`${start}/>`);
    }
  }

  private escapeAttribute(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  }

  private escapeText(value: string): string {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }
}
