import { languageNames } from "../constants";
import { getCssService, toCommand, toCompletionItemKind, toRange, toTextEdit } from "../css/utils";
import type { CancellationToken, Position, Uri, editor, languages } from "../monaco";
import { getWordRange } from "../utils";
import { htmlRegionCache } from "./htmlRegionCache";
import { toLsPosition } from "./utils";
import { monaco } from "../monaco"
import { InsertTextFormat } from "vscode-css-languageservice";
import { stylesheetCache } from "./cssCache";

class CssSuggestAdapter implements languages.CompletionItemProvider {
    triggerCharacters = ['/', '-', ':'];
    async provideCompletionItems(model: editor.ITextModel, position: Position, _context: languages.CompletionContext, _token: CancellationToken): Promise<languages.CompletionList | undefined> {
        const regions = htmlRegionCache.get(model);
        if (regions.getLanguageAtPosition(position) != languageNames.css) return;
        const wordRange = getWordRange(model, position);

        const cssDocument = regions.getEmbeddedDocument(languageNames.css, true);
        if (!cssDocument) return;
        const cssService = getCssService();
        const style = stylesheetCache.get(model)
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

export function useCssSuggestInHtml() {
    monaco.languages.registerCompletionItemProvider(
        languageNames.html,
        new CssSuggestAdapter()
    )
}