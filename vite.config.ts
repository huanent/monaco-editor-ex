import { defineConfig } from 'vite'
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: './lib/index.ts',
      name: 'monaco-editor-ex',
      fileName: 'monaco-editor-ex'
    },
    rollupOptions: {
      external: ['monaco-editor', "monaco-editor/esm/vs/editor/editor.api"],
      output: {
        globals: {
          monaco: 'monaco',
        },
      },
    },
  },
  plugins: [dts({ entryRoot: "lib", outputDir: "dist" })]
})
