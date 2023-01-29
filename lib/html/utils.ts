import { getLanguageService, Position as HtmlPosition, TextDocument } from "vscode-html-languageservice";
import { editor, Position,monaco } from "../monaco";
import { getCSSLanguageService } from "vscode-css-languageservice"

export const htmlService = getLanguageService();
export const cssService = getCSSLanguageService();

export const languageNames = {
    javascript: "javascript",
    css: "css",
    html: "html",
}

export function toLsPosition(position: Position): HtmlPosition {
    return {
        character: position.column - 1,
        line: position.lineNumber - 1
    }
}

export function modelToDocument(model: editor.IModel) {
    return TextDocument.create(
        model.uri.toString(),
        model.getLanguageId(),
        model.getVersionId(),
        model.getValue()
    );
}

function getEmbeddedUri(model: editor.IModel, languageId: string) {
    return monaco.Uri.joinPath(model.uri, languageId)
}

export function getEmbeddedJavascriptUri(model: editor.IModel) {
    return getEmbeddedUri(model, languageNames.javascript)
}