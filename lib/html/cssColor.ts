import { languageNames } from "../constants";
import { fromRange, getCssService, toRange, toTextEdit } from "../css/utils";
import type { CancellationToken, editor, languages } from "../monaco";
import { htmlRegionCache } from "./htmlRegionCache";
import { monaco } from "../monaco"

class CssDocumentColorAdapter implements languages.DocumentColorProvider {
    async provideDocumentColors(
        model: editor.IReadOnlyModel,
        _token: CancellationToken
    ): Promise<languages.IColorInformation[] | undefined> {
        const regions = htmlRegionCache.get(model);
        const cssDocument = regions.getEmbeddedDocument(languageNames.css, true);
        const cssService = getCssService()
        const style = cssService.parseStylesheet(cssDocument);
        const infos = cssService.findDocumentColors(cssDocument, style)
        if (!infos) return;

        return infos.map((item) => ({
            color: item.color,
            range: toRange(item.range)!,
        }));
    }

    async provideColorPresentations(
        model: editor.IReadOnlyModel,
        info: languages.IColorInformation,
        _token: CancellationToken
    ): Promise<languages.IColorPresentation[] | undefined> {
        const regions = htmlRegionCache.get(model);
        const cssDocument = regions.getEmbeddedDocument(languageNames.css, true);
        const cssService = getCssService()
        const style = cssService.parseStylesheet(cssDocument);
        const presentations = cssService.getColorPresentations(cssDocument, style, info.color, fromRange(info.range)!)
        if (!presentations) return;

        return presentations.map((presentation) => {
            let item: languages.IColorPresentation = {
                label: presentation.label
            };
            if (presentation.textEdit) {
                item.textEdit = toTextEdit(presentation.textEdit);
            }
            if (presentation.additionalTextEdits) {
                (item.additionalTextEdits as any) =
                    presentation.additionalTextEdits.map(toTextEdit);
            }
            return item;
        });
    }
}

export function useCssColorInHtml() {
    monaco.languages.registerColorProvider(
        languageNames.html,
        new CssDocumentColorAdapter()
    )
}