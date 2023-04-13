import { CancellationToken, editor, languages } from "../monaco";
import { monaco } from "../monaco"
import { languageNames } from "../constants";
import { htmlRegionCache } from "./htmlRegionCache";
import { toLsRange, modelToDocument } from "./utils"
import { getJavascriptWorker } from "../javascript/utils";
import { getHtmlService } from "./utils";
import { toTextEdit as toJsTextEdit } from "../javascript/utils";
import { toTextEdit } from "./utils";
import { getTempUri } from "../utils";

export async function htmlFormat(html: string, options?: languages.FormattingOptions) {
    let htmlModel = monaco.editor.createModel(html, languageNames.html, getTempUri());

    try {
        let htmlRange = toLsRange(htmlModel.getFullModelRange());
        const htmlService = getHtmlService();
        const htmlEdits = htmlService.format(modelToDocument(htmlModel), htmlRange, {})
        htmlModel.applyEdits(htmlEdits.map(m => toTextEdit(m)))
        const ranges = htmlRegionCache.get(htmlModel).getLanguageRanges(htmlRange);
        const javascriptEdits: languages.TextEdit[] = []
        const javascriptRanges = ranges.filter(f => f?.languageId == languageNames.javascript);
        for (const range of javascriptRanges) {
            const javascriptRange = {
                startLineNumber: range.start.line + 2,
                startColumn: 1,
                endLineNumber: range.end.line + 1,
                endColumn: 1,
            }
            var javascriptCode = htmlModel.getValueInRange(javascriptRange)
            let javascriptModel = monaco.editor.createModel(javascriptCode, languageNames.typescript, getTempUri());
            try {
                var indent = javascriptModel.getLineFirstNonWhitespaceColumn(1)
                const indentContent = javascriptModel.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: indent })
                const worker = await getJavascriptWorker(javascriptModel.uri);
                const edits = await worker.getFormattingEditsForDocument(javascriptModel.uri.toString(), {
                    ConvertTabsToSpaces: options?.insertSpaces ?? 2,
                    TabSize: options?.tabSize ?? 2,
                    IndentSize: options?.tabSize ?? 2,
                    IndentStyle: 2,
                    NewLineCharacter: '\n',
                    InsertSpaceAfterCommaDelimiter: true,
                    InsertSpaceAfterSemicolonInForStatements: true,
                    InsertSpaceBeforeAndAfterBinaryOperators: true,
                    InsertSpaceAfterKeywordsInControlFlowStatements: true,
                    InsertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
                    InsertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
                    InsertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
                    InsertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
                    PlaceOpenBraceOnNewLineForControlBlocks: false,
                    PlaceOpenBraceOnNewLineForFunctions: false
                });
                javascriptModel.applyEdits(edits.map(m => toJsTextEdit(javascriptModel, m)));

                var indentEdits = []
                for (let i = 0; i < javascriptModel.getLineCount() - 1; i++) {
                    indentEdits.push({
                        text: indentContent,
                        range: new monaco.Range(i + 1, 1, i + 1, 1)
                    })
                }
                javascriptModel.applyEdits(indentEdits);
                javascriptEdits.push({
                    text: javascriptModel.getValue(),
                    range: javascriptRange
                })
            } catch (error) {

            } finally {
                javascriptModel.dispose();
            }

        }

        htmlModel.applyEdits(javascriptEdits);
        return htmlModel.getValue();
    } catch (error) {
        return undefined;
    } finally {
        htmlModel.dispose();
    }
}


class HtmlFormattingAdapter implements languages.DocumentFormattingEditProvider {
    async provideDocumentFormattingEdits(
        model: editor.ITextModel,
        options: languages.FormattingOptions,
        _token: CancellationToken)
        : Promise<languages.TextEdit[] | undefined> {
        const formatted = await htmlFormat(model.getValue(), options);
        if (formatted) {
            return [{
                text: formatted,
                range: model.getFullModelRange()
            }]
        }

        return [];
    }
}

export function useHtmlFormatting() {
    monaco.languages.html.htmlDefaults.setModeConfiguration({
        ...monaco.languages.html.htmlDefaults.modeConfiguration,
        documentFormattingEdits: false
    })
    monaco.languages.registerDocumentFormattingEditProvider(
        languageNames.html,
        new HtmlFormattingAdapter()
    );
}