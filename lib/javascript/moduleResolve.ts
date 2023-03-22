import type { IDisposable, editor } from "../monaco"
import { monaco } from "../monaco"
import { isScript } from "../utils";
import { createModule, getModule, removeModule } from "./moduleState";

function didCreateModel(model: editor.IModel) {
    if (!isScript(model)) return;
    var uri = model.uri.toString()
    getModule(uri) ?? createModule(uri, model.getLanguageId(), model.getValue())
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

function dispose() {
    initialized = false;
    disposables.forEach((d) => d && d.dispose());
    disposables.length = 0;
}

export function useModuleResolve() {
    if (initialized) return dispose;
    initialized = true;
    disposables.push(monaco.editor.onDidCreateModel((m) => didCreateModel(m)))
    disposables.push(monaco.editor.onWillDisposeModel((m) => willDisposeModel(m)))
    disposables.push(monaco.editor.onDidChangeModelLanguage(e => didChangeModelLanguage(e)))
    return dispose;
}