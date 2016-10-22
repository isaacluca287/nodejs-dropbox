#!/usr/bin/env babel-node

require('./helper')

const path = require('path')
const fs = require('fs').promise
const express= require('express')
const morgan = require('morgan')
const nodeify = require('bluebird-nodeify')
const mimetype = require('mime-types')
// const Hapi = require('hapi')
// const asyncHandlerPlugin = require('hapi-async-handler')

require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = path.resolve(process.cwd())

const cat = require('./cat')
// const rm = require('./rm')
// const mkdir = require('./mkdir')
// const touch = require('./touch')

function getLocalFilePathFromRequest(request) {
  return path.join(ROOT_DIR, 'files', request.params.file)
}

async function sendHeaders(request, reply, next) {
  let filePath = getLocalFilePathFromRequest(request)
  request.filePath = filePath

  if (filePath.indexOf(ROOT_DIR) !== 0) {
    reply.send(400, 'Invalid path')
    return
  }

  try {
    let stat = await fs.promise.lstat(filePath)

    if (stat.isDirectory()) {
      let files = await fs.readdir(filePath)
      reply.body = JSON.stringify(files)
      reply.setHeader('Content-Length', reply.body.length)
      reply.setHeader('Content-Type', 'aplication/json')
    } else {
      reply.setHeader('Content-Length', stat.size)
      let contentType = mimetype.contentType(path.extname(filePath))
      reply.setHeader('Content-Type', contentType)
    }
  } catch(err) {
    reply.setHeader('Content-Length', Object.keys(err).length)
    reply.setHeader('Content-Type', 'application/json')
    reply.status(400)
  }

  next();
}

async function readHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)

  console.log(`Reading ${filePath}`)
  const data = await cat(filePath)
  reply.end(data + '\n')
}

async function createHandler(request, reply) {
  /* eslint no-unused-expressions: 0 */
  const filePath = getLocalFilePathFromRequest(request)

  console.log(`Creating ${filePath}`)

  const stat = await fs.stat(filePath)
  await stat.isDirectory() ? mkdir(filePath) : touch(filePath)
  reply()
}

async function updateHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)

  console.log(`Updating ${filePath}`)
  await fs.writeFile(filePath, request.payload)
  reply()
}

async function deleteHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)

  console.log(`Deleting ${filePath}`)
  await rm(filePath)
  reply()
}

async function headHandler(request, reply) {
  reply.end()
}

async function main() {
  let app = express()

  if (NODE_ENV === 'development') {
    app.use(morgan('dev'))
  }

  app.head('/:file', sendHeaders, headHandler)
  app.get('/:file', readHandler)

  await app.listen(PORT)
  console.log(`LISTENING @ http://127.0.0.1:${PORT}`)
}

main()
