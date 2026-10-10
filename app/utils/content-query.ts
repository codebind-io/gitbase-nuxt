export type ContentWhere = {
  field: string
  value: string | number | boolean
}

export type ContentOrder = {
  field: string
  direction: 'ASC' | 'DESC'
}

export type ContentQuery = {
  collection: string
  kind?: 'list' | 'navigation' | 'search' | 'surround'
  where?: ContentWhere[]
  path?: string
  order?: ContentOrder
  first?: boolean
  fields?: string[]
}

export async function queryContent<T>(query: ContentQuery) {
  const result = await $fetch<T>('/api/content/query', {
    method: 'POST',
    body: query
  })

  if (result !== undefined) {
    return result
  }

  return (query.first ? null : []) as T
}
