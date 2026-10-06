import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { isAbsolute, resolve } from 'node:path'

const require = createRequire(import.meta.url)

let announced = false

function localBundlePath() {
  const override = process.env.GITBASE_CMS_LOCAL?.trim()

  if (!override) {
    return null
  }

  return isAbsolute(override) ? override : resolve(process.cwd(), override)
}

export function isLocalCmsBundle() {
  const path = localBundlePath()
  return !!path && existsSync(path)
}

export function resolveCmsBundlePath() {
  const local = localBundlePath()

  if (local) {
    if (existsSync(local)) {
      if (!announced) {
        announced = true
        console.info(`[gitbase-cms] Using local bundle: ${local}`)
      }

      return local
    }

    console.warn(`[gitbase-cms] GITBASE_CMS_LOCAL not found (${local}). Using the npm package.`)
  }

  try {
    return require.resolve('@gitbase/cms/gitbase-cms.js')
  } catch {
    return null
  }
}
