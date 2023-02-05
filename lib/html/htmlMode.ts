import { htmlService, modelToDocument, toLsPosition } from "./utils";
import { editor, monaco} from "../monaco";
import { languageNames } from "../constants";

export class HtmlAutoCloseTagAdapter {
    constructor() {
        monaco.editor.onDidCreateEditor(this.didCreateEditor)
    }
    private didCreateEditor(ed: editor.ICodeEditor) {
        ed.onDidChangeModelContent(e => {
            var model = ed.getModel();
            if (model?.getLanguageId() != languageNames.html) return;
            if (e.isRedoing || e.isUndoing || e.changes.length != 1) return;

            const change = e.changes[0];
            if (change.text == ">") {
                var document = modelToDocument(model);
                const position = new monaco.Position(change.range.endLineNumber, change.range.endColumn + 1);
                var close = htmlService.doTagComplete(document, toLsPosition(position), htmlService.parseHTMLDocument(document))
                if (!close?.startsWith("$0")) return;

                ed.executeEdits(null, [{
                    text: close.substring(2)!,
                    range: new monaco.Range(
                        change.range.endLineNumber,
                        change.range.endColumn + 1,
                        change.range.endLineNumber,
                        change.range.endColumn + 1
                    ),
                }], [
                    new monaco.Selection(
                        change.range.endLineNumber,
                        change.range.endColumn + 1,
                        change.range.endLineNumber,
                        change.range.endColumn + 1
                    )
                ])
            }
        })
    }
}