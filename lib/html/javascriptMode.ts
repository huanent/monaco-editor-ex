import { CancellationToken, editor, languages, Position, Uri, monaco, IRange, Range } from "../monaco";
import type ts from "typescript";
import { getEmbeddedJavascriptUri, tagToString, textSpanToRange } from "./utils";
import { htmlRegionCache } from "./htmlRegionCache";
import { languageNames } from "../constants";
import { displayPartsToString } from "typescript";

export class JavascriptInHtmlQuickInfoAdapter implements languages.HoverProvider {
    public async provideHover(
        model: editor.ITextModel,
        position: Position,
        _token: CancellationToken
    ): Promise<languages.Hover | undefined> {
        const regions = htmlRegionCache.getCache(model);
        if (regions.getLanguageAtPosition(position) != languageNames.javascript) return;
        const workerGetter = await monaco.languages.typescript.getJavaScriptWorker()
        const worker = await workerGetter(getEmbeddedJavascriptUri(model))
        const javascriptModel = monaco.editor.getModel(getEmbeddedJavascriptUri(model))
        if (!javascriptModel) return
        const offset = javascriptModel.getOffsetAt(position);

        if (model.isDisposed()) {
            return;
        }

        const info = await worker.getQuickInfoAtPosition(javascriptModel.uri.toString(), offset);

        if (!info || model.isDisposed()) {
            return;
        }

        const documentation = displayPartsToString(info.documentation);
        const tags = info.tags ? info.tags.map((tag: any) => tagToString(tag)).join('  \n\n') : '';
        const contents = displayPartsToString(info.displayParts);
        return {
            range: textSpanToRange(javascriptModel, info.textSpan),
            contents: [
                {
                    value: '```typescript\n' + contents + '\n```\n'
                },
                {
                    value: documentation + (tags ? '\n\n' + tags : '')
                }
            ]
        };
    }
}

export class JavascriptInHtmlOccurrencesAdapter implements languages.DocumentHighlightProvider {
    public async provideDocumentHighlights(
        model: editor.ITextModel,
        position: Position,
        _token: CancellationToken
    ): Promise<languages.DocumentHighlight[] | undefined> {
        const regions = htmlRegionCache.getCache(model);
        if (regions.getLanguageAtPosition(position) != languageNames.javascript) return;
        const workerGetter = await monaco.languages.typescript.getJavaScriptWorker()
        const worker = await workerGetter(getEmbeddedJavascriptUri(model))
        const javascriptModel = monaco.editor.getModel(getEmbeddedJavascriptUri(model))
        if (!javascriptModel) return
        const offset = javascriptModel.getOffsetAt(position);

        if (model.isDisposed()) {
            return;
        }

        const entries = await worker.getOccurrencesAtPosition(javascriptModel.uri.toString(), offset);

        if (!entries || model.isDisposed()) {
            return;
        }

        return entries.map((entry) => {
            return <languages.DocumentHighlight>{
                range: textSpanToRange(model, entry.textSpan),
                kind: entry.isWriteAccess
                    ? monaco.languages.DocumentHighlightKind.Write
                    : monaco.languages.DocumentHighlightKind.Text
            };
        });
    }
}

export class JavascriptInHtmlFormattingAdapter implements languages.DocumentFormattingEditProvider {
    async provideDocumentFormattingEdits(model: editor.ITextModel, options: languages.FormattingOptions, _token: CancellationToken): Promise<languages.TextEdit[] | undefined> {
        const workerGetter = await monaco.languages.typescript.getJavaScriptWorker()
        const uri = getEmbeddedJavascriptUri(model);
        const worker = await workerGetter(uri)
        const javascriptModel = monaco.editor.getModel(uri)
        if (!javascriptModel) return;
        const edits = await worker.getFormattingEditsForDocument(uri.toString(), options)

        if (!edits || model.isDisposed()) {
            return;
        }
        return edits.map((edit) => this._convertTextChanges(model, edit));
    }

    protected _convertTextChanges(
        model: editor.ITextModel,
        change: ts.TextChange
    ): languages.TextEdit {
        return {
            text: change.newText,
            range: textSpanToRange(model, change.span)
        };
    }
}

export class JavascriptInHtmlRangeFormattingAdapter implements languages.DocumentRangeFormattingEditProvider {
    async provideDocumentRangeFormattingEdits(model: editor.ITextModel, _range: Range, options: languages.FormattingOptions, _token: CancellationToken): Promise<languages.TextEdit[] | undefined> {
        const workerGetter = await monaco.languages.typescript.getJavaScriptWorker()
        const uri = getEmbeddedJavascriptUri(model);
        const worker = await workerGetter(uri)
        const javascriptModel = monaco.editor.getModel(uri)
        if (!javascriptModel) return;
        const edits = await worker.getFormattingEditsForDocument(uri.toString(), options)

        if (!edits || model.isDisposed()) {
            return;
        }
        return edits.map((edit) => this._convertTextChanges(model, edit));
    }

    protected _convertTextChanges(
        model: editor.ITextModel,
        change: ts.TextChange
    ): languages.TextEdit {
        return {
            text: change.newText,
            range: textSpanToRange(model, change.span)
        };
    }
}