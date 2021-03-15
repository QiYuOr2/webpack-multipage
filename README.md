# Webpack 构建多页面程序



## 原理

将每个页面所在的文件夹都看作是一个单独的单页面程序目录，配置多个`entry`以及`html-webpack-plugin`即可实现多页面打包。

下面为本项目目录结构

```
.
├─ src
│  └─ pages
│       ├─ about
│       │    ├─ index.css
│       │    ├─ index.html
│       │    └─ index.js
│       └─ index
│            ├─ index.css
│            ├─ index.html
│            └─ index.js
└─ webpack.config.js
```

## 单页面打包基础配置

首先我们来看一下单页面程序的 webpack 基础配置

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
    }),
  ],
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js',
  },
};
```

要想将其改为多页面程序，就要将它的单入口和单 HTML 模板改为多入口和多 HTML 模板

## 多页面打包基础配置

### 改造入口

传统的多入口写法可以写成键值对的形式

```js
module.exports = {
  entry: {
    index: './src/pages/index/index.js',
    about: './src/pages/about/index.js',
  },
  ...
}
```

这样写的话，每增加一个页面就需要手动添加一个入口，比较麻烦，因此我们可以定义一个根据目录生成入口的函数来简化我们的操作

```js
const glob = require('glob');

function getEntry() {
  const entry = {};
  glob.sync('./src/pages/**/index.js').forEach((file) => {
    const name = file.match(/\/pages\/(.+)\/index.js/)[1];
    entry[name] = file;
  });
  return entry;
}

module.exports = {
  entry: getEntry(),
  ...
}
```

### 改造输出

在输出的配置项中，再将输出的文件名写死显示已经不合适了，因此我们要将名字改为与源文件相匹配的名字

```js
module.exports = {
  ...
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'js/[name].[contenthash].js',
  },
  ...
}
```

### 配置多个 html-webpack-plugin

与入口相同，可以将不同的 html 模板直接写入插件配置中，这里我们需要为每个插件配置不同的`chunks`，防止 js 注入到错误的 html 中

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  ...
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/pages/index/index.html',
      chunks: ['index'],
      filename: 'index.html',
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/about/index.html',
      chunks: ['about'],
      filename: 'about.html',
    }),
  ],
  ...
};
```

这样的做法与入口有着同样的毛病，因此我们再定义一个函数来生成这个配置

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const glob = require('glob');

function getHtmlTemplate() {
  return glob
    .sync('./src/pages/**/index.html')
    .map((file) => {
      return { name: file.match(/\/pages\/(.+)\/index.html/)[1], path: file };
    })
    .map(
      (template) =>
        new HtmlWebpackPlugin({
          template: template.path,
          chunks: [template.name.toString()],
          filename: `${template.name}.html`,
        })
    );
}

module.exports = {
  ...
  plugins: [...getHtmlTemplate()],
  ...
};
```

这样一个简单的多页面项目就配置完成了，我们还可以在此基础上添加热更新、代码分割等功能，有兴趣的可以自己尝试一下

## 完整配置



```js
// webpack.config.js

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const glob = require('glob');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

// 多页入口
function getEntry() {
  const entry = {};
  glob.sync('./src/pages/**/index.js').forEach((file) => {
    const name = file.match(/\/pages\/(.+)\/index.js/)[1];
    entry[name] = file;
  });
  return entry;
}

// 多页模板
function getHtmlTemplate() {
  return glob
    .sync('./src/pages/**/index.html')
    .map((file) => {
      return { name: file.match(/\/pages\/(.+)\/index.html/)[1], path: file };
    })
    .map(
      (template) =>
        new HtmlWebpackPlugin({
          template: template.path,
          chunks: [template.name.toString()],
          filename: `${template.name}.html`,
        })
    );
}

const config = {
  mode: 'production',
  entry: getEntry(),
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'js/[name].[contenthash].js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [new CleanWebpackPlugin(), ...getHtmlTemplate()],
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 3000,
    hot: true,
    open: true,
  },
};

module.exports = config;
```
