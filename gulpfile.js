let gulp = require('gulp')
let tinypng = require('./gulp-tinypng-with-cache')

const projectPath = __dirname + '/test-img' // 测试项目路径，可通过 test-img-origin 恢复未压缩前图片
const apiKeyList = [
  // 'XgNgkoyWbdIZd8OizINMjX2TpxAd_Gp3', // 无效 key
  // 'IAl6s3ekmONUVMEqWZdIp1nV2ItJL1PC', // 无效 key
  'IAl6s3ekmONUVMEqWZdIp1nV2ItJLyPC', // 有效 key
]

gulp.task('default', function () {
  return gulp.src([
    projectPath + '/**/*.png',
    projectPath + '/**/*.jpg',
    projectPath + '/**/*.jpeg',
    '!/**/node_modules/*', // 忽略无需遍历的文件，路径匹配语法参考：https://www.gulpjs.com.cn/docs/getting-started/explaining-globs/
  ], {
    base: './', // 对文件使用相路径，为了后面覆盖源文件
    nodir: true, // 忽略文件夹
  })
  .pipe(tinypng({
    apiKeyList,
    reportFilePath: __dirname + '/tinypngReport.json', // 不设置，则不进行日志记录
    md5RecordFilePath: __dirname + '/tinypngMd5Record.json', // 不设置，则不进行缓存过滤
    minCompressPercentLimit: 10, // 默认值为零，最小压缩百分比限制，为保证图片质量，当压缩比例低于该值时，保持源文件，避免过分压缩，损伤图片质量
    createMd5FormOrigin: false, // 不进行压缩操作，只生成现有图片的 md5 信息，并作为缓存。用于「初次项目接入」及手动清理冗余的「图片md5信息」
  }))
  .pipe(gulp.dest('./', { overwrite: true })) // 覆写原文件
})