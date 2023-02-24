import { editor } from "monaco-editor";
import { Cache } from "../cache";
import { Stylesheet } from "vscode-css-languageservice";
import { htmlRegionCache } from "./htmlRegionCache";
import { languageNames } from "../constants";
import { getCssService } from "../css/utils";

export class StylesheetCache extends Cache<Stylesheet>{
    _getCache(model: editor.ITextModel) {
        const regions = htmlRegionCache.get(model);
        const cssDocument = regions.getEmbeddedDocument(languageNames.css, true);
        const cssService = getCssService();
        return cssService.parseStylesheet(cssDocument);
    }
}

export const stylesheetCache = new StylesheetCache("HtmlStylesheet")