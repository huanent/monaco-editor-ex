import { editor } from "../monaco";
import { HTMLDocumentRegions, getDocumentRegions } from "./embeddedSupport";
import { Cache } from "../cache";
import { getHtmlService, modelToDocument } from "./utils";

export class HtmlRegionCache extends Cache<HTMLDocumentRegions>{
    _getCache(model: editor.ITextModel) {
        const htmlService = getHtmlService();
        return getDocumentRegions(htmlService, modelToDocument(model));
    }
}

export const htmlRegionCache = new HtmlRegionCache("HtmlRegion")