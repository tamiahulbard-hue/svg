import * as vscode from "vscode";
import { SvgFileDecorationProvider } from "./SvgFileDecorationProvider.js";
import { SvgDocumentSymbolProvider } from "./SvgDocumentSymbolProvider.js";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new SvgFileDecorationProvider();
  context.subscriptions.push(
    provider,
    vscode.window.registerFileDecorationProvider(provider),
    vscode.languages.registerDocumentSymbolProvider(
      { scheme: "file", pattern: "**/*.svg" },
      new SvgDocumentSymbolProvider(),
    ),
    vscode.workspace.onDidCreateFiles(() => provider.notifyFilesChanged()),
    vscode.workspace.onDidDeleteFiles(() => provider.notifyFilesChanged()),
    vscode.workspace.onDidRenameFiles(() => provider.notifyFilesChanged()),
  );
}

export function deactivate(): void {}
