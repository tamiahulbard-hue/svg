import { DomainError } from "../domain/DomainError.js";
import { SvgDocument } from "../domain/SvgDocument.js";

export type DocumentSessionEvent =
  | { readonly type: "initialized"; readonly document: SvgDocument }
  | { readonly type: "loaded"; readonly document: SvgDocument }
  | { readonly type: "saved"; readonly document: SvgDocument };

export class DocumentSession {
  private currentDocument: SvgDocument | undefined;
  private currentPath: string | undefined;
  private readonly listeners = new Set<(event: DocumentSessionEvent) => void>();

  get document(): SvgDocument {
    if (this.currentDocument === undefined) {
      throw new DomainError("no document. use 'init' or 'read' first");
    }
    return this.currentDocument;
  }

  get path(): string | undefined {
    return this.currentPath;
  }

  subscribe(listener: (event: DocumentSessionEvent) => void): () => void {
    this.listeners.add(listener);
    if (this.currentDocument !== undefined) {
      try {
        listener({
          type: this.currentPath === undefined ? "initialized" : "loaded",
          document: this.currentDocument,
        });
      } catch (error) {
        this.listeners.delete(listener);
        throw error;
      }
    }
    return () => this.listeners.delete(listener);
  }

  initialize(width = 800, height = 600): SvgDocument {
    const document = new SvgDocument(width, height);
    this.currentDocument = document;
    this.currentPath = undefined;
    this.publish({ type: "initialized", document });
    return document;
  }

  load(document: SvgDocument, path: string): void {
    this.currentDocument = document;
    this.currentPath = path;
    this.publish({ type: "loaded", document });
  }

  markSaved(path: string): void {
    this.currentPath = path;
    this.publish({ type: "saved", document: this.document });
  }

  resizeCanvas(width: number, height: number): SvgDocument {
    const document = this.document;
    document.setCanvasSize(width, height);
    return document;
  }

  private publish(event: DocumentSessionEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
