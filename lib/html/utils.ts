import { getLanguageService, Position as HtmlPosition, TextDocument } from "vscode-html-languageservice";
import { editor, Position,monaco, IRange } from "../monaco";
import { getCSSLanguageService } from "vscode-css-languageservice"
import type ts from "typescript";
import { languageNames } from "../constants";

export const htmlService = getLanguageService();
export const cssService = getCSSLanguageService();

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

export function textSpanToRange(model: editor.ITextModel, span: ts.TextSpan): IRange {
    let p1 = model.getPositionAt(span.start);
    let p2 = model.getPositionAt(span.start + span.length);
    let { lineNumber: startLineNumber, column: startColumn } = p1;
    let { lineNumber: endLineNumber, column: endColumn } = p2;
    return { startLineNumber, startColumn, endLineNumber, endColumn };
}