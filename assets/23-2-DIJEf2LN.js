const n=`---
title: "CSRF攻击与防护策略（二）：防护策略与实现"
excerpt: "在了解了CSRF攻击的原理和类型后，本文将重点介绍各种CSRF防护策略及其具体实现方法。我们将从同步器令牌模式、双重提交Cookie、SameSite属性、Referer和Origin验证等多个角度，详细说明如何构建一个全面的CSRF防护体系。"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-11-05"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

# CSRF攻击与防护策略（二）：防护策略与实现

## 前言

在了解了CSRF攻击的原理和类型后，本文将重点介绍各种CSRF防护策略及其具体实现方法。我们将从同步器令牌模式、双重提交Cookie、SameSite属性、Referer和Origin验证等多个角度，详细说明如何构建一个全面的CSRF防护体系。每种策略都将提供完整的代码示例，帮助开发者在实际项目中应用这些防护措施。

## CSRF防护策略

### 同步器令牌模式

同步器令牌模式（Synchronizer Token Pattern）是最常用和最有效的CSRF防护方法之一。它要求每个用户会话都有一个唯一的CSRF令牌，该令牌必须在每个状态变更请求中提交。

#### 服务器端实现

\`\`\`javascript
// 1. 生成CSRF令牌
const crypto = require('crypto');

function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 2. 存储令牌到会话
function storeCSRFToken(req, token) {
  if (!req.session.csrfTokens) {
    req.session.csrfTokens = [];
  }
  
  // 限制令牌数量，防止会话膨胀
  if (req.session.csrfTokens.length > 10) {
    req.session.csrfTokens = req.session.csrfTokens.slice(-5);
  }
  
  req.session.csrfTokens.push({
    token,
    createdAt: Date.now()
  });
}

// 3. 验证CSRF令牌
function validateCSRFToken(req, token) {
  if (!req.session.csrfTokens || !token) {
    return false;
  }
  
  // 查找匹配的令牌
  const tokenIndex = req.session.csrfTokens.findIndex(t => t.token === token);
  
  if (tokenIndex === -1) {
    return false;
  }
  
  // 检查令牌是否过期（1小时）
  const tokenData = req.session.csrfTokens[tokenIndex];
  const isExpired = Date.now() - tokenData.createdAt > 60 * 60 * 1000;
  
  if (isExpired) {
    // 移除过期令牌
    req.session.csrfTokens.splice(tokenIndex, 1);
    return false;
  }
  
  // 使用后移除令牌（一次性令牌）
  req.session.csrfTokens.splice(tokenIndex, 1);
  return true;
}

// 4. Express中间件 - 提供CSRF令牌
function csrfTokenMiddleware(req, res, next) {
  // 生成新令牌
  const token = generateCSRFToken();
  storeCSRFToken(req, token);
  
  // 将令牌添加到响应中
  res.locals.csrfToken = token;
  
  // 如果是AJAX请求，直接返回令牌
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.json({ csrfToken: token });
  }
  
  next();
}

// 5. Express中间件 - 验证CSRF令牌
function csrfProtectionMiddleware(req, res, next) {
  // 只对状态变更请求进行验证
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // 从请求中获取令牌
  let token;
  
  // 从请求体获取
  if (req.body && req.body._csrf) {
    token = req.body._csrf;
  }
  // 从请求头获取
  else if (req.headers['x-csrf-token']) {
    token = req.headers['x-csrf-token'];
  }
  // 从查询参数获取（不推荐，但某些情况下需要）
  else if (req.query.csrf) {
    token = req.query.csrf;
  }
  
  // 验证令牌
  if (!validateCSRFToken(req, token)) {
    return res.status(403).json({ 
      error: 'Invalid CSRF token',
      code: 'INVALID_CSRF_TOKEN'
    });
  }
  
  next();
}

// 6. 应用中间件
const express = require('express');
const session = require('express-session');
const app = express();

// 配置会话
app.use(session({
  name: 'sessionId',
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
}));

// 解析请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 提供CSRF令牌的端点
app.get('/api/csrf-token', csrfTokenMiddleware);

// 应用CSRF保护
app.use(csrfProtectionMiddleware);
\`\`\`

#### 前端实现

\`\`\`javascript
// 1. 获取CSRF令牌
class CSRFTokenManager {
  constructor() {
    this.token = null;
    this.tokenRefreshInterval = null;
    this.init();
  }
  
  async init() {
    await this.fetchToken();
    this.setupTokenRefresh();
  }
  
  // 获取令牌
  async fetchToken() {
    try {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      this.token = data.csrfToken;
      return this.token;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      throw error;
    }
  }
  
  // 设置定期刷新令牌
  setupTokenRefresh() {
    // 每30分钟刷新一次令牌
    this.tokenRefreshInterval = setInterval(() => {
      this.fetchToken();
    }, 30 * 60 * 1000);
  }
  
  // 获取当前令牌
  getToken() {
    return this.token;
  }
  
  // 手动刷新令牌
  async refreshToken() {
    return await this.fetchToken();
  }
  
  // 清理资源
  cleanup() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }
  }
}

// 2. 表单CSRF令牌注入
class FormCSRFProtection {
  constructor(tokenManager) {
    this.tokenManager = tokenManager;
    this.init();
  }
  
  init() {
    // 监听DOM变化，处理动态添加的表单
    this.setupMutationObserver();
    
    // 处理现有表单
    this.processExistingForms();
    
    // 监听表单提交事件
    this.setupFormSubmitListener();
  }
  
  // 设置DOM变化观察器
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          // 检查添加的节点是否是表单或包含表单
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'FORM') {
              this.injectTokenIntoForm(node);
            } else {
              const forms = node.querySelectorAll?.('form') || [];
              forms.forEach(form => this.injectTokenIntoForm(form));
            }
          }
        });
      });
    });
    
    // 观察整个文档
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // 处理现有表单
  processExistingForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => this.injectTokenIntoForm(form));
  }
  
  // 向表单注入CSRF令牌
  injectTokenIntoForm(form) {
    // 检查是否是敏感表单
    if (!this.isSensitiveForm(form)) {
      return;
    }
    
    // 检查是否已有CSRF令牌
    if (form.querySelector('input[name="_csrf"]')) {
      return;
    }
    
    // 创建令牌输入
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = '_csrf';
    tokenInput.value = this.tokenManager.getToken();
    
    // 添加到表单
    form.appendChild(tokenInput);
  }
  
  // 判断是否是敏感表单
  isSensitiveForm(form) {
    const sensitiveActions = [
      'login',
      'register',
      'change-password',
      'update-profile',
      'transfer',
      'payment',
      'purchase',
      'delete'
    ];
    
    const formAction = (form.getAttribute('action') || '').toLowerCase();
    const formId = (form.getAttribute('id') || '').toLowerCase();
    const formClass = (form.getAttribute('class') || '').toLowerCase();
    
    return sensitiveActions.some(action => 
      formAction.includes(action) || 
      formId.includes(action) || 
      formClass.includes(action)
    );
  }
  
  // 设置表单提交监听器
  setupFormSubmitListener() {
    document.addEventListener('submit', (event) => {
      const form = event.target;
      
      // 确保表单有最新的CSRF令牌
      if (this.isSensitiveForm(form)) {
        this.updateFormToken(form);
      }
    });
  }
  
  // 更新表单令牌
  updateFormToken(form) {
    const tokenInput = form.querySelector('input[name="_csrf"]');
    if (tokenInput) {
      tokenInput.value = this.tokenManager.getToken();
    } else {
      this.injectTokenIntoForm(form);
    }
  }
}

// 3. AJAX请求CSRF令牌注入
class AjaxCSRFProtection {
  constructor(tokenManager) {
    this.tokenManager = tokenManager;
    this.setupInterceptors();
  }
  
  setupInterceptors() {
    // 拦截fetch请求
    this.interceptFetch();
    
    // 拦截XMLHttpRequest
    this.interceptXHR();
  }
  
  interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = (url, options = {}) => {
      // 只对同源敏感请求添加CSRF令牌
      if (this.isSensitiveRequest(url, options)) {
        options.headers = {
          ...options.headers,
          'X-CSRF-Token': this.tokenManager.getToken()
        };
      }
      
      return originalFetch.call(window, url, options);
    };
  }
  
  interceptXHR() {
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._url = url;
      this._method = method;
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
      // 为敏感请求添加CSRF令牌
      if (window.ajaxCSRFProtection.isSensitiveRequest(this._url, { method: this._method })) {
        this.setRequestHeader('X-CSRF-Token', window.ajaxCSRFProtection.tokenManager.getToken());
      }
      
      return originalXHRSend.apply(this, arguments);
    };
  }
  
  // 判断是否是敏感请求
  isSensitiveRequest(url, options) {
    // 只对同源请求添加令牌
    if (typeof url === 'string' && !url.startsWith('/')) {
      try {
        const urlObj = new URL(url);
        if (urlObj.origin !== window.location.origin) {
          return false;
        }
      } catch (e) {
        return false;
      }
    }
    
    // 检查是否是状态变更方法
    const method = (options.method || 'GET').toUpperCase();
    const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    
    if (!stateChangingMethods.includes(method)) {
      return false;
    }
    
    // 检查是否是敏感路径
    const sensitivePaths = [
      '/api/transfer',
      '/api/payment',
      '/api/purchase',
      '/api/change-password',
      '/api/update-profile',
      '/api/delete'
    ];
    
    const requestUrl = typeof url === 'string' ? url : '';
    return sensitivePaths.some(path => requestUrl.includes(path));
  }
}

// 4. 初始化CSRF防护
document.addEventListener('DOMContentLoaded', () => {
  const tokenManager = new CSRFTokenManager();
  
  // 等待令牌获取完成
  tokenManager.fetchToken().then(() => {
    // 初始化表单保护
    window.formCSRFProtection = new FormCSRFProtection(tokenManager);
    
    // 初始化AJAX保护
    window.ajaxCSRFProtection = new AjaxCSRFProtection(tokenManager);
  });
});
\`\`\`

### 双重提交Cookie模式

双重提交Cookie模式（Double Submit Cookie）是一种不需要服务器端会话存储的CSRF防护方法。它将CSRF令牌同时存储在Cookie和请求参数中，服务器验证两者是否匹配。

#### 服务器端实现

\`\`\`javascript
// 1. 生成CSRF令牌
const crypto = require('crypto');

function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 2. 设置CSRF Cookie
function setCSRFCookie(res, token) {
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // 必须为false，以便JavaScript读取
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  });
}

// 3. 验证双重提交Cookie
function validateDoubleSubmitCookie(req) {
  const cookieToken = req.cookies['XSRF-TOKEN'];
  const requestToken = req.headers['x-xsrf-token'] || 
                      req.body['_csrf'] || 
                      req.query['csrf'];
  
  if (!cookieToken || !requestToken) {
    return false;
  }
  
  // 使用恒定时间比较，防止时序攻击
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken, 'hex'),
    Buffer.from(requestToken, 'hex')
  );
}

// 4. Express中间件 - 提供CSRF令牌
function doubleSubmitCookieMiddleware(req, res, next) {
  // 如果没有CSRF cookie，设置一个
  if (!req.cookies['XSRF-TOKEN']) {
    const token = generateCSRFToken();
    setCSRFCookie(res, token);
  }
  
  next();
}

// 5. Express中间件 - 验证双重提交Cookie
function doubleSubmitCookieProtection(req, res, next) {
  // 只对状态变更请求进行验证
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (!validateDoubleSubmitCookie(req)) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  
  next();
}

// 6. 应用双重提交Cookie保护
app.use(doubleSubmitCookieMiddleware);
app.use(doubleSubmitCookieProtection);
\`\`\`

#### 前端实现

\`\`\`javascript
// 1. 前端双重提交Cookie实现
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

// 2. 初始化双重提交Cookie管理器
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

// 5. 使用安全HTTP客户端
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

SameSite Cookie属性是浏览器内置的CSRF防护机制，通过限制cookie在跨站请求中的发送来防止CSRF攻击。

#### 服务器端实现

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

验证Referer和Origin头是另一种CSRF防护方法，通过检查请求来源是否可信来防止CSRF攻击。

#### 服务器端实现

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

// 4. 应用验证中间件
const allowedOrigins = ['https://example.com', 'https://www.example.com'];
app.use(validateRefererAndOrigin(allowedOrigins));

// 5. 高级验证逻辑
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

// 6. 自适应验证策略
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

## 总结

CSRF防护需要采用多层防御策略，包括同步器令牌模式、双重提交Cookie、SameSite属性和Referer/Origin验证等。每种策略都有其优缺点，最佳实践是根据应用场景组合使用多种防护方法。在下一篇文章中，我们将介绍CSRF检测与监控技术，以及实际应用案例，帮助开发者构建更全面的CSRF防护体系。`;export{n as default};
//# sourceMappingURL=23-2-DIJEf2LN.js.map
