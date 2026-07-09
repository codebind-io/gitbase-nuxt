function readEnv(name: string, fallback = '') {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  return env?.[name]?.trim() ?? fallback
}

function parseAllowedEmails(raw: string) {
  return raw
    .split(/[,;]/)
    .map(entry => entry.trim().toLowerCase())
    .filter(Boolean)
}

export function getGitbaseEnv() {
  return {
    codebaseUrl: readEnv('GITBASE_CODEBASE_URL'),
    siteUrl: readEnv('GITBASE_SITE_URL'),
    githubRepo: readEnv('GITBASE_GITHUB_REPO'),
    githubPat: readEnv('GITBASE_GITHUB_PAT'),
    deployHookUrl: readEnv('GITBASE_DEPLOY_HOOK_URL'),
    googleClientId: readEnv('GITBASE_GOOGLE_CLIENT_ID'),
    allowedEmails: parseAllowedEmails(readEnv('GITBASE_ALLOWED_EMAILS')),
    r2AccessKeyId: readEnv('GITBASE_R2_ACCESS_KEY_ID'),
    r2SecretAccessKey: readEnv('GITBASE_R2_SECRET_ACCESS_KEY'),
    r2Bucket: readEnv('GITBASE_R2_BUCKET'),
    r2AccountId: readEnv('GITBASE_R2_ACCOUNT_ID'),
    r2PublicUrl: readEnv('GITBASE_R2_PUBLIC_URL'),
    r2Prefix: readEnv('GITBASE_R2_PREFIX', 'cms/'),
    r2Jurisdiction: readEnv('GITBASE_R2_JURISDICTION', 'default'),
    pexels: readEnv('GITBASE_PEXELS'),
    pixabay: readEnv('GITBASE_PIXABAY'),
    unsplash: readEnv('GITBASE_UNSPLASH')
  }
}

export type GitbaseEnv = ReturnType<typeof getGitbaseEnv>
