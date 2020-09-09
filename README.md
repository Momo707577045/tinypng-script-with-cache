# 无依赖的 tinypng node 脚本
## 特点
- 【无依赖，纯脚本】
  - 下载脚本代码，直接使用 node 命令即可运行。
  - 将使用门槛降到最低。
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


## 专为小型项目定制
- 纯脚本，不依赖 gulp，不依赖 webpack，无需搭建脚手架环境
- 小型项目，或者只有几个静态页面，搭建脚手架的成本过高。本脚解决的即是脚手架依赖的问题。
- 当然，中大型项目也可以用，只是其「无依赖」的特点在里面没那么突出。中大型项目推荐使用其 [gulp 版本](https://segmentfault.com/a/1190000023895556)，实现更灵活的配置。


## 使用方式
- 第一步，点击[下载源码](http://upyun.luckly-mjw.cn/lib/mtp.js)
- 第二步，在脚本文件头部添加 tinypng 的 [api key](https://tinypng.com/developers)
  ```
  global.tinypngConf = {
    apiKeyList: [
      // 'XgNgkoyWbdIZd8OizINMjX2TpxAd_Gp3', // 无效 key
      // 'IAl6s3ekmONUVMEqWZdIp1nV2ItJL1PC', // 无效 key
      'IAl6s3ekmONUVMEqWZdIp1nV2ItJLyPC', // 有效 key
    ]
  }
  ```
  ![配置图](http://upyun.luckly-mjw.cn/Assets/tinypng/004.png)
- 第三步，赋予脚本文件「可执行」权限，```chmod +x ./mtp.js```
- 第四步，将脚本文件放置到项目所在目录
  ![运行效果](http://upyun.luckly-mjw.cn/Assets/tinypng/007.jpeg)
- 第五步，在项目所在目录运行脚本```node ./mtp.js```
  ![运行效果](http://upyun.luckly-mjw.cn/Assets/tinypng/006.jpeg)
- 后续使用，仅需最后两步「第四步」「第五步」


## 参数传递方式
#### 默认压缩路径
- 默认压缩「运行命令所在文件夹」下的图片
- 「命令传参」优先级高于「修改源文件设置」


#### 修改源文件设置
- 在源文件头部，写入全局参数，程序运行时自动获取
- 全部参考配置如下
  ```
  global.tinypngConf = {
     basePath: '/Users/mjw/Desktop/git/tinypng-script-with-cache/test-img', // 压缩路径
     createMd5FormOrigin: false, // 不进行压缩操作，只生成现有图片的 md5 信息，并作为缓存。用于「初次项目接入」及手动清理冗余的「图片md5信息」
     apiKeyList: [ // tiny png 的 api key 数组，当其中一个不可用或超过使用次数时，自动切换下一个 key 调用
       'IAl6s3ekmONUVMEqWZdIp1nV2ItJLyPC', // 有效 key
     ]
   }
  ```
  ![配置图](http://upyun.luckly-mjw.cn/Assets/tinypng/004.png)

#### 命令传参
- 参数通过空格区分
- 参数一：压缩路径
- 参数二：是否不进行压缩操作，只生成现有图片的 md5 信息。除空字符串```''```外，其余值均为 true
- 参数三：apiKeyList，以逗号区分```,```
- 传参参考
  ```
  node ./mtp.js /Users/mjw/Desktop/git/tinypng-script-with-cache/test-img '' IAl6s3ekmONUVMEqWZdIp1nV2ItJLyPC
  ```
  ![运行效果](http://upyun.luckly-mjw.cn/Assets/tinypng/005.jpeg)

#### 配置合并优先级源码
```
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
```

## [项目地址](https://github.com/Momo707577045/tinypng-script-with-cache)

## 二次开发，生成自定义脚本
- git clone 下载项目
- npm install 安装依赖
- 修改「tinypng-mjw.js」与「tinypng-with-cache.js」源文件
- 执行```npx webpack --config webpack.config.js```命令，进行打包
- 生成目标文件```dist/mtp.js```


## 测试资源
- test-img：图片压缩测试目录
- test-img-origin：测试图片备份目录，用于恢复测试


## 运行效果
![运行效果](http://upyun.luckly-mjw.cn/Assets/tinypng/006.jpeg)

## 压缩报告
![压缩报告](http://upyun.luckly-mjw.cn/Assets/tinypng/002.png)

## md5 记录
![md5 记录](http://upyun.luckly-mjw.cn/Assets/tinypng/003.png)

## gulp 版本请参考[这里](https://segmentfault.com/a/1190000023895556)