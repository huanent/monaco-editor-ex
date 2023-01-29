import './userWorker'
import * as monaco from "monaco-editor"
import { initMonaco } from "../lib";

initMonaco(monaco)

const model = monaco.editor.createModel(`
<style>
  div{
    color:red;
  }
</style>
<div>
  
</div>
<script>

</${'script'}>
`, "html", monaco.Uri.file("index.html"))

monaco.editor.create(document.querySelector("#app")!, {
  model
})
