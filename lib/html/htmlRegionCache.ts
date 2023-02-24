import { editor } from "monaco-editor";
import { HTMLDocumentRegions, getDocumentRegions } from "./embeddedSupport";
import { Cache } from "../cache";
import { htmlService, modelToDocument } from "./utils";

export class HtmlRegionCache extends Cache<HTMLDocumentRegions>{
    _getCache(model: editor.ITextModel) {
        return getDocumentRegions(htmlService, modelToDocument(model));
    }
}

export const htmlRegionCache = new HtmlRegionCache("HtmlRegion")