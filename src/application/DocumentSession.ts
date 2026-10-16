import { DomainError } from "../domain/DomainError.js";
import { SvgDocument } from "../domain/SvgDocument.js";

export class DocumentSession {
  private currentDocument: SvgDocument | undefined;
  private currentPath: string | undefined;

  get document(): SvgDocument {
    if (this.currentDocument === undefined) {
      throw new DomainError("no document. use 'init' or 'read' first");
    }
    return this.currentDocument;
  }

  get path(): string | undefined {
    return this.currentPath;
  }

  initialize(width = 800, height = 600): SvgDocument {
    const document = new SvgDocument(width, height);
    this.currentDocument = document;
    this.currentPath = undefined;
    return document;
  }

  load(document: SvgDocument, path: string): void {
    this.currentDocument = document;
    this.currentPath = path;
  }

  markSaved(path: string): void {
    this.currentPath = path;
  }

  resizeCanvas(width: number, height: number): SvgDocument {
    const document = this.document;
    document.setCanvasSize(width, height);
    return document;
  }
}
