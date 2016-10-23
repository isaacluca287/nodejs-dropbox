require('./helper')

const fs = require('fs').promise
const Promise = require('songbird')
const path = require('path')

let filesList = []

async function ls(filePath) {
  let filePaths = await Promise.all(getAllFile(filePath))
  traverseArray(filePaths)
  filePaths = filesList
  filesList = []
  return filePaths
}

function traverseArray(list) {
  list.forEach((item) => {
    if (item) {
      if (typeof item === 'string') {
        filesList.push(item)
      } else {
        traverseArray(item)
      }
    }
  })
}

async function getAllFile(rootPath) {
  let fileNames = await fs.readdir(rootPath)

  return fileNames.map((fileName) => {
    let filePath = path.join(rootPath, fileName)

    return checkDirPromise(filePath).then((stats) => {
      if(!stats.isDirectory()) {
        return Promise.resolve(filePath)
      }

      return Promise.all(getAllFile(filePath))
    })
  })
}

function checkDirPromise(file) {
  return new Promise((resolve, reject) => {
    fs.lstat(file, (err, stats) => {
      if (err) {
        return reject(err)
      }

      return resolve(stats)
    })
  })
}

function main(filePath) {
  return ls(filePath)
}

module.exports = main
