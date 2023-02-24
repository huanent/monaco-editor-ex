import {
    getCSSLanguageService,
    Command,
    CompletionItemKind,
    Range,
    TextEdit,
    MarkupContent,
    MarkedString,
    FoldingRangeKind,
    WorkspaceEdit,
    SymbolKind,
    Location,
    DocumentHighlightKind
} from "vscode-css-languageservice"
import type { IMarkdownString, IRange, languages, Range as MonacoRange } from "../monaco"
import { monaco } from "../monaco"

export function getCssService() {
    return getCSSLanguageService()
}

export function toCommand(c: Command | undefined): languages.Command | undefined {
    return c && c.command === 'editor.action.triggerSuggest'
        ? { id: c.command, title: c.title, arguments: c.arguments }
        : undefined;
}

export function toCompletionItemKind(kind: number | undefined): languages.CompletionItemKind {
    const mItemKind = monaco.languages.CompletionItemKind;

    switch (kind) {
        case CompletionItemKind.Text:
            return mItemKind.Text;
        case CompletionItemKind.Method:
            return mItemKind.Method;
        case CompletionItemKind.Function:
            return mItemKind.Function;
        case CompletionItemKind.Constructor:
            return mItemKind.Constructor;
        case CompletionItemKind.Field:
            return mItemKind.Field;
        case CompletionItemKind.Variable:
            return mItemKind.Variable;
        case CompletionItemKind.Class:
            return mItemKind.Class;
        case CompletionItemKind.Interface:
            return mItemKind.Interface;
        case CompletionItemKind.Module:
            return mItemKind.Module;
        case CompletionItemKind.Property:
            return mItemKind.Property;
        case CompletionItemKind.Unit:
            return mItemKind.Unit;
        case CompletionItemKind.Value:
            return mItemKind.Value;
        case CompletionItemKind.Enum:
            return mItemKind.Enum;
        case CompletionItemKind.Keyword:
            return mItemKind.Keyword;
        case CompletionItemKind.Snippet:
            return mItemKind.Snippet;
        case CompletionItemKind.Color:
            return mItemKind.Color;
        case CompletionItemKind.File:
            return mItemKind.File;
        case CompletionItemKind.Reference:
            return mItemKind.Reference;
    }
    return mItemKind.Property;
}

export function toRange(range: Range | undefined): MonacoRange | undefined {
    if (!range) {
        return void 0;
    }
    return new monaco.Range(
        range.start.line + 1,
        range.start.character + 1,
        range.end.line + 1,
        range.end.character + 1
    );
}

export function toTextEdit(textEdit: TextEdit | undefined): languages.TextEdit | undefined {
    if (!textEdit) {
        return void 0;
    }
    return {
        range: toRange(textEdit.range)!,
        text: textEdit.newText
    };
}

export function toMarkedStringArray(
    contents: MarkupContent | MarkedString | MarkedString[]
): IMarkdownString[] | undefined {
    if (!contents) {
        return void 0;
    }
    if (Array.isArray(contents)) {
        return contents.map(toMarkdownString);
    }
    return [toMarkdownString(contents)];
}

function toMarkdownString(entry: MarkupContent | MarkedString): IMarkdownString {
    if (typeof entry === 'string') {
        return {
            value: entry
        };
    }
    if (isMarkupContent(entry)) {
        if (entry.kind === 'plaintext') {
            return {
                value: entry.value.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&')
            };
        }
        return {
            value: entry.value
        };
    }

    return { value: '```' + entry.language + '\n' + entry.value + '\n```\n' };
}

function isMarkupContent(thing: any): thing is MarkupContent {
    return (
        thing && typeof thing === 'object' && typeof (<MarkupContent>thing).kind === 'string'
    );
}


export function toFoldingRangeKind(
    kind: FoldingRangeKind
): languages.FoldingRangeKind | undefined {
    switch (kind) {
        case FoldingRangeKind.Comment:
            return monaco.languages.FoldingRangeKind.Comment;
        case FoldingRangeKind.Imports:
            return monaco.languages.FoldingRangeKind.Imports;
        case FoldingRangeKind.Region:
            return monaco.languages.FoldingRangeKind.Region;
        default:
            return;
    }
}

export function fromRange(range: IRange | undefined): Range | undefined {
    if (!range) {
        return void 0;
    }
    return {
        start: {
            line: range.startLineNumber - 1,
            character: range.startColumn - 1
        },
        end: { line: range.endLineNumber - 1, character: range.endColumn - 1 }
    };
}

export function toWorkspaceEdit(edit: WorkspaceEdit | null): languages.WorkspaceEdit | undefined {
    if (!edit || !edit.changes) {
        return void 0;
    }
    let resourceEdits: languages.IWorkspaceTextEdit[] = [];
    for (let uri in edit.changes) {
        const _uri = monaco.Uri.parse(uri);
        for (let e of edit.changes[uri]) {
            resourceEdits.push({
                resource: _uri,
                versionId: undefined,
                textEdit: {
                    range: toRange(e.range)!,
                    text: e.newText
                }
            });
        }
    }
    return {
        edits: resourceEdits
    };
}

export function toSymbolKind(kind: SymbolKind): languages.SymbolKind {
    let mKind = monaco.languages.SymbolKind;

    switch (kind) {
        case SymbolKind.File:
            return mKind.Array;
        case SymbolKind.Module:
            return mKind.Module;
        case SymbolKind.Namespace:
            return mKind.Namespace;
        case SymbolKind.Package:
            return mKind.Package;
        case SymbolKind.Class:
            return mKind.Class;
        case SymbolKind.Method:
            return mKind.Method;
        case SymbolKind.Property:
            return mKind.Property;
        case SymbolKind.Field:
            return mKind.Field;
        case SymbolKind.Constructor:
            return mKind.Constructor;
        case SymbolKind.Enum:
            return mKind.Enum;
        case SymbolKind.Interface:
            return mKind.Interface;
        case SymbolKind.Function:
            return mKind.Function;
        case SymbolKind.Variable:
            return mKind.Variable;
        case SymbolKind.Constant:
            return mKind.Constant;
        case SymbolKind.String:
            return mKind.String;
        case SymbolKind.Number:
            return mKind.Number;
        case SymbolKind.Boolean:
            return mKind.Boolean;
        case SymbolKind.Array:
            return mKind.Array;
    }
    return mKind.Function;
}

export function toLocation(location: Location): languages.Location {
    return {
        uri: monaco.Uri.parse(location.uri),
        range: toRange(location.range)!
    };
}

export function toDocumentHighlightKind(
    kind: DocumentHighlightKind | undefined
): languages.DocumentHighlightKind {
    switch (kind) {
        case DocumentHighlightKind.Read:
            return monaco.languages.DocumentHighlightKind.Read;
        case DocumentHighlightKind.Write:
            return monaco.languages.DocumentHighlightKind.Write;
        case DocumentHighlightKind.Text:
            return monaco.languages.DocumentHighlightKind.Text;
    }
    return monaco.languages.DocumentHighlightKind.Text;
}