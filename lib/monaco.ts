import type * as Monaco from "monaco-editor/esm/vs/editor/editor.api";
export type {
    IDisposable,
    IPosition,
    CancellationToken,
    editor,
    IEvent,
    IMarkdownString,
    IRange,
    languages,
    Position,
    Range,
    Uri
} from "monaco-editor/esm/vs/editor/editor.api";

export let monaco: typeof Monaco

export function tryInitMonaco(monacoInstance: typeof Monaco) {
    if (monaco) return false;
    monaco = monacoInstance;
    return true
}