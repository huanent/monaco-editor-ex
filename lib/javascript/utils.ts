import { monaco, Uri } from "../monaco"
import type {  SymbolDisplayPart} from "typescript";

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