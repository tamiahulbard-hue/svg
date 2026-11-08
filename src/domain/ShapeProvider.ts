import type { Shape } from "./Shape.js";

export interface SvgShapeElement {
  readonly name: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly text: string;
  readonly children: readonly Shape[];
}

export interface SvgShapeEncoding {
  readonly name: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly text?: string;
  readonly children?: readonly Shape[];
}

export interface ShapeProvider {
  readonly kind: string;
  readonly acceptsChildren: boolean;
  create(id: string, parameters: readonly string[]): Shape;
  matchesSvg(element: SvgShapeElement): boolean;
  readSvg(id: string, element: SvgShapeElement): Shape;
  writeSvg(shape: Shape): SvgShapeEncoding;
}
