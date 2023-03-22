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
} from "./html";
import { tryInitMonaco } from "./monaco";
import { useJavascriptSnippet } from "./javascript";
export { useUnocss } from "./html"
export { useModuleResolve } from "./javascript/moduleResolve"

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
