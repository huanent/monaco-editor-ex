import { FoldingRangeKind } from "vscode-css-languageservice";
import { languageNames } from "../constants";
import { getCssService, toFoldingRangeKind } from "../css/utils";
import type { CancellationToken, IEvent, editor, languages } from "../monaco";
import { htmlRegionCache } from "./htmlRegionCache";
import { monaco } from "../monaco"

class CssFoldingRangeAdapter implements languages.FoldingRangeProvider {
    onDidChange?: IEvent<this> | undefined;
    async provideFoldingRanges(model: editor.ITextModel, _context: languages.FoldingContext, _token: CancellationToken): Promise<languages.FoldingRange[] | undefined> {

        const regions = htmlRegionCache.get(model);
        const cssDocument = regions.getEmbeddedDocument(languageNames.css);
        const cssService = getCssService();
        const ranges = cssService.getFoldingRanges(cssDocument)
        return ranges.map((range) => {
            const result: languages.FoldingRange = {
                start: range.startLine + 1,
                end: range.endLine + 1
            };
            if (typeof range.kind !== 'undefined') {
                result.kind = toFoldingRangeKind(<FoldingRangeKind>range.kind);
            }
            return result;
        });
    }
}

export function useCssFoldingRangeInHtml() {
    monaco.languages.registerFoldingRangeProvider(
        languageNames.html,
        new CssFoldingRangeAdapter()
    )
}