import { languageNames } from "../constants"
import type { IDisposable, Uri, editor } from "../monaco"
import { monaco } from "../monaco"
import { htmlRegionCache } from "./htmlRegionCache"

export * from "./autoCloseTag"
export * from "./javascriptSuggest"
export * from "./javascriptSignatureHelp"
export * from "./javascriptQuickInfo"
export * from "./javascriptOccurrences"
export * from "./cssSuggest"
export * from "./cssHover"
export * from "./cssFoldingRange"
export * from "./cssColor"
export * from "./cssRename"
export * from "./cssSymbol"
export * from "./cssReference"
export * from "./cssDefinition"
export * from "./cssHighlight"


export class javascriptInHtmlAdapter {
    protected readonly _disposables: IDisposable[] = [];

    constructor() {
        this._disposables.push(monaco.editor.onDidCreateModel((m) => this.didCreateModel(m)))
        this._disposables.push(monaco.editor.onWillDisposeModel((m) => this.willDisposeModel(m)))
        this._disposables.push(monaco.editor.onDidChangeModelLanguage(e => this.didChangeModelLanguage(e)))
    }

    didCreateModel(model: editor.IModel) {
        if (model.getLanguageId() != languageNames.html) return;
        this.createEmbeddedModel(model)
    }

    willDisposeModel(model: editor.IModel) {
        if (model.getLanguageId() != languageNames.html) return;
        this.tryRemoveEmbeddedModel(model.uri);
    }

    didChangeModelLanguage(e: { model: editor.IModel, oldLanguage: string }) {
        if (e.oldLanguage == languageNames.html) {
            this.tryRemoveEmbeddedModel(e.model.uri)
        }

        if (e.model.getLanguageId() == languageNames.html) {
            this.createEmbeddedModel(e.model)
        }
    }

    private tryRemoveEmbeddedModel(uri: Uri) {
        const path = monaco.Uri.joinPath(uri, languageNames.javascript);
        const embeddedModel = monaco.editor.getModel(path)
        embeddedModel?.dispose();
    }

    private createEmbeddedModel(model: editor.IModel) {
        const content = htmlRegionCache.get(model).getEmbeddedDocument(languageNames.javascript, true)
        const uri = monaco.Uri.joinPath(model.uri, languageNames.javascript);
        monaco.editor.createModel(content.getText(), languageNames.javascript, uri)

        model.onDidChangeContent(() => {
            if (model.getLanguageId() == languageNames.html) {
                const content = htmlRegionCache.get(model).getEmbeddedDocument(languageNames.javascript, true)
                const embeddedModel = monaco.editor.getModel(uri);
                embeddedModel?.setValue(content.getText()) //TODO 优化
            }
        })
    }

    dispose(): void {
        this._disposables.forEach((d) => d && d.dispose());
        this._disposables.length = 0;
    }
}