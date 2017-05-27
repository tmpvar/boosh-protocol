const message = require('../lib/message')
const pad = require('../lib/pad')

module.exports.generateFunction = generateFunction

function generateFunction (operationId, fn, def) {
  const args = Object.keys(def.args)

  const preface = [
    `proto.functions.${fn} = ${fn}`,
    `function ${fn} (${args.join(', ')}) {`,
    `${pad(1)}var offset = 0`
  ]

  const sizeParts = [8]
  const lines = []

  args.forEach((k, i) => {
    const val = def.args[k]
    const type = (typeof val === 'string') ? val : val.type

    const obj = message.gen[type](k)

    if (obj.preface) {
      if (Array.isArray(obj.preface)) {
        Array.prototype.push.apply(preface, obj.preface.map(pad.lines(1)))
      }
    }
    switch (obj.length.type) {
      case 'fixed':
        sizeParts[0] += obj.length.value
        break

      case 'variable':
        sizeParts.push(obj.length.value)
        break

      default:
        throw new Error(`unknown length type for ${k}: ${JSON.stringify(obj.length)}`)
    }

    Array.prototype.push.apply(lines, obj.write.map(pad.lines(1)))
  })

  preface.push(`  const size = ${sizeParts.join(' + ')};`)
  preface.push(`  const buf = allocator.alloc(4 + size)`)
  preface.push('')
  preface.push('  // size and operationId')
  preface.push(`  offset = buf.writeUInt32LE(size, offset)`)
  preface.push(`  offset = buf.writeUInt32LE(${operationId}, offset)`)
  lines.push('  return buf')
  lines.push('}')

  const str = preface.join('\n') + '\n\n  // pack buffer\n' + lines.join('\n')
  return str
}
