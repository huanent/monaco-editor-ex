import { languageNames } from "./constants";
import { Position, monaco, editor } from "./monaco";

var libEntries = [
    // JavaScript only
    ["es5", "lib.es5.d.ts"],
    ["es6", "lib.es2015.d.ts"],
    ["es2015", "lib.es2015.d.ts"],
    ["es7", "lib.es2016.d.ts"],
    ["es2016", "lib.es2016.d.ts"],
    ["es2017", "lib.es2017.d.ts"],
    ["es2018", "lib.es2018.d.ts"],
    ["es2019", "lib.es2019.d.ts"],
    ["es2020", "lib.es2020.d.ts"],
    ["es2021", "lib.es2021.d.ts"],
    ["esnext", "lib.esnext.d.ts"],
    // Host only
    ["dom", "lib.dom.d.ts"],
    ["dom.iterable", "lib.dom.iterable.d.ts"],
    ["webworker", "lib.webworker.d.ts"],
    ["webworker.importscripts", "lib.webworker.importscripts.d.ts"],
    ["webworker.iterable", "lib.webworker.iterable.d.ts"],
    ["scripthost", "lib.scripthost.d.ts"],
    // ES2015 Or ESNext By-feature options
    ["es2015.core", "lib.es2015.core.d.ts"],
    ["es2015.collection", "lib.es2015.collection.d.ts"],
    ["es2015.generator", "lib.es2015.generator.d.ts"],
    ["es2015.iterable", "lib.es2015.iterable.d.ts"],
    ["es2015.promise", "lib.es2015.promise.d.ts"],
    ["es2015.proxy", "lib.es2015.proxy.d.ts"],
    ["es2015.reflect", "lib.es2015.reflect.d.ts"],
    ["es2015.symbol", "lib.es2015.symbol.d.ts"],
    ["es2015.symbol.wellknown", "lib.es2015.symbol.wellknown.d.ts"],
    ["es2016.array.include", "lib.es2016.array.include.d.ts"],
    ["es2017.object", "lib.es2017.object.d.ts"],
    ["es2017.sharedmemory", "lib.es2017.sharedmemory.d.ts"],
    ["es2017.string", "lib.es2017.string.d.ts"],
    ["es2017.intl", "lib.es2017.intl.d.ts"],
    ["es2017.typedarrays", "lib.es2017.typedarrays.d.ts"],
    ["es2018.asyncgenerator", "lib.es2018.asyncgenerator.d.ts"],
    ["es2018.asynciterable", "lib.es2018.asynciterable.d.ts"],
    ["es2018.intl", "lib.es2018.intl.d.ts"],
    ["es2018.promise", "lib.es2018.promise.d.ts"],
    ["es2018.regexp", "lib.es2018.regexp.d.ts"],
    ["es2019.array", "lib.es2019.array.d.ts"],
    ["es2019.object", "lib.es2019.object.d.ts"],
    ["es2019.string", "lib.es2019.string.d.ts"],
    ["es2019.symbol", "lib.es2019.symbol.d.ts"],
    ["es2020.bigint", "lib.es2020.bigint.d.ts"],
    ["es2020.promise", "lib.es2020.promise.d.ts"],
    ["es2020.sharedmemory", "lib.es2020.sharedmemory.d.ts"],
    ["es2020.string", "lib.es2020.string.d.ts"],
    ["es2020.symbol.wellknown", "lib.es2020.symbol.wellknown.d.ts"],
    ["es2020.intl", "lib.es2020.intl.d.ts"],
    ["es2021.promise", "lib.es2021.promise.d.ts"],
    ["es2021.string", "lib.es2021.string.d.ts"],
    ["es2021.weakref", "lib.es2021.weakref.d.ts"],
    ["es2021.intl", "lib.es2021.intl.d.ts"],
    ["esnext.array", "lib.es2019.array.d.ts"],
    ["esnext.symbol", "lib.es2019.symbol.d.ts"],
    ["esnext.asynciterable", "lib.es2018.asynciterable.d.ts"],
    ["esnext.intl", "lib.esnext.intl.d.ts"],
    ["esnext.bigint", "lib.es2020.bigint.d.ts"],
    ["esnext.string", "lib.es2021.string.d.ts"],
    ["esnext.promise", "lib.es2021.promise.d.ts"],
    ["esnext.weakref", "lib.es2021.weakref.d.ts"]
];

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

export function isInnerModel(value: string | editor.IModel) {
    if (typeof value != "string") {
        value = value.uri.path;
    }

    return libEntries.some(f => (value as string).endsWith(f[1]))
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
