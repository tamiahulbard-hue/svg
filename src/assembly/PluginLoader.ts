import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { AttributeHandlerRegistry } from "../application/AttributeHandlerRegistry.js";
import type { CommandRegistry } from "../application/CommandRegistry.js";
import type { DirectoryAccess } from "../application/DirectoryAccess.js";
import type { DocumentSession } from "../application/DocumentSession.js";
import type { SvgFilePort } from "../application/SvgFilePort.js";
import type { TreeDecoratorRegistry } from "../application/TreeDecoratorRegistry.js";
import type { ShapeProviderRegistry } from "../domain/ShapeProviderRegistry.js";
import {
  StagedPluginContext,
  type PluginActivationContext,
  type PluginContributions,
} from "./PluginContext.js";

const CONTRIBUTION_CATEGORIES = ["shapes", "commands", "decorators", "attributes"] as const;
type ContributionCategory = (typeof CONTRIBUTION_CATEGORIES)[number];
type ContributionsByName = Record<ContributionCategory, readonly string[]>;

export interface PluginConfigEntry {
  readonly module: string;
  readonly enabled?: boolean;
  readonly options?: Readonly<Record<string, unknown>>;
}

type PluginManifest = {
  readonly name: string;
  readonly contributes: ContributionsByName;
};

interface PluginModule {
  activate(
    context: PluginActivationContext,
    options: Readonly<Record<string, unknown>> | undefined,
  ): void | Promise<void>;
}

export interface PluginRegistries {
  readonly shapeProviders: ShapeProviderRegistry;
  readonly commands: CommandRegistry;
  readonly decorators: TreeDecoratorRegistry;
  readonly attributes: AttributeHandlerRegistry;
}

export class PluginLoader {
  constructor(
    private readonly registries: PluginRegistries,
    private readonly services: {
      readonly session: DocumentSession;
      readonly filePort: SvgFilePort | undefined;
      readonly directoryAccess: DirectoryAccess;
    },
  ) {}

  async loadConfig(configPath: string): Promise<string[]> {
    const absolutePath = resolve(configPath);
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(absolutePath, "utf8"));
    } catch {
      return ["error: invalid plugin config"];
    }

    if (!this.isConfig(parsed)) {
      return ["error: invalid plugin config"];
    }
    return this.load(parsed.plugins, absolutePath);
  }

  async load(
    entries: readonly PluginConfigEntry[],
    resolutionBasePath: string,
  ): Promise<string[]> {
    const messages: string[] = [];
    for (const entry of entries) {
      if (entry.enabled === false) {
        continue;
      }
      const message = await this.loadOne(entry, resolutionBasePath);
      if (message !== undefined) {
        messages.push(message);
      }
    }
    return messages;
  }

  private async loadOne(
    entry: PluginConfigEntry,
    resolutionBasePath: string,
  ): Promise<string | undefined> {
    const requireFromBase = createRequire(resolve(resolutionBasePath));
    let modulePath: string;
    try {
      modulePath = requireFromBase.resolve(entry.module);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "MODULE_NOT_FOUND") {
        return `error: plugin not found: ${entry.module}`;
      }
      return `error: plugin not found: ${entry.module}`;
    }

    const manifestResult = this.readManifest(modulePath);
    if (manifestResult.manifest === undefined) {
      return `error: plugin manifest mismatch: ${entry.module} (declared: ${manifestResult.reason}, registered: none)`;
    }
    const manifest = manifestResult.manifest;

    let namespace: Record<string, unknown>;
    try {
      namespace = await import(pathToFileURL(modulePath).href) as Record<string, unknown>;
    } catch (error) {
      return `error: plugin failed to activate: ${manifest.name} (${this.reason(error)})`;
    }
    if (namespace.default === undefined) {
      return `error: plugin has no default export: ${entry.module}`;
    }
    if (
      typeof namespace.default !== "object"
      || namespace.default === null
      || typeof (namespace.default as { activate?: unknown }).activate !== "function"
    ) {
      return `error: plugin failed to activate: ${manifest.name} (default export must provide activate())`;
    }

    const module = namespace.default as PluginModule;
    const context = new StagedPluginContext(
      this.services.session,
      this.services.filePort,
      this.services.directoryAccess,
    );
    try {
      await module.activate(context, entry.options);
    } catch (error) {
      const cleanupErrors = this.dispose(context.contributions);
      return `error: plugin failed to activate: ${manifest.name} (${this.reason(error)}${this.cleanupMessage(cleanupErrors)})`;
    }

    const contributions = context.contributions;
    const duplicate = this.findDuplicate(contributions);
    if (duplicate !== undefined) {
      const cleanupErrors = this.dispose(contributions);
      return `error: duplicate registration: ${duplicate.category}/${duplicate.name}${this.cleanupMessage(cleanupErrors)}`;
    }

    const registered = this.names(contributions);
    if (!this.sameContributions(manifest.contributes, registered)) {
      const cleanupErrors = this.dispose(contributions);
      return `error: plugin manifest mismatch: ${manifest.name} (declared: ${this.describe(manifest.contributes)}, registered: ${this.describe(registered)})${this.cleanupMessage(cleanupErrors)}`;
    }

    const crossPluginDuplicate = this.findExistingDuplicate(contributions);
    if (crossPluginDuplicate !== undefined) {
      const cleanupErrors = this.dispose(contributions);
      return `error: duplicate registration: ${crossPluginDuplicate.category}/${crossPluginDuplicate.name}${this.cleanupMessage(cleanupErrors)}`;
    }

    this.commit(contributions);
    return undefined;
  }

  private readManifest(modulePath: string): {
    manifest?: PluginManifest;
    reason?: string;
  } {
    let directory = dirname(modulePath);
    while (true) {
      const packagePath = join(directory, "package.json");
      if (existsSync(packagePath)) {
        let value: unknown;
        try {
          value = JSON.parse(readFileSync(packagePath, "utf8"));
        } catch {
          return { reason: "invalid package.json" };
        }
        const manifest = this.parseManifest(value);
        return manifest === undefined
          ? { reason: "invalid package.json" }
          : { manifest };
      }
      const parent = dirname(directory);
      if (parent === directory) {
        return { reason: "package.json missing" };
      }
      directory = parent;
    }
  }

  private parseManifest(value: unknown): PluginManifest | undefined {
    if (!this.isRecord(value) || typeof value.name !== "string" || value.name.length === 0) {
      return undefined;
    }
    if (value.contributes !== undefined && !this.isRecord(value.contributes)) {
      return undefined;
    }
    const contributes = this.isRecord(value.contributes) ? value.contributes : {};
    if (Object.keys(contributes).some((key) => !CONTRIBUTION_CATEGORIES.includes(key as ContributionCategory))) {
      return undefined;
    }
    const categories = {} as Record<ContributionCategory, readonly string[]>;
    for (const category of CONTRIBUTION_CATEGORIES) {
      const names = contributes[category] ?? [];
      if (
        !Array.isArray(names)
        || !names.every((name) => typeof name === "string" && name.length > 0)
        || new Set(names).size !== names.length
      ) {
        return undefined;
      }
      categories[category] = [...names];
    }
    return { name: value.name, contributes: categories };
  }

  private names(contributions: PluginContributions): ContributionsByName {
    return {
      shapes: contributions.shapes.map((item) => item.kind),
      commands: contributions.commands.map((item) => item.name),
      decorators: contributions.decorators.map((item) => item.name),
      attributes: contributions.attributes.map((item) => item.name),
    };
  }

  private sameContributions(
    declared: ContributionsByName,
    registered: ContributionsByName,
  ): boolean {
    return CONTRIBUTION_CATEGORIES.every((category) => {
      const left = [...declared[category]].sort();
      const right = [...registered[category]].sort();
      return left.length === right.length && left.every((name, index) => name === right[index]);
    });
  }

  private describe(contributions: ContributionsByName): string {
    return CONTRIBUTION_CATEGORIES
      .map((category) => `${category}=[${[...contributions[category]].sort().join(", ")}]`)
      .join(", ");
  }

  private findDuplicate(
    contributions: PluginContributions,
  ): { category: ContributionCategory; name: string } | undefined {
    const names = this.names(contributions);
    for (const category of CONTRIBUTION_CATEGORIES) {
      const seen = new Set<string>();
      for (const name of names[category]) {
        if (typeof name !== "string" || name.length === 0 || seen.has(name)) {
          return { category, name: typeof name === "string" ? name : "<invalid>" };
        }
        seen.add(name);
      }
    }
    return undefined;
  }

  private dispose(contributions: PluginContributions): string[] {
    const staged = [
      ...contributions.shapes,
      ...contributions.commands,
      ...contributions.decorators,
      ...contributions.attributes,
    ];
    const errors: string[] = [];
    for (const contribution of staged) {
      if ("dispose" in contribution && typeof contribution.dispose === "function") {
        try {
          contribution.dispose.call(contribution);
        } catch (error) {
          errors.push(this.reason(error));
        }
      }
    }
    return errors;
  }

  private cleanupMessage(errors: readonly string[]): string {
    return errors.length === 0 ? "" : `; cleanup failed: ${errors.join("; ")}`;
  }

  private findExistingDuplicate(
    contributions: PluginContributions,
  ): { category: ContributionCategory; name: string } | undefined {
    const existing: ContributionsByName = {
      shapes: this.registries.shapeProviders.kinds,
      commands: this.registries.commands.names,
      decorators: this.registries.decorators.names,
      attributes: this.registries.attributes.names,
    };
    const names = this.names(contributions);
    for (const category of CONTRIBUTION_CATEGORIES) {
      const registered = new Set(existing[category]);
      const duplicate = names[category].find((name) => registered.has(name));
      if (duplicate !== undefined) {
        return { category, name: duplicate };
      }
    }
    return undefined;
  }

  private commit(contributions: PluginContributions): void {
    for (const provider of contributions.shapes) {
      this.registries.shapeProviders.register(provider);
    }
    for (const command of contributions.commands) {
      this.registries.commands.register(command);
    }
    for (const decorator of contributions.decorators) {
      this.registries.decorators.register(decorator);
    }
    for (const handler of contributions.attributes) {
      this.registries.attributes.register(handler);
    }
  }

  private isConfig(value: unknown): value is { plugins: PluginConfigEntry[] } {
    if (
      !this.isRecord(value)
      || Object.keys(value).some((key) => key !== "plugins")
      || !Array.isArray(value.plugins)
    ) {
      return false;
    }
    return value.plugins.every((entry) => {
      if (
        !this.isRecord(entry)
        || Object.keys(entry).some((key) => !["module", "enabled", "options"].includes(key))
        || typeof entry.module !== "string"
        || entry.module.trim().length === 0
      ) {
        return false;
      }
      if (entry.enabled !== undefined && typeof entry.enabled !== "boolean") {
        return false;
      }
      return entry.options === undefined || (
        this.isRecord(entry.options) && entry.options !== null && !Array.isArray(entry.options)
      );
    });
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
