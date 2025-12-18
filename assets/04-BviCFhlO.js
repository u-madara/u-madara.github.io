const n=`---
title: "html面试题"
excerpt: "html的一些面试题"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-11-14"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

# HTML面试题

## 1. src和href的区别
- **src**：指向的内容会嵌入当前标签所在位置，并且需要加载编译执行完之后才会执行其他资源
- **href**：指向一些网络资源，执行到的时候会并行下载，不会停止对当前文档的处理

## 2. 对HTML语义化的理解
语义化是指根据内容的结构化，选择合适的标签

### 优点：
- 更适合搜索引擎的爬虫爬取有效信息，有利于SEO
- 增强可读性，结构更清晰

### 常见的语义化标签：
\`\`\`html
<header>头部</header>
<nav>导航栏</nav>
<section>区块</section>
<main>主要区域</main>
<aside>侧边栏</aside>
<footer>底部</footer>
\`\`\`

## 3. DOCTYPE(文档类型) 的作用
告诉浏览器（解析器）应该以什么样（html或xhtml）的文档类型定义解析文档

### 渲染页面的两种模式（可通过document.compatMode获取）
- **CSS1Compat**: 标准模式
  - 浏览器使用W3C的标准解析渲染页面，在标准模式中，浏览器以其支持的最高标准呈现页面
- **BackCompat**: 怪异模式
  - 浏览器使用自己的怪异模式解析渲染页面。在怪异模式中，页面以一种比较宽松的向后兼容的方式显示

## 4. Script标签的defer和async的区别
- 如果没有defer或async属性，浏览器会立即加载并执行相应的脚本，会阻塞后续文档的加载
- defer和async属性都是去异步加载外部的js脚本文件，它们都不会阻塞页面的解析

### 区别：
#### 执行顺序：
- 多个async属性的标签，不能保证加载的顺序
- 多个带defer属性的标签，按照加载顺序执行

#### 脚本是否并行执行：
- **async属性**：表示后续文档的加载和执行与js脚本的加载和执行是并行进行的
- **defer属性**：加载后续文档的过程和js脚本的加载（此时仅加载不执行）是并行的，js脚本需要等到文档所有元素解析完成之后才执行

## 5. 常用的meta标签
\`\`\`html
<meta charset="UTF-8" /> 用来描述HMTL文档的编码类型
<meta name="keywords" content="关键词" /> keywords, 页面关键词
<meta name="description" content="页面描述" /> description, 页面描述
<meta http-equiv="refresh" content="0;url=" /> refresh，页面重定向和刷新
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/> 适配移动端，可以控制视口的大小和比例
\`\`\`

### viewport属性说明：
- width viewport: 宽度（数值/device-width）
- height viewport: 高度（数值/device-height）
- initial-scale: 初始缩放比例
- maximum-scale: 最大缩放比例
- minimum-scale: 最小缩放比例
- user-scalable: 是否允许用户缩放（yes/no）

\`\`\`html
<meta name="robots" content="index,follow" /> 搜索引擎索引方式
\`\`\`

### robots content属性：
- all: 文件将被检索，且页面上的链接可以被查询
- none: 文件将不可检索，且页面上的链接不可以被查询
- index: 文件将被检索；
- follow: 页面上的链接可以被查询
- noindex: 文件将不被检索
- nofollow: 页面上的链接不可以被查询

## 6. HTML5的更新

### 1. 语义化标签
\`\`\`html
<header>头部</header>
<nav>导航</nav>
<footer>底部</footer>
<article>文章</article>
<section>区块</section>
<aside>侧边栏</aside>
\`\`\`

### 2. 媒体标签

#### 音频标签：
\`\`\`html
<audio src="" controls autoplay loop="true">音频</audio>
\`\`\`
- controls: 控制面板
- autoplay: 自动播放
- loop="true": 循环播放

#### 视频标签：
\`\`\`html
<video src="" poster="imgs/aa.jpg" controls>视频</video>
\`\`\`
- poster: 指定视频还没有完全下载完毕，或者用户还没有点击播放前显示的封面，默认显示当前视频文件的第一帧画面，当然通过poster也可以自己指定
- controls: 控制面板
- width: 宽度
- height: 高度

#### 多视频源：
\`\`\`html
<video>
    <source src="aa.flv" type="video/flv"></source>
    <source src="aa.mp4" type="video/mp4"></source>
</video>
\`\`\`

### 3. 表单

#### 表单类型：
\`\`\`html
<input type="text">
\`\`\`
- email: 能够验证当前输入的邮箱地址是否合法
- url: 验证URL
- number：智能输入数字，其他输入不了，自带上下增大减小箭头，max属性可以设置最大值，min可以设置为最小值，value为默认值
- search：输入框后面会有清除按钮
- range：可以提供给一个范围，其中可以设置max和min以及value，其中value属性可以设置为默认值
- color：提供一个颜色拾取器
- time：时分秒
- date: 日期选择年月日
- datetime: 时间和日期，目前只有safari支持
- datetime-local: 日期时间控件
- week: 周控件
- month: 月控件

#### 表单属性：
- placeholder: 提示信息
- autofocus: 自动获取焦点
- autocomplate="on"或者autocomplete="off"使用这个属性需要有两个前提
  - 表单必须提交过
  - 必须有name属性
- required: 要求输入框不能为空，必须有值才能提交
- pattern=""里面写入想要的正则模式，例如手机号
- multiple: 可以选择多个文件或者多个邮箱
- form=""form表单的ID

#### 表单事件：
- oninput: 每当input里输入框内容发送变化都会触发此事件
- oninvalid: 每当验证不通过时触发此事件

### 4. 进度条、度量器
\`\`\`html
<progress>任务的进度</progress>（IE和Safari不支持）
<meter value="">用来显示剩余容量和剩余库存的</meter>（IE和Safari不支持）
\`\`\`
- progress: max表示任务的进度，value表示已完成多少
- meter: max/min规定最大最小值，value规定当前度量值，high/low：规定被视作高/低的范围，设置规则：min < low < high < max

### 5. DOM查询操作
- document.querySelector(),选择指定dom的第一个元素
- document.querySelectorAll() 选择指定dom的所有元素

### 6. Web存储
- localStorage: 没有时间限制的数据存储
- sessionStorage: 针对一个session的数据存储

### 7. 其他

#### 拖放：
\`\`\`html
<img src="" alt="" draggable="true">
\`\`\`

#### 画布:
\`\`\`html
<canvas id="myCanvas" width="200" height="200"></canvas>
\`\`\`

#### SVG:
可伸缩矢量图形，使用XML格式定义图形，图像在缩放或者改变尺寸的时候，图形质量不会有损失

#### 地图定位：
geolocation(地理定位)用于定位用户的位置

### 总结：
1. 新增语义化标签
2. 视频、音频标签
3. 数据存储
4. 画布、地理定位、websocket
5. input新增属性
6. history API： go、forward、back、pushState

#### 移除的元素：
\`\`\`html
<basefont></basefont> <big></big> <center></center> <font></font> <s></s> <strike></strike> <tt></tt> <u></u>
\`\`\`

## 7. img的srcset属性的作用
响应式页面经常用到根据屏幕密度设置不同的图片。srcset属性用于设置不同屏幕密度下，img会自动加载不同的图片

\`\`\`html
<img src="image-128.png" alt="" srcset="image-256.png 2x" />
\`\`\`
使用以上代码，屏幕密度1x的情况下加载image-128.png,屏幕密度为2x的时候加载image-256.png,如果每个图片设置4张图片，加载就会很慢。

### 新的srcset标准：
\`\`\`html
<img src="image-128.png" alt="" sizes="(max-width: 360px) 340px, 128px" srcset="image-128.png 128w, image-256.png 256w, image-512.png 512w">
\`\`\`

- 其中srcset指定图片的地址和对应的图片质量。sizes用来设置图片的尺寸零界点。对于 srcset 中的 w 单位，可以理解成图片质量。如果可视区域小于这个质量的值，就可以使用。浏览器会自动选择一个最小的可用图片。
- sizes="[media query] [length], [media query] [length] ... "
- sizes就是指默认显示128px, 如果视区宽度大于360px, 则显示340px。

## 8. 行内元素、块级元素、空元素

### 行内元素：
\`\`\`html
<a href=""></a>
<b></b>
<span></span>
<img src="" alt="">
<input type="text">
<select name="" id=""></select>
<strong></strong>
\`\`\`

### 块级元素：
\`\`\`html
<div></div>
<ul></ul>
<ol></ol>
<li></li>
<dl></dl>
<dt></dt>
<dd></dd>
<h1></h1>
<h2></h2>
<h3></h3>
<h4></h4>
<h5></h5>
<h6></h6>
<p></p>
\`\`\`

### 空元素:
\`\`\`html
<br><hr><img src="" alt=""><input type="text"><link rel="stylesheet" href=""><meta>
<area shape="" coords="" href="" alt=""><base href=""><col><colgroup></colgroup><command><embed src="" type=""><keygen><param name="" value=""><source><track></track><wbr></wbr>
\`\`\`

## 9. 谈一下web worker

### 定义与核心概念
web worker是HTML5引入的一项技术，允许在浏览器后台线程中运行JavaScript代码，独立于主线程，不会阻塞页面渲染和用户交互。

### 分类
1. **Dedicated Worker（专用Worker）**
   - 只能被创建它的脚本使用
   - 生命周期与创建它的页面绑定

2. **Shared Worker（共享Worker）**
   - 可以被同源的多个页面共享使用
   - 生命周期独立于单个页面，只要有页面在使用就会一直存在

3. **Service Worker（服务Worker）**
   - 主要用于离线缓存、消息推送和后台同步
   - 运行在独立的上下文环境中，完全独立于页面
   - 支持拦截和处理网络请求

### 工作原理
- 主线程通过\`new Worker()\`创建Worker实例
- Worker线程在独立的JavaScript环境中运行，有自己的全局对象（\`self\`）
- 线程间通过\`postMessage()\`方法传递数据，数据会被序列化（深拷贝）
- 主线程可以通过\`terminate()\`方法终止Worker，Worker也可以通过\`self.close()\`关闭自己

### 基本使用方法

#### 1. 创建Worker
\`\`\`javascript
// 主线程
const worker = new Worker('worker.js');
\`\`\`

#### 2. 线程间通信
\`\`\`javascript
// 主线程发送消息
worker.postMessage('Hello Worker!');

// 主线程接收消息
worker.onmessage = function(event) {
  console.log('主线程收到:', event.data);
};

// worker.js 中接收消息
self.onmessage = function(event) {
  console.log('Worker收到:', event.data);
  // Worker发送消息
  self.postMessage('Hello Main!');
};
\`\`\`

#### 3. 终止Worker
\`\`\`javascript
// 主线程终止
worker.terminate();

// Worker内部终止
self.close();
\`\`\`

### 限制与注意事项
1. **同源策略**：Worker脚本必须与主线程脚本同源
2. **DOM访问限制**：Worker线程不能直接访问DOM，只能通过消息通信
3. **全局对象差异**：Worker中没有\`window\`对象，有自己的全局对象\`self\`
4. **XMLHttpRequest限制**：Worker中可以使用XMLHttpRequest，但有一些限制
5. **文件系统访问限制**：不能直接访问本地文件系统
6. **性能开销**：创建Worker会有一定的性能开销，不宜过多创建

### 应用场景
1. **计算密集型任务**：大数运算、加密解密、数据压缩
2. **图像处理**：Canvas图像处理、视频帧处理
3. **数据处理**：大规模数据过滤、排序、分析
4. **实时通信**：WebSocket连接维护
5. **后台同步**：Service Worker用于离线数据同步
6. **游戏开发**：物理引擎计算、AI逻辑

### 与其他方案对比
- **Web Worker vs 主线程**：Worker不会阻塞主线程，适合耗时操作
- **Web Worker vs Service Worker**：Service Worker主要用于网络层面，Web Worker用于计算层面
- **Web Worker vs WebAssembly**：WebAssembly更适合极端性能需求，Worker更适合JavaScript生态

### 代码示例：使用Worker进行大数计算
\`\`\`javascript
// 主线程
const worker = new Worker('calculate.js');

worker.postMessage({ num: 1000000 });

worker.onmessage = function(event) {
  console.log('计算结果:', event.data);
};

// calculate.js
self.onmessage = function(event) {
  const { num } = event.data;
  let result = 0;
  for (let i = 0; i <= num; i++) {
    result += i;
  }
  self.postMessage(result);
};
\`\`\`

### 总结
web worker是前端实现多线程的重要技术，通过将耗时操作移至后台线程，可以显著提高页面性能和用户体验。在实际开发中，需要根据具体场景选择合适的worker类型，并注意其使用限制。`;export{n as default};
//# sourceMappingURL=04-BviCFhlO.js.map
