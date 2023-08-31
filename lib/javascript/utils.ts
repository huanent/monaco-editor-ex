import { monaco } from "../monaco"
import { Uri, languages, editor } from "../monaco"
import type { SymbolDisplayPart } from "typescript";

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
		return decodeURIComponent(value.toString())
	}

	if (isRelativeOrAbsolute(value)) {
		if (source) {
			value = trimScriptPathExtension(value);
			return getAbsolutePath(source, value) + ".ts";
		} else {
			value = trimPathPrefix(value);
			value = trimScriptPathExtension(value);
			return `file:///${value}.ts`
		}
	} else {
		return `file:///node_modules/@types/${value}/index.ts`
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

function getAbsolutePath(base: string, relative: string) {
	var stack = base.split("/"),
		parts = relative.split("/");
	stack.pop();
	for (var i = 0; i < parts.length; i++) {
		if (parts[i] == ".")
			continue;
		if (parts[i] == "..")
			stack.pop();
		else
			stack.push(parts[i]);
	}
	return stack.join("/");
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

export function sameUris(uri: string) {
	const result = [uri]
	const encodedUri = monaco.Uri.parse(uri).toString()
	if (encodedUri != uri) {
		result.push(encodedUri)
	}

	if (uri.endsWith("/index.ts")) {
		result.push(uri.substring(0, uri.length - 3) + ".d.ts")
		result.push(encodedUri.substring(0, encodedUri.length - 3) + ".d.ts")
	}
	return result;
}