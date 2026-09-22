// Dev-only project filesystem for the CMS. The browser directory picker aborts for repos under Documents on Windows.
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path'

import type { H3Event } from 'h3'

const projectRoot = process.cwd()

type FsOp = 'list' | 'stat' | 'read' | 'write' | 'remove' | 'mkdir' | 'move'

type FsBody = {
  op?: FsOp
  path?: string
  from?: string
  to?: string
  recursive?: boolean
  data?: string
}

function fsError(name: string, message: string) {
  const error = new Error(message) as Error & { fsName: string }
  error.fsName = name
  return error
}

function toRelative(input: string) {
  return input.replace(/\\/g, '/').replace(/^\/+/, '')
}

export function localProjectName() {
  return basename(projectRoot)
}

export function resolveLocalPath(input = '') {
  const rel = toRelative(input)

  if (rel.split('/').some(part => part === '..')) {
    throw fsError('SecurityError', 'Path escapes the project root')
  }

  const full = resolve(projectRoot, rel)
  const fromRoot = relative(projectRoot, full)

  if (fromRoot.startsWith('..') || isAbsolute(fromRoot)) {
    throw fsError('SecurityError', 'Path escapes the project root')
  }

  return full
}

function kindFromError(error: unknown) {
  const code = (error as NodeJS.ErrnoException)?.code
  const fsName = (error as { fsName?: string })?.fsName

  if (fsName) {
    return { status: 400, name: fsName, message: (error as Error).message }
  }

  if (code === 'ENOENT') {
    return { status: 404, name: 'NotFoundError', message: 'Not found' }
  }

  if (code === 'ENOTDIR' || code === 'EISDIR') {
    return { status: 409, name: 'TypeMismatchError', message: 'Path kind does not match' }
  }

  return { status: 500, name: 'UnknownError', message: (error as Error)?.message || 'Local filesystem request failed' }
}

async function pathKind(full: string) {
  try {
    const info = await stat(full)
    return info.isDirectory() ? 'directory' as const : 'file' as const
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return null
    }

    throw error
  }
}

async function runLocalFs(body: FsBody) {
  const op = body.op

  if (op === 'stat') {
    return { kind: await pathKind(resolveLocalPath(body.path ?? '')) }
  }

  if (op === 'list') {
    const full = resolveLocalPath(body.path ?? '')
    const entries = await readdir(full, { withFileTypes: true })

    return {
      entries: entries
        .map(entry => ({
          name: entry.name,
          kind: entry.isDirectory() ? 'directory' as const : 'file' as const
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    }
  }

  if (op === 'read') {
    const data = await readFile(resolveLocalPath(body.path ?? ''))
    return { data: data.toString('base64') }
  }

  if (op === 'mkdir') {
    await mkdir(resolveLocalPath(body.path ?? ''), { recursive: true })
    return { ok: true }
  }

  if (op === 'write') {
    const full = resolveLocalPath(body.path ?? '')
    await mkdir(dirname(full), { recursive: true })
    await writeFile(full, Buffer.from(body.data ?? '', 'base64'))
    return { ok: true }
  }

  if (op === 'remove') {
    const full = resolveLocalPath(body.path ?? '')
    await rm(full, { recursive: body.recursive === true })
    return { ok: true }
  }

  if (op === 'move') {
    const from = resolveLocalPath(body.from ?? '')
    const to = resolveLocalPath(body.to ?? '')
    await mkdir(dirname(to), { recursive: true })
    await rename(from, to)
    return { ok: true }
  }

  throw fsError('SyntaxError', 'Unknown filesystem operation')
}

export async function handleLocalFs(event: H3Event) {
  if (!import.meta.dev) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  try {
    const body = await readBody<FsBody>(event)
    return await runLocalFs(body ?? {})
  } catch (error) {
    const mapped = kindFromError(error)
    setResponseStatus(event, mapped.status)
    return { name: mapped.name, message: mapped.message }
  }
}
