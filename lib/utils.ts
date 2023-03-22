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
