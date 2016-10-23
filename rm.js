require('./helper')

const fs = require('fs').promise
const Promise = require('songbird')
const path = require('path')

let filesList = []
let dirsList = []

async function rm(filePath) {
  let fileNameDirs = filePath.split('/')
  let fileName = fileNameDirs[fileNameDirs.length - 1]

  try {
    let stat = await fs.lstat(filePath)

    if (!stat.isDirectory()) {
      try {
        let delFile = await fs.unlink(filePath)
        return "`" + fileName + "`: is successfully removed"
      } catch(err) {
        return "`" + fileName + "`: cannot remove this file"
      }
    } else {
      let paths = []
      let filePathPromise = Promise.all(getAllFile(filePath)).then((filePaths) => {
        paths = filesList.concat(filePaths)
      }).then(() => {
        traverseArray(paths)
        dirsList.push(filePath)

        if (filesList.length === 0) {
          dirsList.map((dir) => {
            deleteDirPromise(dir)
              .then((dirs) => {})
              .catch((err) => {})
          })
        } else {
          filesList.map((file) => {
            deleteFilePromise(file)
              .then((files) => {
                dirsList.map((dir) => {
                  deleteDirPromise(dir)
                    .then((dirs) => {})
                    .catch((err) => {})
                })
              })
              .catch((err) => {})
          })
        }
      })
    }
  } catch(err) {
    return "cannot remove ‘" + fileName + "’: No such file or directory\n"
  }
}

async function getAllFile(rootPath) {
  let fileNames = await fs.readdir(rootPath)

  return fileNames.map((fileName) => {
    let filePath = path.join(rootPath, fileName)

    return checkDirPromise(filePath).then((stats) => {
      if(!stats.isDirectory()) {
        return Promise.resolve(filePath)
      }

      dirsList.unshift(filePath)
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

function deleteFilePromise(file) {
  return new Promise((resolve, reject) => {
    fs.unlink(file, (err, files) => {
      if (err) {
        return reject(err)
      }

      return resolve(files)
    })
  })
}

function deleteDirPromise(dir) {
  return new Promise((resolve, reject) => {
    fs.rmdir(dir, (err, dirs) => {
      if (err) {
        return reject(err);
      }

      return resolve(dirs)
    })
  })
}

function main(filePath) {
  return filePath ? rm(filePath) : null
}

module.exports = main
