import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { H3Event } from 'h3'

// @ts-expect-error Inlined at build time by nitro rollup plugin in nuxt.config.ts
import baseConfigYaml from 'virtual:gitbase-config'

import { isLocalCmsBundle, resolveCmsBundlePath } from './cms-bundle-path'
import {
  addCmsMember,
  isCmsMember,
  isMemberEmail,
  listCmsMembers,
  normalizeMemberEmail,
  getMembersDatabase,
  removeCmsMember
} from './cms-members'
import { readContentDatabase, syncContentChanges } from './content-d1'
import { getGitbaseEnv, type GitbaseEnv } from './env'
import { localFsClientScript } from './local-fs-client'
import { handleLocalFs, localProjectName } from './local-fs'

const gitbaseConfigSourcePath = join(process.cwd(), 'gitbase.config.yml')

function decodeCmsBundle(value: unknown) {
  if (typeof value === 'string' && value.length > 0) {
    return value
  }

  if (value instanceof Uint8Array) {
    return new TextDecoder().decode(value)
  }

  if (value instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(value))
  }

  return null
}

async function readCmsBundle() {
  const bundlePath = resolveCmsBundlePath()

  if (isLocalCmsBundle() && bundlePath && existsSync(bundlePath)) {
    return readFileSync(bundlePath, 'utf-8')
  }

  try {
    const storage = useStorage('assets:gitbase-cms')
    const fromItem = decodeCmsBundle(await storage.getItem('gitbase-cms.js'))
      ?? decodeCmsBundle(await storage.getItemRaw('gitbase-cms.js'))

    if (fromItem) {
      return fromItem
    }
  } catch {
    // Dev / Node: fall through to the npm package on disk
  }

  if (!bundlePath || !existsSync(bundlePath)) {
    return null
  }

  return readFileSync(bundlePath, 'utf-8')
}

const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo'

function yamlString(value: string) {
  return JSON.stringify(value)
}

function buildR2Block(config: GitbaseEnv) {
  const accessKeyId = config.r2AccessKeyId.trim()
  const bucket = config.r2Bucket.trim()
  const accountId = config.r2AccountId.trim()
  const publicUrl = config.r2PublicUrl.trim()
  const prefix = config.r2Prefix.trim()
  const jurisdiction = config.r2Jurisdiction.trim() || 'default'

  if (!accessKeyId || !bucket || !accountId || !publicUrl) {
    return ''
  }

  return `media_libraries:
  cloudflare_r2:
    access_key_id: ${yamlString(accessKeyId)}
    bucket: ${yamlString(bucket)}
    account_id: ${yamlString(accountId)}
    public_url: ${yamlString(publicUrl)}
    prefix: ${yamlString(prefix)}
    jurisdiction: ${yamlString(jurisdiction)}
`
}

function buildAdminConfigYaml(base: string, config: GitbaseEnv) {
  let yaml = base

  if (config.githubRepo.trim()) {
    yaml = yaml.replace(/^(\s*repo:\s*).+$/m, `$1${config.githubRepo.trim()}`)
  }

  if (config.githubBranch.trim()) {
    yaml = yaml.replace(/^(\s*branch:\s*).+$/m, `$1${config.githubBranch.trim()}`)
  }

  if (config.siteUrl.trim()) {
    const site = config.siteUrl.replace(/\/$/, '')
    yaml = yaml.replace(/^(\s*#?\s*site_url:\s*).+$/m, `$1${site}`)
  }

  const r2Block = buildR2Block(config)

  if (!r2Block) {
    yaml = yaml.replace(/^media_libraries:[\s\S]*?(?=^collections:|^singletons:|$)/m, '')

    if (!/^media_folder:/m.test(yaml)) {
      const marker = '\ncollections:'
      const insertAt = yaml.indexOf(marker)

      const fallbackMedia = `media_folder: public/media\npublic_folder: /media\n`

      if (insertAt === -1) {
        yaml = `${yaml.trimEnd()}\n\n${fallbackMedia}`
      } else {
        yaml = `${yaml.slice(0, insertAt)}\n\n${fallbackMedia}${yaml.slice(insertAt + 1)}`
      }
    }

    return yaml
  }

  if (/^media_libraries:/m.test(yaml)) {
    return yaml.replace(/^media_libraries:[\s\S]*?(?=^collections:|^singletons:|$)/m, `${r2Block}\n`)
  }

  const marker = '\ncollections:'
  const insertAt = yaml.indexOf(marker)

  if (insertAt === -1) {
    return `${yaml.trimEnd()}\n\n${r2Block}`
  }

  return `${yaml.slice(0, insertAt)}\n\n${r2Block}${yaml.slice(insertAt)}`
}

function isGoogleCmsAuthConfigured(config: GitbaseEnv) {
  return !!(
    config.googleClientId.trim()
    && config.allowedEmails.length
    && config.githubPat.trim()
  )
}

async function verifyGoogleIdToken(credential: string, clientId: string) {
  const token = credential.trim()
  const expectedClientId = clientId.trim()

  if (!token || !expectedClientId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing Google credential' })
  }

  const response = await fetch(`${GOOGLE_TOKEN_INFO_URL}?id_token=${encodeURIComponent(token)}`)

  if (!response.ok) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid Google sign-in' })
  }

  const payload = await response.json() as {
    aud?: string
    email?: string
    email_verified?: string | boolean
    iss?: string
    exp?: string
  }

  const aud = payload.aud?.trim()
  const email = payload.email?.trim().toLowerCase()
  const iss = payload.iss?.trim() ?? ''
  const emailVerified = payload.email_verified === true || payload.email_verified === 'true'

  if (aud !== expectedClientId || !email || !emailVerified) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid Google sign-in' })
  }

  if (iss !== 'accounts.google.com' && iss !== 'https://accounts.google.com') {
    throw createError({ statusCode: 401, statusMessage: 'Invalid Google sign-in' })
  }

  if (payload.exp && Number(payload.exp) * 1000 < Date.now()) {
    throw createError({ statusCode: 401, statusMessage: 'Google sign-in expired' })
  }

  return email
}

async function isAllowedCmsEmail(event: H3Event, config: GitbaseEnv, email: string) {
  if (config.allowedEmails.includes(email)) {
    return true
  }

  const database = await getMembersDatabase(event)

  if (!database) {
    return false
  }

  try {
    return await isCmsMember(database, email)
  } catch {
    return false
  }
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false
  }

  let mismatch = 0

  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return mismatch === 0
}

async function requireCmsAuth(event: H3Event, config: GitbaseEnv) {
  const authorization = getRequestHeader(event, 'authorization')

  if (!authorization?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Missing GitHub token' })
  }

  const token = authorization.slice(7).trim()

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing GitHub token' })
  }

  const sharedPat = config.githubPat.trim()

  if (sharedPat) {
    if (!timingSafeEqual(token, sharedPat)) {
      throw createError({ statusCode: 403, statusMessage: 'Invalid CMS access token' })
    }

    return token
  }

  const repo = config.githubRepo.trim()

  if (!repo) {
    if (import.meta.dev) {
      return token
    }

    throw createError({ statusCode: 503, statusMessage: 'CMS GitHub repo is not configured' })
  }

  const response = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'GitBase-CMS',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })

  if (response.status === 401) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid GitHub token' })
  }

  if (!response.ok) {
    throw createError({ statusCode: 403, statusMessage: 'No access to CMS repository' })
  }

  return token
}

async function requireMembersAuth(event: H3Event, config: GitbaseEnv) {
  const authorization = getRequestHeader(event, 'authorization')

  if (import.meta.dev && !authorization?.startsWith('Bearer ')) {
    return
  }

  await requireCmsAuth(event, config)
}

function loadBaseConfig() {
  if (import.meta.dev) {
    try {
      return readFileSync(gitbaseConfigSourcePath, 'utf-8')
    } catch {
      throw createError({ statusCode: 500, statusMessage: 'gitbase.config.yml is missing' })
    }
  }

  if (!baseConfigYaml.trim()) {
    throw createError({ statusCode: 500, statusMessage: 'gitbase.config.yml is missing' })
  }

  return baseConfigYaml
}

function getPublishHookUrl(event: H3Event, config: GitbaseEnv) {
  const origin = config.siteUrl.replace(/\/$/, '') || getRequestURL(event).origin

  return `${origin}/admin/cms/publish`
}

function renderAdminHtml() {
  const localFsScript = import.meta.dev
    ? '\n    <script src="/admin/local-fs.js"></script>'
    : ''

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex" />
    <link rel="cms-config-url" href="/admin/config.yml" type="application/yaml" />
    <title>GitBase CMS</title>
  </head>
  <body>${localFsScript}
    <script src="/admin/gitbase-cms.js"></script>
  </body>
</html>`
}

const GITHUB_AGENT_API_VERSION = '2026-03-10'

function setAgentCorsHeaders(event: H3Event) {
  setHeader(event, 'access-control-allow-origin', getRequestURL(event).origin)
  setHeader(event, 'access-control-allow-methods', 'GET, POST, OPTIONS')
  setHeader(event, 'access-control-allow-headers', 'Authorization, Content-Type')
}

async function proxyGithubAgentRequest(
  githubPath: string,
  token: string,
  options: { method?: string, body?: Record<string, unknown> } = {}
) {
  const response = await fetch(`https://api.github.com${githubPath}`, {
    method: options.method ?? 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'GitBase-CMS',
      'X-GitHub-Api-Version': GITHUB_AGENT_API_VERSION,
      ...(options.body ? { 'Content-Type': 'application/json' } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  const text = await response.text()

  let data: unknown

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text || response.statusText }
  }

  return { response, data }
}

function parseGithubRepo(config: GitbaseEnv) {
  const repo = config.githubRepo.trim()

  if (!repo.includes('/')) {
    throw createError({ statusCode: 503, statusMessage: 'CMS GitHub repo is not configured' })
  }

  const [owner, name] = repo.split('/')

  if (!owner || !name) {
    throw createError({ statusCode: 503, statusMessage: 'CMS GitHub repo is not configured' })
  }

  return { owner, name }
}

function buildBootstrapApiKeys(config: GitbaseEnv) {
  const apiKeys: Record<string, string> = {}

  if (config.r2SecretAccessKey.trim()) {
    apiKeys.cloudflare_r2 = config.r2SecretAccessKey.trim()
  }

  if (config.pexels.trim()) {
    apiKeys.pexels = config.pexels.trim()
  }

  if (config.pixabay.trim()) {
    apiKeys.pixabay = config.pixabay.trim()
  }

  if (config.unsplash.trim()) {
    apiKeys.unsplash = config.unsplash.trim()
  }

  return apiKeys
}

/** Handle all /admin/* routes */
export async function handleGitbaseAdminRoute(event: H3Event, slug: string) {
  const config = getGitbaseEnv()
  const method = getMethod(event)
  const path = slug.replace(/\/$/, '')

  if (import.meta.dev && path === 'local-fs.js' && method === 'GET') {
    setHeader(event, 'content-type', 'application/javascript; charset=utf-8')
    setHeader(event, 'cache-control', 'no-store')
    return localFsClientScript(localProjectName())
  }

  if (import.meta.dev && path === 'cms/fs' && method === 'POST') {
    return handleLocalFs(event)
  }

  if (path === 'index.html' && method === 'GET') {
    setHeader(event, 'content-type', 'text/html; charset=utf-8')
    setHeader(event, 'cache-control', 'no-store')
    return renderAdminHtml()
  }

  if (path === 'gitbase-cms.js' && method === 'GET') {
    const bundle = await readCmsBundle()

    if (!bundle) {
      throw createError({
        statusCode: 503,
        statusMessage: '@gitbase/cms bundle missing — run pnpm add @gitbase/cms'
      })
    }

    setHeader(event, 'content-type', 'application/javascript; charset=utf-8')
    setHeader(event, 'cache-control', isLocalCmsBundle() ? 'no-store' : 'public, max-age=3600')
    return bundle
  }

  if (path === 'config.yml' && method === 'GET') {
    const base = loadBaseConfig()

    setHeader(event, 'content-type', 'text/yaml; charset=utf-8')
    setHeader(event, 'cache-control', 'no-store')

    return buildAdminConfigYaml(base, config)
  }

  if (path === 'cms/auth-config' && method === 'GET') {
    const googleAuthEnabled = isGoogleCmsAuthConfigured(config)

    setHeader(event, 'cache-control', 'no-store')

    return {
      googleAuthEnabled,
      googleClientId: googleAuthEnabled ? config.googleClientId : undefined
    }
  }

  if (path === 'cms/google-auth' && method === 'POST') {
    if (!isGoogleCmsAuthConfigured(config)) {
      throw createError({ statusCode: 503, statusMessage: 'Google CMS sign-in is not configured' })
    }

    const body = await readBody(event)
    const credential = typeof body?.credential === 'string' ? body.credential : ''
    const email = await verifyGoogleIdToken(credential, config.googleClientId)

    if (!(await isAllowedCmsEmail(event, config, email))) {
      throw createError({ statusCode: 403, statusMessage: 'You are not allowed to access this CMS' })
    }

    return { token: config.githubPat.trim() }
  }

  if (path === 'cms/members' && (method === 'GET' || method === 'POST' || method === 'DELETE')) {
    await requireMembersAuth(event, config)

    const database = await getMembersDatabase(event)

    if (!database) {
      throw createError({ statusCode: 503, statusMessage: 'D1 binding DB is not configured' })
    }

    if (method === 'GET') {
      setHeader(event, 'cache-control', 'no-store')

      return {
        owners: config.allowedEmails,
        members: await listCmsMembers(database)
      }
    }

    const body = await readBody(event)
    const email = normalizeMemberEmail(body?.email)

    if (!isMemberEmail(email)) {
      throw createError({ statusCode: 400, statusMessage: 'Enter a valid email address' })
    }

    if (config.allowedEmails.includes(email)) {
      throw createError({ statusCode: 409, statusMessage: 'This email is already an owner' })
    }

    if (method === 'POST') {
      const added = await addCmsMember(database, email)

      if (!added) {
        throw createError({ statusCode: 409, statusMessage: 'This email is already an admin' })
      }

      return { ok: true }
    }

    const removed = await removeCmsMember(database, email)

    if (!removed) {
      throw createError({ statusCode: 404, statusMessage: 'This email is not an admin' })
    }

    return { ok: true }
  }

  if (path === 'cms/bootstrap' && method === 'GET') {
    const authorization = getRequestHeader(event, 'authorization')

    await requireCmsAuth(event, config)

    const apiKeys = buildBootstrapApiKeys(config)
    const hasDeployHook = !!config.deployHookUrl.trim()

    if (!Object.keys(apiKeys).length && !hasDeployHook) {
      if (import.meta.dev) {
        return { apiKeys: {} }
      }

      throw createError({ statusCode: 503, statusMessage: 'CMS integrations are not configured' })
    }

    return {
      apiKeys,
      deployHookURL: hasDeployHook ? getPublishHookUrl(event, config) : undefined,
      deployHookAuthHeader: authorization || undefined
    }
  }

  if (path.startsWith('cms/agent/') && method === 'OPTIONS') {
    setAgentCorsHeaders(event)
    setResponseStatus(event, 204)
    return null
  }

  if (path === 'cms/agent/tasks' && method === 'POST') {
    const token = await requireCmsAuth(event, config)
    const { owner, name } = parseGithubRepo(config)
    const body = await readBody(event)
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''

    if (!prompt) {
      throw createError({ statusCode: 400, statusMessage: 'Missing agent prompt' })
    }

    const baseRef = typeof body?.base_ref === 'string' && body.base_ref.trim()
      ? body.base_ref.trim()
      : (config.githubBranch.trim() || 'main')
    const createPullRequest = body?.create_pull_request === true
    const { response, data } = await proxyGithubAgentRequest(
      `/agents/repos/${owner}/${name}/tasks`,
      token,
      {
        method: 'POST',
        body: {
          prompt,
          base_ref: baseRef,
          create_pull_request: createPullRequest
        }
      }
    )

    setAgentCorsHeaders(event)
    setResponseStatus(event, response.status)

    return data
  }

  const agentTaskMatch = path.match(/^cms\/agent\/tasks\/([^/]+)$/)

  if (agentTaskMatch?.[1] && method === 'GET') {
    const token = await requireCmsAuth(event, config)
    const taskId = decodeURIComponent(agentTaskMatch[1])
    const { response, data } = await proxyGithubAgentRequest(
      `/agents/tasks/${encodeURIComponent(taskId)}`,
      token
    )

    setAgentCorsHeaders(event)
    setResponseStatus(event, response.status)

    return data
  }

  const agentSteerMatch = path.match(/^cms\/agent\/tasks\/([^/]+)\/steer$/)

  if (agentSteerMatch?.[1] && method === 'POST') {
    const token = await requireCmsAuth(event, config)
    const taskId = decodeURIComponent(agentSteerMatch[1])
    const body = await readBody(event)
    const content = typeof body?.content === 'string' ? body.content.trim() : ''

    if (!content) {
      throw createError({ statusCode: 400, statusMessage: 'Missing steer content' })
    }

    const steerType = typeof body?.type === 'string' ? body.type : 'user_message'
    const { response, data } = await proxyGithubAgentRequest(
      `/agents/tasks/${encodeURIComponent(taskId)}/steer`,
      token,
      {
        method: 'POST',
        body: { content, type: steerType }
      }
    )

    setAgentCorsHeaders(event)
    setResponseStatus(event, response.status)

    return data
  }

  if (path === 'cms/content' && (method === 'POST' || method === 'OPTIONS')) {
    if (method === 'OPTIONS') {
      setHeader(event, 'access-control-allow-origin', getRequestURL(event).origin)
      setHeader(event, 'access-control-allow-methods', 'POST, OPTIONS')
      setHeader(event, 'access-control-allow-headers', 'Authorization, Content-Type')
      setResponseStatus(event, 204)
      return null
    }

    if (import.meta.dev) {
      return { ok: true, skipped: true }
    }

    await requireCmsAuth(event, config)

    const database = readContentDatabase(event)

    if (!database) {
      throw createError({ statusCode: 503, statusMessage: 'D1 binding DB is not configured' })
    }

    const body = await readBody(event)
    const changes = Array.isArray(body?.changes) ? body.changes : null

    if (!changes) {
      throw createError({ statusCode: 400, statusMessage: 'Missing content changes' })
    }

    try {
      await syncContentChanges(database, changes)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Content sync failed'
      throw createError({ statusCode: 400, statusMessage: message })
    }

    setHeader(event, 'access-control-allow-origin', getRequestURL(event).origin)

    return { ok: true }
  }

  if (path === 'cms/publish' && (method === 'POST' || method === 'OPTIONS')) {
    if (method === 'OPTIONS') {
      setHeader(event, 'access-control-allow-origin', getRequestURL(event).origin)
      setHeader(event, 'access-control-allow-methods', 'POST, OPTIONS')
      setHeader(event, 'access-control-allow-headers', 'Authorization, Content-Type')
      setResponseStatus(event, 204)
      return null
    }

    await requireCmsAuth(event, config)

    const hookUrl = config.deployHookUrl.trim()

    if (!hookUrl) {
      throw createError({ statusCode: 503, statusMessage: 'GITBASE_DEPLOY_HOOK_URL is not configured' })
    }

    const response = await fetch(hookUrl, { method: 'POST' })

    if (!response.ok) {
      throw createError({ statusCode: 502, statusMessage: `Deploy hook returned ${response.status}` })
    }

    setHeader(event, 'access-control-allow-origin', getRequestURL(event).origin)

    return { ok: true }
  }

  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}
