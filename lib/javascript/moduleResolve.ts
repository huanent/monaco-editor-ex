import type { IDisposable, editor } from "../monaco"
import { monaco } from "../monaco"
import { isScript } from "../utils";
import { Source, getModulesFromAst } from "./ast";
import { createModule, getModule, removeModule } from "./moduleState";

function didCreateModel(model: editor.IModel) {
    if (!isScript(model)) return;
    var uri = model.uri.toString()
    var module = getModule(uri) ?? createModule(uri, model.getLanguageId(), model.getValue())
    var sources = getModulesFromAst(module.ast);
    if (moduleReporter) moduleReporter(sources);
    model.onDidChangeContent(() => {
        module.content = model.getValue();
        sources = getModulesFromAst(module.ast);
        if (moduleReporter) moduleReporter(sources);
    })
}

function willDisposeModel(model: editor.IModel) {
    if (!isScript(model)) return;
    removeModule(model.uri.toString())
}

function didChangeModelLanguage(e: { model: editor.IModel, oldLanguage: string }) {
    if (isScript(e.oldLanguage)) {
        removeModule(e.model.uri.toString())
    }

    if (isScript(e.model)) {
        var uri = e.model.uri.toString()
        getModule(uri) ?? createModule(uri, e.model.getLanguageId(), e.model.getValue())
    }
}

let initialized = false;
let disposables: IDisposable[] = [];
type ModuleReporter = (source: Source[]) => void;
let moduleReporter: ModuleReporter | undefined

function dispose() {
    initialized = false;
    moduleReporter = undefined;
    disposables.forEach((d) => d && d.dispose());
    disposables.length = 0;
}

export function useModuleResolve(onModuleFind?: ModuleReporter) {
    moduleReporter = onModuleFind;
    if (initialized) return dispose;
    initialized = true;
    disposables.push(monaco.editor.onDidCreateModel((m) => didCreateModel(m)))
    disposables.push(monaco.editor.onWillDisposeModel((m) => willDisposeModel(m)))
    disposables.push(monaco.editor.onDidChangeModelLanguage(e => didChangeModelLanguage(e)))
    return dispose;
}