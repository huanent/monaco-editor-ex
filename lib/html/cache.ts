import { editor } from "../monaco";
import { getDocumentRegions, HTMLDocumentRegions } from "./embeddedSupport";
import { htmlService, modelToDocument } from "./utils";

const HtmlRegionsMap: Record<string, HTMLDocumentRegions> = {}

export function getHtmlRegions(model: editor.IModel) {
    const uri = model.uri.toString();
    let htmlRegions = HtmlRegionsMap[uri]

    if (!htmlRegions || htmlRegions.versionId != model.getVersionId()) {
        htmlRegions = getDocumentRegions(htmlService, modelToDocument(model));
        HtmlRegionsMap[uri] = htmlRegions;
    }

    return htmlRegions;
}