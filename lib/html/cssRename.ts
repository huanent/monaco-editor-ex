import { languageNames } from "../constants";
import { getCssService, toWorkspaceEdit } from "../css/utils";
import type { CancellationToken, Position, editor, languages } from "../monaco";
import { htmlRegionCache } from "./htmlRegionCache";
import { toLsPosition } from "./utils";
import { monaco } from "../monaco"

class CssRenameAdapter implements languages.RenameProvider {
    provideRenameEdits(model: editor.ITextModel, position: Position, newName: string, _token: CancellationToken): languages.ProviderResult<languages.WorkspaceEdit & languages.Rejection> {
        const regions = htmlRegionCache.get(model);
        if (regions.getLanguageAtPosition(position) != languageNames.css) return;
        const cssDocument = regions.getEmbeddedDocument(languageNames.css);
        const cssService = getCssService()
        const style = cssService.parseStylesheet(cssDocument);
        const edit = cssService.doRename(cssDocument, toLsPosition(position), newName, style)
        return toWorkspaceEdit(edit);
    }
}

export function useCssRenameInHtml() {
    monaco.languages.registerRenameProvider(
        languageNames.html,
        new CssRenameAdapter()
    )
}