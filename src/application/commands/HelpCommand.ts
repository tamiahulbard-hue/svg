import type { Command } from "../Command.js";

export class HelpCommand implements Command {
  readonly historyEffect = "skip" as const;

  execute(): string {
    return [
      "Document:",
      "  init [w] [h]                          create a document (default 800x600)",
      "  read <file.svg>                       read an SVG document",
      "  save [file.svg]                       save the current document",
      "  canvas [w] [h]                        show or change canvas size",
      "Editing:",
      "  create rect <id> <x> <y> <w> <h> [fill] [in <gid>]",
      "  create circle <id> <cx> <cy> <r> [fill] [in <gid>]",
      "  create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <gid>]",
      "  create line <id> <x1> <y1> <x2> <y2> [stroke] [in <gid>]",
      '  create text <id> <x> <y> "content" [in <gid>]',
      "  create g <id> [in <gid>]",
      "  delete <id>                           delete a shape and its descendants",
      "  move <id> <dx> <dy>                   move a shape or group",
      "  scale <id> <factor>                   scale a shape or group",
      "  set <id> <attr> <value>               set a supported attribute",
      "  group <newGid> <id1> <id2>...         group existing shapes",
      "  ungroup <gid>                         promote children to the parent",
      "  addto <gid> <id>                      move a shape into a group",
      "  front <id> | back <id>                change sibling order",
      "Display and history:",
      "  tree [id]                             display the document or a subtree",
      "  show <id>                             display shape attributes",
      "  undo | redo                           undo or redo an edit",
      "  help                                  display this help",
      "  exit | quit                           leave the editor",
      "Built-in types: rect, circle, ellipse, line, text, g (box is not included in this phase)",
    ].join("\n");
  }

  undo(): string {
    throw new Error("help display cannot be undone");
  }
}
