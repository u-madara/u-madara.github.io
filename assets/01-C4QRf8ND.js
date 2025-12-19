const n=`---
title: "nvm相关笔记"
excerpt: "介绍一下nvm包管理器相关的一些问题和操作"
coverImage: "/assets/blog/hello-world/cover.jpg"
date: "2025-08-17"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

写一些nvm常用的一些操作和使用遇到的问题

## 常用命令
查看nvm版本号&emsp;\`nvm --version\`
安装命令&emsp;\`nvm install 版本号\`
切换到指定版本的node&emsp;\`nvm use 版本号\`&emsp;windows之前应该是直接use就可以切换默认的node版本， mac有些特殊需要 \`nvm alias default 版本号\`
卸载命令&emsp;\`nvm uninstall 版本号\`
帮助命令&emsp;\`nvm --help\` 
列举已安装的node版本&emsp;\`nvm ls\`
列举可安装的node版本&emsp;\`nvm ls available\`
<!-- 查看nvm安装目录 \`nvm root\` -->

## 常见问题
#### 安装完nvm无法下载node
打开nvm目录找到setting.txt文件夹打开
添加以下代码
node_mirror: https://npmmirror.com/mirrors/node/
npm_mirror: https://npmmirror.com/mirrors/npm/`;export{n as default};
//# sourceMappingURL=01-C4QRf8ND.js.map
