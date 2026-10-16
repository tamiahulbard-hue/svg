import { DomainError } from "../domain/DomainError.js";
import { SvgDocument } from "../domain/SvgDocument.js";

export class DocumentSession {
  private currentDocument: SvgDocument | undefined;

  get document(): SvgDocument {
    if (this.currentDocument === undefined) {
      throw new DomainError("no document. use 'init' or 'read' first");
    }
    return this.currentDocument;
  }

  initialize(width = 800, height = 600): SvgDocument {
    const document = new SvgDocument(width, height);
    this.currentDocument = document;
    return document;
  }

  resizeCanvas(width: number, height: number): SvgDocument {
    const document = this.document;
    document.setCanvasSize(width, height);
    return document;
  }
}
