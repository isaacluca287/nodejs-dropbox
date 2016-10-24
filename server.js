#!/usr/bin/env babel-node

require('./helper')

const path = require('path')
const fs = require('fs').promise
const express= require('express')
const morgan = require('morgan')
const nodeify = require('bluebird-nodeify')
const mimetype = require('mime-types')
const bodyParser = require('body-parser')
const Promise = require('songbird')
const archiver = require('archiver')
const argv = require('yargs').argv
// const Hapi = require('hapi')
// const asyncHandlerPlugin = require('hapi-async-handler')

require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = path.resolve(argv.dir || process.cwd())

const cat = require('./cat')
const ls = require('./ls')
const rm = require('./rm')
// const mkdir = require('./mkdir')
const touch = require('./touch')

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
  let data = ''

  console.log(`Reading ${filePath}`)

  try {
    let stat = await fs.lstat(filePath)

    if (!stat.isDirectory()) {
      data = await cat(filePath)
      let contentType = mimetype.contentType(path.extname(filePath))
      reply.setHeader('Content-Type', contentType)
    } else {
      data = await ls(filePath)

      if (request.headers.accept !== "application/x-gtar") {
        data = JSON.stringify(data)
        reply.setHeader('Content-Type', 'application/json')
      } else {
        let archive = archiver('zip')
        archive.pipe(reply)

        archive.bulk([
          { expand: true, cwd: './', src: ['**'], dest: './' }
        ])

        archive.finalize()
        reply.setHeader('Content-Type', 'application/x-gtar')
      }
    }
  } catch(err) {
    reply.status(405)
  }

  reply.end(data + '\n')
}

async function createHandler(request, reply) {
  /* eslint no-unused-expressions: 0 */
  const filePath = getLocalFilePathFromRequest(request)

  console.log(`Creating ${filePath}`)

  try {
    const stat = await fs.lstat(filePath)

    reply.status(405)
  } catch(err) {
    await touch(filePath)

    if (request.body.length) {
      let data = await fs.writeFile(filePath, request.body)
    }
  }

  reply.end('\n')
}

async function updateHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)

  console.log(`Updating ${filePath}`)

  try {
    const stat = await fs.lstat(filePath)

    if (request.body.length) {
      let data = await fs.writeFile(filePath, request.body)
    } else {
      reply.status(405)
    }
  } catch(err) {
    reply.status(405)
  }

  reply.end('\n')
}

async function deleteHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)

  console.log(`Deleting ${filePath}`)
  const data = await rm(filePath)
  reply.end(data + '\n')
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
  app.put('/:file', bodyParser.raw({ type: '*/*' }), createHandler)
  app.post('/:file', bodyParser.raw({ type: '*/*' }), updateHandler)
  app.delete('/:file', deleteHandler)

  await app.listen(PORT)
  console.log(`LISTENING @ http://127.0.0.1:${PORT}`)
}

main()
