import { editor } from "monaco-editor";
import { Cache } from "../cache";
import { cssService } from "./utils";
import { Stylesheet } from "vscode-css-languageservice";
import { htmlRegionCache } from "./htmlRegionCache";
import { languageNames } from "../constants";

export class StylesheetCache extends Cache<Stylesheet>{
    getCache(model: editor.ITextModel) {
        const regions = htmlRegionCache.getCache(model);
        const cssDocument = regions.getEmbeddedDocument(languageNames.css, true);
        return cssService.parseStylesheet(cssDocument);
    }
}

export const stylesheetCache = new StylesheetCache("HtmlStylesheet")