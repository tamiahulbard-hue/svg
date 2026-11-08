import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { PluginLoader } from "../dist/assembly/PluginLoader.js";
import { AttributeHandlerRegistry } from "../dist/application/AttributeHandlerRegistry.js";
import { CommandRegistry } from "../dist/application/CommandRegistry.js";
import { DocumentSession } from "../dist/application/DocumentSession.js";
import { TreeDecoratorRegistry } from "../dist/application/TreeDecoratorRegistry.js";
import { ShapeProviderRegistry } from "../dist/domain/ShapeProviderRegistry.js";
import { NodeDirectoryAdapter } from "../dist/infrastructure/NodeDirectoryAdapter.js";

const VALID_PLUGIN = `
export default {
  activate(context, options) {
    context.registerShapeProvider({ kind: "fixture-shape" });
    context.registerCommand({
      name: "fixture-command",
      helpText: options?.help ?? "",
      create() {},
    });
    context.registerTreeDecorator({ name: "fixture-decorator", decorate() {} });
    context.registerAttributeHandler({
      name: "fixture-attributes",
      handles() { return false; },
      apply() {},
    });
  },
};
`;

function createPlugin(root, directory, name, contributes, source) {
  const packageDirectory = join(root, directory);
  mkdirSync(packageDirectory, { recursive: true });
  writeFileSync(
    join(packageDirectory, "package.json"),
    JSON.stringify({ name, contributes }),
  );
  const entry = join(packageDirectory, "index.mjs");
  writeFileSync(entry, source);
  return entry;
}

function createHarness() {
  const registries = {
    shapeProviders: new ShapeProviderRegistry(),
    commands: new CommandRegistry(),
    decorators: new TreeDecoratorRegistry(),
    attributes: new AttributeHandlerRegistry(),
  };
  const services = {
    session: new DocumentSession(),
    filePort: undefined,
    directoryAccess: new NodeDirectoryAdapter(),
  };
  return {
    registries,
    loader: new PluginLoader(registries, services),
  };
}

function writeConfig(root, plugins) {
  const configPath = join(root, "plugins.config.json");
  writeFileSync(configPath, JSON.stringify({ plugins }));
  return configPath;
}

test("configuration loads plugins transactionally, in order, and passes options", async () => {
  const root = mkdtempSync(join(tmpdir(), "svg-plugin-load-"));
  try {
    createPlugin(
      root,
      "plugins/valid",
      "fixture-valid",
      {
        shapes: ["fixture-shape"],
        commands: ["fixture-command"],
        decorators: ["fixture-decorator"],
        attributes: ["fixture-attributes"],
      },
      VALID_PLUGIN,
    );
    const configPath = writeConfig(root, [
      { module: "./plugins/valid/index.mjs", options: { help: "configured option" } },
      { module: "./plugins/missing/index.mjs", enabled: false },
    ]);
    const { loader, registries } = createHarness();

    assert.deepEqual(await loader.loadConfig(configPath), []);
    assert.deepEqual(registries.shapeProviders.kinds, ["fixture-shape"]);
    assert.deepEqual(registries.commands.names, ["fixture-command"]);
    assert.deepEqual(registries.decorators.names, ["fixture-decorator"]);
    assert.deepEqual(registries.attributes.names, ["fixture-attributes"]);
    assert.match(registries.commands.additionalHelp, /configured option/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("A and B entries use the same activation and registration path", async () => {
  const root = mkdtempSync(join(tmpdir(), "svg-plugin-ab-"));
  try {
    createPlugin(
      root,
      "plugins/valid",
      "fixture-valid",
      {
        shapes: ["fixture-shape"],
        commands: ["fixture-command"],
        decorators: ["fixture-decorator"],
        attributes: ["fixture-attributes"],
      },
      VALID_PLUGIN,
    );
    const entry = { module: "./plugins/valid/index.mjs", options: { help: "same" } };
    const { loader: codeLoader, registries: codeRegistries } = createHarness();
    const { loader: configLoader, registries: configRegistries } = createHarness();
    const configPath = writeConfig(root, [entry]);

    assert.deepEqual(await codeLoader.load([entry], configPath), []);
    assert.deepEqual(await configLoader.loadConfig(configPath), []);
    assert.deepEqual(
      {
        shapes: codeRegistries.shapeProviders.kinds,
        commands: codeRegistries.commands.names,
        decorators: codeRegistries.decorators.names,
        attributes: codeRegistries.attributes.names,
        help: codeRegistries.commands.additionalHelp,
      },
      {
        shapes: configRegistries.shapeProviders.kinds,
        commands: configRegistries.commands.names,
        decorators: configRegistries.decorators.names,
        attributes: configRegistries.attributes.names,
        help: configRegistries.commands.additionalHelp,
      },
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("code and file configuration produce identical CLI transcripts", () => {
  const input = [
    "init",
    'create box card 10 20 120 60 "Hello"',
    "tree",
    "stats",
    "dir",
    "help",
    "exit",
    "",
  ].join("\n");
  const run = (arguments_) => {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "src/main.ts", ...arguments_],
      { cwd: process.cwd(), encoding: "utf8", input },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    return result.stdout;
  };
  const codeTranscript = run([]);
  const configTranscript = run(["--config", "plugins.config.json"]);
  const builtResult = spawnSync(process.execPath, ["dist/main.js"], {
    cwd: process.cwd(),
    encoding: "utf8",
    input,
  });

  assert.equal(configTranscript, codeTranscript);
  assert.equal(builtResult.status, 0, builtResult.stderr);
  assert.equal(builtResult.stderr, "");
  assert.equal(builtResult.stdout, codeTranscript);
  assert.match(codeTranscript, /g#card \(box\) \*/);
  assert.match(codeTranscript, /\(total 2, containers 1\)/);
  assert.match(codeTranscript, /\bdir\b/);
  assert.match(codeTranscript, /\bstats\b/);

  const invalidConfigDirectory = mkdtempSync(join(tmpdir(), "svg-invalid-plugin-config-"));
  try {
    const invalidConfigPath = join(invalidConfigDirectory, "plugins.config.json");
    writeFileSync(invalidConfigPath, "{invalid json");
    const fallback = spawnSync(
      process.execPath,
      ["--import", "tsx", "src/main.ts", "--config", invalidConfigPath],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        input: "init\nstats\nexit\n",
      },
    );
    assert.equal(fallback.status, 0, fallback.stderr);
    assert.equal(fallback.stderr.trim(), "error: invalid plugin config");
    assert.match(fallback.stdout, /error: unknown command: stats/);
  } finally {
    rmSync(invalidConfigDirectory, { recursive: true, force: true });
  }
});

test("loader reports all four failures, rolls back failed stages, and continues", async () => {
  const root = mkdtempSync(join(tmpdir(), "svg-plugin-errors-"));
  try {
    createPlugin(root, "plugins/no-default", "fixture-no-default", {}, "export const x = 1;");
    const mismatchPath = createPlugin(
      root,
      "plugins/mismatch",
      "fixture-mismatch",
      { shapes: ["declared-shape"] },
      `export const state = { disposed: false };
      export default {
        activate(context) {
          context.registerShapeProvider({ kind: "actual-shape" });
          context.registerTreeDecorator({
            name: "discarded-decorator",
            decorate() {},
            dispose() { state.disposed = true; },
          });
        },
      };`,
    );
    createPlugin(
      root,
      "plugins/activation-failure",
      "fixture-activation-failure",
      { commands: ["discarded-command"], decorators: ["discarded-decorator"] },
      `export default {
        activate(context) {
          context.registerCommand({ name: "discarded-command" });
          context.registerTreeDecorator({
            name: "discarded-decorator",
            decorate() {},
            dispose() { throw new Error("cleanup broke"); },
          });
          throw new Error("boom");
        },
      };`,
    );
    createPlugin(
      root,
      "plugins/dependency-failure",
      "fixture-dependency-failure",
      {},
      `import "./missing-dependency.mjs"; export default { activate() {} };`,
    );
    createPlugin(root, "plugins/valid", "fixture-valid", {
      shapes: ["fixture-shape"],
      commands: ["fixture-command"],
      decorators: ["fixture-decorator"],
      attributes: ["fixture-attributes"],
    }, VALID_PLUGIN);

    const configPath = writeConfig(root, [
      { module: "./plugins/missing/index.mjs" },
      { module: "./plugins/no-default/index.mjs" },
      { module: "./plugins/mismatch/index.mjs" },
      { module: "./plugins/dependency-failure/index.mjs" },
      { module: "./plugins/activation-failure/index.mjs" },
      { module: "./plugins/valid/index.mjs" },
    ]);
    const { loader, registries } = createHarness();
    const messages = await loader.loadConfig(configPath);

    assert.equal(messages.length, 5);
    assert.equal(messages[0], "error: plugin not found: ./plugins/missing/index.mjs");
    assert.equal(messages[1], "error: plugin has no default export: ./plugins/no-default/index.mjs");
    assert.match(messages[2], /^error: plugin manifest mismatch: fixture-mismatch \(declared: /);
    assert.match(messages[3], /^error: plugin failed to activate: fixture-dependency-failure \(/);
    assert.equal(
      messages[4],
      "error: plugin failed to activate: fixture-activation-failure (boom; cleanup failed: cleanup broke)",
    );
    assert.deepEqual(registries.shapeProviders.kinds, ["fixture-shape"]);
    assert.deepEqual(registries.commands.names, ["fixture-command"]);
    assert.equal(registries.shapeProviders.kinds.includes("actual-shape"), false);
    assert.equal(registries.commands.names.includes("discarded-command"), false);
    const mismatchModule = await import(pathToFileURL(mismatchPath).href);
    assert.equal(mismatchModule.state.disposed, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("duplicate registrations reject the whole plugin before committing any category", async () => {
  const root = mkdtempSync(join(tmpdir(), "svg-plugin-duplicate-"));
  try {
    const duplicatePlugin = createPlugin(
      root,
      "plugins/duplicate",
      "fixture-duplicate",
      { shapes: ["staged-shape"], commands: ["existing-command"] },
      `export default {
        activate(context) {
          context.registerShapeProvider({ kind: "staged-shape" });
          context.registerCommand({ name: "existing-command" });
        },
      };`,
    );
    const internalDuplicate = createPlugin(
      root,
      "plugins/internal-duplicate",
      "fixture-internal-duplicate",
      { decorators: ["same"] },
      `export default {
        activate(context) {
          context.registerTreeDecorator({ name: "same", decorate() {} });
          context.registerTreeDecorator({ name: "same", decorate() {} });
        },
      };`,
    );
    const { loader, registries } = createHarness();
    registries.commands.register({ name: "existing-command", helpText: "", create() {} });
    const configPath = writeConfig(root, [
      { module: duplicatePlugin },
      { module: internalDuplicate },
    ]);

    assert.deepEqual(await loader.loadConfig(configPath), [
      "error: duplicate registration: commands/existing-command",
      "error: duplicate registration: decorators/same",
    ]);
    assert.deepEqual(registries.shapeProviders.kinds, []);
    assert.deepEqual(registries.decorators.names, []);
    assert.deepEqual(registries.commands.names, ["existing-command"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("invalid configuration falls back without loading modules", async () => {
  const root = mkdtempSync(join(tmpdir(), "svg-plugin-config-"));
  try {
    const configPath = writeConfig(root, [{ module: "./missing", enabled: "yes" }]);
    const { loader, registries } = createHarness();
    assert.deepEqual(await loader.loadConfig(configPath), ["error: invalid plugin config"]);
    assert.deepEqual(registries.shapeProviders.kinds, []);
    assert.deepEqual(registries.commands.names, []);

    writeFileSync(configPath, "{invalid json");
    assert.deepEqual(await loader.loadConfig(configPath), ["error: invalid plugin config"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
