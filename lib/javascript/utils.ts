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

export function trimCurrentPath(path: string) {
	if (path.startsWith("./") || path.startsWith(".\\")) {
		path = trimCurrentPath(path.substring(2));
	}

	return path;
}

export function isRelativePath(path: string) {
	return (
		path.startsWith("./") ||
		path.startsWith(".\\") ||
		path.startsWith("../") ||
		path.startsWith("..\\")
	);
}

