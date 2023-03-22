import { displayPartsToString } from "../javascript/utils";
import { languageNames } from "../constants";
import type { languages, editor, Position, CancellationToken } from "../monaco";
import { monaco } from "../monaco"
import { htmlRegionCache } from "./htmlRegionCache";
import { getEmbeddedJavascriptUri, tagToString, textSpanToRange } from "./utils";

class JavascriptQuickInfoAdapter implements languages.HoverProvider {
    public async provideHover(
        model: editor.ITextModel,
        position: Position,
        _token: CancellationToken
    ): Promise<languages.Hover | undefined> {
        const regions = htmlRegionCache.get(model);
        if (regions.getLanguageAtPosition(position) != languageNames.javascript) return;
        const workerGetter = await monaco.languages.typescript.getJavaScriptWorker()
        const worker = await workerGetter(getEmbeddedJavascriptUri(model))
        const javascriptModel = monaco.editor.getModel(getEmbeddedJavascriptUri(model))
        if (!javascriptModel) return
        const offset = javascriptModel.getOffsetAt(position);

        if (model.isDisposed()) {
            return;
        }

        const info = await worker.getQuickInfoAtPosition(javascriptModel.uri.toString(), offset);

        if (!info || model.isDisposed()) {
            return;
        }

        const documentation = displayPartsToString(info.documentation);
        const tags = info.tags ? info.tags.map((tag: any) => tagToString(tag)).join('  \n\n') : '';
        const contents = displayPartsToString(info.displayParts);
        return {
            range: textSpanToRange(javascriptModel, info.textSpan),
            contents: [
                {
                    value: '```typescript\n' + contents + '\n```\n'
                },
                {
                    value: documentation + (tags ? '\n\n' + tags : '')
                }
            ]
        };
    }
}

export function useJavascriptQuickInfoInHtml() {
    monaco.languages.registerHoverProvider(languageNames.html, new JavascriptQuickInfoAdapter())
}
