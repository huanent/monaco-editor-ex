import { expect, test } from 'vitest'
import { toLsPosition } from "../../lib/html/utils"
import { Position } from "monaco-editor/esm/vs/editor/editor.api"

test('toLsPosition', () => {
  const LspPosition = toLsPosition(new Position(1, 1));
  expect(LspPosition.line).toBe(0);
  expect(LspPosition.character).toBe(0);
})
