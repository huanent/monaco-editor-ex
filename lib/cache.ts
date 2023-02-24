import { editor } from "./monaco"

export class Cache<T> {
    readonly map: Record<string, CacheRecord<T>> = {}

    constructor(readonly category: string) {
    }

    get(model: editor.ITextModel) {
        const uri = model.uri.toString()
        const version = model.getVersionId();

        let record = this.map[uri];
        if (!record) {
            record = {
                version: version,
                value: this._getCache(model)
            }
            this.map[uri] = record;
        } else if (version != record.version) {
            record.value = this._getCache(model);
        }

        return record.value;
    }

    _getCache(_model: editor.ITextModel): T {
        throw new Error('You have to implement the method getCache!');
    }

}

export interface CacheRecord<T> {
    version: number;
    value: T
}