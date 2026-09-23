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

export function queryContent<T>(query: ContentQuery) {
  return $fetch<T>('/api/content/query', {
    method: 'POST',
    body: query
  })
}
