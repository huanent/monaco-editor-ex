import { parse } from "@babel/parser";
import type { AstTree } from "./ast";
import { monaco } from "../monaco";
import { languageNames } from "../constants";

const modules: Record<string, Module> = {};

export enum ModuleState {
  create,
  loading,
  success,
  error,
}

export class Module {
  private _content?: string;
  state = ModuleState.create;
  ast?: AstTree;
  loadDependenciesToken: any = null;

  constructor(readonly uri: string, readonly language: string) { }

  get content() {
    return this._content;
  }

  set content(value) {
    if (value === undefined || value === null) return;
    this._content = value;
    this.state = ModuleState.success;
    this.ast = this.parseAst(value);

    if (this.language == languageNames.javascript) {
      monaco.languages.typescript.javascriptDefaults.addExtraLib(value, this.uri);
    }

    if (this.language == languageNames.typescript) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(value, this.uri);
    }
  }

  parseAst(content: string) {
    try {
      return parse(content, {
        sourceType: "module",
        plugins: ["typescript"],
        errorRecovery: true,
      });
    } catch (error) {
      return;
    }
  }

  loadDependencies(action: (module: Module) => void) {
    if (this.loadDependenciesToken) {
      clearTimeout(this.loadDependenciesToken);
    }

    this.loadDependenciesToken = setTimeout(() => action(this), 1000);
  }
}

export function createModule(uri: string, language: string, content?: string) {
  const module = new Module(uri, language);
  modules[uri] = module;

  if (content) {
    module.content = content;
  }

  return module;
}

export function getModule(uri: string) {
  return modules[uri];
}

export function removeModule(uri: string) {
  if (modules[uri]) {
    delete modules[uri];
    monaco.languages.typescript.javascriptDefaults.addExtraLib("", uri);
    monaco.languages.typescript.typescriptDefaults.addExtraLib("", uri);
  }
}

export function removeModules() {
  for (const key in modules) {
    delete modules[key];
  }

  monaco.languages.typescript.javascriptDefaults.setExtraLibs([]);
  monaco.languages.typescript.typescriptDefaults.setExtraLibs([]);
}
