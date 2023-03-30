import { languageNames } from "../constants"
import type { IDisposable, Uri, editor } from "../monaco"
import { monaco } from "../monaco"
import { htmlRegionCache } from "./htmlRegionCache"
import { getEmbeddedJavascriptUri } from "./utils";

function didCreateModel(model: editor.IModel) {
    if (model.getLanguageId() != languageNames.html) return;
    createEmbeddedModel(model)
}

function willDisposeModel(model: editor.IModel) {
    if (model.getLanguageId() != languageNames.html) return;
    tryRemoveEmbeddedModel(model.uri);
    htmlRegionCache.remove(model);
}

function didChangeModelLanguage(e: { model: editor.IModel, oldLanguage: string }) {
    if (e.oldLanguage == languageNames.html) {
        tryRemoveEmbeddedModel(e.model.uri)
    }

    if (e.model.getLanguageId() == languageNames.html) {
        createEmbeddedModel(e.model)
    }
}

function tryRemoveEmbeddedModel(uri: Uri) {
    const path = getEmbeddedJavascriptUri(uri)
    const embeddedModel = monaco.editor.getModel(path)
    embeddedModel?.dispose();
}

function createEmbeddedModel(model: editor.IModel) {
    const content = htmlRegionCache.get(model).getEmbeddedDocument(languageNames.javascript, true)
    const uri = getEmbeddedJavascriptUri(model.uri)
    monaco.editor.createModel(content.getText(), languageNames.javascript, uri)

    model.onDidChangeContent(() => {
        if (model.getLanguageId() == languageNames.html) {
            const content = htmlRegionCache.get(model).getEmbeddedDocument(languageNames.javascript, true)
            const embeddedModel = monaco.editor.getModel(uri);
            embeddedModel?.setValue(content.getText()) //TODO 优化
        }
    })
}

const disposables: IDisposable[] = [];
let initialized = false;

function dispose() {
    initialized = false;
    disposables.forEach((d) => d && d.dispose());
    disposables.length = 0;
}

export function useJavascriptInHtml() {
    if (initialized) return dispose;
    initialized = true;
    disposables.push(monaco.editor.onDidCreateModel((m) => didCreateModel(m)))
    disposables.push(monaco.editor.onWillDisposeModel((m) => willDisposeModel(m)))
    disposables.push(monaco.editor.onDidChangeModelLanguage(e => didChangeModelLanguage(e)))
    return dispose;
}