import { readdirSync } from "node:fs";
import type {
  DirectoryAccess,
  DirectoryEntry,
  DirectoryReadResult,
} from "../application/DirectoryAccess.js";

export class NodeDirectoryAdapter implements DirectoryAccess {
  constructor(private readonly cwd: () => string = () => process.cwd()) {}

  currentWorkingDirectory(): string {
    return this.cwd();
  }

  readDirectory(path: string): DirectoryReadResult {
    try {
      const entries: DirectoryEntry[] = readdirSync(path, { withFileTypes: true }).map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? "directory" : entry.isFile() ? "file" : "other",
      }));
      return { success: true, entries };
    } catch (error) {
      if (error instanceof Error && "code" in error) {
        return { success: false };
      }
      throw error;
    }
  }
}
