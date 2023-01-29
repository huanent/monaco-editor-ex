import { monaco } from "../monaco";
import { languageNames } from "./utils";
import { HtmlAutoCloseTagAdapter } from "./htmlMode";

import {
    JavascriptInHtmlSuggestAdapter,
    JavascriptInHtmlSignatureHelpAdapter,
    JavascriptInHtmlQuickInfoAdapter,
    JavascriptInHtmlOccurrencesAdapter
} from "./javascriptMode";

import {
    CssInHtmlDocumentHighlightAdapter,
    CssInHtmlHoverAdapter,
    CssInHtmlSuggestAdapter,
    CssInHtmlDocumentColorAdapter,
    CssInHtmlDefinitionAdapter,
    CssInHtmlReferenceAdapter,
    CssInHtmlDocumentSymbolAdapter,
    CssInHtmlRenameAdapter,
    CssInHtmlFoldingRangeAdapter
} from "./cssMode";


export function setupHtml() {
    new HtmlAutoCloseTagAdapter()
    monaco.languages.registerCompletionItemProvider(languageNames.html, new JavascriptInHtmlSuggestAdapter())
    monaco.languages.registerSignatureHelpProvider(languageNames.html, new JavascriptInHtmlSignatureHelpAdapter())
    monaco.languages.registerHoverProvider(languageNames.html, new JavascriptInHtmlQuickInfoAdapter())
    monaco.languages.registerDocumentHighlightProvider(languageNames.html, new JavascriptInHtmlOccurrencesAdapter())
    // monaco.languages.registerDocumentFormattingEditProvider
    // monaco.languages.registerDocumentRangeFormattingEditProvider(
    //     languageNames.html,
    //     new languageFeatures.FormatAdapter(worker)
    // );

    monaco.languages.registerCompletionItemProvider(languageNames.html, new CssInHtmlSuggestAdapter())
    monaco.languages.registerHoverProvider(languageNames.html, new CssInHtmlHoverAdapter())
    monaco.languages.registerDocumentHighlightProvider(languageNames.html, new CssInHtmlDocumentHighlightAdapter())
    monaco.languages.registerColorProvider(languageNames.html, new CssInHtmlDocumentColorAdapter())
    monaco.languages.registerDefinitionProvider(languageNames.html, new CssInHtmlDefinitionAdapter())
    monaco.languages.registerReferenceProvider(languageNames.html, new CssInHtmlReferenceAdapter())
    monaco.languages.registerDocumentSymbolProvider(languageNames.html, new CssInHtmlDocumentSymbolAdapter())
    monaco.languages.registerRenameProvider(languageNames.html, new CssInHtmlRenameAdapter())
    monaco.languages.registerFoldingRangeProvider(languageNames.html, new CssInHtmlFoldingRangeAdapter())
}