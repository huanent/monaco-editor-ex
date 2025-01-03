import type { IDisposable, editor } from "../monaco"
import { monaco } from "../monaco"
import { getFileName, isInnerModel, isRelative, isScript } from "../utils";
import { getModulesFromAst } from "./ast";
import { Module, ModuleState, createModule, getModule, removeModule } from "./moduleState";
import { getModuleKey } from "./utils";

let initialized = false;
let disposables: IDisposable[] = [];

type LoaderCallback = (path: string) => Promise<string> | string | undefined;

export interface LoaderOptions {
    onlyEmitEndsWithExtensions?: boolean
    callback?: LoaderCallback
}

type ModuleLoader = LoaderOptions | LoaderCallback | undefined;
let moduleLoader: ModuleLoader | undefined

function didCreateModel(model: editor.IModel) {
    if (model.uri.scheme == "memory") return;
    if (!isScript(model) || isInnerModel(model)) return;
    var uri = getModuleKey(model.uri)
    var module = getModule(uri) ?? createModule(uri, model.getValue())
    resolveModules(module)

    model.onDidChangeContent(() => {
        module.content = model.getValue();
        module.loadDependencies(resolveModules)
    })
}

function willDisposeModel(model: editor.IModel) {
    if (!isScript(model)) return;
    removeModule(getModuleKey(model.uri))
}

function didChangeModelLanguage(e: { model: editor.IModel, oldLanguage: string }) {
    if (isScript(e.oldLanguage)) {
        removeModule(getModuleKey(e.model.uri))
    }

    if (isScript(e.model)) {
        var uri = getModuleKey(e.model.uri)
        getModule(uri) ?? createModule(uri, e.model.getValue())
    }
}

export function resolveModules(module: Module) {
    if (!module?.ast) return;
    const moduleNames = getModulesFromAst(module.ast).map((m) => m.value);

    for (const moduleName of moduleNames) {
        resolveModule(moduleName, module.uri)
    }
}

async function resolveModule(name: string, source: string) {
    const uri = getModuleKey(name, source);
    if (isInnerModel(uri)) return;
    const module = getModule(uri) ?? createModule(uri);

    if (
        module.state == ModuleState.loading ||
        module.state == ModuleState.error ||
        module.state == ModuleState.success
    ) {
        return;
    }

    module.state = ModuleState.loading;

    try {
        let code = undefined
        if (typeof moduleLoader === "function") {
            code = await moduleLoader(uri)
        } else {
            if (moduleLoader?.onlyEmitEndsWithExtensions && getFileName(name).indexOf('.') < 1 && isRelative(name)) {
                return
            }
            code = await moduleLoader?.callback?.(uri)
        }
        module.content = code;
        if (code) resolveModules(module);
    } catch (error) {
        module.state = ModuleState.error;
    }
}

function dispose() {
    initialized = false;
    moduleLoader = undefined;
    disposables.forEach((d) => d && d?.dispose());
    disposables.length = 0;
}

export function useModuleResolve(options: ModuleLoader) {
    moduleLoader = options;
    if (initialized) return dispose;
    initialized = true;
    disposables.push(monaco.editor.onDidCreateModel((m) => didCreateModel(m)))
    disposables.push(monaco.editor.onWillDisposeModel((m) => willDisposeModel(m)))
    disposables.push(monaco.editor.onDidChangeModelLanguage(e => didChangeModelLanguage(e)))
    return dispose;
}