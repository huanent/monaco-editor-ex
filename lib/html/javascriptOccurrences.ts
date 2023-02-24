import { languageNames } from "../constants";
import type { CancellationToken, Position, editor, languages } from "../monaco";
import { htmlRegionCache } from "./htmlRegionCache";
import { monaco } from "../monaco"
import { getEmbeddedJavascriptUri, textSpanToRange } from "./utils";

class JavascriptOccurrencesAdapter implements languages.DocumentHighlightProvider {
    public async provideDocumentHighlights(
        model: editor.ITextModel,
        position: Position,
        _token: CancellationToken
    ): Promise<languages.DocumentHighlight[] | undefined> {
        const regions = htmlRegionCache.get(model);
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

export function useJavascriptOccurrencesInHtml() {
    monaco.languages.registerDocumentHighlightProvider(
        languageNames.html,
        new JavascriptOccurrencesAdapter()
    )
}