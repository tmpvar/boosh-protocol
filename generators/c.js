const message = require('../lib/message')
const pad = require('../lib/pad')

module.exports.generateFunctionSink = generateFunctionSink

function generateFunctionSink (operationId, fn, def) {
  const args = Object.keys(def.args)

  const preface = [
    `void boosh_protocol_fn_sink_${fn} (char *buf, size_t length) {`
  ]

  const lines = [`${pad(1)}${fn}(`]
  const where = [0]
  Array.prototype.push.apply(lines, args.map((k, i) => {
    const val = def.args[k]
    const type = (typeof val === 'string') ? val : val.type

    var ret = null
    switch (type) {
      case 'ui32':
        ret = `${pad(2)}*(uint32_t *)(buf + ${where.join('+')})`
        where[0] += 4
        break

      // TODO: handle handles
      case 'handle':
        ret = `${pad(2)}0`
        where[0] += 4
        break

      case 'string':
        preface.push(`${pad(1)}uint32_t ${k}Length = *(uint32_t *)(buf + ${where});`)
        where[0] += 4

        ret = `${pad(2)}buf + ${where.join('+')}`
        where.push(`${k}Length`)
        break
    }

    if (i < args.length - 1) {
      ret += ','
    }

    return ret
  }))

  lines.push('  );')
  lines.push('}')

  const str = preface.join('\n') + '\n' + lines.join('\n')
  return str
}
