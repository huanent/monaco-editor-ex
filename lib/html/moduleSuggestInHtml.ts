import { languageNames } from "../constants";
import { getModuleSuggest, Suggestion } from "../javascript";
import { IDisposable, Position, editor, languages } from "../monaco";
import { monaco } from "../monaco";
import { getEmbeddedJavascriptUri } from "./utils";

let initialized = false;
let disposables: IDisposable[] = [];
let suggestion: Suggestion;

class ModuleSuggestAdapter implements languages.CompletionItemProvider {
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
        var javascriptModel = monaco.editor.getModel(getEmbeddedJavascriptUri(model))
        if (!javascriptModel) return;
        return getModuleSuggest(javascriptModel, position, suggestion);
    }
}

function dispose() {
    initialized = false;
    suggestion = [];
    disposables.forEach((d) => d && d.dispose());
    disposables.length = 0;
}

export function useHtmlModuleSuggest(options?: Suggestion) {
    suggestion = options;
    if (initialized) return dispose;
    initialized = true;
    disposables.push(monaco.languages.registerCompletionItemProvider(languageNames.html, new ModuleSuggestAdapter()))
    return dispose;
}
