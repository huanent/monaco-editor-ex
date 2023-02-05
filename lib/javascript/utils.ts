import { monaco, Uri } from "../monaco"

export async function getJavascriptWorker(uri: Uri) {
    const workerGetter = await monaco.languages.typescript.getJavaScriptWorker()
    return await workerGetter(uri)
}