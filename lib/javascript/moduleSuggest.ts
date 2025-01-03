import { languageNames } from "../constants";
import { IDisposable, Position, editor, languages } from "../monaco";
import { monaco } from "../monaco";
import { isFileUri, isRelative } from "../utils";
import { getModuleByOffset } from "./ast";
import { getModule, Module } from "./moduleState";
import { getModuleKey } from "./utils";

interface SuggestContext {
    uri: string,
    prefix: string,
    relative: boolean
}

type Callback = (context: SuggestContext) => Promise<string[]> | string[]

interface Options {
    callback?: Callback,
    triggerCharacters: string[]
}

export type Suggestion = Options | Callback | string[] | undefined

let initialized = false;
let disposables: IDisposable[] = [];
let suggestion: Suggestion;

class ModuleSuggestAdapter
    implements languages.CompletionItemProvider {
    triggerCharacters = ["/"];

    constructor() {
        if (suggestion && "triggerCharacters" in suggestion) {
            this.triggerCharacters = suggestion.triggerCharacters
        }
    }
    async provideCompletionItems(
        model: editor.ITextModel,
        position: Position
    ): Promise<languages.CompletionList | undefined> {
        return getModuleSuggest(model, position, suggestion);
    }
}

function dispose() {
    initialized = false;
    suggestion = undefined;
    disposables.forEach((d) => d && d.dispose());
    disposables.length = 0;
}


export function useJavascriptModuleSuggest(options?: Suggestion) {
    suggestion = options;
    if (initialized) return dispose;
    initialized = true;
    disposables.push(monaco.languages.registerCompletionItemProvider(languageNames.javascript, new ModuleSuggestAdapter()))
    disposables.push(monaco.languages.registerCompletionItemProvider(languageNames.typescript, new ModuleSuggestAdapter()))
    return dispose;
}

export async function getModuleSuggest(model: editor.ITextModel, position: Position, suggestion: Suggestion) {
    let module: Module | undefined;
    let offset: number | undefined;
    const key = getModuleKey(model.uri);
    module = getModule(key);
    offset = model.getOffsetAt(position);
    if (!module || !offset) return;
    const moduleNode = getModuleByOffset(module.ast, offset);
    if (!moduleNode) return;
    const currentModelPath = getModuleKey(model.uri)
    const prefix = moduleNode.value.substring(0, offset - moduleNode.start)
    const isRelativePrefix = isRelative(prefix)
    const context: SuggestContext = { uri: key, prefix: prefix, relative: isRelativePrefix };
    let suggestions = await getSuggestions(suggestion, context)
    const moduleOffset = model.getOffsetAt(position) - offset;

    function transformSuggestions() {
        var result: languages.CompletionItem[] = [];
        if (prefix.endsWith("//") || prefix.endsWith("/.") || prefix.endsWith("/..")) return result;

        const { basePath, relative } = getBasePath(key, prefix);

        for (const item of suggestions) {
            if (getModuleKey(item) == currentModelPath) continue;
            let label = item;
            let insertText = item;
            let kind = monaco.languages.CompletionItemKind.Module;

            if (isRelativePrefix) {
                if (!item.startsWith(basePath)) continue;
                const path = item.substring(basePath.length + 1);
                const slugIndex = path.indexOf('/');
                if (slugIndex > -1) {
                    label = path.substring(0, slugIndex);
                    kind = monaco.languages.CompletionItemKind.Folder;
                } else {
                    label = path;
                    kind = monaco.languages.CompletionItemKind.File;
                }
                insertText = `${relative}/${label}`;
            } else {
                if (isFileUri(item)) continue;
                if (!item.startsWith(prefix)) continue;
            }

            insertText = insertText.substring(offset! - moduleNode!.start - 1)
            if (!insertText) continue;

            result.push({
                insertText: insertText,
                kind: kind,
                label: label,
                sortText: '!' + label,
                range: monaco.Range.fromPositions(
                    position,
                    model.getPositionAt(moduleNode!.end - 1 + moduleOffset)
                ),
            })
        }
        return result;
    }

    return {
        suggestions: transformSuggestions(),
        incomplete: true,
    };
}

export function getBasePath(uri: string, relative: string) {
    uri = uri.substring(0, uri.lastIndexOf('/'))
    relative = relative.substring(0, relative.lastIndexOf('/'))
    const start = []

    for (const item of relative.split('/')) {
        if (!item) continue
        if (item == '..') {
            uri = uri.substring(0, uri.lastIndexOf('/'))
        } else if (item != '.') {
            uri = [uri, item].join('/')
        }
        start.push(item);
    }
    return { basePath: uri, relative: start.join('/') };
}

async function getSuggestions(suggestion: Suggestion, context: SuggestContext) {
    if (!suggestion) return [];
    if (Array.isArray(suggestion)) return suggestion;

    if (typeof suggestion === "function") {
        return await suggestion(context);
    }

    if (!suggestion.callback) return []
    return await suggestion.callback(context)
}