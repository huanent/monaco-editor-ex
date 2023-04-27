import type { parse } from "@babel/parser";

export type AstTree = ReturnType<typeof parse>;

export interface AstNode {
  type: string;
  start: number;
  end: number;
}
export interface Source {
  value: string;
  end: number;
  start: number;
}

export interface StringLiteral extends AstNode {
  value: string;
}

export function getModulesFromAst(ast: AstTree): Source[] {
  const importDeclarations = getAstNode(ast, [
    "ImportDeclaration",
    "ExportNamedDeclaration"
  ]) as unknown as { source: Source }[];

  return importDeclarations.map((m) => m.source).filter(f => f);
}

export function getAstNode(node: any, types: string[]) {
  const list = getNodes(node);
  const result: AstNode[] = [];

  for (const item of list) {
    if ("type" in item) {
      if (types.includes(item.type)) {
        result.push(item);
      }

      for (const key in item) {
        result.push(...getAstNode((item as any)[key], types));
      }
    }
  }

  return result;
}

export function getNodePaths(node: any, start: number, end: number) {
  const list = getNodes(node);
  const result: AstNode[] = [];

  for (const item of list) {
    if (item.start <= start && item.end >= end) {
      result.push(item);
      for (const key in item) {
        result.push(...getNodePaths((item as any)[key], start, end));
      }
    }
  }

  return result;
}

function getNodes(node: any) {
  const list: AstNode[] = [];

  if (Array.isArray(node)) {
    for (const i of node) {
      if (typeof i === "object") list.push(i);
    }
  } else if (node && typeof node === "object") {
    list.push(node);
  }
  return list;
}

export function getModuleByOffset(ast: AstTree | undefined, offset: number) {
  if (!ast) return;
  const paths = getNodePaths(ast, offset, offset);
  if (paths.length < 2) return;

  if (
    paths[paths.length - 1].type != "StringLiteral" ||
    !["ImportDeclaration", "ExportNamedDeclaration"].includes(paths[paths.length - 2].type)
  ) {
    return;
  }

  return paths[paths.length - 1] as StringLiteral;
}

