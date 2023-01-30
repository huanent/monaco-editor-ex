<script setup lang="ts">
import "../../../src/userWorker"
import * as monaco from "monaco-editor"
import { initMonaco } from "monaco-editor-ex"
import { ref, onMounted } from "vue";

const container = ref();
initMonaco(monaco);

onMounted(() => {
  const model = monaco.editor.createModel(`
  <style>

  </style>
  <div>
  
  </div>
  <script>
  
  </${'script'}>
  `, "html")

  monaco.editor.create(container.value, {
    model
  })
})

</script>

<template>
  <div ref="container" style="height: 90vh;">
  </div>
</template>