import { monaco } from "../monaco"
import type { Uri } from "../monaco"
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
	if (path.endsWith(".js") || path.startsWith(".ts")) {
		return path.substring(0, path.length - 3)
	}

	return path;
}

export function standardizeScriptUri(value: string | Uri) {
	if (typeof value != "string") {
		value = value.path;
	}
	value = trimPathPrefix(value);
	value = trimScriptPathExtension(value);
	return monaco.Uri.file(value + '.ts')
}

export function isRelativePath(path: string) {
	return (
		path.startsWith("./") ||
		path.startsWith(".\\") ||
		path.startsWith("../") ||
		path.startsWith("..\\")
	);
}

