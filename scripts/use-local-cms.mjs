import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cmsRoot = resolve(root, '..', 'gitbase-cms')
const bundle = resolve(cmsRoot, 'dist', 'gitbase-cms.js')
const relativeBundle = '../gitbase-cms/dist/gitbase-cms.js'
const envPath = resolve(root, '.env')
const line = `GITBASE_CMS_LOCAL=${relativeBundle}`

if (!existsSync(cmsRoot)) {
  console.error('No gitbase-cms folder next to this repo. Leave GITBASE_CMS_LOCAL unset to use the npm package.')
  process.exit(1)
}

const build = spawnSync('pnpm', ['build'], {
  cwd: cmsRoot,
  stdio: 'inherit',
  shell: true
})

if (build.error) {
  console.error(build.error.message)
}

if (build.status !== 0) {
  process.exit(build.status ?? 1)
}

if (!existsSync(bundle)) {
  console.error('Build finished, but dist/gitbase-cms.js is missing.')
  process.exit(1)
}

const current = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
const next = /^GITBASE_CMS_LOCAL=/m.test(current)
  ? current.replace(/^GITBASE_CMS_LOCAL=.*$/m, line)
  : `${current.trimEnd()}${current.trim() ? '\n' : ''}\n# Local CMS only. Delete this line to use the npm package. Do not upload it to Cloudflare.\n${line}\n`

writeFileSync(envPath, next.endsWith('\n') ? next : `${next}\n`)

console.log(`Local CMS is ready: ${relativeBundle}`)
console.log('Restart pnpm dev. Delete GITBASE_CMS_LOCAL from .env to go back to the npm package.')
