### 「过滤重复压缩」
### 「替换源文件」
### 「静默压缩，不生成冗余文件」

## 项目特点
- 【过滤重复压缩】
  - 自动记录已被压缩过的图片，跳过压缩，加快进度。
  - 记录图片压缩后的 md5 值，再次运行压缩脚本时，跳过压缩。
  - 通过 md5 值比较文件变更，即使「文件迁移」也能自动过滤。
  - 通过 md5 值比较文件变更，即使「使用同名文件替换」也能自动识别，并压缩，没有漏网之鱼。
- 【替换源文件】
  - 压缩成功，直接替换源文件，不生成冗余文件，不需要复制粘贴，移动图片。
  - 静默压缩，对项目无感知，无任何影响。
- 【自动切换 api key】
  - tinypng 申请的 [api key](https://tinypng.com/developers) 每月只有 500 次免费压缩额度。
  - 可设置多个 api key，当某 key 超过使用次数时，自动切换下一个 key 进行压缩。
- 【压缩报告】
  - 记录每个图片的压缩数据，并生成汇总信息。
- 【压缩安全边界】
  - 压缩安全线，当压缩比例低于该百分比值时，保持源文件，避免过分压缩，损伤图片质量。
- 【源码携带详细备注，自带测试图片】
  - 降低源码阅读门槛，降低测试门槛，减低使用门槛。
  - 推荐阅读源码，打破恐惧，便于定制个性化需求。


## [项目地址](https://github.com/Momo707577045/gulp-tingpng-with-cache)


## 参数介绍
| 参数名 | 值类型 | 是否必填 | 参数作用 | 默认值 | 推荐值 |
| :------: | :------: | :------: | :------: | :------: | :------: |
| apiKeyList | Array | 必填 | tiny png 的 api key 数组，当其中一个不可用或超过使用次数时，自动切换下一个 key 调用 | 无 | 无 |
| reportFilePath | Number | 非必填 | 压缩报告文件路径，记录图片的压缩比例，生产压缩报告 | 无 | __dirname + '/tinyPngReport.json' |
| md5RecordFilePath | Number | 非必填 | 压缩后图片 md5 记录文件，如果待压缩图片的 md5 值存在于该文件，则跳过压缩，解决「重复压缩」问题 | 无 | __dirname + '/md5RecordFilePath.json' |
| minCompressPercentLimit | Number | 非必填 | 压缩安全线，当压缩比例低于该百分比时，保持源文件，避免图片过分压缩，损伤显示质量 | 0 | 10 |
| createMd5FormOrigin | Boolean | 非必填 | 不进行压缩操作，只生成现有图片的 md5 信息，并作为缓存。用于「初次项目接入」及手动清理冗余的「图片md5信息」 | false | false |


## 参数配置示例
```
let gulp = require('gulp')
let tinypng = require('gulp-tinypng-with-cache')

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
```


## 组件集成步骤
- 第一步：npm install -S gulp-tinypng-with-cache
- 第二步：根据示例进行参数配置
- 第三步：gulp


## 示例运行步骤
- 第一步：cd 到当前项目
- 第二步：npm install
- 第三步：gulp


## 测试资源
- test-img：图片压缩测试目录
- test-img-origin：测试图片备份目录，用于恢复测试


## 运行效果
![运行效果](http://upyun.luckly-mjw.cn/Assets/tinypng/001.png)

## 压缩报告
![压缩报告](http://upyun.luckly-mjw.cn/Assets/tinypng/002.png)

## md5 记录
![md5 记录](http://upyun.luckly-mjw.cn/Assets/tinypng/003.png)


## 特别感谢
- 感谢 Gaurav Jassal，本项目改编自他的 [gulp-tinypng](https://github.com/creativeaura/gulp-tinypng)
