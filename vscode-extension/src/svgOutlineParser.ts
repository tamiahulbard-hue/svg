import { SaxesParser } from "saxes";

export interface SvgOutlineNode {
  name: string;
  id: string | undefined;
  startOffset: number;
  endOffset: number;
  children: SvgOutlineNode[];
}

export function parseSvgOutline(source: string): SvgOutlineNode[] {
  const roots: SvgOutlineNode[] = [];
  const stack: SvgOutlineNode[] = [];
  const parser = new SaxesParser();
  let pendingStartOffset: number | undefined;
  let valid = true;

  parser.on("error", () => {
    valid = false;
  });
  parser.on("opentagstart", () => {
    pendingStartOffset = source.lastIndexOf("<", parser.position - 1);
    if (pendingStartOffset < 0) {
      valid = false;
    }
  });
  parser.on("opentag", (tag) => {
    if (pendingStartOffset === undefined || pendingStartOffset < 0) {
      valid = false;
      return;
    }

    const rawId = tag.attributes.id;
    const node: SvgOutlineNode = {
      name: tag.name,
      id: typeof rawId === "string" && rawId.length > 0 ? rawId : undefined,
      startOffset: pendingStartOffset,
      endOffset: source.length,
      children: [],
    };
    const parent = stack.at(-1);
    if (parent === undefined) {
      roots.push(node);
    } else {
      parent.children.push(node);
    }
    stack.push(node);
    pendingStartOffset = undefined;
  });
  parser.on("closetag", () => {
    const node = stack.pop();
    if (node === undefined) {
      valid = false;
      return;
    }
    node.endOffset = parser.position;
  });
  parser.on("end", () => {
    if (stack.length > 0) {
      valid = false;
    }
  });

  parser.write(source).close();
  return valid ? roots : [];
}
