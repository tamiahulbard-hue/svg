# SVG Explorer Badge

This VS Code extension adds the `[]` Explorer decoration to regular files whose
name ends in `.svg` (case-insensitive). It does not rename or modify files.
Directories and other file types are not decorated.

## Run from source

1. In a terminal, run `npm install --prefix vscode-extension`.
2. Open the `vscode-extension` folder in VS Code.
3. Open the Run and Debug view, select **Run Extension**, and press F5.
4. In the Extension Development Host, open a folder containing an SVG file.
5. Confirm that regular `.svg` files display `[]`, while a `.txt` file and
   directories do not.

The extension logs file inspection failures to the **SVG Explorer Badge**
output channel and leaves the resource undecorated.

## Tests

Run `npm test --prefix vscode-extension`.
