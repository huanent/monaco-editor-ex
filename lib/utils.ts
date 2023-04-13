import { languageNames } from "./constants";
import { Position, monaco, editor } from "./monaco";

export function getWordRange(model: editor.ITextModel, position: Position) {
    const wordInfo = model.getWordUntilPosition(position);

    return new monaco.Range(
        position.lineNumber,
        wordInfo.startColumn,
        position.lineNumber,
        wordInfo.endColumn
    );
}

export function isScript(value: string | editor.IModel) {
    if (typeof value != "string") {
        value = value.getLanguageId();
    }
    return (
        value === languageNames.javascript || value === languageNames.typescript
    );
}

export function getTempUri() {
    return monaco.Uri.from({
        scheme: "memory",
        path: newGuid() + ".tmp"
    })
}

export function newGuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
