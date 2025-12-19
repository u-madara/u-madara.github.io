const n=`---
title: "CSRF攻击与防护策略"
excerpt: "深入探讨CSRF攻击的原理、危害、检测方法以及全面的防护策略，帮助开发者构建更安全的Web应用"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-11-07"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/preview/cover.jpg"
---

# CSRF攻击与防护策略

## 前言

跨站请求伪造(CSRF)是一种常见的Web安全漏洞，攻击者利用用户的已登录状态，诱使用户在不知情的情况下执行非预期的操作。与XSS不同，CSRF不直接注入恶意脚本，而是利用用户的身份凭证执行操作。本文将深入探讨CSRF攻击的原理、危害、检测方法以及全面的防护策略，帮助你构建更安全的Web应用。

## CSRF攻击原理

### CSRF攻击流程

\`\`\`html
<!-- 1. 用户正常登录银行网站 -->
<!-- POST https://bank.example.com/transfer -->
<form action="https://bank.example.com/transfer" method="post">
  <input type="hidden" name="to" value="attacker-account">
  <input type="hidden" name="amount" value="1000">
  <input type="submit" value="转账">
</form>

<!-- 2. 攻击者创建恶意网站 -->
<!-- https://attacker.com/malicious-page.html -->
<!DOCTYPE html>
<html>
<head>
  <title>有趣的图片</title>
</head>
<body>
  <h1>看看这些可爱的猫咪图片！</h1>
  
  <!-- 隐藏的表单自动提交 -->
  <form id="csrf-form" action="https://bank.example.com/transfer" method="post" style="display:none">
    <input type="hidden" name="to" value="attacker-account">
    <input type="hidden" name="amount" value="1000">
  </form>
  
  <img src="cute-cat.jpg" alt="可爱的猫咪">
  
  <script>
    // 页面加载后自动提交表单
    window.onload = function() {
      document.getElementById('csrf-form').submit();
    };
  <\/script>
</body>
</html>

<!-- 3. 用户访问恶意网站，触发CSRF攻击 -->
<!-- 浏览器自动携带银行网站的cookie发送请求 -->
\`\`\`

### CSRF攻击条件

1. **用户已登录目标网站**：浏览器中保存了有效的会话cookie
2. **目标网站存在敏感操作**：如转账、修改密码、删除数据等
3. **目标网站没有CSRF防护**：操作请求可以通过伪造发起
4. **用户访问恶意网站**：在保持登录状态的情况下访问攻击者页面

### CSRF攻击类型

\`\`\`html
<!-- 1. GET型CSRF -->
<!-- 利用img标签发起GET请求 -->
<img src="https://example.com/delete-account?id=123" style="display:none">

<!-- 2. POST型CSRF -->
<!-- 利用form自动提交发起POST请求 -->
<form action="https://example.com/update-profile" method="post" style="display:none">
  <input type="hidden" name="email" value="attacker@malicious.com">
  <input type="hidden" name="role" value="admin">
</form>
<script>document.forms[0].submit();<\/script>

<!-- 3. JSON型CSRF -->
<!-- 利用fetch API发起JSON请求 -->
<script>
fetch('https://api.example.com/transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: 'attacker-account',
    amount: 1000
  }),
  credentials: 'include' // 携带cookie
});
<\/script>

<!-- 4. 文件上传型CSRF -->
<!-- 利用文件上传功能 -->
<form action="https://example.com/upload-avatar" method="post" enctype="multipart/form-data" style="display:none">
  <input type="file" name="avatar" value="malicious-script.js">
  <input type="submit">
</form>
<script>document.forms[0].submit();<\/script>
\`\`\`

## CSRF攻击危害

### 常见攻击场景

\`\`\`javascript
// 1. 金融交易攻击
// 攻击者伪造转账请求
function simulateBankTransfer() {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://bank.example.com/api/transfer';
  
  const toAccount = document.createElement('input');
  toAccount.type = 'hidden';
  toAccount.name = 'toAccount';
  toAccount.value = 'attacker-account';
  
  const amount = document.createElement('input');
  amount.type = 'hidden';
  amount.name = 'amount';
  amount.value = '10000';
  
  form.appendChild(toAccount);
  form.appendChild(amount);
  document.body.appendChild(form);
  form.submit();
}

// 2. 密码修改攻击
// 攻击者修改用户密码
function simulatePasswordChange() {
  fetch('https://example.com/api/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currentPassword: 'guessed-or-leaked-password',
      newPassword: 'attacker-controlled-password'
    }),
    credentials: 'include'
  });
}

// 3. 权限提升攻击
// 攻击者提升用户权限
function simulatePrivilegeEscalation() {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://example.com/admin/grant-admin';
  
  const userId = document.createElement('input');
  userId.type = 'hidden';
  userId.name = 'userId';
  userId.value = 'attacker-user-id';
  
  const role = document.createElement('input');
  role.type = 'hidden';
  role.name = 'role';
  role.value = 'admin';
  
  form.appendChild(userId);
  form.appendChild(role);
  document.body.appendChild(form);
  form.submit();
}

// 4. 数据篡改攻击
// 攻击者修改用户数据
function simulateDataTampering() {
  fetch('https://example.com/api/update-profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'attacker@malicious.com',
      phone: 'attacker-phone',
      shippingAddress: 'attacker-address'
    }),
    credentials: 'include'
  });
}
\`\`\`

### 攻击影响评估

\`\`\`javascript
// CSRF风险评估工具
class CSRFVulnerabilityAssessment {
  constructor() {
    this.vulnerabilities = [];
  }
  
  // 评估网站CSRF风险
  assessWebsite(baseUrl) {
    this.checkStateChangingEndpoints(baseUrl);
    this.checkAuthenticationMechanisms(baseUrl);
    this.checkSensitiveOperations(baseUrl);
    
    return this.generateReport();
  }
  
  // 检查状态变更端点
  checkStateChangingEndpoints(baseUrl) {
    const stateChangingEndpoints = [
      '/api/transfer',
      '/api/change-password',
      '/api/update-profile',
      '/api/delete-account',
      '/api/grant-permissions',
      '/api/purchase',
      '/api/post-comment'
    ];
    
    stateChangingEndpoints.forEach(endpoint => {
      this.checkEndpointProtection(baseUrl + endpoint);
    });
  }
  
  // 检查端点保护
  checkEndpointProtection(endpoint) {
    // 模拟检查CSRF令牌
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'data' })
    })
    .then(response => {
      if (response.status === 200 || response.status === 302) {
        // 可能存在CSRF漏洞
        this.vulnerabilities.push({
          type: 'missing_csrf_token',
          endpoint: endpoint,
          severity: 'high',
          description: 'Endpoint accepts state-changing requests without CSRF protection'
        });
      }
    })
    .catch(error => {
      console.error('Error checking endpoint:', error);
    });
  }
  
  // 检查认证机制
  checkAuthenticationMechanisms(baseUrl) {
    // 检查是否使用cookie进行认证
    fetch(baseUrl + '/api/user/profile')
    .then(response => {
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        // 检查cookie属性
        const hasHttpOnly = setCookieHeader.includes('HttpOnly');
        const hasSameSite = setCookieHeader.includes('SameSite');
        
        if (!hasSameSite) {
          this.vulnerabilities.push({
            type: 'missing_samesite_attribute',
            endpoint: baseUrl + '/api/user/profile',
            severity: 'medium',
            description: 'Authentication cookie missing SameSite attribute'
          });
        }
      }
    });
  }
  
  // 检查敏感操作
  checkSensitiveOperations(baseUrl) {
    // 检查是否有敏感操作使用GET方法
    const sensitiveGetOperations = [
      '/api/delete-account',
      '/api/approve-request',
      '/api/execute-payment'
    ];
    
    sensitiveGetOperations.forEach(operation => {
      this.vulnerabilities.push({
        type: 'sensitive_get_operation',
        endpoint: baseUrl + operation,
        severity: 'medium',
        description: 'Sensitive operation using GET method, vulnerable to CSRF'
      });
    });
  }
  
  // 生成评估报告
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
  
  // 生成修复建议
  generateRecommendations() {
    const recommendations = [];
    
    if (this.vulnerabilities.some(v => v.type === 'missing_csrf_token')) {
      recommendations.push({
        priority: 'high',
        action: 'Implement CSRF tokens for all state-changing operations',
        details: 'Use synchronizer token pattern or double submit cookie pattern'
      });
    }
    
    if (this.vulnerabilities.some(v => v.type === 'missing_samesite_attribute')) {
      recommendations.push({
        priority: 'medium',
        action: 'Add SameSite attribute to authentication cookies',
        details: 'Set SameSite=Strict or SameSite=Lax for better CSRF protection'
      });
    }
    
    if (this.vulnerabilities.some(v => v.type === 'sensitive_get_operation')) {
      recommendations.push({
        priority: 'medium',
        action: 'Change sensitive operations from GET to POST/PUT/DELETE',
        details: 'GET requests should not modify server state'
      });
    }
    
    return recommendations;
  }
}
\`\`\`

## CSRF防护策略

### 同步器令牌模式

\`\`\`javascript
// 1. 服务器端CSRF令牌生成
const crypto = require('crypto');

// 生成CSRF令牌
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 存储CSRF令牌到会话
function storeCSRFToken(session, token) {
  session.csrfToken = token;
}

// 验证CSRF令牌
function validateCSRFToken(session, token) {
  return session.csrfToken && session.csrfToken === token;
}

// Express中间件 - 提供CSRF令牌
app.get('/api/csrf-token', (req, res) => {
  const token = generateCSRFToken();
  storeCSRFToken(req.session, token);
  res.json({ csrfToken: token });
});

// Express中间件 - 验证CSRF令牌
function csrfProtection(req, res, next) {
  const token = req.body._csrf || req.headers['x-csrf-token'];
  
  if (!validateCSRFToken(req.session, token)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
}

// 应用CSRF保护到敏感路由
app.post('/api/transfer', csrfProtection, (req, res) => {
  const { toAccount, amount } = req.body;
  
  // 处理转账逻辑
  // ...
  
  res.json({ success: true });
});

// 2. 前端CSRF令牌使用
class CSRFTokenManager {
  constructor() {
    this.token = null;
    this.init();
  }
  
  // 初始化CSRF令牌
  async init() {
    try {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      this.token = data.csrfToken;
      
      // 将令牌添加到所有表单
      this.addTokenToForms();
      
      // 将令牌添加到所有AJAX请求
      this.setupAjaxInterceptors();
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  }
  
  // 添加令牌到表单
  addTokenToForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      // 检查是否已有CSRF令牌
      if (!form.querySelector('input[name="_csrf"]')) {
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = '_csrf';
        tokenInput.value = this.token;
        
        form.appendChild(tokenInput);
      }
    });
  }
  
  // 设置AJAX拦截器
  setupAjaxInterceptors() {
    // 拦截fetch请求
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options = {}) {
      // 只对同源请求添加CSRF令牌
      if (url.startsWith('/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
        options.headers = {
          ...options.headers,
          'X-CSRF-Token': window.csrfManager.token
        };
      }
      
      return originalFetch.call(this, url, options);
    };
    
    // 拦截XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._method = method;
      this._url = url;
      return originalXHROpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
      // 添加CSRF令牌头
      if (
        this._url.startsWith('/') && 
        ['POST', 'PUT', 'DELETE', 'PATCH'].includes(this._method.toUpperCase())
      ) {
        this.setRequestHeader('X-CSRF-Token', window.csrfManager.token);
      }
      
      return originalXHRSend.apply(this, arguments);
    };
  }
  
  // 获取当前令牌
  getToken() {
    return this.token;
  }
  
  // 刷新令牌
  async refreshToken() {
    await this.init();
  }
}

// 初始化CSRF令牌管理器
window.csrfManager = new CSRFTokenManager();

// 3. React中的CSRF防护
import React, { useState, useEffect } from 'react';

function TransferForm() {
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  
  useEffect(() => {
    // 获取CSRF令牌
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken));
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ toAccount, amount })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('转账成功');
      } else {
        alert('转账失败');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      alert('转账失败');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="hidden"
        name="_csrf"
        value={csrfToken}
      />
      
      <div>
        <label>收款账户:</label>
        <input
          type="text"
          value={toAccount}
          onChange={(e) => setToAccount(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label>转账金额:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      
      <button type="submit">转账</button>
    </form>
  );
}
\`\`\`

### 双重提交Cookie模式

\`\`\`javascript
// 1. 服务器端双重提交Cookie实现
const crypto = require('crypto');

// 生成CSRF令牌
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 设置CSRF Cookie
function setCSRFCookie(res, token) {
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // 必须为false，以便JavaScript读取
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
}

// 验证双重提交Cookie
function validateDoubleSubmitCookie(req) {
  const cookieToken = req.cookies['XSRF-TOKEN'];
  const headerToken = req.headers['x-xsrf-token'];
  
  return cookieToken && headerToken && cookieToken === headerToken;
}

// Express中间件 - 设置CSRF Cookie
app.use((req, res, next) => {
  // 如果没有CSRF cookie，设置一个
  if (!req.cookies['XSRF-TOKEN']) {
    const token = generateCSRFToken();
    setCSRFCookie(res, token);
  }
  
  next();
});

// Express中间件 - 验证双重提交Cookie
function doubleSubmitCookieProtection(req, res, next) {
  // 只对状态变更请求进行验证
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (!validateDoubleSubmitCookie(req)) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  
  next();
}

// 应用双重提交Cookie保护
app.use(doubleSubmitCookieProtection);

// 2. 前端双重提交Cookie实现
class DoubleSubmitCookieManager {
  constructor() {
    this.token = this.getCSRFCookie();
    this.setupAjaxInterceptors();
  }
  
  // 获取CSRF Cookie
  getCSRFCookie() {
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      
      if (cookie.startsWith('XSRF-TOKEN=')) {
        return cookie.substring('XSRF-TOKEN='.length);
      }
    }
    
    return null;
  }
  
  // 设置AJAX拦截器
  setupAjaxInterceptors() {
    // 拦截fetch请求
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options = {}) {
      // 只对同源请求添加CSRF令牌
      if (url.startsWith('/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
        options.headers = {
          ...options.headers,
          'X-XSRF-Token': window.doubleSubmitCookieManager.token
        };
      }
      
      return originalFetch.call(this, url, options);
    };
    
    // 拦截XMLHttpRequest
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.send = function(data) {
      // 添加CSRF令牌头
      if (
        this._url && 
        this._url.startsWith('/') && 
        ['POST', 'PUT', 'DELETE', 'PATCH'].includes(this._method.toUpperCase())
      ) {
        this.setRequestHeader('X-XSRF-Token', window.doubleSubmitCookieManager.token);
      }
      
      return originalXHRSend.apply(this, arguments);
    };
  }
  
  // 刷新令牌
  refreshToken() {
    this.token = this.getCSRFCookie();
  }
}

// 初始化双重提交Cookie管理器
window.doubleSubmitCookieManager = new DoubleSubmitCookieManager();

// 3. Angular中的双重提交Cookie（Angular内置支持）
// Angular HttpClient会自动从XSRF-TOKEN cookie读取令牌并添加到X-XSRF-TOKEN头

// 4. 自定义HTTP客户端实现
class SecureHttpClient {
  constructor() {
    this.csrfToken = this.getCSRFCookie();
  }
  
  getCSRFCookie() {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? match[1] : null;
  }
  
  async request(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // 为状态变更请求添加CSRF令牌
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(mergedOptions.method)) {
      mergedOptions.headers['X-XSRF-Token'] = this.csrfToken;
    }
    
    return fetch(url, mergedOptions);
  }
  
  get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }
  
  post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }
}

// 使用安全HTTP客户端
const httpClient = new SecureHttpClient();

// 示例：安全转账
async function secureTransfer(toAccount, amount) {
  try {
    const response = await httpClient.post('/api/transfer', {
      toAccount,
      amount
    });
    
    return await response.json();
  } catch (error) {
    console.error('Transfer failed:', error);
    throw error;
  }
}
\`\`\`

### SameSite Cookie属性

\`\`\`javascript
// 1. 设置SameSite Cookie
app.use(session({
  name: 'sessionId',
  secret: 'your-secret-key',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // 'strict' | 'lax' | 'none'
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

// 2. SameSite属性详解
/*
SameSite=Strict:
- 最严格的安全设置
- 浏览器不会在跨站请求中发送cookie
- 即使从目标网站点击链接到外部网站再返回，也不会发送cookie
- 提供最强的CSRF防护，但可能影响用户体验

SameSite=Lax:
- 平衡安全性和用户体验
- 允许某些安全的跨站请求发送cookie（如GET请求）
- 阻止大多数CSRF攻击（如POST请求）
- 推荐用于大多数网站

SameSite=None:
- 允许所有跨站请求发送cookie
- 必须与Secure属性一起使用（仅HTTPS）
- 不提供CSRF防护
- 仅在确实需要跨站cookie时使用
*/

// 3. 动态设置SameSite属性
function setCookieWithSameSite(res, name, value, options = {}) {
  const {
    maxAge = 24 * 60 * 60 * 1000,
    httpOnly = true,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'lax',
    domain = null,
    path = '/'
  } = options;
  
  let cookieString = \`\${name}=\${value}; Path=\${path}; HttpOnly\`;
  
  if (secure) {
    cookieString += '; Secure';
  }
  
  if (sameSite) {
    cookieString += \`; SameSite=\${sameSite}\`;
  }
  
  if (domain) {
    cookieString += \`; Domain=\${domain}\`;
  }
  
  if (maxAge) {
    cookieString += \`; Max-Age=\${Math.floor(maxAge / 1000)}\`;
  }
  
  res.setHeader('Set-Cookie', cookieString);
}

// 4. 兼容性处理
// 检测浏览器是否支持SameSite属性
function supportsSameSite() {
  // 尝试设置一个测试cookie
  document.cookie = 'testSameSite=1; SameSite=Strict';
  
  // 检查cookie是否设置成功
  const supports = document.cookie.includes('testSameSite=1');
  
  // 清理测试cookie
  document.cookie = 'testSameSite=1; SameSite=Strict; Max-Age=0';
  
  return supports;
}

// 5. 渐进式SameSite策略
function setProgressiveSameSiteCookie(res, name, value) {
  // 检测User-Agent是否支持SameSite
  const userAgent = req.headers['user-agent'];
  const supportsSameSite = !userAgent.includes('Chrome/5x') && 
                           !userAgent.includes('UCBrowser') &&
                           !userAgent.includes('Android');
  
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: supportsSameSite ? 'lax' : null
  };
  
  setCookieWithSameSite(res, name, value, options);
}
\`\`\`

### 验证Referer和Origin头

\`\`\`javascript
// 1. 验证Referer头
function validateReferer(req, allowedOrigins) {
  const referer = req.headers.referer;
  
  if (!referer) {
    return false; // 没有referer头，可能是恶意请求
  }
  
  try {
    const refererUrl = new URL(referer);
    return allowedOrigins.includes(refererUrl.origin);
  } catch (error) {
    return false; // 无效的referer URL
  }
}

// 2. 验证Origin头
function validateOrigin(req, allowedOrigins) {
  const origin = req.headers.origin;
  
  // 对于GET请求，可能没有origin头
  if (!origin && req.method === 'GET') {
    return true;
  }
  
  if (!origin) {
    return false; // 状态变更请求应该有origin头
  }
  
  return allowedOrigins.includes(origin);
}

// 3. Express中间件 - 验证Referer和Origin
function validateRefererAndOrigin(allowedOrigins) {
  return (req, res, next) => {
    // 只对状态变更请求进行验证
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const isValidOrigin = validateOrigin(req, allowedOrigins);
      const isValidReferer = validateReferer(req, allowedOrigins);
      
      if (!isValidOrigin || !isValidReferer) {
        return res.status(403).json({ error: 'Invalid origin or referer' });
      }
    }
    
    next();
  };
}

// 应用验证中间件
const allowedOrigins = ['https://example.com', 'https://www.example.com'];
app.use(validateRefererAndOrigin(allowedOrigins));

// 4. 高级验证逻辑
function advancedOriginValidation(req, allowedOrigins) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  // 对于简单请求，可能没有origin头
  if (!origin && req.method === 'GET') {
    return true;
  }
  
  // 对于状态变更请求，至少应该有origin或referer
  if (!origin && !referer) {
    return false;
  }
  
  // 如果有origin头，验证origin
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (!allowedOrigins.includes(originUrl.origin)) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  
  // 如果有referer头，验证referer
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (!allowedOrigins.includes(refererUrl.origin)) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  
  // 检查origin和referer是否一致（如果两者都存在）
  if (origin && referer) {
    try {
      const originUrl = new URL(origin);
      const refererUrl = new URL(referer);
      
      if (originUrl.origin !== refererUrl.origin) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  
  return true;
}

// 5. 自适应验证策略
function adaptiveValidation(req, allowedOrigins) {
  // 对于API请求，严格验证origin
  if (req.path.startsWith('/api/')) {
    return advancedOriginValidation(req, allowedOrigins);
  }
  
  // 对于页面请求，宽松验证
  if (req.path.startsWith('/')) {
    return validateReferer(req, allowedOrigins);
  }
  
  // 默认严格验证
  return advancedOriginValidation(req, allowedOrigins);
}
\`\`\`

## CSRF检测与监控

### 自动化CSRF扫描

\`\`\`javascript
// 1. CSRF漏洞扫描器
class CSRFScanner {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.vulnerabilities = [];
    this.session = null;
  }
  
  // 执行扫描
  async scan() {
    // 1. 登录获取会话
    await this.login();
    
    // 2. 发现端点
    const endpoints = await this.discoverEndpoints();
    
    // 3. 测试CSRF漏洞
    for (const endpoint of endpoints) {
      await this.testCSRF(endpoint);
    }
    
    // 4. 生成报告
    return this.generateReport();
  }
  
  // 模拟登录
  async login() {
    const loginResponse = await fetch(\`\${this.baseUrl}/login\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass'
      })
    });
    
    if (loginResponse.ok) {
      // 提取会话cookie
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      this.session = this.parseCookie(setCookieHeader);
    }
  }
  
  // 解析cookie
  parseCookie(cookieString) {
    if (!cookieString) return null;
    
    const cookies = {};
    cookieString.split(',').forEach(cookie => {
      const parts = cookie.split(';')[0].split('=');
      if (parts.length === 2) {
        cookies[parts[0].trim()] = parts[1].trim();
      }
    });
    
    return cookies;
  }
  
  // 发现端点
  async discoverEndpoints() {
    const endpoints = [];
    
    // 从常见路径发现
    const commonPaths = [
      '/api/transfer',
      '/api/change-password',
      '/api/update-profile',
      '/api/delete-account',
      '/api/purchase',
      '/api/post-comment'
    ];
    
    for (const path of commonPaths) {
      try {
        const response = await fetch(\`\${this.baseUrl}\${path}\`, {
          method: 'OPTIONS',
          headers: {
            'Cookie': this.formatCookie(this.session)
          }
        });
        
        if (response.ok) {
          const allowedMethods = response.headers.get('allow') || '';
          endpoints.push({
            path,
            methods: allowedMethods.split(', ').map(m => m.trim())
          });
        }
      } catch (error) {
        // 忽略错误，继续下一个路径
      }
    }
    
    return endpoints;
  }
  
  // 格式化cookie
  formatCookie(cookies) {
    if (!cookies) return '';
    
    return Object.entries(cookies)
      .map(([key, value]) => \`\${key}=\${value}\`)
      .join('; ');
  }
  
  // 测试CSRF漏洞
  async testCSRF(endpoint) {
    for (const method of endpoint.methods) {
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        await this.testCSRFWithMethod(endpoint.path, method);
      }
    }
  }
  
  // 使用特定方法测试CSRF
  async testCSRFWithMethod(path, method) {
    try {
      // 1. 正常请求（带会话）
      const normalResponse = await fetch(\`\${this.baseUrl}\${path}\`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': this.formatCookie(this.session)
        },
        body: JSON.stringify({ test: 'data' })
      });
      
      // 2. 无会话请求
      const noSessionResponse = await fetch(\`\${this.baseUrl}\${path}\`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'data' })
      });
      
      // 3. 无CSRF令牌请求
      const noTokenResponse = await fetch(\`\${this.baseUrl}\${path}\`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': this.formatCookie(this.session)
        },
        body: JSON.stringify({ test: 'data' })
      });
      
      // 分析响应
      if (
        normalResponse.ok && 
        noSessionResponse.status === 401 &&
        noTokenResponse.ok
      ) {
        // 可能存在CSRF漏洞
        this.vulnerabilities.push({
          type: 'csrf_vulnerability',
          path,
          method,
          severity: 'high',
          description: \`Endpoint \${path} accepts \${method} requests without CSRF protection\`
        });
      }
    } catch (error) {
      console.error(\`Error testing \${path} with \${method}:\`, error);
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
  
  // 生成修复建议
  generateRecommendations() {
    const recommendations = [];
    
    if (this.vulnerabilities.some(v => v.type === 'csrf_vulnerability')) {
      recommendations.push({
        priority: 'high',
        action: 'Implement CSRF protection',
        details: 'Use synchronizer token pattern or double submit cookie pattern'
      });
    }
    
    return recommendations;
  }
}

// 2. 使用扫描器
async function runCSRFScan(baseUrl) {
  const scanner = new CSRFScanner(baseUrl);
  const report = await scanner.scan();
  
  console.log('CSRF Scan Report:');
  console.log(\`Total vulnerabilities: \${report.summary.total}\`);
  console.log(\`High severity: \${report.summary.high}\`);
  console.log(\`Medium severity: \${report.summary.medium}\`);
  console.log(\`Low severity: \${report.summary.low}\`);
  
  report.vulnerabilities.forEach(vuln => {
    console.log(\`\${vuln.severity.toUpperCase()}: \${vuln.description}\`);
  });
  
  return report;
}
\`\`\`

### CSRF攻击监控

\`\`\`javascript
// 1. CSRF攻击监控系统
class CSRFAttackMonitor {
  constructor() {
    this.suspiciousRequests = [];
    this.attackPatterns = [
      {
        name: 'Missing Referer',
        check: (req) => !req.headers.referer && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)
      },
      {
        name: 'Mismatched Origin',
        check: (req) => {
          const origin = req.headers.origin;
          const referer = req.headers.referer;
          
          if (!origin || !referer) return false;
          
          try {
            const originUrl = new URL(origin);
            const refererUrl = new URL(referer);
            return originUrl.origin !== refererUrl.origin;
          } catch (error) {
            return true;
          }
        }
      },
      {
        name: 'Suspicious User-Agent',
        check: (req) => {
          const userAgent = req.headers['user-agent'];
          return userAgent && (
            userAgent.includes('curl') ||
            userAgent.includes('wget') ||
            userAgent.includes('python-requests')
          );
        }
      },
      {
        name: 'High Frequency Requests',
        check: (req, context) => {
          const ip = req.ip || req.connection.remoteAddress;
          const now = Date.now();
          const recentRequests = context.recentRequests[ip] || [];
          
          // 过滤最近1分钟的请求
          const recentMinuteRequests = recentRequests.filter(
            timestamp => now - timestamp < 60000
          );
          
          // 更新请求记录
          context.recentRequests[ip] = [...recentMinuteRequests, now];
          
          // 如果1分钟内超过10个请求，认为是可疑的
          return recentMinuteRequests.length > 10;
        }
      }
    ];
    
    this.context = {
      recentRequests: {}
    };
  }
  
  // 检查请求
  checkRequest(req) {
    const suspiciousPatterns = [];
    
    for (const pattern of this.attackPatterns) {
      if (pattern.check(req, this.context)) {
        suspiciousPatterns.push(pattern.name);
      }
    }
    
    if (suspiciousPatterns.length > 0) {
      this.recordSuspiciousRequest(req, suspiciousPatterns);
      return true;
    }
    
    return false;
  }
  
  // 记录可疑请求
  recordSuspiciousRequest(req, patterns) {
    const suspiciousRequest = {
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
      origin: req.headers.origin,
      suspiciousPatterns: patterns
    };
    
    this.suspiciousRequests.push(suspiciousRequest);
    
    // 发送警报
    this.sendAlert(suspiciousRequest);
  }
  
  // 发送警报
  sendAlert(request) {
    console.warn('Potential CSRF Attack Detected:', request);
    
    // 可以集成到监控系统
    this.sendToMonitoringSystem('csrf_attack', request);
  }
  
  // 发送到监控系统
  sendToMonitoringSystem(eventType, data) {
    // 这里可以集成到实际的监控系统
    // 例如：Sentry, Datadog, 自定义监控端点等
    fetch('/api/security-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: eventType,
        data,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.error('Failed to send security event:', error);
    });
  }
  
  // 获取攻击统计
  getAttackStats() {
    const stats = {
      total: this.suspiciousRequests.length,
      byIp: {},
      byPattern: {},
      byHour: {}
    };
    
    this.suspiciousRequests.forEach(req => {
      // 按IP统计
      const ip = req.ip;
      stats.byIp[ip] = (stats.byIp[ip] || 0) + 1;
      
      // 按模式统计
      req.suspiciousPatterns.forEach(pattern => {
        stats.byPattern[pattern] = (stats.byPattern[pattern] || 0) + 1;
      });
      
      // 按小时统计
      const hour = new Date(req.timestamp).getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    });
    
    return stats;
  }
}

// 2. Express中间件 - CSRF监控
function csrfMonitoring() {
  const monitor = new CSRFAttackMonitor();
  
  return (req, res, next) => {
    // 检查请求是否可疑
    const isSuspicious = monitor.checkRequest(req);
    
    if (isSuspicious) {
      // 可以选择阻止请求或仅记录
      // return res.status(403).json({ error: 'Suspicious request detected' });
    }
    
    next();
  };
}

// 3. 应用监控中间件
app.use(csrfMonitoring());

// 4. 安全事件API
app.post('/api/security-events', (req, res) => {
  const { type, data, timestamp } = req.body;
  
  // 记录安全事件
  console.log('Security Event:', { type, data, timestamp });
  
  // 可以存储到数据库或发送到安全团队
  securityEventLogger.log(type, data, timestamp);
  
  res.status(204).end();
});

// 5. 安全事件日志记录
class SecurityEventLogger {
  constructor(logPath) {
    this.logPath = logPath;
    this.init();
  }
  
  init() {
    // 确保日志目录存在
    const fs = require('fs');
    const path = require('path');
    const logDir = path.dirname(this.logPath);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
  
  log(type, data, timestamp) {
    const fs = require('fs');
    const event = {
      type,
      data,
      timestamp: timestamp || new Date().toISOString()
    };
    
    const logLine = JSON.stringify(event) + '\\n';
    
    fs.appendFile(this.logPath, logLine, (error) => {
      if (error) {
        console.error('Failed to write security event log:', error);
      }
    });
  }
}

// 初始化安全事件日志记录
const securityEventLogger = new SecurityEventLogger('./logs/security-events.log');
\`\`\`

## 实际应用案例

### 电子商务网站的CSRF防护

\`\`\`javascript
// 1. 电子商务网站 - 服务器端防护
const express = require('express');
const session = require('express-session');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();

// 配置会话
app.use(session({
  name: 'sessionId',
  secret: 'ecommerce-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

// 解析cookie
app.use(cookieParser());

// CSRF防护
const csrfProtection = csrf({
  cookie: {
    httpOnly: false, // 必须为false，以便JavaScript读取
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  }
});

// 提供CSRF令牌
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// 限制敏感操作频率
const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 每分钟最多5次操作
  message: { error: 'Too many requests, please try again later' }
});

// 支付API - 多层防护
app.post('/api/payment', 
  csrfProtection, 
  sensitiveOperationLimiter,
  validateRefererAndOrigin(['https://shop.example.com']),
  (req, res) => {
    const { orderId, amount, paymentMethod } = req.body;
    
    // 处理支付逻辑
    // ...
    
    res.json({ success: true, transactionId: 'txn_' + Date.now() });
  }
);

// 修改订单API
app.put('/api/orders/:id',
  csrfProtection,
  sensitiveOperationLimiter,
  validateRefererAndOrigin(['https://shop.example.com']),
  (req, res) => {
    const orderId = req.params.id;
    const updates = req.body;
    
    // 处理订单修改逻辑
    // ...
    
    res.json({ success: true });
  }
);

// 2. 电子商务网站 - 前端防护
class EcommerceCSRFProtection {
  constructor() {
    this.csrfToken = null;
    this.init();
  }
  
  async init() {
    await this.fetchCSRFToken();
    this.setupEventListeners();
    this.setupAjaxInterceptors();
  }
  
  async fetchCSRFToken() {
    try {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      this.csrfToken = data.csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  }
  
  setupEventListeners() {
    // 监听表单提交
    document.addEventListener('submit', (event) => {
      const form = event.target;
      
      // 检查是否是敏感表单
      if (this.isSensitiveForm(form)) {
        this.addCSRFTokenToForm(form);
      }
    });
    
    // 监听支付按钮点击
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('payment-button')) {
        this.handlePayment(event);
      }
    });
  }
  
  isSensitiveForm(form) {
    const sensitiveActions = [
      'payment',
      'checkout',
      'update-profile',
      'change-password'
    ];
    
    const formAction = form.getAttribute('action') || '';
    const formId = form.getAttribute('id') || '';
    
    return sensitiveActions.some(action => 
      formAction.includes(action) || formId.includes(action)
    );
  }
  
  addCSRFTokenToForm(form) {
    // 检查是否已有CSRF令牌
    if (!form.querySelector('input[name="_csrf"]')) {
      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = '_csrf';
      tokenInput.value = this.csrfToken;
      
      form.appendChild(tokenInput);
    }
  }
  
  setupAjaxInterceptors() {
    // 拦截fetch请求
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options = {}) {
      // 只对同源敏感请求添加CSRF令牌
      if (url.startsWith('/') && this.isSensitiveRequest(url, options)) {
        options.headers = {
          ...options.headers,
          'X-CSRF-Token': window.ecommerceCSRF.csrfToken
        };
      }
      
      return originalFetch.call(this, url, options);
    }.bind(this);
  }
  
  isSensitiveRequest(url, options) {
    const sensitivePaths = [
      '/api/payment',
      '/api/checkout',
      '/api/orders',
      '/api/profile'
    ];
    
    const isSensitivePath = sensitivePaths.some(path => url.startsWith(path));
    const isStateChangingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method);
    
    return isSensitivePath && isStateChangingMethod;
  }
  
  async handlePayment(event) {
    event.preventDefault();
    
    const paymentForm = document.getElementById('payment-form');
    const formData = new FormData(paymentForm);
    
    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': this.csrfToken
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 重定向到成功页面
        window.location.href = \`/payment-success?transactionId=\${result.transactionId}\`;
      } else {
        // 显示错误信息
        this.showPaymentError(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      this.showPaymentError('Network error, please try again');
    }
  }
  
  showPaymentError(message) {
    const errorElement = document.getElementById('payment-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      
      // 5秒后自动隐藏
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 5000);
    }
  }
}

// 初始化电子商务CSRF防护
window.ecommerceCSRF = new EcommerceCSRFProtection();

// 3. 支付组件 - React实现
import React, { useState, useEffect } from 'react';

function PaymentForm({ orderId, amount }) {
  const [csrfToken, setCsrfToken] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // 获取CSRF令牌
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken))
      .catch(err => console.error('Failed to fetch CSRF token:', err));
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');
    
    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          orderId,
          amount,
          paymentMethod
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 重定向到成功页面
        window.location.href = \`/payment-success?transactionId=\${result.transactionId}\`;
      } else {
        setError(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Network error, please try again');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="payment-form">
      <h2>Payment Details</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="_csrf" value={csrfToken} />
        
        <div className="form-group">
          <label>Order ID: {orderId}</label>
        </div>
        
        <div className="form-group">
          <label>Amount: \${amount.toFixed(2)}</label>
        </div>
        
        <div className="form-group">
          <label>Payment Method:</label>
          <select 
            value={paymentMethod} 
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="credit-card">Credit Card</option>
            <option value="debit-card">Debit Card</option>
            <option value="paypal">PayPal</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          className="payment-button"
          disabled={isProcessing || !csrfToken}
        >
          {isProcessing ? 'Processing...' : 'Pay Now'}
        </button>
      </form>
    </div>
  );
}

export default PaymentForm;
\`\`\`

## 总结

CSRF攻击是Web应用中常见的安全威胁，通过多层防护策略可以有效防范：

1. **同步器令牌模式**：在每个请求中包含唯一的CSRF令牌
2. **双重提交Cookie**：将令牌同时存储在cookie和请求参数中
3. **SameSite Cookie属性**：限制cookie在跨站请求中的发送
4. **验证Referer和Origin头**：检查请求来源是否可信
5. **自动化检测与监控**：定期扫描和实时监控可疑活动

通过本文介绍的方法和实际应用案例，你可以构建一个全面的CSRF防护体系，保护用户免受跨站请求伪造攻击。记住，安全是一个持续的过程，需要不断评估和改进防护策略。`;export{n as default};
//# sourceMappingURL=23-BXpq0Kxh.js.map
