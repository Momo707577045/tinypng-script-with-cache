const fs = require('fs')
const md5 = require('md5')
const gutil = require('gulp-util')
const request = require('request')
const through = require('through2')
const prettyBytes = require('pretty-bytes')
const PluginError = gutil.PluginError // 错误提示
const PLUGIN_NAME = 'gulp-tinypng-with-cache' // 插件名

let AUTH_TOKEN = '' // 根据 aypi key 生成的请求头，
let _createMd5FormOrigin = false // 不进行压缩操作，只生成现有图片的 md5 信息，并作为缓存。只会在接入本项目时用一次。
let _minCompressPercentLimit = 0 // 默认值为零，最小压缩百分比限制，为保证图片质量，当压缩比例低于该值时，保持源文件，避免过分压缩，损伤图片质量
let _md5RecordFilePath = '' // 压缩后图片 md5 信息文件所在路径
let _reportFilePath = '' // 报告文件路径
let _apiKeyList = [] // key 列表
let recordList = [] // 压缩日志列表
let md5RecordList = [] // 图片压缩后的 md5 记录数组
let keyIndex = 0 // 当前使用第几个 Key

let compressionInfo = {
  num: 0, // 压缩的文件数
  saveSize: 0, // 节省的体积
  originSize: 0, // 文件未被压缩前总体积
  savePercent: 0, // 压缩百分比
}

// 记录压缩结果
function recordResult () {
  const record = `共压缩 ${compressionInfo.num} 个文件，压缩前 ${prettyBytes(compressionInfo.originSize)}，压缩后 ${prettyBytes(compressionInfo.originSize - compressionInfo.saveSize)}，节省 ${prettyBytes(compressionInfo.saveSize)} 空间，压缩百分比 ${((compressionInfo.saveSize / (compressionInfo.originSize || 1)) * 100).toFixed(0)}%`
  gutil.log(record)
  recordList.push(record)
  _md5RecordFilePath && fs.writeFileSync(_md5RecordFilePath, JSON.stringify(md5RecordList))
  _reportFilePath && fs.writeFileSync(_reportFilePath, JSON.stringify(recordList))
}

// 主函数
function gulpMain ({ apiKeyList = [], md5RecordFilePath, reportFilePath, minCompressPercentLimit = 0, createMd5FormOrigin = false }) {
  if (!apiKeyList.length) {
    throw new PluginError(PLUGIN_NAME, 'tinypny key 列表不能为空!')
  }

  _apiKeyList = apiKeyList
  _md5RecordFilePath = md5RecordFilePath
  _reportFilePath = reportFilePath
  _minCompressPercentLimit = minCompressPercentLimit
  _createMd5FormOrigin = createMd5FormOrigin
  AUTH_TOKEN = Buffer.from('api:' + _apiKeyList[keyIndex]).toString('base64')
  gutil.log(`当前使用第一个 apiKey:  ${_apiKeyList[keyIndex]}`)
  try {
    md5RecordList = JSON.parse(fs.readFileSync(_md5RecordFilePath) || '[]')
  } catch (e) {

  }

  // gulp 进入的主流程
  return through.obj(function (file, enc, callback) {
    if (file.isStream()) {
      throw new PluginError(PLUGIN_NAME, 'Stream is not supported')
    } else if (file.isNull()) {
      this.push(file)
      return callback()
    } else if (file.isBuffer()) { // 正常处理的类型

      if (_createMd5FormOrigin) { // 不进行压缩操作，只生成现有图片的 md5 信息，并作为缓存。只会在接入本项目时用一次。
        md5RecordList.push(md5(file.contents)) // 记录到缓存中
        this.push(file)
        return callback()
      }

      // 目标文件在缓存中存在，且内容未发生变化
      if (_md5RecordFilePath && md5RecordList.indexOf(md5(file.contents)) > -1) {
        this.push(file)
        return callback()
      }

      // 不命中缓存，进行压缩
      let prevSize = file.contents.length // 压缩前的大小
      tinypng(file, (data) => {
        const compressPercent = (1 - data.length / prevSize) * 100// 压缩百分比
        const compressPercentStr = compressPercent.toFixed(0) + '%' // 压缩百分比
        if (compressPercent < _minCompressPercentLimit) { // 无效压缩，保存源文件
          md5RecordList.push(md5(file.contents)) // 记录到缓存中
          gutil.log(`压缩比例低于安全线，保存源文件: ${file.relative} 【${compressPercentStr}】`)
        } else { // 有效压缩
          file.contents = data
          compressionInfo.num++
          compressionInfo.saveSize += prevSize - data.length
          compressionInfo.originSize += prevSize
          md5RecordList.push(md5(data)) // 记录到缓存中
          let record = '压缩成功  '
          record += `前: ${prettyBytes(prevSize)}`.padEnd(15)
          record += `后: ${prettyBytes(data.length)}`.padEnd(15)
          record += `压缩: ${prettyBytes(prevSize - data.length)}`.padEnd(18)
          record += `${file.relative} `
          recordList.push(record)
          gutil.log(record)
        }
        this.push(file)
        _md5RecordFilePath && fs.writeFileSync(_md5RecordFilePath, JSON.stringify(md5RecordList)) // 每个文件压缩后，都保留一次 md5 信息。防止中途中断进程，浪费已压缩的记录。
        return callback()
      })
    }
  }, function (callback) { // 全部处理完后进入的函数，记录压缩缓存
    recordResult()
    callback()
  })
}

// 检测 key 文件，使用下一个 key
function checkApiKey (errorMsg, cb) {
  const matchError = [  // 匹配的错误信息
    'Credentials are invalid.', // apiKey 无效
    'Your monthly limit has been exceeded', // 已超本月免费的 500 张限制
  ]
  if (matchError.indexOf(errorMsg) > -1) {
    if (keyIndex < _apiKeyList.length - 1) {
      keyIndex++
      gutil.log(`apiKey 已超使用限制，切换使用第 ${keyIndex + 1} 个 apiKey: ${_apiKeyList[keyIndex]}`)
      AUTH_TOKEN = Buffer.from('api:' + _apiKeyList[keyIndex]).toString('base64') // 使用下一个 key
      cb() // 重试压缩
    } else {
      gutil.log('提供的 apiKey 已均不可用，压缩结束')
    }
  } else {
    recordResult()
    gutil.log('[error] : 文件不可压缩 - ', errorMsg)
  }
}

// 压缩文件
function tinypng (file, cb) {
  request({
    method: 'POST',
    strictSSL: false,
    body: file.contents,
    url: 'https://api.tinypng.com/shrink',
    headers: {
      'Accept': '*/*',
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + AUTH_TOKEN
    },
  }, function (error, response, body) {
    if (!error) {
      const results = JSON.parse(body)
      if (results.output && results.output.url) { // 获得实际下载的地址
        request.head(results.output.url, function (error) { // 通过head 请求，提前请求，确保资源存在
          if (!error) {
            request({
              headers: { 'Content-Type': 'application/octet-stream' },
              strictSSL: false,
              encoding: null, // 获取二进制数据，必须设置该值
              url: results.output.url,
            }, function (error, response, body) {
              cb(body)
            })
          } else {
            recordResult()
            gutil.log('[error] : 文件下载错误 - ', results.message)
          }
        })
      } else {
        // 检测 key 无效的错误码，从 key 列表中使用下一个 key
        checkApiKey(results.message, tinypng.bind(null, file, cb))
      }
    } else {
      recordResult()
      gutil.log('[error] : 上传出错 - ', error)
    }
  })
}


module.exports = gulpMain
