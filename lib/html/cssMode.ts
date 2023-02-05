import {
    InsertTextFormat,
    Command as CssCommand,
    CompletionItemKind as CssCompletionItemKind,
    Range as CssRange,
    TextEdit as CssTextEdit,
    MarkupContent,
    MarkedString,
    DocumentHighlightKind,
    Location as CssLocation,
    SymbolKind as CssSymbolKind,
    WorkspaceEdit as CssWorkspaceEdit,
    FoldingRangeKind as CssFoldingRangeKind
} from "vscode-css-languageservice";

import {
    monaco, CancellationToken,
    editor,
    IEvent,
    IMarkdownString,
    IRange,
    languages,
    Position,
    Range,
    Uri
} from "../monaco"

import { cssService, toLsPosition } from "./utils";
import { htmlRegionCache } from "./htmlRegionCache";
import { languageNames } from "../constants";
import { getWordRange } from "../utils";


export class CssInHtmlSuggestAdapter implements languages.CompletionItemProvider {
    triggerCharacters = ['/', '-', ':'];
    async provideCompletionItems(model: editor.ITextModel, position: Position, _context: languages.CompletionContext, _token: CancellationToken): Promise<languages.CompletionList | undefined> {
        const regions = htmlRegionCache.getCache(model);
        if (regions.getLanguageAtPosition(position) != languageNames.css) return;
        const wordRange = getWordRange(model, position);

        const cssDocument = regions.getEmbeddedDocument(languageNames.css, true);
        if (!cssDocument) return;

        const style = cssService.parseStylesheet(cssDocument);
        const info = cssService.doComplete(cssDocument, toLsPosition(position), style)

        if (!info || model.isDisposed()) return;

        const items: languages.CompletionItem[] = info.items.map((entry) => {
            const item: languages.CompletionItem & { uri: Uri; position: Position } = {
                uri: model.uri,
                position: position,
                label: entry.label,
                insertText: entry.insertText || entry.label,
                sortText: entry.sortText,
                filterText: entry.filterText,
                documentation: entry.documentation,
                detail: entry.detail,
                command: toCommand(entry.command),
                range: wordRange,
                kind: toCompletionItemKind(entry.kind)
            };

            if (entry.textEdit) {
                if ("range" in entry.textEdit) {
                    (item.range as any) = toRange(entry.textEdit.range);
                } else {
                    (item.range as any) = {
                        insert: toRange(entry.textEdit.insert),
                        replace: toRange(entry.textEdit.replace)
                    };

                }
                item.insertText = entry.textEdit.newText;
            }

            if (entry.additionalTextEdits) {
                item.additionalTextEdits =
                    entry.additionalTextEdits.map<languages.TextEdit>(toTextEdit as any);
            }

            if (entry.insertTextFormat === InsertTextFormat.Snippet) {
                item.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
            }

            return item;
        });

        return {
            incomplete: info.isIncomplete,
            suggestions: items
        }
    }
}

export class CssInHtmlHoverAdapter implements languages.HoverProvider {
    async provideHover(
        model: editor.IReadOnlyModel,
        position: Position,
        _token: CancellationToken
    ): Promise<languages.Hover | undefined> {
        const regions = htmlRegionCache.getCache(model);
        if (regions.getLanguageAtPosition(position) != languageNames.css) return;
        const cssDocument = regions.getEmbeddedDocument(languageNames.css, true);
        const style = cssService.parseStylesheet(cssDocument);
        const info = cssService.doHover(cssDocument, toLsPosition(position), style)
        if (!info) return;
        return <languages.Hover>{
            range: toRange(info.range),
            contents: toMarkedStringArray(info.contents)
        };
    }
}

export class CssInHtmlDocumentHighlightAdapter implements languages.DocumentHighlightProvider {
    async provideDocumentHighlights(
        model: editor.IReadOnlyModel,
        position: Position,
        _token: CancellationToken
    ): Promise<languages.DocumentHighlight[] | undefined> {
        const regions = htmlRegionCache.getCache(model);
        if (regions.getLanguageAtPosition(position) != languageNames.css) return;
        const cssDocument = regions.getEmbeddedDocument(languageNames.css, true);
        const style = cssService.parseStylesheet(cssDocument);
        const entries = cssService.findDocumentHighlights(cssDocument, toLsPosition(position), style)
        if (!entries) return;

        return entries.map((entry) => {
            return <languages.DocumentHighlight>{
                range: toRange(entry.range),
                kind: toDocumentHighlightKind(entry.kind)
            };
        });
    }
}

export class CssInHtmlDefinitionAdapter implements languages.DefinitionProvider {
    async provideDefinition(model: editor.ITextModel, position: Position, _token: CancellationToken): Promise<languages.Definition | undefined> {
        const regions = htmlRegionCache.getCache(model);
        if (regions.getLanguageAtPosition(position) != languageNames.css) return;
        const cssDocument = regions.getEmbeddedDocument(languageNames.css, true);
        const style = cssService.parseStylesheet(cssDocument);
        const definition = cssService.findDefinition(cssDocument, toLsPosition(position), style)
        if (!definition) {
            return;
        }
        return [toLocation(definition)];
    }


}

export class CssInHtmlReferenceAdapter implements languages.ReferenceProvider {
    async provideReferences(model: editor.ITextModel, position: Position, _context: languages.ReferenceContext, _token: CancellationToken): Promise<languages.Location[] | undefined> {
        const regions = htmlRegionCache.getCache(model);
        if (regions.getLanguageAtPosition(position) != languageNames.css) return;
        const cssDocument = regions.getEmbeddedDocument(languageNames.css, true);
        const style = cssService.parseStylesheet(cssDocument);
        const entries = cssService.findReferences(cssDocument, toLsPosition(position), style)
        if (!entries) return;
        return entries.map(toLocation);
    }
}

export class CssInHtmlDocumentColorAdapter implements languages.DocumentColorProvider {
    async provideDocumentColors(
        model: editor.IReadOnlyModel,
        _token: CancellationToken
    ): Promise<languages.IColorInformation[] | undefined> {
        const regions = htmlRegionCache.getCache(model);
        const cssDocument = regions.getEmbeddedDocument(languageNames.css, true);
        const style = cssService.parseStylesheet(cssDocument);
        const infos = cssService.findDocumentColors(cssDocument, style)
        if (!infos) return;

        return infos.map((item) => ({
            color: item.color,
            range: toRange(item.range)!,
        }));
    }

    async provideColorPresentations(
        model: editor.IReadOnlyModel,
        info: languages.IColorInformation,
        _token: CancellationToken
    ): Promise<languages.IColorPresentation[] | undefined> {
        const regions = htmlRegionCache.getCache(model);
        const cssDocument = regions.getEmbeddedDocument(languageNames.css, true);
        const style = cssService.parseStylesheet(cssDocument);
        const presentations = cssService.getColorPresentations(cssDocument, style, info.color, fromRange(info.range)!)
        if (!presentations) return;

        return presentations.map((presentation) => {
            let item: languages.IColorPresentation = {
                label: presentation.label
            };
            if (presentation.textEdit) {
                item.textEdit = toTextEdit(presentation.textEdit);
            }
            if (presentation.additionalTextEdits) {
                (item.additionalTextEdits as any) =
                    presentation.additionalTextEdits.map(toTextEdit);
            }
            return item;
        });
    }
}

export class CssInHtmlDocumentSymbolAdapter implements languages.DocumentSymbolProvider {
    async provideDocumentSymbols(model: editor.ITextModel, _token: CancellationToken): Promise<languages.DocumentSymbol[] | undefined> {
        const regions = htmlRegionCache.getCache(model);
        const cssDocument = regions.getEmbeddedDocument(languageNames.css, true);
        const style = cssService.parseStylesheet(cssDocument);
        const items = cssService.findDocumentSymbols(cssDocument, style);
        if (!items) return;

        return items.map<languages.DocumentSymbol>((item) => ({
            name: item.name,
            detail: '',
            containerName: item.containerName,
            kind: toSymbolKind(item.kind),
            range: toRange(item.location.range)!,
            selectionRange: toRange(item.location.range)!,
            tags: []
        }));
    }

}

export class CssInHtmlRenameAdapter implements languages.RenameProvider {
    provideRenameEdits(model: editor.ITextModel, position: Position, newName: string, _token: CancellationToken): languages.ProviderResult<languages.WorkspaceEdit & languages.Rejection> {
        const regions = htmlRegionCache.getCache(model);
        if (regions.getLanguageAtPosition(position) != languageNames.css) return;
        const cssDocument = regions.getEmbeddedDocument(languageNames.css, true);
        const style = cssService.parseStylesheet(cssDocument);
        const edit = cssService.doRename(cssDocument, toLsPosition(position), newName, style)
        return toWorkspaceEdit(edit);
    }
}

export class CssInHtmlFoldingRangeAdapter implements languages.FoldingRangeProvider {
    onDidChange?: IEvent<this> | undefined;
    async provideFoldingRanges(model: editor.ITextModel, _context: languages.FoldingContext, _token: CancellationToken): Promise<languages.FoldingRange[] | undefined> {

        const regions = htmlRegionCache.getCache(model);
        const cssDocument = regions.getEmbeddedDocument(languageNames.css, true);
        const ranges = cssService.getFoldingRanges(cssDocument)
        return ranges.map((range) => {
            const result: languages.FoldingRange = {
                start: range.startLine + 1,
                end: range.endLine + 1
            };
            if (typeof range.kind !== 'undefined') {
                result.kind = toFoldingRangeKind(<CssFoldingRangeKind>range.kind);
            }
            return result;
        });
    }
}

function toCommand(c: CssCommand | undefined): languages.Command | undefined {
    return c && c.command === 'editor.action.triggerSuggest'
        ? { id: c.command, title: c.title, arguments: c.arguments }
        : undefined;
}

function toCompletionItemKind(kind: number | undefined): languages.CompletionItemKind {
    const mItemKind = monaco.languages.CompletionItemKind;

    switch (kind) {
        case CssCompletionItemKind.Text:
            return mItemKind.Text;
        case CssCompletionItemKind.Method:
            return mItemKind.Method;
        case CssCompletionItemKind.Function:
            return mItemKind.Function;
        case CssCompletionItemKind.Constructor:
            return mItemKind.Constructor;
        case CssCompletionItemKind.Field:
            return mItemKind.Field;
        case CssCompletionItemKind.Variable:
            return mItemKind.Variable;
        case CssCompletionItemKind.Class:
            return mItemKind.Class;
        case CssCompletionItemKind.Interface:
            return mItemKind.Interface;
        case CssCompletionItemKind.Module:
            return mItemKind.Module;
        case CssCompletionItemKind.Property:
            return mItemKind.Property;
        case CssCompletionItemKind.Unit:
            return mItemKind.Unit;
        case CssCompletionItemKind.Value:
            return mItemKind.Value;
        case CssCompletionItemKind.Enum:
            return mItemKind.Enum;
        case CssCompletionItemKind.Keyword:
            return mItemKind.Keyword;
        case CssCompletionItemKind.Snippet:
            return mItemKind.Snippet;
        case CssCompletionItemKind.Color:
            return mItemKind.Color;
        case CssCompletionItemKind.File:
            return mItemKind.File;
        case CssCompletionItemKind.Reference:
            return mItemKind.Reference;
    }
    return mItemKind.Property;
}

export function toRange(range: CssRange | undefined): Range | undefined {
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

export function toTextEdit(textEdit: CssTextEdit | undefined): languages.TextEdit | undefined {
    if (!textEdit) {
        return void 0;
    }
    return {
        range: toRange(textEdit.range)!,
        text: textEdit.newText
    };
}

function toMarkedStringArray(
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

function toDocumentHighlightKind(
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

export function fromRange(range: IRange | undefined): CssRange | undefined {
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

function toLocation(location: CssLocation): languages.Location {
    return {
        uri: monaco.Uri.parse(location.uri),
        range: toRange(location.range)!
    };
}

function toSymbolKind(kind: CssSymbolKind): languages.SymbolKind {
    let mKind = monaco.languages.SymbolKind;

    switch (kind) {
        case CssSymbolKind.File:
            return mKind.Array;
        case CssSymbolKind.Module:
            return mKind.Module;
        case CssSymbolKind.Namespace:
            return mKind.Namespace;
        case CssSymbolKind.Package:
            return mKind.Package;
        case CssSymbolKind.Class:
            return mKind.Class;
        case CssSymbolKind.Method:
            return mKind.Method;
        case CssSymbolKind.Property:
            return mKind.Property;
        case CssSymbolKind.Field:
            return mKind.Field;
        case CssSymbolKind.Constructor:
            return mKind.Constructor;
        case CssSymbolKind.Enum:
            return mKind.Enum;
        case CssSymbolKind.Interface:
            return mKind.Interface;
        case CssSymbolKind.Function:
            return mKind.Function;
        case CssSymbolKind.Variable:
            return mKind.Variable;
        case CssSymbolKind.Constant:
            return mKind.Constant;
        case CssSymbolKind.String:
            return mKind.String;
        case CssSymbolKind.Number:
            return mKind.Number;
        case CssSymbolKind.Boolean:
            return mKind.Boolean;
        case CssSymbolKind.Array:
            return mKind.Array;
    }
    return mKind.Function;
}


function toWorkspaceEdit(edit: CssWorkspaceEdit | null): languages.WorkspaceEdit | undefined {
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

function toFoldingRangeKind(
    kind: CssFoldingRangeKind
): languages.FoldingRangeKind | undefined {
    switch (kind) {
        case CssFoldingRangeKind.Comment:
            return monaco.languages.FoldingRangeKind.Comment;
        case CssFoldingRangeKind.Imports:
            return monaco.languages.FoldingRangeKind.Imports;
        case CssFoldingRangeKind.Region:
            return monaco.languages.FoldingRangeKind.Region;
        default:
            return;
    }
}