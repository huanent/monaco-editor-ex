import { getLanguageService, Position as HtmlPosition, TextDocument, Range as HtmlRange, TextEdit } from "vscode-html-languageservice";
import type { editor, Position, IRange, languages, Uri } from "../monaco";
import { monaco } from "../monaco";
import type ts from "typescript";

export function getHtmlService() {
    return getLanguageService();
}

export function toLsPosition(position: Position): HtmlPosition {
    return {
        character: position.column - 1,
        line: position.lineNumber - 1
    }
}

export function toLsRange(range: IRange): HtmlRange {
    return HtmlRange.create(
        range.startLineNumber - 1,
        range.startColumn - 1,
        range.endLineNumber - 1,
        range.endColumn - 1
    )
}

export function toRange(range: HtmlRange): IRange {
    return {
        startLineNumber: range.start.line + 1,
        startColumn: range.start.character + 1,
        endLineNumber: range.end.line + 1,
        endColumn: range.end.character + 1,
    }
}

export function toTextEdit(textEdit: TextEdit): languages.TextEdit {
    return {
        range: toRange(textEdit.range),
        text: textEdit.newText
    };
}

export function modelToDocument(model: editor.IModel) {
    return TextDocument.create(
        model.uri.toString(),
        model.getLanguageId(),
        model.getVersionId(),
        model.getValue()
    );
}

export function getEmbeddedJavascriptUri(value: editor.IModel | Uri) {
    if ("uri" in value) {
        value = value.uri;
    }
    return monaco.Uri.parse(value.toString() + ".ts")
}

export function textSpanToRange(model: editor.ITextModel, span: ts.TextSpan): IRange {
    let p1 = model.getPositionAt(span.start);
    let p2 = model.getPositionAt(span.start + span.length);
    let { lineNumber: startLineNumber, column: startColumn } = p1;
    let { lineNumber: endLineNumber, column: endColumn } = p2;
    return { startLineNumber, startColumn, endLineNumber, endColumn };
}

export function tagToString(tag: ts.JSDocTagInfo): string {
    let tagLabel = `*@${tag.name}*`;
    if (tag.name === 'param' && tag.text) {
        ``
        const [paramName, ...rest] = tag.text;
        tagLabel += `\`${paramName.text}\``;
        if (rest.length > 0) tagLabel += ` — ${rest.map((r) => r.text).join(' ')}`;
    } else if (Array.isArray(tag.text)) {
        tagLabel += ` — ${tag.text.map((r) => r.text).join(' ')}`;
    } else if (tag.text) {
        tagLabel += ` — ${tag.text}`;
    }
    return tagLabel;
}

export class Kind {
    public static unknown: string = '';
    public static keyword: string = 'keyword';
    public static script: string = 'script';
    public static module: string = 'module';
    public static class: string = 'class';
    public static interface: string = 'interface';
    public static type: string = 'type';
    public static enum: string = 'enum';
    public static variable: string = 'var';
    public static localVariable: string = 'local var';
    public static function: string = 'function';
    public static localFunction: string = 'local function';
    public static memberFunction: string = 'method';
    public static memberGetAccessor: string = 'getter';
    public static memberSetAccessor: string = 'setter';
    public static memberVariable: string = 'property';
    public static constructorImplementation: string = 'constructor';
    public static callSignature: string = 'call';
    public static indexSignature: string = 'index';
    public static constructSignature: string = 'construct';
    public static parameter: string = 'parameter';
    public static typeParameter: string = 'type parameter';
    public static primitiveType: string = 'primitive type';
    public static label: string = 'label';
    public static alias: string = 'alias';
    public static const: string = 'const';
    public static let: string = 'let';
    public static warning: string = 'warning';
}