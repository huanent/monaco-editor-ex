import type * as Monaco from "monaco-editor/esm/vs/editor/editor.api";
import {
  useAutoCloseTag,
  useJavascriptSuggestInHtml,
  useJavascriptSignatureHelpInHtml,
  useJavascriptQuickInfoInHtml,
  useJavascriptOccurrencesInHtml,
  useCssSuggestInHtml,
  useCssHoverInHtml,
  useCssFoldingRangeInHtml,
  useCssColorInHtml,
  useCssReferenceInHtml,
  useCssDefinitionInHtml,
  useCssHighlightInHtml,
  useJavascriptInHtml,
  useHtmlFormatting,
  useHtmlModuleSuggest
} from "./html";
import { tryInitMonaco } from "./monaco";
import { useJavascriptSnippet, useJavascriptModuleSuggest } from "./javascript";
export { useUnocss } from "./html"
export { useModuleResolve } from "./javascript"

export function useMonacoEx(monaco: typeof Monaco) {
  if (!tryInitMonaco(monaco)) return
  useAutoCloseTag()
  useJavascriptSuggestInHtml();
  useJavascriptSignatureHelpInHtml();
  useJavascriptQuickInfoInHtml();
  useJavascriptOccurrencesInHtml();
  useCssSuggestInHtml();
  useCssHoverInHtml();
  useCssFoldingRangeInHtml();
  useCssColorInHtml();
  useCssReferenceInHtml();
  useCssDefinitionInHtml();
  useCssHighlightInHtml();
  useHtmlFormatting();
  useJavascriptSnippet();
  useJavascriptInHtml();
}

export function useModuleSuggest(modules: string[] = []) {
  useJavascriptModuleSuggest(modules)
  useHtmlModuleSuggest(modules)
}
