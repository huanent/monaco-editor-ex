# monaco-editor-ex

```monaco-editor-ex``` is a powerful monaco-editor extension.
    
Many features that are only available in vscode are brought to monaco-editor,try it now! [online demo](https://huanent.github.io/monaco-editor-ex/)

![](https://huanent.github.io/monaco-editor-ex/img/js-completion-in-html.png)

## available features
### html
* javascript and style tag code completion
* style color preview and edit
* auto close tag 
### javascript
TODO
### css
TODO

## Usage
### html
``` html
   <div id="container" style="width:800px;height:600px;border:1px solid grey"></div>

    <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs/loader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/monaco-editor-ex@latest/dist/monaco-editor-ex.iife.js"></script>
    <script>
        require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            MonacoEditorEx.initMonaco(monaco);
            var editor = monaco.editor.create(document.getElementById('container'), {
                value: `<div><div>`,
                language: 'html'
            });
        });
    </script>
```
### vite
Add "[userWorker.ts](https://github.com/huanent/monaco-editor-ex/blob/main/src/userWorker.ts)" file to project
``` js
import "./userWorker"
import * as monaco from "monaco-editor"
import { initMonaco } from "monaco-editor-ex";

initMonaco(monaco)
```