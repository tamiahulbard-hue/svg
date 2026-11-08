import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const transcriptDirectory = join(root, "doc", "transcript");
const mainPath = join(root, "src", "main.ts");
const configPath = join(root, "plugins.config.json");
const tsxLoader = pathToFileURL(join(root, "node_modules", "tsx", "dist", "loader.mjs")).href;
const sessions = [
  {
    name: "phase1-session",
    fixture: "phase1",
    files: ["other.svg"],
    generatedFiles: [{ name: "demo.svg", expected: "phase1-session-demo.expected.svg" }],
  },
  {
    name: "phase1-box-session",
    fixture: undefined,
    files: [],
    generatedFiles: [{ name: "flowchart-box.svg", expected: "phase1-box-flowchart.expected.svg" }],
  },
  {
    name: "stats-dir-session",
    fixture: "dir",
    fixedDirectory: true,
    files: [],
    generatedFiles: [],
  },
];

function createWorkingDirectory(name, fixture, files, temporaryRoot, suffix) {
  if (fixture !== undefined && name === "stats-dir-session") {
    return join(transcriptDirectory, "fixtures", fixture);
  }
  const directory = join(temporaryRoot, `${name}-${suffix}`);
  mkdirSync(directory, { recursive: true });
  for (const file of files) {
    copyFileSync(
      join(transcriptDirectory, "fixtures", fixture, file),
      join(directory, file),
    );
  }
  return directory;
}

function runSession(name, assembly, cwd, inputPath, config = configPath) {
  const arguments_ = [
    "--import",
    tsxLoader,
    mainPath,
    ...(assembly === "B" ? ["--config", config] : []),
  ];
  const result = spawnSync(process.execPath, arguments_, {
    cwd,
    encoding: "utf8",
    input: readFileSync(inputPath, "utf8"),
  });
  assert.equal(result.status, 0, `${name}/${assembly}: ${result.stderr}`);
  assert.equal(result.stderr, "", `${name}/${assembly}`);
  return result.stdout;
}

function snapshotDirectory(directory) {
  const entries = [];
  const visit = (currentDirectory, prefix) => {
    const children = readdirSync(currentDirectory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const child of children) {
      const path = join(currentDirectory, child.name);
      const relativePath = join(prefix, child.name);
      if (child.isDirectory()) {
        entries.push(`directory:${relativePath}`);
        visit(path, relativePath);
      } else {
        entries.push(`file:${relativePath}:${readFileSync(path).toString("base64")}`);
      }
    }
  };
  visit(directory, "");
  return entries.join("\n");
}

test("A and B produce byte-identical complete CLI transcripts", () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "svg-cli-transcripts-"));
  try {
    for (const session of sessions) {
      const inputPath = join(transcriptDirectory, `${session.name}.txt`);
      const expectedPath = join(transcriptDirectory, `${session.name}.expected.json`);
      const workingDirectory = session.fixedDirectory === true
        ? createWorkingDirectory(session.name, session.fixture, session.files, temporaryRoot, "fixed")
        : createWorkingDirectory(session.name, session.fixture, session.files, temporaryRoot, "shared");
      const before = session.fixedDirectory === true
        ? snapshotDirectory(workingDirectory)
        : undefined;

      const outputA = runSession(session.name, "A", workingDirectory, inputPath);
      for (const file of session.generatedFiles) {
        const generatedPath = join(workingDirectory, file.name);
        const expectedFilePath = join(transcriptDirectory, file.expected);
        if (process.env.UPDATE_TRANSCRIPTS === "1") {
          writeFileSync(expectedFilePath, readFileSync(generatedPath));
        } else {
          assert.deepEqual(
            readFileSync(generatedPath),
            readFileSync(expectedFilePath),
            `${session.name}: saved SVG changed`,
          );
        }
        rmSync(generatedPath, { force: true });
      }
      const outputB = runSession(session.name, "B", workingDirectory, inputPath);
      assert.equal(outputB, outputA, `${session.name}: A/B output differs`);
      for (const file of session.generatedFiles) {
        assert.deepEqual(
          readFileSync(join(workingDirectory, file.name)),
          readFileSync(join(transcriptDirectory, file.expected)),
          `${session.name}: B saved SVG changed`,
        );
        rmSync(join(workingDirectory, file.name), { force: true });
      }
      if (before !== undefined) {
        assert.equal(snapshotDirectory(workingDirectory), before, "dir fixture changed during the session");
      }
      if (process.env.UPDATE_TRANSCRIPTS === "1") {
        writeFileSync(expectedPath, `${JSON.stringify({ stdout: outputA })}\n`, "utf8");
      } else {
        assert.equal(
          outputA,
          JSON.parse(readFileSync(expectedPath, "utf8")).stdout,
          `${session.name}: output changed`,
        );
      }
    }

    const baselineInputPath = join(transcriptDirectory, "phase1-session.txt");
    const baselineExpectedPath = join(transcriptDirectory, "phase1-session-disabled.expected.json");
    const baselineWorkingDirectory = createWorkingDirectory(
      "phase1-baseline",
      "phase1",
      ["other.svg"],
      temporaryRoot,
      "disabled",
    );
    const baselineOutput = runSession(
      "phase1-session-disabled",
      "B",
      baselineWorkingDirectory,
      baselineInputPath,
      join(transcriptDirectory, "plugins-disabled.config.json"),
    );
    assert.doesNotMatch(baselineOutput, / \*(?:\r?\n|$)/, "disabled decorators added dirty labels");
    if (process.env.UPDATE_TRANSCRIPTS === "1") {
      writeFileSync(baselineExpectedPath, `${JSON.stringify({ stdout: baselineOutput })}\n`, "utf8");
    } else {
      assert.equal(
        baselineOutput,
        JSON.parse(readFileSync(baselineExpectedPath, "utf8")).stdout,
        "disabled-plugin Phase 1 baseline output changed",
      );
    }
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
