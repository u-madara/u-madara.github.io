const n=`---
title: "前端安全编码规范与测试方法"
excerpt: "介绍前端安全编码规范和安全测试方法，包括通用安全编码原则、安全DOM操作、安全网络请求以及前端安全测试工具，帮助开发者构建更加安全可靠的前端应用"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-11-14"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/preview/cover.jpg"
---

# 前端安全编码规范与测试方法

## 前言

随着Web应用的日益复杂和网络安全威胁的不断演变，前端安全已成为现代Web开发中不可忽视的重要环节。单一的安全措施往往不足以应对多样化的安全威胁，需要构建一个全面、多层次的安全防护体系。本文将介绍前端安全的编码规范和测试方法，帮助你构建更加安全可靠的前端应用。

## 安全编码规范

### 通用安全编码原则

\`\`\`javascript
// 1. 安全编码工具类
class SecureCodingUtils {
  // 输入验证与清理
  static validateAndSanitizeInput(input, type = 'string') {
    if (typeof input !== 'string') {
      return null;
    }
    
    // 去除前后空格
    let sanitized = input.trim();
    
    // 根据类型进行特定验证和清理
    switch (type) {
      case 'email':
        return this.validateEmail(sanitized);
      case 'url':
        return this.validateUrl(sanitized);
      case 'number':
        return this.validateNumber(sanitized);
      case 'html':
        return this.sanitizeHtml(sanitized);
      case 'sql':
        return this.sanitizeSql(sanitized);
      default:
        return this.escapeHtml(sanitized);
    }
  }
  
  // 验证邮箱
  static validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) ? email : null;
  }
  
  // 验证URL
  static validateUrl(url) {
    try {
      const urlObj = new URL(url);
      // 只允许http和https协议
      return ['http:', 'https:'].includes(urlObj.protocol) ? url : null;
    } catch (error) {
      return null;
    }
  }
  
  // 验证数字
  static validateNumber(str) {
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }
  
  // HTML转义
  static escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  // HTML清理
  static sanitizeHtml(html) {
    // 使用DOMPurify等库进行更严格的HTML清理
    // 这里提供一个简单实现
    const tempDiv = document.createElement('div');
    tempDiv.textContent = html;
    return tempDiv.innerHTML;
  }
  
  // SQL注入防护
  static sanitizeSql(str) {
    // 移除常见的SQL注入字符
    return str.replace(/['"\\\\;]/g, '');
  }
  
  // 安全的JSON解析
  static safeJsonParse(jsonString, defaultValue = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('JSON parsing error:', error);
      return defaultValue;
    }
  }
  
  // 安全的本地存储操作
  static secureLocalStorage = {
    setItem(key, value, isEncrypted = false) {
      try {
        const data = isEncrypted ? this.encrypt(JSON.stringify(value)) : JSON.stringify(value);
        localStorage.setItem(key, data);
        return true;
      } catch (error) {
        console.error('Error setting localStorage item:', error);
        return false;
      }
    },
    
    getItem(key, isEncrypted = false) {
      try {
        const data = localStorage.getItem(key);
        if (!data) return null;
        
        const parsed = isEncrypted ? this.decrypt(data) : data;
        return JSON.parse(parsed);
      } catch (error) {
        console.error('Error getting localStorage item:', error);
        return null;
      }
    },
    
    removeItem(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('Error removing localStorage item:', error);
        return false;
      }
    },
    
    // 简单加密（实际应用中应使用更安全的加密方法）
    encrypt(data) {
      return btoa(data);
    },
    
    // 简单解密（实际应用中应使用更安全的解密方法）
    decrypt(data) {
      return atob(data);
    }
  };
  
  // 安全的Cookie操作
  static secureCookie = {
    setCookie(name, value, options = {}) {
      try {
        let cookieString = \`\${name}=\${encodeURIComponent(value)}\`;
        
        // 设置安全选项
        if (options.expires) {
          cookieString += \`; expires=\${options.expires.toUTCString()}\`;
        }
        
        if (options.maxAge) {
          cookieString += \`; max-age=\${options.maxAge}\`;
        }
        
        if (options.path) {
          cookieString += \`; path=\${options.path}\`;
        }
        
        if (options.domain) {
          cookieString += \`; domain=\${options.domain}\`;
        }
        
        // 默认启用安全标志
        if (options.secure !== false && window.location.protocol === 'https:') {
          cookieString += '; secure';
        }
        
        // 默认启用SameSite
        cookieString += \`; samesite=\${options.sameSite || 'strict'}\`;
        
        document.cookie = cookieString;
        return true;
      } catch (error) {
        console.error('Error setting cookie:', error);
        return false;
      }
    },
    
    getCookie(name) {
      try {
        const cookies = document.cookie.split(';');
        
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          const [cookieName, cookieValue] = cookie.split('=');
          
          if (cookieName === name) {
            return decodeURIComponent(cookieValue);
          }
        }
        
        return null;
      } catch (error) {
        console.error('Error getting cookie:', error);
        return null;
      }
    },
    
    deleteCookie(name, options = {}) {
      this.setCookie(name, '', {
        ...options,
        expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT')
      });
    }
  };
}

// 2. 安全DOM操作
class SecureDOMOperations {
  // 安全创建元素
  static createElement(tagName, attributes = {}, textContent = '') {
    const element = document.createElement(tagName);
    
    // 安全设置属性
    for (const [attr, value] of Object.entries(attributes)) {
      // 避免设置危险属性
      if (this.isSafeAttribute(attr, value)) {
        element.setAttribute(attr, value);
      }
    }
    
    // 安全设置文本内容
    if (textContent) {
      element.textContent = textContent;
    }
    
    return element;
  }
  
  // 检查属性是否安全
  static isSafeAttribute(attr, value) {
    // 危险属性列表
    const dangerousAttributes = [
      'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
      'onchange', 'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress'
    ];
    
    // 检查是否是危险属性
    if (dangerousAttributes.includes(attr.toLowerCase())) {
      return false;
    }
    
    // 检查属性值是否包含危险内容
    if (typeof value === 'string' && value.toLowerCase().includes('javascript:')) {
      return false;
    }
    
    return true;
  }
  
  // 安全插入HTML
  static insertHTML(element, html, position = 'beforeend') {
    // 使用DOMPurify等库清理HTML
    const cleanHTML = this.sanitizeHTML(html);
    element.insertAdjacentHTML(position, cleanHTML);
  }
  
  // 简单的HTML清理（实际应用中应使用DOMPurify等库）
  static sanitizeHTML(html) {
    const tempDiv = document.createElement('div');
    tempDiv.textContent = html;
    return tempDiv.innerHTML;
  }
  
  // 安全设置样式
  static setStyle(element, styles) {
    for (const [property, value] of Object.entries(styles)) {
      // 避免设置危险样式
      if (this.isSafeStyle(property, value)) {
        element.style[property] = value;
      }
    }
  }
  
  // 检查样式是否安全
  static isSafeStyle(property, value) {
    // 危险样式列表
    const dangerousStyles = [
      'behavior', 'binding', 'expression'
    ];
    
    // 检查是否是危险样式
    if (dangerousStyles.includes(property.toLowerCase())) {
      return false;
    }
    
    // 检查样式值是否包含危险内容
    if (typeof value === 'string' && value.toLowerCase().includes('javascript:')) {
      return false;
    }
    
    return true;
  }
}

// 3. 安全网络请求
class SecureNetworkRequests {
  // 安全的fetch封装
  static async secureFetch(url, options = {}) {
    // 默认选项
    const defaultOptions = {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    };
    
    // 合并选项
    const fetchOptions = { ...defaultOptions, ...options };
    
    // 添加CSRF令牌
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(fetchOptions.method?.toUpperCase())) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        fetchOptions.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
    try {
      // 发送请求
      const response = await fetch(url, fetchOptions);
      
      // 检查响应状态
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      
      // 检查响应内容类型
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }
  
  // 获取CSRF令牌
  static getCsrfToken() {
    // 从meta标签获取
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }
    
    // 从Cookie获取
    return SecureCodingUtils.secureCookie.getCookie('csrf_token');
  }
  
  // 安全的JSONP请求
  static secureJsonp(url, callbackName) {
    return new Promise((resolve, reject) => {
      // 生成唯一回调函数名
      const uniqueCallbackName = \`jsonp_callback_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`;
      
      // 创建回调函数
      window[uniqueCallbackName] = (data) => {
        // 清理
        delete window[uniqueCallbackName];
        document.body.removeChild(script);
        
        // 解析Promise
        resolve(data);
      };
      
      // 创建script标签
      const script = document.createElement('script');
      script.src = \`\${url}\${url.includes('?') ? '&' : '?'}callback=\${uniqueCallbackName}\`;
      script.onerror = () => {
        // 清理
        delete window[uniqueCallbackName];
        document.body.removeChild(script);
        
        // 拒绝Promise
        reject(new Error('JSONP request failed'));
      };
      
      // 添加到页面
      document.body.appendChild(script);
    });
  }
}
\`\`\`

## 安全测试方法

### 前端安全测试工具

\`\`\`javascript
// 1. 前端安全测试套件
class FrontendSecurityTester {
  constructor(options = {}) {
    this.options = {
      testXSS: true,
      testCSRF: true,
      testClickjacking: true,
      testInsecureContent: true,
      testLocalStorage: true,
      testCookies: true,
      ...options
    };
    
    this.results = {
      xss: { passed: 0, failed: 0, details: [] },
      csrf: { passed: 0, failed: 0, details: [] },
      clickjacking: { passed: 0, failed: 0, details: [] },
      insecureContent: { passed: 0, failed: 0, details: [] },
      localStorage: { passed: 0, failed: 0, details: [] },
      cookies: { passed: 0, failed: 0, details: [] }
    };
  }
  
  // 运行所有测试
  async runAllTests() {
    console.log('Starting frontend security tests...');
    
    if (this.options.testXSS) {
      await this.testXSSVulnerabilities();
    }
    
    if (this.options.testCSRF) {
      await this.testCSRFProtection();
    }
    
    if (this.options.testClickjacking) {
      await this.testClickjackingProtection();
    }
    
    if (this.options.testInsecureContent) {
      await this.testInsecureContent();
    }
    
    if (this.options.testLocalStorage) {
      await this.testLocalStorageSecurity();
    }
    
    if (this.options.testCookies) {
      await this.testCookieSecurity();
    }
    
    return this.generateReport();
  }
  
  // 测试XSS漏洞
  async testXSSVulnerabilities() {
    console.log('Testing XSS vulnerabilities...');
    
    // 测试常见的XSS攻击向量
    const xssPayloads = [
      '<script>alert("XSS")<\/script>',
      '<img src="x" onerror="alert(\\'XSS\\')">',
      '<svg onload="alert(\\'XSS\\')">',
      '"><script>alert("XSS")<\/script>',
      '\\';alert("XSS");//'
    ];
    
    // 测试输入字段
    const inputs = document.querySelectorAll('input[type="text"], input[type="search"], textarea');
    
    for (const input of inputs) {
      for (const payload of xssPayloads) {
        // 备份原始值
        const originalValue = input.value;
        
        try {
          // 设置测试值
          input.value = payload;
          
          // 触发事件
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          
          // 检查是否有脚本执行
          const scriptExecuted = this.checkForScriptExecution(payload);
          
          if (scriptExecuted) {
            this.results.xss.failed++;
            this.results.xss.details.push({
              element: input.tagName + (input.id ? \`#\${input.id}\` : ''),
              payload: payload,
              issue: 'XSS vulnerability detected'
            });
          } else {
            this.results.xss.passed++;
          }
        } catch (error) {
          this.results.xss.failed++;
          this.results.xss.details.push({
            element: input.tagName + (input.id ? \`#\${input.id}\` : ''),
            payload: payload,
            issue: \`Error during test: \${error.message}\`
          });
        } finally {
          // 恢复原始值
          input.value = originalValue;
        }
      }
    }
    
    // 测试URL参数
    const urlParams = new URLSearchParams(window.location.search);
    for (const [key, value] of urlParams.entries()) {
      for (const payload of xssPayloads) {
        // 创建测试URL
        const testUrl = new URL(window.location.href);
        testUrl.searchParams.set(key, payload);
        
        // 检查页面是否处理了XSS
        // 这里需要根据实际应用逻辑进行检查
        // 简单示例：检查页面是否包含未转义的payload
        const pageContent = document.documentElement.outerHTML;
        if (pageContent.includes(payload) && !pageContent.includes(encodeURIComponent(payload))) {
          this.results.xss.failed++;
          this.results.xss.details.push({
            element: 'URL parameter',
            payload: payload,
            issue: 'Potential XSS in URL parameter'
          });
        } else {
          this.results.xss.passed++;
        }
      }
    }
  }
  
  // 检查是否有脚本执行
  checkForScriptExecution(payload) {
    // 创建一个全局标志来检测脚本执行
    const testId = 'xss_test_' + Date.now();
    window[testId] = false;
    
    // 创建测试脚本
    const testScript = document.createElement('script');
    testScript.textContent = \`window.\${testId} = true;\`;
    
    // 添加到页面
    document.body.appendChild(testScript);
    
    // 检查标志
    const scriptExecuted = window[testId];
    
    // 清理
    delete window[testId];
    document.body.removeChild(testScript);
    
    return scriptExecuted;
  }
  
  // 测试CSRF防护
  async testCSRFProtection() {
    console.log('Testing CSRF protection...');
    
    // 检查表单是否有CSRF令牌
    const forms = document.querySelectorAll('form');
    
    for (const form of forms) {
      // 查找CSRF令牌
      const csrfToken = form.querySelector('input[name*="csrf"], input[name*="token"]');
      
      if (!csrfToken) {
        this.results.csrf.failed++;
        this.results.csrf.details.push({
          element: 'form' + (form.id ? \`#\${form.id}\` : ''),
          issue: 'Missing CSRF token'
        });
      } else if (!csrfToken.value) {
        this.results.csrf.failed++;
        this.results.csrf.details.push({
          element: 'form' + (form.id ? \`#\${form.id}\` : ''),
          issue: 'Empty CSRF token'
        });
      } else {
        this.results.csrf.passed++;
      }
      
      // 检查表单方法
      const method = form.method ? form.method.toLowerCase() : 'get';
      if (['post', 'put', 'delete', 'patch'].includes(method)) {
        // 检查SameSite Cookie设置
        const cookies = document.cookie.split(';');
        let hasSameSite = false;
        
        for (const cookie of cookies) {
          const trimmedCookie = cookie.trim();
          if (trimmedCookie.includes('samesite')) {
            hasSameSite = true;
            break;
          }
        }
        
        if (!hasSameSite) {
          this.results.csrf.failed++;
          this.results.csrf.details.push({
            element: 'form' + (form.id ? \`#\${form.id}\` : ''),
            issue: 'Missing SameSite cookie attribute'
          });
        } else {
          this.results.csrf.passed++;
        }
      }
    }
    
    // 检查AJAX请求是否有CSRF令牌
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      if (script.textContent) {
        // 检查fetch调用
        if (script.textContent.includes('fetch(') && 
            (script.textContent.includes('method:') || script.textContent.includes('POST'))) {
          if (!script.textContent.includes('X-CSRF-Token') && 
              !script.textContent.includes('csrf-token')) {
            this.results.csrf.failed++;
            this.results.csrf.details.push({
              element: 'script',
              issue: 'AJAX request without CSRF token'
            });
          } else {
            this.results.csrf.passed++;
          }
        }
        
        // 检查XMLHttpRequest
        if (script.textContent.includes('XMLHttpRequest') || 
            script.textContent.includes('$.ajax')) {
          if (!script.textContent.includes('X-CSRF-Token') && 
              !script.textContent.includes('csrf-token')) {
            this.results.csrf.failed++;
            this.results.csrf.details.push({
              element: 'script',
              issue: 'AJAX request without CSRF token'
            });
          } else {
            this.results.csrf.passed++;
          }
        }
      }
    }
  }
  
  // 测试点击劫持防护
  async testClickjackingProtection() {
    console.log('Testing clickjacking protection...');
    
    // 检查X-Frame-Options头
    try {
      const response = await fetch(window.location.href, { method: 'HEAD' });
      const xFrameOptions = response.headers.get('x-frame-options');
      
      if (!xFrameOptions) {
        this.results.clickjacking.failed++;
        this.results.clickjacking.details.push({
          element: 'HTTP headers',
          issue: 'Missing X-Frame-Options header'
        });
      } else if (!['deny', 'sameorigin'].includes(xFrameOptions.toLowerCase())) {
        this.results.clickjacking.failed++;
        this.results.clickjacking.details.push({
          element: 'HTTP headers',
          issue: 'Invalid X-Frame-Options value'
        });
      } else {
        this.results.clickjacking.passed++;
      }
    } catch (error) {
      this.results.clickjacking.failed++;
      this.results.clickjacking.details.push({
        element: 'HTTP headers',
        issue: \`Error checking headers: \${error.message}\`
      });
    }
    
    // 检查Content Security Policy frame-ancestors
    try {
      const response = await fetch(window.location.href, { method: 'HEAD' });
      const csp = response.headers.get('content-security-policy');
      
      if (!csp) {
        this.results.clickjacking.failed++;
        this.results.clickjacking.details.push({
          element: 'HTTP headers',
          issue: 'Missing Content Security Policy'
        });
      } else if (!csp.includes('frame-ancestors')) {
        this.results.clickjacking.failed++;
        this.results.clickjacking.details.push({
          element: 'HTTP headers',
          issue: 'Missing frame-ancestors in CSP'
        });
      } else {
        this.results.clickjacking.passed++;
      }
    } catch (error) {
      this.results.clickjacking.failed++;
      this.results.clickjacking.details.push({
        element: 'HTTP headers',
        issue: \`Error checking CSP: \${error.message}\`
      });
    }
    
    // 检查JavaScript防护
    const scripts = document.querySelectorAll('script');
    let hasFrameBusting = false;
    
    for (const script of scripts) {
      if (script.textContent) {
        if (script.textContent.includes('top.location') || 
            script.textContent.includes('self.location')) {
          hasFrameBusting = true;
          break;
        }
      }
    }
    
    if (!hasFrameBusting) {
      this.results.clickjacking.failed++;
      this.results.clickjacking.details.push({
        element: 'JavaScript',
        issue: 'Missing frame-busting script'
      });
    } else {
      this.results.clickjacking.passed++;
    }
  }
  
  // 测试不安全内容
  async testInsecureContent() {
    console.log('Testing for insecure content...');
    
    // 检查是否使用HTTPS
    if (window.location.protocol !== 'https:') {
      this.results.insecureContent.failed++;
      this.results.insecureContent.details.push({
        element: 'Page protocol',
        issue: 'Page not served over HTTPS'
      });
    } else {
      this.results.insecureContent.passed++;
    }
    
    // 检查不安全的资源
    const resources = [
      { selector: 'img[src]', attribute: 'src', type: 'Image' },
      { selector: 'script[src]', attribute: 'src', type: 'Script' },
      { selector: 'link[rel="stylesheet"]', attribute: 'href', type: 'Stylesheet' },
      { selector: 'iframe[src]', attribute: 'src', type: 'Iframe' },
      { selector: 'video[src]', attribute: 'src', type: 'Video' },
      { selector: 'audio[src]', attribute: 'src', type: 'Audio' }
    ];
    
    for (const resource of resources) {
      const elements = document.querySelectorAll(resource.selector);
      
      for (const element of elements) {
        const url = element.getAttribute(resource.attribute);
        
        if (url && url.startsWith('http://')) {
          this.results.insecureContent.failed++;
          this.results.insecureContent.details.push({
            element: \`\${resource.type}: \${url}\`,
            issue: 'Insecure HTTP resource on HTTPS page'
          });
        } else if (url && (url.startsWith('https://') || url.startsWith('/') || !url.includes('://'))) {
          this.results.insecureContent.passed++;
        }
      }
    }
    
    // 检查混合内容
    if (window.location.protocol === 'https:') {
      // 检查是否有通过JavaScript动态加载的不安全内容
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.textContent) {
          if (script.textContent.includes('http://') && 
              !script.textContent.includes('https://')) {
            this.results.insecureContent.failed++;
            this.results.insecureContent.details.push({
              element: 'JavaScript',
              issue: 'Potential mixed content in script'
            });
          } else {
            this.results.insecureContent.passed++;
          }
        }
      }
    }
  }
  
  // 测试本地存储安全
  async testLocalStorageSecurity() {
    console.log('Testing localStorage security...');
    
    // 检查localStorage中是否有敏感信息
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    let hasSensitiveData = false;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      
      // 检查键名是否包含敏感词汇
      for (const sensitiveKey of sensitiveKeys) {
        if (key.toLowerCase().includes(sensitiveKey)) {
          this.results.localStorage.failed++;
          this.results.localStorage.details.push({
            element: \`localStorage key: \${key}\`,
            issue: 'Potentially sensitive data in localStorage'
          });
          hasSensitiveData = true;
          break;
        }
      }
      
      // 检查值是否包含敏感信息
      if (value && (value.includes('token') || value.includes('password'))) {
        this.results.localStorage.failed++;
        this.results.localStorage.details.push({
          element: \`localStorage value for key: \${key}\`,
          issue: 'Potentially sensitive data in localStorage value'
        });
        hasSensitiveData = true;
      }
    }
    
    if (!hasSensitiveData) {
      this.results.localStorage.passed++;
    }
    
    // 检查sessionStorage
    hasSensitiveData = false;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const value = sessionStorage.getItem(key);
      
      // 检查键名是否包含敏感词汇
      for (const sensitiveKey of sensitiveKeys) {
        if (key.toLowerCase().includes(sensitiveKey)) {
          this.results.localStorage.failed++;
          this.results.localStorage.details.push({
            element: \`sessionStorage key: \${key}\`,
            issue: 'Potentially sensitive data in sessionStorage'
          });
          hasSensitiveData = true;
          break;
        }
      }
      
      // 检查值是否包含敏感信息
      if (value && (value.includes('token') || value.includes('password'))) {
        this.results.localStorage.failed++;
        this.results.localStorage.details.push({
          element: \`sessionStorage value for key: \${key}\`,
          issue: 'Potentially sensitive data in sessionStorage value'
        });
        hasSensitiveData = true;
      }
    }
    
    if (!hasSensitiveData) {
      this.results.localStorage.passed++;
    }
  }
  
  // 测试Cookie安全
  async testCookieSecurity() {
    console.log('Testing cookie security...');
    
    // 解析所有Cookie
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [name, ...valueParts] = cookie.trim().split('=');
      const value = valueParts.join('=');
      
      if (!name) continue;
      
      // 检查敏感Cookie是否设置了安全标志
      const sensitiveKeys = ['session', 'token', 'auth', 'password'];
      const isSensitive = sensitiveKeys.some(key => name.toLowerCase().includes(key));
      
      if (isSensitive) {
        // 检查是否设置了Secure标志
        if (window.location.protocol === 'https:' && !cookie.includes('secure')) {
          this.results.cookies.failed++;
          this.results.cookies.details.push({
            element: \`Cookie: \${name}\`,
            issue: 'Sensitive cookie without Secure flag'
          });
        } else {
          this.results.cookies.passed++;
        }
        
        // 检查是否设置了HttpOnly标志
        // 注意：JavaScript无法直接检查HttpOnly标志
        // 这里只能记录，需要通过其他方式验证
        if (!cookie.includes('httponly')) {
          this.results.cookies.failed++;
          this.results.cookies.details.push({
            element: \`Cookie: \${name}\`,
            issue: 'Sensitive cookie without HttpOnly flag (cannot be verified in JavaScript)'
          });
        }
      }
      
      // 检查是否设置了SameSite属性
      if (!cookie.includes('samesite')) {
        this.results.cookies.failed++;
        this.results.cookies.details.push({
          element: \`Cookie: \${name}\`,
          issue: 'Cookie without SameSite attribute'
        });
      } else {
        this.results.cookies.passed++;
      }
    }
  }
  
  // 生成测试报告
  generateReport() {
    const report = {
      summary: {
        totalPassed: 0,
        totalFailed: 0,
        totalTests: 0
      },
      details: {}
    };
    
    // 计算总结
    for (const [category, results] of Object.entries(this.results)) {
      report.summary.totalPassed += results.passed;
      report.summary.totalFailed += results.failed;
      report.summary.totalTests += results.passed + results.failed;
      
      report.details[category] = {
        passed: results.passed,
        failed: results.failed,
        total: results.passed + results.failed,
        issues: results.details
      };
    }
    
    // 计算通过率
    report.summary.passRate = report.summary.totalTests > 0 
      ? (report.summary.totalPassed / report.summary.totalTests * 100).toFixed(2) + '%'
      : '0%';
    
    return report;
  }
}

// 2. 使用示例
document.addEventListener('DOMContentLoaded', async () => {
  // 创建安全测试器
  const securityTester = new FrontendSecurityTester({
    testXSS: true,
    testCSRF: true,
    testClickjacking: true,
    testInsecureContent: true,
    testLocalStorage: true,
    testCookies: true
  });
  
  // 运行所有测试
  const report = await securityTester.runAllTests();
  
  // 输出报告
  console.log('Security Test Report:', report);
  
  // 在页面上显示报告
  const reportContainer = document.getElementById('security-report');
  if (reportContainer) {
    reportContainer.innerHTML = \`
      <h2>前端安全测试报告</h2>
      <div class="summary">
        <p>总测试数: \${report.summary.totalTests}</p>
        <p>通过: \${report.summary.totalPassed}</p>
        <p>失败: \${report.summary.totalFailed}</p>
        <p>通过率: \${report.summary.passRate}</p>
      </div>
      <div class="details">
        \${Object.entries(report.details).map(([category, details]) => \`
          <div class="category">
            <h3>\${category}</h3>
            <p>通过: \${details.passed}, 失败: \${details.failed}, 总计: \${details.total}</p>
            \${details.issues.length > 0 ? \`
              <ul>
                \${details.issues.map(issue => \`
                  <li><strong>\${issue.element}:</strong> \${issue.issue}</li>
                \`).join('')}
              </ul>
            \` : ''}
          </div>
        \`).join('')}
      </div>
    \`;
  }
});
\`\`\`

## 总结

前端安全编码规范和测试方法是构建安全Web应用的基础。通过遵循安全编码原则，如输入验证与清理、安全的DOM操作、安全的网络请求等，可以有效地减少安全漏洞。同时，使用系统性的安全测试工具，可以帮助开发者发现和修复潜在的安全问题。

在下一篇文章中，我们将继续探讨前端安全监控与响应、数据保护合规以及综合安全架构设计，帮助构建更加全面的前端安全防护体系。`;export{n as default};
//# sourceMappingURL=26-1-BxjoV7-s.js.map
