/**
 * Lightweight audio metadata reader (no dependencies).
 *
 * Extracts title / artist / album and an embedded cover image from:
 *   - MP3  (ID3v2.2 / v2.3 / v2.4)
 *   - FLAC (Vorbis comments + PICTURE block)
 *
 * Other formats (M4A, OGG, WAV …) gracefully return no tags, and the UI
 * falls back to the file name. Only the bytes that are needed are read
 * from disk via File.slice().
 */

const MAX_TAG_BYTES = 6 * 1024 * 1024 // safety cap for a single tag/cover

function readBytes(file, start, end) {
  return file.slice(start, end).arrayBuffer()
}

/** A stable key for a file, resilient to playlist reordering. */
export function fileKey(file) {
  return `${file.name}::${file.size}::${file.lastModified || 0}`
}

// ---------------------------------------------------------------- ID3 (MP3)

function decodeText(bytes, encoding) {
  try {
    switch (encoding) {
      case 0:
        return new TextDecoder('iso-8859-1').decode(bytes)
      case 1:
        return new TextDecoder('utf-16').decode(bytes) // handles BOM
      case 2:
        return new TextDecoder('utf-16be').decode(bytes)
      case 3:
      default:
        return new TextDecoder('utf-8').decode(bytes)
    }
  } catch {
    return ''
  }
}

// Text frame payload: 1 encoding byte followed by the (possibly
// null-terminated) string.
function decodeTextFrame(data) {
  return decodeText(data.subarray(1), data[0]).replace(/\0+$/, '')
}

// Frame IDs per ID3 version: v2.2 uses 3-char IDs, v2.3/v2.4 use 4-char IDs.
const FRAME_IDS = {
  2: { title: 'TT2', artist: 'TP1', album: 'TAL', picture: 'PIC' },
  default: { title: 'TIT2', artist: 'TPE1', album: 'TALB', picture: 'APIC' },
}

function synchsafe(view, offset) {
  return (
    (view.getUint8(offset) << 21) |
    (view.getUint8(offset + 1) << 14) |
    (view.getUint8(offset + 2) << 7) |
    view.getUint8(offset + 3)
  )
}

async function parseId3(file) {
  const headerBuf = await readBytes(file, 0, 10)
  const header = new DataView(headerBuf)
  const id = String.fromCharCode(header.getUint8(0), header.getUint8(1), header.getUint8(2))
  if (id !== 'ID3') return null

  const version = header.getUint8(3)
  const tagSize = synchsafe(header, 6)
  if (tagSize <= 0 || tagSize > MAX_TAG_BYTES) return null

  const body = new Uint8Array(await readBytes(file, 10, 10 + tagSize))
  const view = new DataView(body.buffer)
  const meta = {}

  const idLen = version === 2 ? 3 : 4
  const sizeLen = version === 2 ? 3 : 4
  const flagsLen = version === 2 ? 0 : 2
  const ids = version === 2 ? FRAME_IDS[2] : FRAME_IDS.default

  let offset = 0
  while (offset + idLen + sizeLen + flagsLen <= body.length) {
    let frameId = ''
    for (let i = 0; i < idLen; i++) {
      const c = body[offset + i]
      if (c !== 0) frameId += String.fromCharCode(c)
    }
    if (!frameId.trim()) break

    let frameSize
    if (version === 2) {
      frameSize = (body[offset + 3] << 16) | (body[offset + 4] << 8) | body[offset + 5]
    } else if (version === 4) {
      frameSize = synchsafe(view, offset + 4)
    } else {
      frameSize = view.getUint32(offset + 4)
    }

    const dataStart = offset + idLen + sizeLen + flagsLen
    if (frameSize <= 0 || dataStart + frameSize > body.length) break
    const data = body.subarray(dataStart, dataStart + frameSize)

    if (frameId === ids.title) {
      meta.title = decodeTextFrame(data)
    } else if (frameId === ids.artist) {
      meta.artist = decodeTextFrame(data)
    } else if (frameId === ids.album) {
      meta.album = decodeTextFrame(data)
    } else if (frameId === ids.picture && !meta.coverBlob) {
      const pic = parseApic(data, version)
      if (pic) {
        meta.coverBlob = pic.blob
        meta.coverType = pic.type
      }
    }

    offset = dataStart + frameSize
  }

  return meta
}

function parseApic(data, version) {
  let p = 0
  const encoding = data[p++]
  let mime

  if (version === 2) {
    // v2.2: 3-char image format (e.g. "JPG"/"PNG")
    const fmt = String.fromCharCode(data[p], data[p + 1], data[p + 2]).toLowerCase()
    p += 3
    mime = fmt === 'png' ? 'image/png' : 'image/jpeg'
  } else {
    let mimeStr = ''
    while (p < data.length && data[p] !== 0) mimeStr += String.fromCharCode(data[p++])
    p++ // null terminator
    mime = mimeStr || 'image/jpeg'
  }

  p++ // picture type byte

  // Skip description (terminated by null in the used encoding).
  if (encoding === 1 || encoding === 2) {
    while (p + 1 < data.length && !(data[p] === 0 && data[p + 1] === 0)) p += 2
    p += 2
  } else {
    while (p < data.length && data[p] !== 0) p++
    p++
  }

  if (p >= data.length) return null
  const picBytes = data.subarray(p)
  return { blob: new Blob([picBytes], { type: mime }), type: mime }
}

// ---------------------------------------------------------------- FLAC

async function parseFlac(file) {
  const marker = new Uint8Array(await readBytes(file, 0, 4))
  if (String.fromCharCode(...marker) !== 'fLaC') return null

  const meta = {}
  let pos = 4
  let isLast = false

  while (!isLast) {
    const headerBuf = new Uint8Array(await readBytes(file, pos, pos + 4))
    if (headerBuf.length < 4) break
    const blockHeader = headerBuf[0]
    isLast = (blockHeader & 0x80) !== 0
    const blockType = blockHeader & 0x7f
    const blockSize = (headerBuf[1] << 16) | (headerBuf[2] << 8) | headerBuf[3]
    const blockStart = pos + 4

    if (blockSize > MAX_TAG_BYTES) break

    if (blockType === 4) {
      // VORBIS_COMMENT
      const buf = new Uint8Array(await readBytes(file, blockStart, blockStart + blockSize))
      Object.assign(meta, parseVorbisComment(buf))
    } else if (blockType === 6 && !meta.coverBlob) {
      // PICTURE
      const buf = new Uint8Array(await readBytes(file, blockStart, blockStart + blockSize))
      const pic = parseFlacPicture(buf)
      if (pic) {
        meta.coverBlob = pic.blob
        meta.coverType = pic.type
      }
    }

    pos = blockStart + blockSize
    if (pos > file.size) break
  }

  return meta
}

function parseVorbisComment(buf) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const decoder = new TextDecoder('utf-8')
  const meta = {}
  let p = 0

  const vendorLen = view.getUint32(p, true)
  p += 4 + vendorLen
  const count = view.getUint32(p, true)
  p += 4

  for (let i = 0; i < count && p + 4 <= buf.length; i++) {
    const len = view.getUint32(p, true)
    p += 4
    if (p + len > buf.length) break
    const comment = decoder.decode(buf.subarray(p, p + len))
    p += len
    const eq = comment.indexOf('=')
    if (eq === -1) continue
    const field = comment.slice(0, eq).toUpperCase()
    const value = comment.slice(eq + 1)
    if (field === 'TITLE' && !meta.title) meta.title = value
    else if (field === 'ARTIST' && !meta.artist) meta.artist = value
    else if (field === 'ALBUM' && !meta.album) meta.album = value
  }
  return meta
}

function parseFlacPicture(buf) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  let p = 4 // skip picture type
  const mimeLen = view.getUint32(p, false)
  p += 4
  const mime = new TextDecoder('ascii').decode(buf.subarray(p, p + mimeLen)) || 'image/jpeg'
  p += mimeLen
  const descLen = view.getUint32(p, false)
  p += 4 + descLen
  p += 16 // width, height, depth, colors (4 x uint32)
  const dataLen = view.getUint32(p, false)
  p += 4
  if (p + dataLen > buf.length) return null
  return { blob: new Blob([buf.subarray(p, p + dataLen)], { type: mime }), type: mime }
}

// ---------------------------------------------------------------- public

/**
 * Parse metadata for a file. Never throws — returns a (possibly empty)
 * object: { title?, artist?, album?, coverBlob?, coverType? }.
 */
export async function parseMetadata(file) {
  try {
    const name = file.name.toLowerCase()
    if (name.endsWith('.flac')) {
      return (await parseFlac(file)) || {}
    }
    // Default to ID3 (MP3 and many others embed it).
    return (await parseId3(file)) || {}
  } catch {
    return {}
  }
}
