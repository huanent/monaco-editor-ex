import './userWorker'
import * as monaco from "monaco-editor"
import { useMonacoEx, useUnocss, useModuleResolve, useModuleSuggest } from "../lib";

useMonacoEx(monaco)
useUnocss()
useModuleResolve(path => {
  console.log(path)
  return Promise.resolve("export interface abc{ name:string}")
});

useModuleSuggest(["./main", "./user.ts", "order", "order.ts"])

monaco.editor.createModel(`
export const customObject={
  name:""
}
`, "javascript", monaco.Uri.file("myModule.js"))

const model = monaco.editor.createModel(`
<style>
  div{
    color:red;
  }
</style>
<div>
  
</div>
<script>
  import {} from "./myModule"
  function foo(){
           return "bar";

        }
</${'script'}>
`, "html", monaco.Uri.file("main.html"))

monaco.editor.create(document.querySelector("#app")!, {
  model
})
