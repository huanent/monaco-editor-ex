import { Scanner, TextDocument, Range } from "vscode-html-languageservice"
import { EmbeddedRegion } from "./embeddedSupport";

let _directives: Directive[] | undefined
let _contents: ContentRegin[] | undefined

export interface LanguageRange extends Range {
    languageId: string | undefined;
    type?: "tag" | "attribute" | "content"
}

export interface ContentRegin {
    matcher: ((value: string) => { start: number, end: number }[]),
    language: 'css' | 'javascript'
}

export interface Directive {
    matcher: string | RegExp,
    language: 'css' | 'javascript'
    appendContent?: (value: string) => string
}

export function useDirective(directives?: Directive[]) {
    _directives = directives
}

export function useContentRegin(regin?: ContentRegin[]) {
    _contents = regin
}

export function getDirectiveRegion(attributeName: string, scanner: Scanner, document: TextDocument): EmbeddedRegion | undefined {
    if (!_directives) return;
    let match: boolean | RegExpMatchArray | null = false;
    for (const directive of _directives) {
        if (typeof directive.matcher == 'string' && directive.matcher == attributeName) {
            match = true
        } else {
            match = attributeName.match(directive.matcher);
        }

        if (match) {
            let start = scanner.getTokenOffset();
            let end = scanner.getTokenEnd();
            let firstChar = document.getText()[start];
            if (firstChar === "'" || firstChar === '"') {
                start++;
                end--;
            } else {
                continue;
            }
            return { languageId: directive.language, start, end, type: "attribute", appendContent: directive.appendContent }
        }
    }

    return;
}

export function getContentRegions(scanner: Scanner, document: TextDocument): EmbeddedRegion[] | undefined {
    if (!_contents) return
    const start = scanner.getTokenOffset();
    const end = scanner.getTokenEnd();
    const content = document.getText().substring(start, end);
    const result: EmbeddedRegion[] = []
    for (const i of _contents) {
        const ranges = i.matcher(content);
        if (!ranges) continue;
        for (const range of ranges) {
            result.push({
                languageId: i.language,
                start: start + range.start,
                end: start + range.end,
                type: "content"
            })
        }
    }
    return result;
}