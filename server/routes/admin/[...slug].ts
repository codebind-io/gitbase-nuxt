import { handleGitbaseAdminRoute } from '../../utils/gitbase'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''
  return handleGitbaseAdminRoute(event, slug)
})
