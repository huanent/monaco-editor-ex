import { languageNames } from "../constants";
import { getCssService, toLocation } from "../css/utils";
import type { CancellationToken, Position, editor, languages } from "../monaco";
import { htmlRegionCache } from "./htmlRegionCache";
import { monaco } from "../monaco"
import { toLsPosition } from "./utils";

class CssDefinitionAdapter implements languages.DefinitionProvider {
    async provideDefinition(model: editor.ITextModel, position: Position, _token: CancellationToken): Promise<languages.Definition | undefined> {
        const regions = htmlRegionCache.get(model);
        if (regions.getLanguageAtPosition(position) != languageNames.css) return;
        const cssDocument = regions.getEmbeddedDocument(languageNames.css);
        const cssService = getCssService()
        const style = cssService.parseStylesheet(cssDocument);
        const definition = cssService.findDefinition(cssDocument, toLsPosition(position), style)
        if (!definition) {
            return;
        }
        return [toLocation(definition)];
    }


}

export function useCssDefinitionInHtml() {
    monaco.languages.registerDefinitionProvider(
        languageNames.html,
        new CssDefinitionAdapter()
    )
}