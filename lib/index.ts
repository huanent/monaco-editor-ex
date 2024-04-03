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
  useHtmlModuleSuggest,
  useJavascriptFoldingRangeInHtml
} from "./html";
import { tryInitMonaco } from "./monaco";
import { useJavascriptSnippet, useJavascriptModuleSuggest } from "./javascript";
import { removeModules } from "./javascript/moduleState"
import { monaco } from "./monaco";
export { useUnocss, htmlFormat, useDirective } from "./html"
export { useModuleResolve } from "./javascript"

export function useMonacoEx(monacoInstance: typeof Monaco) {
  if (!tryInitMonaco(monacoInstance)) return
  useAutoCloseTag()
  useJavascriptSuggestInHtml();
  useJavascriptSignatureHelpInHtml();
  useJavascriptQuickInfoInHtml();
  useJavascriptOccurrencesInHtml();
  useJavascriptFoldingRangeInHtml();
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

export function useModuleSuggest(modules?: (() => Promise<string[]>) | string[]) {
  useJavascriptModuleSuggest(modules)
  useHtmlModuleSuggest(modules)
}

export function removeAllModules() {
  if (monaco) {
    const models = monaco.editor.getModels();

    for (const i of models) {
      i.dispose()
    }
  }

  removeModules();
}
