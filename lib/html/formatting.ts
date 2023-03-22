import { CancellationToken, editor, languages } from "../monaco";
import { monaco } from "../monaco"
import { languageNames } from "../constants";
import { html_beautify } from "js-beautify"


class HtmlFormattingAdapter implements languages.DocumentFormattingEditProvider {
    async provideDocumentFormattingEdits(
        model: editor.ITextModel,
        _options: languages.FormattingOptions,
        _token: CancellationToken)
        : Promise<languages.TextEdit[] | undefined> {
        const content = model.getValue();
        const formatted = html_beautify(content);
        return [{
            range: model.getFullModelRange(),
            text:formatted
        }];
    }

}

export function useHtmlFormatting() {
    monaco.languages.html.htmlDefaults.setModeConfiguration({
        documentFormattingEdits: false
    })
    monaco.languages.registerDocumentFormattingEditProvider(
        languageNames.html,
        new HtmlFormattingAdapter()
    );
}