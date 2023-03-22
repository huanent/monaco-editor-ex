import jsSnippets from "./defines.json";
import type { languages, Range } from "../../monaco";
import { monaco } from "../../monaco";
import { languageNames } from "../../constants";

type CompletionItemLabel = languages.CompletionItemLabel;

interface Snippet {
    name: string;
    prefix: string;
    body: string | string[];
    description: string;
}

class SnippetCompletion implements languages.CompletionItem {
    label: CompletionItemLabel;
    insertText: string;
    range: Range | { insert: Range; replace: Range };
    kind: languages.CompletionItemKind;
    insertTextRules: languages.CompletionItemInsertTextRule;
    detail?: string;

    constructor(
        readonly snippet: Snippet,
        range: Range | { insert: Range; replace: Range }
    ) {
        this.label = { label: snippet.prefix, description: snippet.name };
        this.detail = snippet.description;
        this.insertText =
            typeof snippet.body === "string" ? snippet.body : snippet.body.join("\n");
        this.range = range;
        this.kind = monaco.languages.CompletionItemKind.Snippet;
        this.insertTextRules =
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
    }
}

export const snippetSuggestions = () => ({
    suggestions: Object.entries(jsSnippets).map(
        ([name, s]) =>
            new SnippetCompletion(
                {
                    name,
                    ...s,
                },
                undefined as any
            )
    ),
});

export function useJavascriptSnippet() {
    monaco.languages.registerCompletionItemProvider(languageNames.javascript, {
        provideCompletionItems: snippetSuggestions,
    });

    monaco.languages.registerCompletionItemProvider(languageNames.typescript, {
        provideCompletionItems: snippetSuggestions,
    });
}
