console.log(__dirname + '/dist')
module.exports = {
  target: 'node',
  mode: "production",
  entry: './tinypng-mjw.js',
  output: {
    filename: 'mtp.js',  // 打包代码时，加上 hash 戳
    path: __dirname + '/dist',
  }
}
