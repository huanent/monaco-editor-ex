import { languageNames } from "../constants";
import { IDisposable, Position, editor, languages } from "../monaco";
import { monaco } from "../monaco";
import { getModuleByOffset } from "./ast";
import { Module, getModule } from "./moduleState";
import { getModuleKey, trimPathPrefix, trimScriptPathExtension } from "./utils";

class ModuleSuggestAdapter
    implements languages.CompletionItemProvider {
    triggerCharacters = ["/"];
    async provideCompletionItems(
        model: editor.ITextModel,
        position: Position
    ): Promise<languages.CompletionList | undefined> {
        const suggestions = await getSuggestions();
        return getModuleSuggest(model, position, suggestions);
    }
}

export function getModuleSuggest(model: editor.ITextModel, position: Position, suggestions: string[]) {
    let module: Module | undefined;
    let offset: number | undefined;
    module = getModule(getModuleKey(model.uri));
    offset = model.getOffsetAt(position);
    if (!module || !offset) return;
    const moduleNode = getModuleByOffset(module.ast, offset);
    if (!moduleNode) return;
    const currentModelPath = getModuleKey(model.uri)
    const prefix = moduleNode.value.substring(0, offset - moduleNode.start)
    const items = suggestions
        .map(m => trimScriptPathExtension(m))
        .filter((f) => f.startsWith(prefix) && getModuleKey(f) != currentModelPath);
    if (!items.length) return;
    const moduleOffset = model.getOffsetAt(position) - offset;
    return {
        suggestions: items.map((m) => ({
            insertText: m.substring(offset! - moduleNode.start - 1),
            kind: monaco.languages.CompletionItemKind.File,
            label: trimPathPrefix(m),
            range: monaco.Range.fromPositions(
                position,
                model.getPositionAt(moduleNode.end - 1 + moduleOffset)
            ),
        })),
        incomplete: true,
    };
}

let initialized = false;
let disposables: IDisposable[] = [];
let _suggestions: (() => Promise<string[]>) | string[] | undefined;

async function getSuggestions() {
    if (!_suggestions) return [];
    if (Array.isArray(_suggestions)) return _suggestions;
    return await _suggestions();
}

function dispose() {
    initialized = false;
    _suggestions = undefined;
    disposables.forEach((d) => d && d.dispose());
    disposables.length = 0;
}


export function useJavascriptModuleSuggest(modules?: (() => Promise<string[]>) | string[]) {
    _suggestions = modules;
    if (initialized) return dispose;
    initialized = true;
    disposables.push(monaco.languages.registerCompletionItemProvider(languageNames.javascript, new ModuleSuggestAdapter()))
    disposables.push(monaco.languages.registerCompletionItemProvider(languageNames.typescript, new ModuleSuggestAdapter()))
    return dispose;
}
