const vfs = require('vinyl-fs');
let tinypng = require('./tinypng-with-cache')

let apiKeyList = [] // 接口 key 默认为空
let basePath = process.cwd() // 默认运行脚本所在目录
let createMd5FormOrigin = false // 不进行压缩操作，只生成现有图片的 md5 信息，并作为缓存。用于「初次项目接入」及手动清理冗余的「图片md5信息」

// 如果有全局传值
if (global.tinypngConf) {
  basePath = tinypngConf.basePath || basePath
  apiKeyList = tinypngConf.apiKeyList || apiKeyList
  createMd5FormOrigin = tinypngConf.createMd5FormOrigin || createMd5FormOrigin
}

// 动态参数传值
basePath = process.argv[2] || basePath
createMd5FormOrigin = process.argv[3] || createMd5FormOrigin
apiKeyList = process.argv[4] ? process.argv[4].split(',') : apiKeyList

let fileFilter = [
  basePath + '/**/*.png',
  basePath + '/**/*.jpg',
  basePath + '/**/*.jpeg',
  '!/**/node_modules/*', // 忽略无需遍历的文件，路径匹配语法参考：https://www.gulpjs.com.cn/docs/getting-started/explaining-globs/
]

console.log({
  basePath,
  apiKeyList,
  fileFilter,
  createMd5FormOrigin,
})

if (!apiKeyList.length) {
  return console.error('tinypng-script-with-cache', 'tinypny key 列表不能为空!')
}

vfs.src(fileFilter, {
  base: './', // 对文件使用相路径，为了后面覆盖源文件
  nodir: true, // 忽略文件夹
})
.pipe(tinypng({
  apiKeyList,
  reportFilePath: basePath + '/tinypngReport.json', // 不设置，则不进行日志记录
  md5RecordFilePath: basePath + '/tinypngMd5Record.json', // 不设置，则不进行缓存过滤
  minCompressPercentLimit: 10, // 默认值为零，最小压缩百分比限制，为保证图片质量，当压缩比例低于该值时，保持源文件，避免过分压缩，损伤图片质量
  createMd5FormOrigin, // 不进行压缩操作，只生成现有图片的 md5 信息，并作为缓存。用于「初次项目接入」及手动清理冗余的「图片md5信息」
}))
.pipe(vfs.dest('./', { overwrite: true })) // 覆写原文件