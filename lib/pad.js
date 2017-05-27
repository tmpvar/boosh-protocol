module.exports = pad

function pad (l) {
  return '  '.repeat(l)
}

pad.lines = function padLines (l) {
  return function (line) {
    return pad(l) + line
  }
}
