require('./helper')

const fs = require('fs').promise
const Promise = require('songbird')

async function cat(filePath) {
  let fileNameDirs = filePath.split('/')
  let fileName = fileNameDirs[fileNameDirs.length - 1]

  try {
    let fileData = await fs.readFile(filePath)
    fileData = fileName + ":\n\n" + fileData
    return fileData
  } catch(err) {}
}

function main(filePath) {
  return cat(filePath)
}

module.exports = main
