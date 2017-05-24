var fs = require('fs')
var path = require('path')
var parser = require('js-yaml')

var raw = fs.readFileSync(path.join(__dirname, 'protocol.yml'), 'utf8')
var protocol = parser.load(raw)
console.log(protocol)

function scheduleMessage (buf, size) {
  console.log(buf.toString())
}

// Message packing
const pack = {
  string (str, length, buf, start) {
    start = pack.ui32(length, buf, start)
    return start + buf.write(str, start, length)
  },
  ui32 (v, buf, start) {
    return buf.writeUInt32LE(v, start)
  }
}
pack.handle = pack.ui32

// Message unpacking
const unpack = {
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

const GLFW_CREATE_WINDOW = 1

function unpackCreateWindow (buf) {
  var start = 0
  const size = unpack.ui32(buf, start)
  start += 4
  const operation = unpack.ui32(buf, start)
  start += 4
  const width = unpack.ui32(buf, start)
  start += 4
  const height = unpack.ui32(buf, start)
  start += 4
  const title = unpack.string(buf, start)
  start += Buffer.byteLength(title) + 4
  const monitor = unpack.ui32(buf, start)
  start += 4
  const share = unpack.ui32(buf, start)
  console.log('%s %s createWindow(%s, %s, %s, %s, %s)', size, operation, width, height, title, monitor, share)
}

// simulate code gen
const SIZES = {
  ui32: 4,
  handle: 4
}

function pad (l) {
  return '  '.repeat(l)
}

const proto = {
  functions: {

  }
}

const allocator = {
  alloc (size) {
    return new Buffer(size)
  }
}

Object.keys(protocol.functions).forEach((fn) => {
  const def = protocol.functions[fn]
  const args = Object.keys(def.args)

  const preface = [
    `proto.functions.${fn} = ${fn}`,
    `function ${fn} (${args.join(', ')}) {`
  ]

  const sizeParts = [8]

  const lines = args.slice().reverse().map((k, i) => {
    const val = def.args[k]
    const type = (typeof val === 'string') ? val : val.type

    if (type === 'string') {
      preface.push(`${pad(1)}var ${k}Length = Buffer.byteLength(${k})`)
      sizeParts.push(`${k}Length`)
      return `${pad(i + 1)}pack.${type}(${k}, ${k}Length, buf,`
    } else if (SIZES[type]) {
      sizeParts[0] += SIZES[type]
      return `${pad(i + 1)}pack.${type}(${k}, buf,`
    } else {
      throw new Error('unknown type: ' + type)
    }
  })

  var l = lines.length + 1
  lines.push(`${pad(l)}pack.ui32(GLFW_CREATE_WINDOW, buf,`)
  lines.push(`${pad(l + 1)}pack.ui32(size, buf, 0)`)

  while (l > 0) {
    lines.push(pad(l) + ')')
    l--
  }

  preface.push(`  const size = ${sizeParts.join(' + ')}`)
  preface.push(`  const buf = allocator.alloc(4 + size)`)
  lines.push('  return buf')
  lines.push('}')
  const str = preface.concat(lines).join('\n')
  console.log(str)
  eval(str)
})

var cmd = proto.functions.createWindow(640, 480, 'hello world', 0, 0)

unpackCreateWindow(cmd)
