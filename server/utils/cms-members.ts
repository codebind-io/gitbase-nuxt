import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

import type { H3Event } from 'h3'

type MembersStatement = {
  bind: (...values: unknown[]) => MembersStatement
  all: <T>() => Promise<{ results?: T[] }>
  first: <T>() => Promise<T | null>
  run: () => Promise<unknown>
}

type MembersDatabase = {
  prepare: (sql: string) => MembersStatement
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

let localMembersDatabase: MembersDatabase | undefined

function cloudflareMembersDatabase(event: H3Event) {
  const context = event.context as {
    cloudflare?: { env?: { DB?: MembersDatabase } }
  }

  return context.cloudflare?.env?.DB
}

async function openLocalMembersDatabase() {
  if (localMembersDatabase) {
    return localMembersDatabase
  }

  const { DatabaseSync } = await import('node:sqlite')
  const directory = join(process.cwd(), '.data')
  mkdirSync(directory, { recursive: true })

  const database = new DatabaseSync(join(directory, 'cms-members.sqlite'))

  localMembersDatabase = {
    prepare(sql: string) {
      const statement = database.prepare(sql)
      let values: unknown[] = []

      const bound = {
        bind(...next: unknown[]) {
          values = next
          return bound
        },
        async all<T>() {
          return { results: statement.all(...values) as T[] }
        },
        async first<T>() {
          return (statement.get(...values) as T | undefined) ?? null
        },
        async run() {
          statement.run(...values)
        }
      }

      return bound
    }
  }

  return localMembersDatabase
}

export async function getMembersDatabase(event: H3Event) {
  const cloudflare = cloudflareMembersDatabase(event)

  if (cloudflare) {
    return cloudflare
  }

  if (import.meta.dev) {
    return openLocalMembersDatabase()
  }

  return undefined
}

export function normalizeMemberEmail(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().toLowerCase()
}

export function isMemberEmail(email: string) {
  return email.length <= 254 && EMAIL_PATTERN.test(email)
}

async function ensureMembersTable(db: MembersDatabase) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS cms_members (
      email TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    )`
  ).run()
}

export async function listCmsMembers(db: MembersDatabase) {
  await ensureMembersTable(db)

  const result = await db.prepare(
    'SELECT email FROM cms_members ORDER BY email'
  ).all<{ email: string }>()

  return (result.results ?? [])
    .map(row => normalizeMemberEmail(row.email))
    .filter(Boolean)
}

export async function isCmsMember(db: MembersDatabase, email: string) {
  await ensureMembersTable(db)

  const row = await db.prepare(
    'SELECT email FROM cms_members WHERE email = ?'
  ).bind(email).first<{ email: string }>()

  return !!row
}

export async function addCmsMember(db: MembersDatabase, email: string) {
  await ensureMembersTable(db)

  const existing = await db.prepare(
    'SELECT email FROM cms_members WHERE email = ?'
  ).bind(email).first<{ email: string }>()

  if (existing) {
    return false
  }

  await db.prepare(
    'INSERT INTO cms_members (email, created_at) VALUES (?, ?)'
  ).bind(email, new Date().toISOString()).run()

  return true
}

export async function removeCmsMember(db: MembersDatabase, email: string) {
  await ensureMembersTable(db)

  const existing = await db.prepare(
    'SELECT email FROM cms_members WHERE email = ?'
  ).bind(email).first<{ email: string }>()

  if (!existing) {
    return false
  }

  await db.prepare('DELETE FROM cms_members WHERE email = ?').bind(email).run()

  return true
}
