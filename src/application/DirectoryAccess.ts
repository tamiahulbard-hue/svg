export interface DirectoryEntry {
  readonly name: string;
  readonly type: "directory" | "file" | "other";
}

export type DirectoryReadResult =
  | { readonly success: true; readonly entries: readonly DirectoryEntry[] }
  | { readonly success: false };

export interface DirectoryAccess {
  currentWorkingDirectory(): string;
  readDirectory(path: string): DirectoryReadResult;
}
