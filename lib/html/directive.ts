import { Scanner, TextDocument } from "vscode-html-languageservice"

let _directives: Directive[] | undefined


export interface Directive {
    matcher: string | RegExp,
    language: 'css' | 'javascript'
    appendContent?: (value: string) => string
}

export function useDirective(directives?: Directive[]) {
    _directives = directives
}


export function getDirectiveRegion(attributeName: string, scanner: Scanner, document: TextDocument) {
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
            return { languageId: directive.language, start, end, attributeValue: true, appendContent: directive.appendContent }
        }
    }
    return null;
}