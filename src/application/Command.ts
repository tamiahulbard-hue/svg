export interface Command {
  readonly historyEffect: "edit" | "barrier" | "skip";
  execute(): string;
  undo(): string;
}
