// Message packing
const pack = module.exports.pack = {
  string (str, length, buf, start) {
    start = pack.ui32(length, buf, start)
    return start + buf.write(str, start, length)
  },
  ui32 (v, buf, start) {
    return buf.writeUInt32LE(v, start)
  }
}
pack.handle = pack.ui32

const gen = module.exports.gen = {
  string (name) {
    return {
      preface: [`const ${name}Length = Buffer.byteLength(${name}) + 1`],
      length: {
        type: 'variable',
        value: `${name}Length`
      },
      write: [
        `offset = buf.writeUInt32LE(${name}Length, offset)`,
        `offset += buf.write(${name} + '\0', offset, ${name}Length)`
      ]
    }
  },
  ui32 (name) {
    return {
      length: {
        type: 'fixed',
        value: 4
      },
      write: [
        `offset = buf.writeUInt32LE(${name}, offset)`
      ]
    }
  }
}

gen.handle = gen.ui32

// Message unpacking
const unpack = module.exports.unpack = {
  string (buf, start) {
    const length = unpack.ui32(buf, start)
    start += 4
    return buf.toString('utf8', start, start + length)
  },
  ui32 (buf, start) {
    return buf.readUInt32LE(start)
  },
  handle: this.ui32
}

module.exports.SIZES = {
  ui32: 4,
  handle: 4
}
