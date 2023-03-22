import { defineConfig } from 'vite'
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: 'lib/index.ts',
      name: 'MonacoEditorEx',
      fileName: 'monaco-editor-ex',
      formats: ["es", "umd", "iife"]
    },
    rollupOptions: {
      external: [
        "monaco-editor",
        "monaco-editor/esm/vs/editor/editor.api"],
      output: {
        globals: {
          monaco: 'monaco',
        },
      },
    },
  },
  plugins: [dts({ entryRoot: 'lib/index.ts', outputDir: "dist/lib" })],
  test: {
    environment: "happy-dom"
  }
})
