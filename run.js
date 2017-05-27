var fs = require('fs')
var path = require('path')
var parser = require('js-yaml')

var raw = fs.readFileSync(path.join(__dirname, 'protocol.yml'), 'utf8')
var protocol = parser.load(raw)

const message = require('./lib/message')
const unpack = message.unpack

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
  console.log('start', start, buf.length)
  const monitor = unpack.ui32(buf, start)
  start += 4
  const share = unpack.ui32(buf, start)
  console.log('%s %s createWindow(%s, %s, %s, %s, %s)', size, operation, width, height, title, monitor, share)
}

const proto = {
  functions: {

  }
}

// TODO:
// - client controls handle ids to avoid every operation being async
// - some operations are async such as getMonitors (i.e. when the user operates
//   on the DATA that is returned)
// - generate proxy objects (e.g. Window and Monitor)
// - generate c code
// - hook js up to c (node addon seems like the easiest)
// - allocate from rolling pool of ArrayBuffer backed buffers

const allocator = {
  alloc (size) {
    return new Buffer(size)
  }
}

const jsgen = require('./generators/js')
const cgen = require('./generators/c')
var operationId = 1
Object.keys(protocol.functions).forEach((fn) => {
  const js = jsgen.generateFunction(operationId++, fn, protocol.functions[fn])
  const c = cgen.generateFunctionSink(operationId, fn, protocol.functions[fn])
  console.log(c)
  eval(js)
})

var cmd = proto.functions.createWindow(640, 480, 'hello world', 0, 0)
unpackCreateWindow(cmd)
