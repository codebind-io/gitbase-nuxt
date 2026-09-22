export function localFsClientScript(rootName: string) {
  return `(() => {
  const rootName = ${JSON.stringify(rootName)}
  const brand = Symbol.for('gitbase.localFs')

  function fail(name, message) {
    const error = new DOMException(message || name, name)
    return error
  }

  async function call(op, payload) {
    const response = await fetch('/admin/cms/fs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ op, ...payload })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw fail(data.name || 'UnknownError', data.message || 'Local filesystem request failed')
    }
    return data
  }

  function join(parent, name) {
    return parent ? parent + '/' + name : name
  }

  function bytesToBase64(bytes) {
    let binary = ''
    const size = 0x2000
    for (let index = 0; index < bytes.length; index += size) {
      binary += String.fromCharCode.apply(null, bytes.subarray(index, index + size))
    }
    return btoa(binary)
  }

  function createFile(path, name) {
    const handle = {
      kind: 'file',
      name,
      path,
      async getFile() {
        const result = await call('read', { path })
        const binary = atob(result.data || '')
        const bytes = new Uint8Array(binary.length)
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index)
        }
        return new File([bytes], name)
      },
      async createWritable() {
        const chunks = []
        return {
          async write(data) {
            const payload = data && data.type ? data.data : data
            if (typeof payload === 'string') {
              chunks.push(new TextEncoder().encode(payload))
              return
            }
            if (payload instanceof Blob) {
              chunks.push(new Uint8Array(await payload.arrayBuffer()))
              return
            }
            if (payload instanceof ArrayBuffer) {
              chunks.push(new Uint8Array(payload))
              return
            }
            if (ArrayBuffer.isView(payload)) {
              chunks.push(new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength))
            }
          },
          async close() {
            const blob = new Blob(chunks)
            const bytes = new Uint8Array(await blob.arrayBuffer())
            await call('write', { path: handle.path, data: bytesToBase64(bytes) })
          }
        }
      },
      async move(destDir, newName) {
        const nextPath = join(destDir.path, newName)
        await call('move', { from: handle.path, to: nextPath })
        handle.path = nextPath
        handle.name = newName
      }
    }
    Object.defineProperty(handle, brand, { value: true })
    return handle
  }

  function createDir(path, name) {
    const handle = {
      kind: 'directory',
      name,
      path,
      async requestPermission() {
        return 'granted'
      },
      async queryPermission() {
        return 'granted'
      },
      entries() {
        const dirPath = path
        return (async function* () {
          const result = await call('list', { path: dirPath })
          for (const entry of result.entries || []) {
            const child = join(dirPath, entry.name)
            yield [entry.name, entry.kind === 'directory' ? createDir(child, entry.name) : createFile(child, entry.name)]
          }
        })()
      },
      async getDirectoryHandle(entryName, options) {
        const child = join(path, entryName)
        const result = await call('stat', { path: child })
        if (result.kind === 'file') throw fail('TypeMismatchError', entryName + ' is a file')
        if (result.kind === 'directory') return createDir(child, entryName)
        if (!options || !options.create) throw fail('NotFoundError', entryName + ' was not found')
        await call('mkdir', { path: child })
        return createDir(child, entryName)
      },
      async getFileHandle(entryName, options) {
        const child = join(path, entryName)
        const result = await call('stat', { path: child })
        if (result.kind === 'directory') throw fail('TypeMismatchError', entryName + ' is a directory')
        if (result.kind === 'file') return createFile(child, entryName)
        if (!options || !options.create) throw fail('NotFoundError', entryName + ' was not found')
        await call('write', { path: child, data: '' })
        return createFile(child, entryName)
      },
      async removeEntry(entryName, options) {
        await call('remove', { path: join(path, entryName), recursive: !!(options && options.recursive) })
      }
    }
    Object.defineProperty(handle, brand, { value: true })
    return handle
  }

  function rootHandle() {
    return createDir('', rootName)
  }

  const originalGet = IDBObjectStore.prototype.get
  IDBObjectStore.prototype.get = function (key) {
    const request = originalGet.call(this, key)
    if (this.name === 'file-system-handles' && key === 'root_dir_handle') {
      Object.defineProperty(request, 'result', {
        configurable: true,
        get() {
          return rootHandle()
        }
      })
    }
    return request
  }

  const originalPut = IDBObjectStore.prototype.put
  IDBObjectStore.prototype.put = function (value, key) {
    if (this.name === 'file-system-handles' && key === 'root_dir_handle') {
      return originalPut.call(this, { gitbaseLocalRoot: 1 }, key)
    }
    return originalPut.call(this, value, key)
  }

  window.showDirectoryPicker = async () => rootHandle()
})()
`
}
