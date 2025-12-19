const n=`---
title: "点击劫持攻击与防护（二）：防护策略与实现"
excerpt: "全面介绍点击劫持的防护策略，包括X-Frame-Options响应头、CSP frame-ancestors指令、JavaScript防御技术以及自动化检测与监控工具的实现"
coverImage: "/assets/blog/hello-world/cover.jpg"
date: "2025-11-09"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

# 点击劫持攻击与防护（二）：防护策略与实现

## 前言

在上一篇文章中，我们详细介绍了点击劫持攻击的原理和类型。本文将重点探讨点击劫持的防护策略与实现方法，包括服务器端防护、客户端防御技术以及自动化检测与监控工具，帮助开发者构建全面的点击劫持防护体系。

## 点击劫持防护策略

### X-Frame-Options响应头

X-Frame-Options是一个HTTP响应头，用于控制是否允许浏览器在\`<frame>\`、\`<iframe>\`、\`<embed>\`或\`<object>\`中渲染页面。它有三个可能的值：

1. **DENY**：完全禁止页面被嵌入任何iframe
2. **SAMEORIGIN**：只允许同源页面嵌入
3. **ALLOW-FROM uri**：只允许指定域名的页面嵌入（已废弃）

#### 服务器端实现

\`\`\`javascript
// 使用Express框架设置X-Frame-Options
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

// 针对特定路由设置不同的X-Frame-Options
app.get('/public-content', (req, res) => {
  // 允许同源嵌入
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.send('Public content that can be embedded in same origin iframes');
});

app.get('/sensitive-content', (req, res) => {
  // 完全禁止嵌入
  res.setHeader('X-Frame-Options', 'DENY');
  res.send('Sensitive content that cannot be embedded in any iframe');
});
\`\`\`

#### 其他服务器环境配置

\`\`\`nginx
# Nginx配置
location / {
  add_header X-Frame-Options "DENY";
}

# 针对特定路径
location /public/ {
  add_header X-Frame-Options "SAMEORIGIN";
}
\`\`\`

\`\`\`apache
# Apache配置
Header always set X-Frame-Options "DENY"

# 针对特定目录
<Directory "/var/www/html/public">
  Header always set X-Frame-Options "SAMEORIGIN"
</Directory>
\`\`\`

### Content Security Policy (CSP) frame-ancestors

CSP的frame-ancestors指令是X-Frame-Options的替代方案，提供了更灵活的控制。它指定哪些页面可以嵌入当前页面。

#### 服务器端实现

\`\`\`javascript
// 使用Express和helmet设置CSP frame-ancestors
const express = require('express');
const helmet = require('helmet');
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
      
      // 允许特定域名的子域名嵌入
      // "frame-ancestors": ["'self'", "https://*.trusted-site.com"],
    }
  }
}));

// 针对特定路由设置不同的CSP
app.get('/embeddable-content', (req, res) => {
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://partner-site.com");
  res.send('Content that can be embedded by self and partner-site.com');
});
\`\`\`

#### HTML Meta标签设置

\`\`\`html
<!-- 在HTML头部设置CSP frame-ancestors -->
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" content="frame-ancestors 'none'">
  
  <!-- 或者只允许同源 -->
  <!-- <meta http-equiv="Content-Security-Policy" content="frame-ancestors 'self'"> -->
  
  <!-- 允许特定域名 -->
  <!-- <meta http-equiv="Content-Security-Policy" content="frame-ancestors 'self' https://trusted-site.com"> -->
  
  <title>Protected Page</title>
</head>
<body>
  <!-- 页面内容 -->
</body>
</html>
\`\`\`

### JavaScript防御技术

虽然服务器端防护是首选，但JavaScript可以提供额外的防御层，特别是在无法控制服务器头的情况下。

#### 检测iframe嵌入

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
  
  // 方法3: 破坏iframe布局
  document.body.style.position = 'fixed';
  document.body.style.top = '0';
  document.body.style.left = '0';
  document.body.style.width = '100%';
  document.body.style.height = '100%';
  document.body.style.zIndex = '999999';
  document.body.style.backgroundColor = 'white';
}

// 页面加载时执行检查
document.addEventListener('DOMContentLoaded', checkForIframeEmbedding);
\`\`\`

#### 防御光标劫持

\`\`\`javascript
// 防御光标劫持
function defendAgainstCursorjacking() {
  // 检测是否隐藏了真实光标
  const computedStyle = window.getComputedStyle(document.body);
  const cursor = computedStyle.cursor;
  
  if (cursor === 'none' || cursor === 'url(') {
    console.warn('Potential cursorjacking detected - cursor is hidden or replaced');
    
    // 恢复默认光标
    document.body.style.cursor = 'auto';
    
    // 检测假光标元素
    const fakeCursors = document.querySelectorAll('[style*="cursor"], [style*="pointer-events: none"]');
    fakeCursors.forEach(element => {
      if (element.style.pointerEvents === 'none' && 
          (element.style.backgroundImage.includes('cursor') || 
           element.classList.contains('cursor'))) {
        console.warn('Potential fake cursor detected:', element);
        element.style.display = 'none';
      }
    });
  }
}

// 定期检查
setInterval(defendAgainstCursorjacking, 1000);
\`\`\`

## 点击劫持检测与监控

### 自动化点击劫持扫描

\`\`\`javascript
// 点击劫持漏洞扫描器
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
      } else if (xFrameOptions.toLowerCase() === 'allow-from') {
        this.vulnerabilities.push({
          type: 'deprecated_allow_from',
          severity: 'medium',
          description: 'Using deprecated ALLOW-FROM directive',
          recommendation: 'Replace with CSP frame-ancestors'
        });
      }
    } catch (error) {
      console.error('Error checking X-Frame-Options:', error);
    }
  }
  
  // 检查CSP frame-ancestors
  async checkCSPFrameAncestors() {
    try {
      const response = await fetch(this.baseUrl);
      const csp = response.headers.get('content-security-policy');
      
      if (!csp) {
        this.vulnerabilities.push({
          type: 'missing_csp',
          severity: 'medium',
          description: 'Missing Content-Security-Policy header',
          recommendation: 'Implement CSP with frame-ancestors directive'
        });
        return;
      }
      
      const cspDirectives = csp.split(';').map(dir => dir.trim());
      const frameAncestors = cspDirectives.find(dir => 
        dir.startsWith('frame-ancestors')
      );
      
      if (!frameAncestors) {
        this.vulnerabilities.push({
          type: 'missing_frame_ancestors',
          severity: 'medium',
          description: 'CSP missing frame-ancestors directive',
          recommendation: 'Add frame-ancestors directive to CSP'
        });
      } else if (frameAncestors.includes("'none'")) {
        // 最佳实践，无漏洞
      } else if (frameAncestors.includes("*")) {
        this.vulnerabilities.push({
          type: 'permissive_frame_ancestors',
          severity: 'high',
          description: 'frame-ancestors allows any origin',
          recommendation: 'Restrict frame-ancestors to specific origins'
        });
      }
    } catch (error) {
      console.error('Error checking CSP frame-ancestors:', error);
    }
  }
  
  // 测试iframe嵌入
  async testIframeEmbedding() {
    return new Promise((resolve) => {
      // 创建测试iframe
      const testIframe = document.createElement('iframe');
      testIframe.style.display = 'none';
      testIframe.src = this.baseUrl;
      
      // 监听加载事件
      testIframe.onload = () => {
        try {
          // 尝试访问iframe内容
          const iframeContent = testIframe.contentWindow.document;
          
          // 如果能够访问，说明同源且可嵌入
          this.vulnerabilities.push({
            type: 'embeddable_in_iframe',
            severity: 'high',
            description: 'Page can be embedded in iframe',
            recommendation: 'Set X-Frame-Options or CSP frame-ancestors'
          });
        } catch (error) {
          // 无法访问，可能是跨域或防护有效
          console.log('Cannot access iframe content, possibly protected');
        }
        
        document.body.removeChild(testIframe);
        resolve();
      };
      
      testIframe.onerror = () => {
        document.body.removeChild(testIframe);
        resolve();
      };
      
      document.body.appendChild(testIframe);
    });
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
  
  // 生成建议
  generateRecommendations() {
    const recommendations = [];
    
    if (this.vulnerabilities.some(v => v.type === 'missing_x_frame_options')) {
      recommendations.push({
        priority: 'high',
        action: 'Implement X-Frame-Options header',
        description: 'Set X-Frame-Options to DENY or SAMEORIGIN to prevent iframe embedding'
      });
    }
    
    if (this.vulnerabilities.some(v => v.type === 'missing_frame_ancestors')) {
      recommendations.push({
        priority: 'high',
        action: 'Implement CSP frame-ancestors',
        description: 'Add frame-ancestors directive to Content-Security-Policy header'
      });
    }
    
    return recommendations;
  }
}

// 使用示例
const scanner = new ClickjackingScanner('https://example.com');
scanner.scan().then(report => {
  console.log('Clickjacking scan report:', report);
});
\`\`\`

## 实际应用案例

### 银行网站的点击劫持防护

\`\`\`javascript
// 银行网站 - 服务器端防护
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

点击劫持是一种隐蔽但危害性极大的Web安全威胁。通过本文的介绍，我们了解了点击劫持的多种防护策略和实现方法。

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
//# sourceMappingURL=24-2-NcXU6ZOA.js.map
