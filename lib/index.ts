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
  javascriptInHtmlAdapter,
  useHtmlFormatting,
  useUnocss
} from "./html";
import { tryInitMonaco } from "./monaco";
import { useJavascriptSnippet } from "./javascript";

export function initMonaco(monaco: typeof Monaco) {
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
  useUnocss();
  useJavascriptSnippet();
  new javascriptInHtmlAdapter();
}
