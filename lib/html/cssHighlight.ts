import { languageNames } from "../constants";
import { getCssService, toDocumentHighlightKind, toRange } from "../css/utils";
import type { CancellationToken, Position, editor, languages } from "../monaco";
import { htmlRegionCache } from "./htmlRegionCache";
import { toLsPosition } from "./utils";
import { monaco } from "../monaco"

class CssDocumentHighlightAdapter implements languages.DocumentHighlightProvider {
    async provideDocumentHighlights(
        model: editor.IReadOnlyModel,
        position: Position,
        _token: CancellationToken
    ): Promise<languages.DocumentHighlight[] | undefined> {
        const regions = htmlRegionCache.get(model);
        if (regions.getLanguageAtPosition(position) != languageNames.css) return;
        const cssDocument = regions.getEmbeddedDocument(languageNames.css);
        const cssService = getCssService();
        const style = cssService.parseStylesheet(cssDocument);
        const entries = cssService.findDocumentHighlights(cssDocument, toLsPosition(position), style)
        if (!entries) return;

        return entries.map((entry) => {
            return <languages.DocumentHighlight>{
                range: toRange(entry.range),
                kind: toDocumentHighlightKind(entry.kind)
            };
        });
    }
}

export function useCssHighlightInHtml() {
    monaco.languages.registerDocumentHighlightProvider(
        languageNames.html,
        new CssDocumentHighlightAdapter()
    )
}