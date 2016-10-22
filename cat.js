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
  } catch(err) {

    try {
      let fileStatChecking = await fs.lstat(filePath)
      return fileName + ": Is a directory"
    } catch (err) {
      return fileName + ": No such file or directory"
    }
  }
}

function main(filePath) {
  return filePath ? cat(filePath) : null
}

module.exports = main
