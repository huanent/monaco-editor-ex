import { languageNames } from "../constants";
import type { CancellationToken, Position, editor, languages } from "../monaco";
import { htmlRegionCache } from "./htmlRegionCache";
import { monaco } from "../monaco"
import { getEmbeddedJavascriptUri, textSpanToRange } from "./utils";
import { getJavascriptWorker } from "../javascript/utils";

class JavascriptOccurrencesAdapter implements languages.DocumentHighlightProvider {
    public async provideDocumentHighlights(
        model: editor.ITextModel,
        position: Position,
        _token: CancellationToken
    ): Promise<languages.DocumentHighlight[] | undefined> {
        const regions = htmlRegionCache.get(model);
        if (regions.getLanguageAtPosition(position) != languageNames.javascript) return;
        const worker = await getJavascriptWorker(model.uri)
        if (!worker) return;
        const javascriptModel = monaco.editor.getModel(getEmbeddedJavascriptUri(model))
        if (!javascriptModel) return
        const offset = javascriptModel.getOffsetAt(position);

        if (model.isDisposed()) {
            return;
        }
        if (!worker.getDocumentHighlights) return;
        const entries = await worker.getDocumentHighlights(javascriptModel.uri.toString(), offset, []);

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