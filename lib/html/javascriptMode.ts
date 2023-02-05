import { CancellationToken, editor, languages, Position, Uri, monaco, IRange, Range } from "../monaco";
import type ts from "typescript";
import { getEmbeddedJavascriptUri, textSpanToRange } from "./utils";
import { htmlRegionCache } from "./htmlRegionCache";
import { getJavascriptWorker } from "../javascript/utils";
import { getWordRange } from "../utils";
import { Kind } from "./constants";
import { languageNames } from "../constants";

export interface JavascriptCompletionItem extends languages.CompletionItem {
    label: string;
    uri: Uri;
    position: Position;
    offset: number;
}

export class JavascriptInHtmlSuggestAdapter implements languages.CompletionItemProvider {
    triggerCharacters = ["."];
    async provideCompletionItems(model: editor.ITextModel, position: Position, _context: languages.CompletionContext, _token: CancellationToken): Promise<languages.CompletionList | undefined> {
        const regions = htmlRegionCache.getCache(model);
        if (regions.getLanguageAtPosition(position) != languageNames.javascript) return;
        const wordRange = getWordRange(model, position);
        const worker = await getJavascriptWorker(model.uri)
        const javascriptModel = monaco.editor.getModel(getEmbeddedJavascriptUri(model))
        if (!javascriptModel) return
        const offset = javascriptModel.getOffsetAt(position);
        var info = await worker.getCompletionsAtPosition(javascriptModel.uri.toString(), offset!)

        if (!info || model.isDisposed()) {
            return;
        }

        const suggestions: JavascriptCompletionItem[] = info.entries.map((entry: any) => {
            let range = wordRange;
            if (entry.replacementSpan) {
                const p1 = model.getPositionAt(entry.replacementSpan.start);
                const p2 = model.getPositionAt(entry.replacementSpan.start + entry.replacementSpan.length);
                range = new monaco.Range(p1.lineNumber, p1.column, p2.lineNumber, p2.column);
            }

            const tags: languages.CompletionItemTag[] = [];
            if (entry.kindModifiers?.indexOf('deprecated') !== -1) {
                tags.push(monaco.languages.CompletionItemTag.Deprecated);
            }

            return {
                uri: javascriptModel.uri,
                position: position,
                offset: offset,
                range: range,
                label: entry.name,
                insertText: entry.name,
                sortText: entry.sortText,
                kind: JavascriptInHtmlSuggestAdapter.convertKind(entry.kind),
                tags
            };
        });

        return {
            suggestions,
        };
    }

    public async resolveCompletionItem(
        item: languages.CompletionItem,
        _token: CancellationToken
    ): Promise<languages.CompletionItem> {
        const myItem = <JavascriptCompletionItem>item;
        const resource = myItem.uri;
        const position = myItem.position;
        const offset = myItem.offset;
        const workerGetter = await monaco.languages.typescript.getJavaScriptWorker()
        const worker = await workerGetter(resource);
        const details = await worker.getCompletionEntryDetails(
            resource.toString(),
            offset,
            myItem.label
        );
        if (!details) {
            return myItem;
        }
        return <JavascriptCompletionItem>{
            uri: resource,
            position: position,
            label: details.name,
            kind: JavascriptInHtmlSuggestAdapter.convertKind(details.kind),
            detail: displayPartsToString(details.displayParts),
            documentation: {
                value: JavascriptInHtmlSuggestAdapter.createDocumentationString(details)
            }
        }
    }

    private static createDocumentationString(details: any): string {
        let documentationString = displayPartsToString(details.documentation);
        if (details.tags) {
            for (const tag of details.tags) {
                documentationString += `\n\n${tagToString(tag)}`;
            }
        }
        return documentationString;
    }

    private static convertKind(kind: string): languages.CompletionItemKind {
        switch (kind) {
            case Kind.primitiveType:
            case Kind.keyword:
                return monaco.languages.CompletionItemKind.Keyword;
            case Kind.variable:
            case Kind.localVariable:
                return monaco.languages.CompletionItemKind.Variable;
            case Kind.memberVariable:
            case Kind.memberGetAccessor:
            case Kind.memberSetAccessor:
                return monaco.languages.CompletionItemKind.Field;
            case Kind.function:
            case Kind.memberFunction:
            case Kind.constructSignature:
            case Kind.callSignature:
            case Kind.indexSignature:
                return monaco.languages.CompletionItemKind.Function;
            case Kind.enum:
                return monaco.languages.CompletionItemKind.Enum;
            case Kind.module:
                return monaco.languages.CompletionItemKind.Module;
            case Kind.class:
                return monaco.languages.CompletionItemKind.Class;
            case Kind.interface:
                return monaco.languages.CompletionItemKind.Interface;
            case Kind.warning:
                return monaco.languages.CompletionItemKind.File;
        }

        return monaco.languages.CompletionItemKind.Property;
    }
}

export class JavascriptInHtmlSignatureHelpAdapter implements languages.SignatureHelpProvider {
    signatureHelpTriggerCharacters = ['(', ',']

    private static _toSignatureHelpTriggerReason(
        context: languages.SignatureHelpContext
    ): ts.SignatureHelpTriggerReason {
        switch (context.triggerKind) {
            case monaco.languages.SignatureHelpTriggerKind.TriggerCharacter:
                if (context.triggerCharacter) {
                    if (context.isRetrigger) {
                        return { kind: 'retrigger', triggerCharacter: context.triggerCharacter as any };
                    } else {
                        return { kind: 'characterTyped', triggerCharacter: context.triggerCharacter as any };
                    }
                } else {
                    return { kind: 'invoked' };
                }

            case monaco.languages.SignatureHelpTriggerKind.ContentChange:
                return context.isRetrigger ? { kind: 'retrigger' } : { kind: 'invoked' };

            case monaco.languages.SignatureHelpTriggerKind.Invoke:
            default:
                return { kind: 'invoked' };
        }
    }

    public async provideSignatureHelp(
        model: editor.ITextModel,
        position: Position,
        _token: CancellationToken,
        context: languages.SignatureHelpContext
    ): Promise<languages.SignatureHelpResult | undefined> {
        const regions = htmlRegionCache.getCache(model);
        if (regions.getLanguageAtPosition(position) != languageNames.javascript) return;
        const workerGetter = await monaco.languages.typescript.getJavaScriptWorker()
        const worker = await workerGetter(getEmbeddedJavascriptUri(model))
        const javascriptModel = monaco.editor.getModel(getEmbeddedJavascriptUri(model))
        if (!javascriptModel) return
        const offset = javascriptModel.getOffsetAt(position);

        if (model.isDisposed()) {
            return;
        }

        const info = await worker.getSignatureHelpItems(javascriptModel.uri.toString(), offset, {
            triggerReason: JavascriptInHtmlSignatureHelpAdapter._toSignatureHelpTriggerReason(context)
        });

        if (!info || model.isDisposed()) {
            return;
        }

        const ret: languages.SignatureHelp = {
            activeSignature: info.selectedItemIndex,
            activeParameter: info.argumentIndex,
            signatures: []
        };

        info.items.forEach((item: any) => {
            const signature: languages.SignatureInformation = {
                label: '',
                parameters: []
            };

            signature.documentation = {
                value: displayPartsToString(item.documentation)
            };
            signature.label += displayPartsToString(item.prefixDisplayParts);
            item.parameters.forEach((p: any, i: any, a: any) => {
                const label = displayPartsToString(p.displayParts);
                const parameter: languages.ParameterInformation = {
                    label: label,
                    documentation: {
                        value: displayPartsToString(p.documentation)
                    }
                };
                signature.label += label;
                signature.parameters.push(parameter);
                if (i < a.length - 1) {
                    signature.label += displayPartsToString(item.separatorDisplayParts);
                }
            });
            signature.label += displayPartsToString(item.suffixDisplayParts);
            ret.signatures.push(signature);
        });

        return {
            value: ret,
            dispose() { }
        };
    }

}

export class JavascriptInHtmlQuickInfoAdapter implements languages.HoverProvider {
    public async provideHover(
        model: editor.ITextModel,
        position: Position,
        _token: CancellationToken
    ): Promise<languages.Hover | undefined> {
        const regions = htmlRegionCache.getCache(model);
        if (regions.getLanguageAtPosition(position) != languageNames.javascript) return;
        const workerGetter = await monaco.languages.typescript.getJavaScriptWorker()
        const worker = await workerGetter(getEmbeddedJavascriptUri(model))
        const javascriptModel = monaco.editor.getModel(getEmbeddedJavascriptUri(model))
        if (!javascriptModel) return
        const offset = javascriptModel.getOffsetAt(position);

        if (model.isDisposed()) {
            return;
        }

        const info = await worker.getQuickInfoAtPosition(javascriptModel.uri.toString(), offset);

        if (!info || model.isDisposed()) {
            return;
        }

        const documentation = displayPartsToString(info.documentation);
        const tags = info.tags ? info.tags.map((tag: any) => tagToString(tag)).join('  \n\n') : '';
        const contents = displayPartsToString(info.displayParts);
        return {
            range: textSpanToRange(javascriptModel, info.textSpan),
            contents: [
                {
                    value: '```typescript\n' + contents + '\n```\n'
                },
                {
                    value: documentation + (tags ? '\n\n' + tags : '')
                }
            ]
        };
    }
}

export class JavascriptInHtmlOccurrencesAdapter implements languages.DocumentHighlightProvider {
    public async provideDocumentHighlights(
        model: editor.ITextModel,
        position: Position,
        _token: CancellationToken
    ): Promise<languages.DocumentHighlight[] | undefined> {
        const regions = htmlRegionCache.getCache(model);
        if (regions.getLanguageAtPosition(position) != languageNames.javascript) return;
        const workerGetter = await monaco.languages.typescript.getJavaScriptWorker()
        const worker = await workerGetter(getEmbeddedJavascriptUri(model))
        const javascriptModel = monaco.editor.getModel(getEmbeddedJavascriptUri(model))
        if (!javascriptModel) return
        const offset = javascriptModel.getOffsetAt(position);

        if (model.isDisposed()) {
            return;
        }

        const entries = await worker.getOccurrencesAtPosition(javascriptModel.uri.toString(), offset);

        if (!entries || model.isDisposed()) {
            return;
        }

        return entries.map((entry) => {
            return <languages.DocumentHighlight>{
                range: textSpanToRange(model, entry.textSpan),
                kind: entry.isWriteAccess
                    ? monaco.languages.DocumentHighlightKind.Write
                    : monaco.languages.DocumentHighlightKind.Text
            };
        });
    }
}

export class JavascriptInHtmlFormattingAdapter implements languages.DocumentFormattingEditProvider {
    async provideDocumentFormattingEdits(model: editor.ITextModel, options: languages.FormattingOptions, _token: CancellationToken): Promise<languages.TextEdit[] | undefined> {
        const workerGetter = await monaco.languages.typescript.getJavaScriptWorker()
        const uri = getEmbeddedJavascriptUri(model);
        const worker = await workerGetter(uri)
        const javascriptModel = monaco.editor.getModel(uri)
        if (!javascriptModel) return;
        const edits = await worker.getFormattingEditsForDocument(uri.toString(), options)

        if (!edits || model.isDisposed()) {
            return;
        }
        return edits.map((edit) => this._convertTextChanges(model, edit));
    }

    protected _convertTextChanges(
        model: editor.ITextModel,
        change: ts.TextChange
    ): languages.TextEdit {
        return {
            text: change.newText,
            range: textSpanToRange(model, change.span)
        };
    }
}

export class JavascriptInHtmlRangeFormattingAdapter implements languages.DocumentRangeFormattingEditProvider {
    async provideDocumentRangeFormattingEdits(model: editor.ITextModel, _range: Range, options: languages.FormattingOptions, _token: CancellationToken): Promise<languages.TextEdit[] | undefined> {
        const workerGetter = await monaco.languages.typescript.getJavaScriptWorker()
        const uri = getEmbeddedJavascriptUri(model);
        const worker = await workerGetter(uri)
        const javascriptModel = monaco.editor.getModel(uri)
        if (!javascriptModel) return;
        const edits = await worker.getFormattingEditsForDocument(uri.toString(), options)

        if (!edits || model.isDisposed()) {
            return;
        }
        return edits.map((edit) => this._convertTextChanges(model, edit));
    }

    protected _convertTextChanges(
        model: editor.ITextModel,
        change: ts.TextChange
    ): languages.TextEdit {
        return {
            text: change.newText,
            range: textSpanToRange(model, change.span)
        };
    }
}


// TODO
// export class JavascriptInHtmlDefinitionProvider implements languages.DefinitionProvider{

// }
//ReferenceAdapter


function displayPartsToString(displayParts: ts.SymbolDisplayPart[] | undefined): string {
    if (displayParts) {
        return displayParts.map((displayPart: any) => displayPart.text).join('');
    }
    return '';
}

function tagToString(tag: ts.JSDocTagInfo): string {
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