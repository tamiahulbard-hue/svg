# SVG Explorer Badge

This VS Code extension adds the `[]` Explorer decoration to regular files whose
name ends in `.svg` (case-insensitive). It also contributes nested SVG elements
to VS Code's native Outline view. It does not rename or modify files.
Directories and other file types are not decorated.

## Run from source

1. In a terminal, run `npm install --prefix vscode-extension`.
2. Open the `vscode-extension` folder in VS Code.
3. Open the Run and Debug view, select **Run Extension**, and press F5.
4. In the Extension Development Host, open a folder containing an SVG file.
5. Confirm that regular `.svg` files display `[]`, while a `.txt` file and
   directories do not.
6. Open an SVG text file and inspect the native Outline view. Select an element
   to navigate to its source, then edit the SVG and confirm the outline updates.
   Temporarily incomplete XML may show an empty outline until it is valid again.

The extension logs file inspection failures to the **SVG Explorer Badge**
output channel and leaves the resource undecorated.

## Tests

Run `npm test --prefix vscode-extension`. The tests cover file decoration
classification and the outline parser's nesting, source ranges, missing ids,
updates, comments, and malformed XML.
