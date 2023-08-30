import { monaco } from "../monaco"
import { Uri, languages, editor } from "../monaco"
import type { SymbolDisplayPart } from "typescript";
import resolve from "@einheit/path-resolve"

export async function getJavascriptWorker(uri: Uri) {
	const workerGetter = await monaco.languages.typescript.getJavaScriptWorker()
	return await workerGetter(uri)
}

export function displayPartsToString(displayParts: SymbolDisplayPart[] | undefined): string {
	if (displayParts) {
		return displayParts.map((displayPart) => displayPart.text).join('');
	}
	return '';
}

export function trimPathPrefix(path: string) {
	if (path.startsWith("./") || path.startsWith(".\\")) {
		path = trimPathPrefix(path.substring(2));
	}

	if (path.startsWith("/") || path.startsWith("\\")) {
		path = trimPathPrefix(path.substring(1));
	}

	return path;
}

export function trimScriptPathExtension(path: string) {
	if (path.endsWith(".js") || path.endsWith(".ts")) {
		path = path.substring(0, path.length - 3)
	}

	return path;
}

export function getModuleKey(value: string | Uri, source: string = "") {
	if (typeof value != "string") {
		value = value.path;
	}

	if (isRelativeOrAbsolute(value)) {
		if (source) {
			if (source.startsWith("file://")) {
				source = source.substring(7)
			}
			const index = source.lastIndexOf("/");
			source = source.substring(0, index);
			source = resolve(source, value)
			return `file://${source}.ts`
		} else {
			value = trimPathPrefix(value);
			value = trimScriptPathExtension(value);
			return `file:///${value}.ts`
		}
	} else {
		return `file:///node_modules/@types/${value}/index.d.ts`
	}
}

export function isRelativeOrAbsolute(path: string) {
	return (
		path.startsWith("/") ||
		path.startsWith("\\") ||
		path.startsWith("./") ||
		path.startsWith(".\\") ||
		path.startsWith("../") ||
		path.startsWith("..\\")
	);
}

interface TextEdit {
	newText: string, span: { start: number, length: number }
}

export function toTextEdit(model: editor.IModel, textEdit: TextEdit): languages.TextEdit {
	const start = model.getPositionAt(textEdit.span.start);
	const end = model.getPositionAt(textEdit.span.start + textEdit.span.length);
	return {
		range: monaco.Range.fromPositions(start, end),
		text: textEdit.newText
	};
}