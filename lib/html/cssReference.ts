import { languageNames } from "../constants";
import { getCssService, toLocation } from "../css/utils";
import type { CancellationToken, Position, editor, languages } from "../monaco";
import { htmlRegionCache } from "./htmlRegionCache";
import { toLsPosition } from "./utils";
import { monaco } from "../monaco"

class CssReferenceAdapter implements languages.ReferenceProvider {
    async provideReferences(model: editor.ITextModel, position: Position, _context: languages.ReferenceContext, _token: CancellationToken): Promise<languages.Location[] | undefined> {
        const regions = htmlRegionCache.get(model);
        if (regions.getLanguageAtPosition(position) != languageNames.css) return;
        const cssDocument = regions.getEmbeddedDocument(languageNames.css);
        const cssService = getCssService()
        const style = cssService.parseStylesheet(cssDocument);
        const entries = cssService.findReferences(cssDocument, toLsPosition(position), style)
        if (!entries) return;
        return entries.map(toLocation);
    }
}

export function useCssReferenceInHtml() {
    monaco.languages.registerReferenceProvider(
        languageNames.html,
        new CssReferenceAdapter()
    )
}
