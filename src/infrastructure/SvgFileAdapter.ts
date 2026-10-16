import { readFileSync, writeFileSync } from "node:fs";
import type { LoadedSvgDocument, SvgFilePort } from "../application/SvgFilePort.js";
import { DomainError } from "../domain/DomainError.js";
import type { SvgDocument } from "../domain/SvgDocument.js";
import { SvgXmlCodec } from "./SvgXmlCodec.js";

export class SvgFileAdapter implements SvgFilePort {
  constructor(private readonly codec = new SvgXmlCodec()) {}

  read(path: string): LoadedSvgDocument {
    let source: string;
    try {
      source = readFileSync(path, "utf8");
    } catch (error) {
      if (!this.isFileSystemError(error)) {
        throw error;
      }
      throw new DomainError(`cannot read file: ${path}`);
    }

    return this.codec.parse(source);
  }

  write(path: string, document: SvgDocument): number {
    const source = this.codec.serialize(document);
    try {
      writeFileSync(path, source, { encoding: "utf8" });
    } catch (error) {
      if (!this.isFileSystemError(error)) {
        throw error;
      }
      throw new DomainError(`cannot write file: ${path}`);
    }
    return document.allShapes().length;
  }

  private isFileSystemError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && "code" in error;
  }
}
