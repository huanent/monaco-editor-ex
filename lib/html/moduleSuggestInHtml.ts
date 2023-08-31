import { languageNames } from "../constants";
import { getModuleSuggest } from "../javascript";
import { IDisposable, Position, editor, languages } from "../monaco";
import { monaco } from "../monaco";
import { getEmbeddedJavascriptUri } from "./utils";

class ModuleSuggestAdapter
    implements languages.CompletionItemProvider {
    triggerCharacters = ["/"];
    async provideCompletionItems(
        model: editor.ITextModel,
        position: Position
    ): Promise<languages.CompletionList | undefined> {
        var javascriptModel = monaco.editor.getModel(getEmbeddedJavascriptUri(model))
        if (!javascriptModel) return;
        const suggestions = await getSuggestions();
        return getModuleSuggest(javascriptModel, position, suggestions);
    }
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
    _suggestions = [];
    disposables.forEach((d) => d && d.dispose());
    disposables.length = 0;
}

export function useHtmlModuleSuggest(modules?: (() => Promise<string[]>) | string[]) {
    _suggestions = modules;
    if (initialized) return dispose;
    initialized = true;
    disposables.push(monaco.languages.registerCompletionItemProvider(languageNames.html, new ModuleSuggestAdapter()))
    return dispose;
}
