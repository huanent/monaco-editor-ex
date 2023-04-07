import type { CancellationToken, IDisposable, Position, editor, languages } from "../monaco";
import { monaco } from "../monaco";
import { createAutocomplete } from "@unocss/autocomplete"
import { createGenerator } from "@unocss/core"
import { presetUno } from "@unocss/preset-uno"
import tinycolor from "tinycolor2";
import { getHtmlService, modelToDocument, toLsRange, toTextEdit } from "./utils";
import { TokenType } from "vscode-html-languageservice";
import { languageNames } from "../constants";
import { getCssService } from "../css/utils";

class ClassCompletionItemAdapter
    implements languages.CompletionItemProvider {
    triggerCharacters = ['"', "'", " ", "-", ":"];
    async provideCompletionItems(
        model: editor.ITextModel,
        position: Position,
        _context: languages.CompletionContext,
        _token: CancellationToken
    ): Promise<languages.CompletionList | undefined> {
        if (!unocssAutocomplete || !unocss) return;
        const offset = model.getOffsetAt(position);
        const classToken = getClassToken(model, offset);
        if (!classToken) return;
        const words = getWords(classToken.content, offset - classToken.start);
        const result = await unocssAutocomplete.suggest(words.current.content);
        const suggests = [];

        for (const i of result) {
            if (words.others.indexOf(i) > -1) continue;
            suggests.push(i);
        }

        if (!suggests.length) suggests.push("");

        const suggestions: languages.CompletionItem[] = [];
        const range = offsetToRange(
            model,
            classToken.start + words.current.start,
            classToken.start + words.current.end
        );

        for (const m of suggests) {
            const result = await unocss.generate(m, {
                preflights: false,
            });
            const colorString = getColorString(result.css);
            suggestions.push({
                label: m,
                kind: colorString
                    ? monaco.languages.CompletionItemKind.Color
                    : monaco.languages.CompletionItemKind.Property,
                insertText: m,
                range: range,
                detail: colorString || result.css,
                documentation: result.css,
                sortText: /-\d$/.test(m) ? "1" : "2",
            });
        }

        return {
            suggestions: suggestions,
            incomplete: true,
        };
    }

    async resolveCompletionItem?(
        item: languages.CompletionItem,
        _token: CancellationToken
    ): Promise<languages.CompletionItem | undefined> {
        let doc = item.documentation;
        if (!doc || typeof doc !== "string") {
            return item;
        }
        item.documentation = {
            value: "```css\n" + formatCss(doc) + "\n```",
        };
        return item;
    }
}

class ClassHoverAdapter implements languages.HoverProvider {
    async provideHover(
        model: editor.ITextModel,
        position: Position,
        _token: CancellationToken
    ): Promise<languages.Hover | undefined> {
        if (!unocss) return;
        const offset = model.getOffsetAt(position);
        const classToken = getClassToken(model, offset);
        if (!classToken) return;
        const words = getWords(classToken.content, offset - classToken.start);
        const result = await unocss.generate(words.current.content, {
            preflights: false,
            safelist: false,
        });

        return {
            contents: [
                {
                    value: "```css\n" + formatCss(result.css) + "\n```",
                },
            ],
            range: offsetToRange(
                model,
                classToken.start + words.current.start,
                classToken.start + words.current.end
            ),
        };
    }
}

class ColorPreviewAdapter implements languages.DocumentColorProvider {
    async provideDocumentColors(
        model: editor.ITextModel,
        _token: CancellationToken
    ): Promise<languages.IColorInformation[] | undefined> {
        if (!unocss) return;
        const classTokens = getClassTokens(model);

        const words = [];
        for (const classToken of classTokens) {
            let currentWord = "";
            let currentStart = classToken.start;
            for (let i = 0; i <= classToken.end - classToken.start; i++) {
                const currentChar = classToken.content[i];
                if (currentChar == " " || currentChar === undefined) {
                    if (currentWord.length) {
                        words.push({
                            content: currentWord,
                            start: currentStart,
                            end: classToken.start + i,
                        });
                        currentWord = "";
                    }
                    currentStart = classToken.start + i + 1;
                } else {
                    currentWord += currentChar;
                }
            }
        }

        const result: languages.IColorInformation[] = [];

        for (const word of words) {
            const lastColonIndex = word.content.lastIndexOf(":");
            if (lastColonIndex > -1) {
                word.content = word.content.substring(lastColonIndex + 1);
                word.start += lastColonIndex + 1;
            }
            const css = await unocss.generate(word.content, {
                preflights: false,
                safelist: false,
            });
            const color = getColorString(css.css);
            if (color) {
                const rgb = tinycolor(color).toRgb();
                result.push({
                    color: {
                        alpha: rgb.a,
                        blue: rgb.b / 255,
                        green: rgb.g / 255,
                        red: rgb.r / 255,
                    },
                    range: offsetToRange(model, word.start, word.end),
                });
            }
        }
        return result;
    }
    async provideColorPresentations(
        model: editor.ITextModel,
        colorInfo: languages.IColorInformation,
        _token: CancellationToken
    ): Promise<languages.IColorPresentation[] | undefined> {
        const word = model.getValueInRange(colorInfo.range);
        const index = word.indexOf("-");
        if (index < 0) return;
        const color = `rgba(${colorInfo.color.red * 255},${colorInfo.color.green * 255
            },${colorInfo.color.blue * 255},${colorInfo.color.alpha})`;
        return [
            {
                label: color,
                textEdit: {
                    text: `${word.substring(0, index)}-[${color}]`,
                    range: new monaco.Range(
                        colorInfo.range.startLineNumber,
                        colorInfo.range.startColumn,
                        colorInfo.range.endLineNumber,
                        colorInfo.range.endColumn
                    ),
                },
            },
        ];
    }
}

function getClassToken(model: editor.ITextModel, offset: number) {
    const htmlService = getHtmlService();
    const scanner = htmlService.createScanner(model.getValue());

    let isClass = false;

    do {
        const type = scanner.scan();
        if (
            scanner.getTokenOffset() < offset &&
            offset < scanner.getTokenEnd() &&
            type == TokenType.AttributeValue &&
            isClass
        ) {
            const value = scanner.getTokenText();
            return {
                content: value.substring(1, value.length - 1),
                start: scanner.getTokenOffset() + 1,
                end: scanner.getTokenEnd() - 1,
            };
        } else if (type != TokenType.DelimiterAssign) {
            isClass =
                type == TokenType.AttributeName &&
                scanner.getTokenText()?.toLowerCase() == "class";
        }
    } while (scanner.getTokenOffset() < offset);

    return;
}

function getClassTokens(model: editor.ITextModel) {
    const content = model.getValue();
    const htmlService = getHtmlService();
    const scanner = htmlService.createScanner(content);
    const result = [];

    let isClass = false;
    do {
        const type = scanner.scan();
        if (type == TokenType.AttributeValue && isClass) {
            const value = scanner.getTokenText();
            result.push({
                content: value.substring(1, value.length - 1),
                start: scanner.getTokenOffset() + 1,
                end: scanner.getTokenEnd() - 1,
            });
        } else if (type != TokenType.DelimiterAssign) {
            isClass =
                type == TokenType.AttributeName &&
                scanner.getTokenText()?.toLowerCase() == "class";
        }
    } while (scanner.getTokenOffset() < content.length);

    return result;
}

function getWords(token: string, offset: number) {
    const leftGroup = token.substring(0, offset).split(" ");
    const rightGroup = token.substring(offset).split(" ");
    const leftSpan = leftGroup.pop() ?? "";
    const rightSpan = rightGroup.shift() ?? "";
    return {
        current: {
            start: offset - leftSpan.length,
            end: offset + rightSpan.length,
            content: leftSpan + rightSpan,
        },
        others: [...leftGroup, ...rightGroup],
    };
}

const getCssVariables = (code: string) => {
    const regex = /(?<key>--\S+?):\s*(?<value>.+?);/gm;
    const cssVariables = new Map<string, string>();
    for (const match of code.matchAll(regex)) {
        const key = match.groups?.key;
        if (key) cssVariables.set(key, match.groups?.value ?? "");
    }

    return cssVariables;
};

const matchCssVarNameRegex =
    /var\((?<cssVarName>--[^,|)]+)(?:,\s*(?<fallback>[^)]+))?\)/gm;
const cssColorRegex =
    /(?:#|0x)(?:[a-f0-9]{3}|[a-f0-9]{6})\b|(?:rgb|hsl)a?\(.*\)/gm;

const getColorString = (str: string) => {
    let colorString = str.match(cssColorRegex)?.[0]; // e.g rgba(248, 113, 113, var(--maybe-css-var))

    if (!colorString) return;

    const cssVars = getCssVariables(str);

    // replace `var(...)` with its value
    for (const match of colorString.matchAll(matchCssVarNameRegex)) {
        const matchedString = match[0];
        const cssVarName = match.groups?.cssVarName;
        const fallback = match.groups?.fallback;

        if (cssVarName && cssVars.get(cssVarName))
            // rgba(248, 113, 113, var(--un-text-opacity)) => rgba(248, 113, 113, 1)
            colorString = colorString.replaceAll(
                matchedString,
                cssVars.get(cssVarName) ?? matchedString
            );
        else if (fallback)
            // rgba(248, 113, 113, var(--no-value, 0.5)) => rgba(248, 113, 113, 0.5)
            colorString = colorString.replaceAll(matchedString, fallback);

        // rgba(248, 113, 113, var(--no-value)) => rgba(248, 113, 113)
        colorString = colorString.replaceAll(/,?\s+var\(--.*?\)/gm, "");
    }

    // if (!(new TinyColor(colorString).isValid))
    //   return

    return colorString;
};

function offsetToRange(model: editor.IModel, start: number, end: number) {
    const startPosition = model.getPositionAt(start);
    const endPosition = model.getPositionAt(end);

    return new monaco.Range(
        startPosition.lineNumber,
        startPosition.column,
        endPosition.lineNumber,
        endPosition.column
    );
}

let unocss: ReturnType<typeof createGenerator> | undefined = undefined

let unocssAutocomplete: ReturnType<typeof createAutocomplete>
let initialized = false;

let disposables: IDisposable[] = [];

function dispose() {
    initialized = false;
    disposables.forEach((d) => d && d.dispose());
    disposables.length = 0;
}

export function useUnocss(config?: Parameters<typeof createGenerator>[0]) {
    unocss = unocss ?? createGenerator({
        presets: [presetUno()],
        ...config
    })
    unocssAutocomplete = createAutocomplete(unocss)
    if (initialized) return dispose;
    initialized = true;
    disposables.push(monaco.languages.registerCompletionItemProvider(languageNames.html, new ClassCompletionItemAdapter()))
    disposables.push(monaco.languages.registerHoverProvider(languageNames.html, new ClassHoverAdapter()))
    disposables.push(monaco.languages.registerColorProvider(languageNames.html, new ColorPreviewAdapter()))
    return dispose;
}

function formatCss(content: string) {

    let model = monaco.editor.createModel(content, languageNames.css, monaco.Uri.from({
        scheme: "memory",
        path: new Date().getTime() + ".tmp"
    }));
    const cssService = getCssService();
    const edits = cssService.format(modelToDocument(model), toLsRange(model.getFullModelRange()), {})
    model.applyEdits(edits.map(m => toTextEdit(m)));
    const result = model.getValue();
    model.dispose();
    return result;
}