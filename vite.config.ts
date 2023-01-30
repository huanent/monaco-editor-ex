import { defineConfig } from 'vite'
import dts from "vite-plugin-dts";
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    lib: {
      entry: 'lib/index.ts',
      name: 'monaco-editor-ex',
      fileName: 'monaco-editor-ex',
    },
    rollupOptions: {
      external: ["monaco-editor/esm/vs/editor/editor.api"],
      output: {
        globals: {
          monaco: 'monaco',
        },
      },
    },
  },
  plugins: [dts({ entryRoot: 'lib/index.ts', outputDir: "dist/lib" })]
})
