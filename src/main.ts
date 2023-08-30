import './userWorker'
import * as monaco from "monaco-editor"
import { useMonacoEx, useUnocss, useModuleResolve, useModuleSuggest } from "../lib";

useMonacoEx(monaco)
useUnocss()
useModuleResolve(path => {
  console.log(path)
  if (path == "file:///node_modules/@types/module:myLib/index.d.ts") {
    return Promise.resolve(`
import {User} from './fileA';
export function myLib():User{ 
  return {
    name:"jobs"
  }
}
    `)
  }
  return Promise.resolve(`
export interface User{ 
  name:string;
  age:number
}
  `)
});

useModuleSuggest(["./main", "./user.ts", "order", "order.ts"])

// monaco.editor.createModel(`
// export const customObject={
//   name:""
// }
// `, "javascript", monaco.Uri.file("myModule.js"))

const model = monaco.editor.createModel(`
import {User} from "./user"

`, "typescript", monaco.Uri.file("main.ts"))

monaco.editor.create(document.querySelector("#app")!, {
  model
})
