import './userWorker'
import * as monaco from "monaco-editor"
import { useMonacoEx, useUnocss, useModuleResolve, useModuleSuggest, useDirective } from "../lib";

useMonacoEx(monaco)
useUnocss()
useModuleResolve(path => {
  console.log(path)
  if (path.startsWith("file:///node_modules/@types/module:myLib/index")) {
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
useDirective([{
  language: "javascript",
  matcher: "k-for",
  appendContent(_value: string) {
    return ";var item:typeof abc[0];"
  },
}, {
  language: "javascript",
  matcher: "k-content",
}, {
  language: "javascript",
  matcher: "k-if",
}]);

// monaco.editor.createModel(`
// export const customObject={
//   name:""
// }
// `, "javascript", monaco.Uri.file("myModule.js"))

const model = monaco.editor.createModel(`
<html>
<body>
<style>
.abc{
  color:red;
}
</style>
<div style="color:red;"></div>

<script>
  var abc=[1,2,3];
</script>
<div k-for="item abc" k-if="!!abc">
  <div k-content="item."></div>

</div>
</body>
</html>
`, "html", monaco.Uri.parse("file:///main.html"))

monaco.editor.create(document.querySelector("#app")!, {
  model
})
