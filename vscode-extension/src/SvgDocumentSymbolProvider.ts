import * as vscode from "vscode";
import { parseSvgOutline, type SvgOutlineNode } from "./svgOutlineParser.js";

export class SvgDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    return parseSvgOutline(document.getText()).map((node) => this.toSymbol(node, document));
  }

  private toSymbol(node: SvgOutlineNode, document: vscode.TextDocument): vscode.DocumentSymbol {
    const label = node.id === undefined ? node.name : `${node.name}#${node.id}`;
    const start = document.positionAt(node.startOffset);
    const nameStart = document.positionAt(node.startOffset + 1);
    const nameEnd = document.positionAt(node.startOffset + 1 + node.name.length);
    const end = document.positionAt(node.endOffset);
    const kind = node.name === "svg"
      ? vscode.SymbolKind.Module
      : node.name === "g"
        ? vscode.SymbolKind.Namespace
        : vscode.SymbolKind.Field;
    const symbol = new vscode.DocumentSymbol(
      label,
      node.name,
      kind,
      new vscode.Range(start, end),
      new vscode.Range(nameStart, nameEnd),
    );
    symbol.children = node.children.map((child) => this.toSymbol(child, document));
    return symbol;
  }
}
