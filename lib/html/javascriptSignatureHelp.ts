import { displayPartsToString, SignatureHelpTriggerReason } from "typescript";
import { languageNames } from "../constants";
import type { languages, editor, Position, CancellationToken } from "../monaco";
import { monaco } from "../monaco"
import { htmlRegionCache } from "./htmlRegionCache";
import { getEmbeddedJavascriptUri } from "./utils";

class JavascriptInHtmlSignatureHelpAdapter implements languages.SignatureHelpProvider {
    signatureHelpTriggerCharacters = ['(', ',']

    private static _toSignatureHelpTriggerReason(
        context: languages.SignatureHelpContext
    ): SignatureHelpTriggerReason {
        switch (context.triggerKind) {
            case monaco.languages.SignatureHelpTriggerKind.TriggerCharacter:
                if (context.triggerCharacter) {
                    if (context.isRetrigger) {
                        return { kind: 'retrigger', triggerCharacter: context.triggerCharacter as any };
                    } else {
                        return { kind: 'characterTyped', triggerCharacter: context.triggerCharacter as any };
                    }
                } else {
                    return { kind: 'invoked' };
                }

            case monaco.languages.SignatureHelpTriggerKind.ContentChange:
                return context.isRetrigger ? { kind: 'retrigger' } : { kind: 'invoked' };

            case monaco.languages.SignatureHelpTriggerKind.Invoke:
            default:
                return { kind: 'invoked' };
        }
    }

    public async provideSignatureHelp(
        model: editor.ITextModel,
        position: Position,
        _token: CancellationToken,
        context: languages.SignatureHelpContext
    ): Promise<languages.SignatureHelpResult | undefined> {
        const regions = htmlRegionCache.getCache(model);
        if (regions.getLanguageAtPosition(position) != languageNames.javascript) return;
        const workerGetter = await monaco.languages.typescript.getJavaScriptWorker()
        const worker = await workerGetter(getEmbeddedJavascriptUri(model))
        const javascriptModel = monaco.editor.getModel(getEmbeddedJavascriptUri(model))
        if (!javascriptModel) return
        const offset = javascriptModel.getOffsetAt(position);

        if (model.isDisposed()) {
            return;
        }

        const info = await worker.getSignatureHelpItems(javascriptModel.uri.toString(), offset, {
            triggerReason: JavascriptInHtmlSignatureHelpAdapter._toSignatureHelpTriggerReason(context)
        });

        if (!info || model.isDisposed()) {
            return;
        }

        const ret: languages.SignatureHelp = {
            activeSignature: info.selectedItemIndex,
            activeParameter: info.argumentIndex,
            signatures: []
        };

        info.items.forEach((item: any) => {
            const signature: languages.SignatureInformation = {
                label: '',
                parameters: []
            };

            signature.documentation = {
                value: displayPartsToString(item.documentation)
            };
            signature.label += displayPartsToString(item.prefixDisplayParts);
            item.parameters.forEach((p: any, i: any, a: any) => {
                const label = displayPartsToString(p.displayParts);
                const parameter: languages.ParameterInformation = {
                    label: label,
                    documentation: {
                        value: displayPartsToString(p.documentation)
                    }
                };
                signature.label += label;
                signature.parameters.push(parameter);
                if (i < a.length - 1) {
                    signature.label += displayPartsToString(item.separatorDisplayParts);
                }
            });
            signature.label += displayPartsToString(item.suffixDisplayParts);
            ret.signatures.push(signature);
        });

        return {
            value: ret,
            dispose() { }
        };
    }

}

export function useJavascriptSignatureHelpInHtml() {
    monaco.languages.registerSignatureHelpProvider(languageNames.html, new JavascriptInHtmlSignatureHelpAdapter())
}