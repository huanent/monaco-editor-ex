import { languageNames } from "../constants";
import { getJavascriptWorker } from "../javascript/utils";
import type { languages, editor, CancellationToken } from "../monaco";
import { monaco } from "../monaco"
import { getEmbeddedJavascriptUri, textSpanToRange } from "./utils";
import ts from "typescript";

class JavascriptFoldingRangeAdapter implements languages.FoldingRangeProvider {
    async provideFoldingRanges(model: editor.ITextModel, _context: languages.FoldingContext, _token: CancellationToken): Promise<languages.FoldingRange[] | undefined> {
        const worker = await getJavascriptWorker(model.uri)
        const javascriptModel = monaco.editor.getModel(getEmbeddedJavascriptUri(model))
        if (!javascriptModel) return

        if (model.isDisposed()) {
            return;
        }

        const info: ts.NavigationBarItem[] = await worker.getNavigationBarItems(javascriptModel.uri.toString());
        if (!info) return;
        return convert(info, javascriptModel);
    }
}

const convert = (
    items: ts.NavigationBarItem[],
    model: editor.ITextModel
): languages.FoldingRange[] => {
    var result: languages.FoldingRange[] = []
    for (const item of items) {
        const range = textSpanToRange(model, item.spans[0]);
        if (range.startLineNumber == 1) continue;
        if (range.startLineNumber == range.endLineNumber) continue;
        const folding: languages.FoldingRange = {
            kind: monaco.languages.FoldingRangeKind.Region,
            start: range.startLineNumber,
            end: range.endLineNumber,
        };
        result.push(folding);

        if (item.childItems) {
            result.push(...convert(item.childItems, model));
        }
    }

    return result;
};

export function useJavascriptFoldingRangeInHtml() {
    monaco.languages.registerFoldingRangeProvider(languageNames.html, new JavascriptFoldingRangeAdapter())
}
