import * as vscode from "vscode";
import { isSvgFile } from "./svgFilePredicate.js";

export class SvgFileDecorationProvider implements vscode.FileDecorationProvider, vscode.Disposable {
  private readonly changedEmitter = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  private readonly output = vscode.window.createOutputChannel("SVG Explorer Badge");

  readonly onDidChangeFileDecorations = this.changedEmitter.event;

  async provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration | undefined> {
    if (!/\.svg$/i.test(uri.path)) {
      return undefined;
    }

    try {
      const stat = await vscode.workspace.fs.stat(uri);
      if (!isSvgFile(uri.path, (stat.type & vscode.FileType.File) !== 0)) {
        return undefined;
      }
      return new vscode.FileDecoration("[]", "SVG file");
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.output.appendLine(`Unable to inspect ${uri.toString()}: ${reason}`);
      return undefined;
    }
  }

  notifyFilesChanged(): void {
    this.changedEmitter.fire(undefined);
  }

  dispose(): void {
    this.changedEmitter.dispose();
    this.output.dispose();
  }
}
