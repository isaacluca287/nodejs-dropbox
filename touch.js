require('./helper')
const fs = require('fs').promise

async function touch(filePath) {
  let data = await fs.open(filePath, "wx")
}

function main(filePath) {
  return touch(filePath)
}

module.exports = main
