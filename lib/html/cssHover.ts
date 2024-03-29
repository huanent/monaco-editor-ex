import { languageNames } from "../constants";
import { getCssService, toMarkedStringArray, toRange } from "../css/utils";
import type { CancellationToken, Position, editor, languages } from "../monaco";
import { htmlRegionCache } from "./htmlRegionCache";
import { toLsPosition } from "./utils";
import { monaco } from "../monaco"

class CssHoverAdapter implements languages.HoverProvider {
    async provideHover(
        model: editor.IReadOnlyModel,
        position: Position,
        _token: CancellationToken
    ): Promise<languages.Hover | undefined> {
        const regions = htmlRegionCache.get(model);
        if (regions.getLanguageAtPosition(position) != languageNames.css) return;
        const cssDocument = regions.getEmbeddedDocument(languageNames.css);
        const cssService = getCssService();
        const style = cssService.parseStylesheet(cssDocument);
        const info = cssService.doHover(cssDocument, toLsPosition(position), style)
        if (!info) return;
        return <languages.Hover>{
            range: toRange(info.range),
            contents: toMarkedStringArray(info.contents)
        };
    }
}

export function useCssHoverInHtml() {
    monaco.languages.registerHoverProvider(
        languageNames.html,
        new CssHoverAdapter()
    )
}