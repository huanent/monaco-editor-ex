# monaco-editor-ex

[![](https://img.shields.io/npm/v/monaco-editor-ex?style=flat-square)](https://www.npmjs.com/package/monaco-editor-ex)

`monaco-editor-ex` is a powerful monaco-editor extension.

Many features that are only available in vscode are brought to monaco-editor,try it now! [online demo](https://huanent.github.io/monaco-editor-ex/)

## available features

### html

- javascript and style tag code completion
  ![](https://huanent.github.io/monaco-editor-ex/img/js-completion-in-html.png)
- style color preview and edit
- auto close tag
- Better format
- unocss support
  ![](https://huanent.github.io/monaco-editor-ex/img/unocss.png)


## Usage

### Html

```html
<div
  id="container"
  style="width:800px;height:600px;border:1px solid grey"
></div>

<script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs/loader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/monaco-editor-ex@latest/dist/monaco-editor-ex.iife.js"></script>
<script>
  require.config({
    paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs" },
  });
  require(["vs/editor/editor.main"], function () {
    MonacoEditorEx.useMonacoEx(monaco);
    var editor = monaco.editor.create(document.getElementById("container"), {
      value: `<div><div>`,
      language: "html",
    });
  });
</script>
```

### Vite

```
npm i monaco-editor
npm i monaco-editor-ex
```

Add "[userWorker.ts](https://github.com/huanent/monaco-editor-ex/blob/main/src/userWorker.ts)" file to project

```js
import "./userWorker";
import * as monaco from "monaco-editor";
import { useMonacoEx } from "monaco-editor-ex";

useMonacoEx(monaco);
```
