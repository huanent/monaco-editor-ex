import { displayPartsToString } from "../javascript/utils";
import { languageNames } from "../constants";
import { getJavascriptWorker } from "../javascript/utils";
import type { languages, editor, Position, CancellationToken, Uri } from "../monaco";
import { monaco } from "../monaco";
import { getWordRange } from "../utils";
import { htmlRegionCache } from "./htmlRegionCache";
import { getEmbeddedJavascriptUri, tagToString, Kind } from "./utils";
import { snippetSuggestions } from "../javascript";
import { EmbeddedRegion } from "./embeddedSupport";

interface JavascriptCompletionItem extends languages.CompletionItem {
    label: string;
    uri: Uri;
    position: Position;
    offset: number;
}

type SuggestFilter = (uri: Uri, regin: EmbeddedRegion, suggestions: any[]) => any[];
let suggestFilter: SuggestFilter | undefined

class JavascriptSuggestAdapter implements languages.CompletionItemProvider {
    triggerCharacters = ["."];
    async provideCompletionItems(model: editor.ITextModel, position: Position, _context: languages.CompletionContext, _token: CancellationToken): Promise<languages.CompletionList | undefined> {
        const regions = htmlRegionCache.get(model);
        const region = regions.getRegionAtPosition(position)
        if (region?.languageId != languageNames.javascript) return;
        const wordRange = getWordRange(model, position);
        const worker = await getJavascriptWorker(model.uri)
        const javascriptModel = monaco.editor.getModel(getEmbeddedJavascriptUri(model))
        if (!javascriptModel) return
        const offset = javascriptModel.getOffsetAt(position);
        const info = await worker.getCompletionsAtPosition(javascriptModel.uri.toString(), offset!)
        let entries = info.entries;

        if (!info?.entries || model.isDisposed()) {
            return;
        }

        if (suggestFilter) {
            entries = suggestFilter(model.uri, region, entries)
        }

        let suggestions: JavascriptCompletionItem[] = entries.map((entry: any) => {
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
                kind: JavascriptSuggestAdapter.convertKind(entry.kind),
                tags
            };
        });

        return {
            suggestions: [...snippetSuggestions().suggestions, ...suggestions],
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
            kind: JavascriptSuggestAdapter.convertKind(details.kind),
            detail: displayPartsToString(details.displayParts),
            documentation: {
                value: JavascriptSuggestAdapter.createDocumentationString(details)
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

export function useJavascriptSuggestInHtml() {
    monaco.languages.registerCompletionItemProvider(languageNames.html, new JavascriptSuggestAdapter())
}

export function useJavascriptInHtmlSuggestFilter(filter: SuggestFilter) {
    suggestFilter = filter;
}