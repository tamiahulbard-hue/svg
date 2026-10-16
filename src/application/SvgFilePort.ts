import type { SvgDocument } from "../domain/SvgDocument.js";

export type LoadedSvgDocument = {
  document: SvgDocument;
  warnings: readonly string[];
  elementCount: number;
};

export interface SvgFilePort {
  read(path: string): LoadedSvgDocument;
  write(path: string, document: SvgDocument): number;
}
