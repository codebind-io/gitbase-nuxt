declare module 'minimark/hast' {
  export function fromHast(tree: unknown): { type: string, value: unknown }
}
