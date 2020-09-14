#!/usr/bin/env node
'use strict';

const fs = require('fs')

// 对操作的前置，设置 key
const keyPath = __dirname + '/key.json' // 秘钥存放文件，当前文件夹
const action = process.argv[2] // 操作

if (action === 'setKey') {
  const key = process.argv[3] // 应用 key
  if (!key) {
    console.error('请输入 apiKey，多个 key，以「,」隔开')
    process.exit(-1)
  }

  const keyList = key.split(',')
  keyList.forEach((keyItem) => {
    if (keyItem.trim().length !== 32) {
      console.error(`api key 长度不正确：${keyItem}，请输入 32 位 api key。多个 key，以「,」隔开`)
      process.exit(-1)
    }
  })
  fs.writeFileSync(keyPath, JSON.stringify(keyList))
} else if (action === '-h') { // 帮助文档
  console.log(`
  设置apiKey：
    格式：mtp setKey key,key
    示例：mtp setKey XgNgkoyWbdIZd8OizINMjX2TpxAd_Gp3,IAl6s3ekmONUVMEqWZdIp1nV2ItJLyPC
  压缩图片：
    格式：mtp [可选]目标压缩目录 [可选]是否仅仅创建md5，不进行压缩  [可选]使用特定apikey
    无参示例：mtp
    带参示例：mtp /Users/xxx/Desktop/test-img true XgNgkoyWbdIZd8OizINMjX2TpxAd_Gp3,IAl6s3ekmONUVMEqWZdIp1nV2ItJLyPC
  更多详情，参考：https://github.com/Momo707577045/tinypng-script-with-cache  
  `)
} else { // 尝试使用 key.json 中的 key
  try {
    const apiKeyList = JSON.parse(fs.readFileSync(keyPath) || '[]')
    if (apiKeyList && apiKeyList.length) {
      global.tinypngConf = global.tinypngConf || {}
      global.tinypngConf.apiKeyList = apiKeyList
    }
  } catch (e) {
  }
  require('../dist/mtp')
}


