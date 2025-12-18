const n=`---
title: "前端安全最佳实践与综合防护"
excerpt: "系统性地介绍前端安全的最佳实践，包括安全编码规范、安全测试方法、安全监控与响应、安全合规性以及综合安全架构设计，帮助开发者构建更加安全可靠的前端应用"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-12-06"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/preview/cover.jpg"
---

# 前端安全最佳实践与综合防护

## 前言

随着Web应用的日益复杂和网络安全威胁的不断演变，前端安全已成为现代Web开发中不可忽视的重要环节。单一的安全措施往往不足以应对多样化的安全威胁，需要构建一个全面、多层次的安全防护体系。本文将系统性地介绍前端安全的最佳实践，包括安全编码规范、安全测试方法、安全监控与响应、安全合规性以及综合安全架构设计，帮助你构建更加安全可靠的前端应用。

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

## 安全监控与响应

### 安全监控系统

\`\`\`javascript
// 1. 前端安全监控系统
class SecurityMonitoringSystem {
  constructor(options = {}) {
    this.options = {
      endpoint: '/api/security-events',
      maxEvents: 100,
      flushInterval: 30000, // 30秒
      enableConsoleLogging: true,
      ...options
    };
    
    this.events = [];
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
    this.startPeriodicFlush();
  }
  
  // 设置事件监听器
  setupEventListeners() {
    // 监听在线/离线状态
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushEvents();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.flushEvents();
      }
    });
    
    // 监听页面卸载
    window.addEventListener('beforeunload', () => {
      this.flushEvents();
    });
  }
  
  // 记录安全事件
  logSecurityEvent(type, details, severity = 'medium') {
    const event = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: type,
      severity: severity,
      details: details,
      url: window.location.href,
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };
    
    // 添加到事件队列
    this.events.push(event);
    
    // 控制台日志
    if (this.options.enableConsoleLogging) {
      console.warn(\`Security Event [\${severity.toUpperCase()}]:\`, event);
    }
    
    // 检查是否需要立即刷新
    if (severity === 'high') {
      this.flushEvents();
    }
    
    // 检查事件队列大小
    if (this.events.length >= this.options.maxEvents) {
      this.flushEvents();
    }
    
    return event.id;
  }
  
  // 检测可疑活动
  detectSuspiciousActivity() {
    // 检测异常的键盘输入模式
    this.detectAbnormalKeystrokes();
    
    // 检测异常的鼠标移动
    this.detectAbnormalMouseMovement();
    
    // 检测异常的表单提交
    this.detectAbnormalFormSubmission();
    
    // 检测异常的网络请求
    this.detectAbnormalNetworkRequests();
  }
  
  // 检测异常的键盘输入
  detectAbnormalKeystrokes() {
    let keystrokeCount = 0;
    let keystrokeStartTime = Date.now();
    
    document.addEventListener('keydown', () => {
      keystrokeCount++;
      
      // 检查是否在短时间内有大量按键
      const currentTime = Date.now();
      const timeDiff = currentTime - keystrokeStartTime;
      
      if (timeDiff < 1000 && keystrokeCount > 50) {
        this.logSecurityEvent('abnormal_keystrokes', {
          keystrokeCount: keystrokeCount,
          timeWindow: timeDiff
        }, 'medium');
        
        // 重置计数器
        keystrokeCount = 0;
        keystrokeStartTime = currentTime;
      }
      
      // 如果时间间隔超过1秒，重置计数器
      if (timeDiff > 1000) {
        keystrokeCount = 1;
        keystrokeStartTime = currentTime;
      }
    });
  }
  
  // 检测异常的鼠标移动
  detectAbnormalMouseMovement() {
    let mouseMovements = [];
    let lastMouseTime = Date.now();
    
    document.addEventListener('mousemove', (event) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastMouseTime;
      
      // 记录鼠标移动
      mouseMovements.push({
        x: event.clientX,
        y: event.clientY,
        time: currentTime
      });
      
      // 保留最近1秒的移动记录
      mouseMovements = mouseMovements.filter(m => currentTime - m.time < 1000);
      
      // 检查是否有异常的鼠标移动模式
      if (mouseMovements.length > 100) {
        // 计算鼠标移动的总距离
        let totalDistance = 0;
        for (let i = 1; i < mouseMovements.length; i++) {
          const dx = mouseMovements[i].x - mouseMovements[i-1].x;
          const dy = mouseMovements[i].y - mouseMovements[i-1].y;
          totalDistance += Math.sqrt(dx * dx + dy * dy);
        }
        
        // 如果在短时间内鼠标移动距离过大，可能是机器人
        if (totalDistance > 5000) {
          this.logSecurityEvent('abnormal_mouse_movement', {
            movements: mouseMovements.length,
            totalDistance: totalDistance,
            timeWindow: 1000
          }, 'medium');
        }
      }
      
      lastMouseTime = currentTime;
    });
  }
  
  // 检测异常的表单提交
  detectAbnormalFormSubmission() {
    const formSubmissions = {};
    
    document.addEventListener('submit', (event) => {
      const form = event.target;
      const formId = form.id || 'unnamed_form';
      
      // 记录表单提交
      if (!formSubmissions[formId]) {
        formSubmissions[formId] = [];
      }
      
      formSubmissions[formId].push(Date.now());
      
      // 保留最近1分钟的提交记录
      const oneMinuteAgo = Date.now() - 60000;
      formSubmissions[formId] = formSubmissions[formId].filter(time => time > oneMinuteAgo);
      
      // 检查是否有异常的提交频率
      if (formSubmissions[formId].length > 10) {
        this.logSecurityEvent('abnormal_form_submission', {
          formId: formId,
          submissions: formSubmissions[formId].length,
          timeWindow: 60000
        }, 'high');
      }
    });
  }
  
  // 检测异常的网络请求
  detectAbnormalNetworkRequests() {
    const networkRequests = [];
    
    // 拦截fetch请求
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      const url = args[0];
      const options = args[1] || {};
      
      // 记录请求
      const request = {
        url: url,
        method: options.method || 'GET',
        timestamp: Date.now()
      };
      
      networkRequests.push(request);
      
      // 保留最近1分钟的请求记录
      const oneMinuteAgo = Date.now() - 60000;
      while (networkRequests.length > 0 && networkRequests[0].timestamp < oneMinuteAgo) {
        networkRequests.shift();
      }
      
      // 检查是否有异常的请求频率
      if (networkRequests.length > 100) {
        this.logSecurityEvent('abnormal_network_requests', {
          requests: networkRequests.length,
          timeWindow: 60000
        }, 'high');
      }
      
      // 调用原始fetch
      return originalFetch(...args);
    };
  }
  
  // 检测XSS攻击尝试
  detectXSSAttempts() {
    // 检测URL参数中的XSS尝试
    const urlParams = new URLSearchParams(window.location.search);
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\\w+\\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];
    
    for (const [key, value] of urlParams.entries()) {
      for (const pattern of xssPatterns) {
        if (pattern.test(value)) {
          this.logSecurityEvent('xss_attempt', {
            parameter: key,
            value: value,
            pattern: pattern.source
          }, 'high');
        }
      }
    }
    
    // 检测表单输入中的XSS尝试
    document.addEventListener('input', (event) => {
      const element = event.target;
      const value = element.value;
      
      for (const pattern of xssPatterns) {
        if (pattern.test(value)) {
          this.logSecurityEvent('xss_attempt', {
            element: element.tagName + (element.id ? \`#\${element.id}\` : ''),
            value: value,
            pattern: pattern.source
          }, 'high');
        }
      }
    });
  }
  
  // 检测CSRF攻击尝试
  detectCSRFAttempts() {
    // 检测跨域请求
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      const url = args[0];
      const options = args[1] || {};
      
      // 检查是否是跨域请求
      if (typeof url === 'string' && !url.startsWith(window.location.origin)) {
        // 检查是否有CSRF令牌
        const hasCSRFToken = 
          (options.headers && options.headers['X-CSRF-Token']) ||
          (options.headers && options.headers['X-Requested-With'] === 'XMLHttpRequest');
        
        if (!hasCSRFToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
          this.logSecurityEvent('csrf_attempt', {
            url: url,
            method: options.method || 'GET'
          }, 'high');
        }
      }
      
      // 调用原始fetch
      return originalFetch(...args);
    };
  }
  
  // 刷新事件到服务器
  async flushEvents() {
    if (!this.isOnline || this.events.length === 0) {
      return;
    }
    
    try {
      const response = await fetch(this.options.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: this.events
        })
      });
      
      if (response.ok) {
        // 清空已发送的事件
        this.events = [];
      } else {
        console.error('Failed to send security events:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending security events:', error);
    }
  }
  
  // 定期刷新事件
  startPeriodicFlush() {
    setInterval(() => {
      this.flushEvents();
    }, this.options.flushInterval);
  }
  
  // 生成事件ID
  generateEventId() {
    return 'event_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }
  
  // 初始化监控系统
  init() {
    // 检测可疑活动
    this.detectSuspiciousActivity();
    
    // 检测XSS攻击尝试
    this.detectXSSAttempts();
    
    // 检测CSRF攻击尝试
    this.detectCSRFAttempts();
    
    console.log('Security monitoring system initialized');
  }
}

// 2. 使用示例
document.addEventListener('DOMContentLoaded', () => {
  // 初始化安全监控系统
  const securityMonitor = new SecurityMonitoringSystem({
    endpoint: '/api/security-events',
    maxEvents: 50,
    flushInterval: 15000, // 15秒
    enableConsoleLogging: true
  });
  
  securityMonitor.init();
  
  // 手动记录安全事件
  document.getElementById('login-form').addEventListener('submit', (event) => {
    const username = document.getElementById('username').value;
    
    // 记录登录尝试
    securityMonitor.logSecurityEvent('login_attempt', {
      username: username,
      timestamp: new Date().toISOString()
    }, 'medium');
  });
  
  // 检测到可疑活动时采取行动
  window.addEventListener('securityEvent', (event) => {
    const securityEvent = event.detail;
    
    // 根据事件类型和严重程度采取行动
    if (securityEvent.type === 'xss_attempt' && securityEvent.severity === 'high') {
      // 阻止表单提交
      event.preventDefault();
      
      // 显示警告
      alert('检测到可疑活动，请检查您的输入');
      
      // 记录事件
      securityMonitor.logSecurityEvent('xss_blocked', {
        originalEvent: securityEvent
      }, 'high');
    }
  });
});
\`\`\`

## 安全合规性

### 数据保护合规

\`\`\`javascript
// 1. 数据保护合规工具
class DataProtectionCompliance {
  constructor(options = {}) {
    this.options = {
      consentCookieName: 'data_consent',
      consentExpirationDays: 365,
      privacyPolicyUrl: '/privacy-policy',
      ...options
    };
    
    this.consentGiven = this.checkConsent();
    this.setupConsentManagement();
  }
  
  // 检查用户是否已同意数据收集
  checkConsent() {
    const consentCookie = SecureCodingUtils.secureCookie.getCookie(this.options.consentCookieName);
    
    if (!consentCookie) {
      return false;
    }
    
    try {
      const consentData = JSON.parse(decodeURIComponent(consentCookie));
      
      // 检查同意是否过期
      const consentDate = new Date(consentData.date);
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + this.options.consentExpirationDays);
      
      if (consentDate > expirationDate) {
        return false;
      }
      
      return consentData.consent;
    } catch (error) {
      console.error('Error parsing consent cookie:', error);
      return false;
    }
  }
  
  // 设置同意管理
  setupConsentManagement() {
    // 如果用户尚未同意，显示同意弹窗
    if (!this.consentGiven) {
      this.showConsentModal();
    }
    
    // 设置同意按钮事件
    const acceptButton = document.getElementById('accept-consent');
    if (acceptButton) {
      acceptButton.addEventListener('click', () => {
        this.grantConsent();
      });
    }
    
    // 设置拒绝按钮事件
    const declineButton = document.getElementById('decline-consent');
    if (declineButton) {
      declineButton.addEventListener('click', () => {
        this.denyConsent();
      });
    }
    
    // 设置自定义设置按钮事件
    const customizeButton = document.getElementById('customize-consent');
    if (customizeButton) {
      customizeButton.addEventListener('click', () => {
        this.showCustomizeConsent();
      });
    }
  }
  
  // 显示同意弹窗
  showConsentModal() {
    // 检查是否已有同意弹窗
    if (document.getElementById('consent-modal')) {
      return;
    }
    
    // 创建同意弹窗
    const modal = SecureDOMOperations.createElement('div', {
      id: 'consent-modal',
      class: 'consent-modal'
    });
    
    // 创建弹窗内容
    const content = SecureDOMOperations.createElement('div', {
      class: 'consent-content'
    });
    
    // 标题
    const title = SecureDOMOperations.createElement('h2', {}, '数据收集同意');
    content.appendChild(title);
    
    // 描述
    const description = SecureDOMOperations.createElement('p', {}, 
      '我们使用Cookie和类似技术来改善您的浏览体验，分析网站流量，并个性化内容。' +
      '通过继续使用我们的网站，您同意我们的数据收集做法。' +
      '请阅读我们的<a href="' + this.options.privacyPolicyUrl + '">隐私政策</a>了解更多信息。'
    );
    content.appendChild(description);
    
    // 按钮容器
    const buttonContainer = SecureDOMOperations.createElement('div', {
      class: 'consent-buttons'
    });
    
    // 接受按钮
    const acceptButton = SecureDOMOperations.createElement('button', {
      id: 'accept-consent',
      class: 'btn btn-primary'
    }, '接受全部');
    buttonContainer.appendChild(acceptButton);
    
    // 自定义按钮
    const customizeButton = SecureDOMOperations.createElement('button', {
      id: 'customize-consent',
      class: 'btn btn-secondary'
    }, '自定义设置');
    buttonContainer.appendChild(customizeButton);
    
    // 拒绝按钮
    const declineButton = SecureDOMOperations.createElement('button', {
      id: 'decline-consent',
      class: 'btn btn-link'
    }, '拒绝');
    buttonContainer.appendChild(declineButton);
    
    content.appendChild(buttonContainer);
    modal.appendChild(content);
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 设置事件监听器
    acceptButton.addEventListener('click', () => {
      this.grantConsent();
    });
    
    customizeButton.addEventListener('click', () => {
      this.showCustomizeConsent();
    });
    
    declineButton.addEventListener('click', () => {
      this.denyConsent();
    });
  }
  
  // 显示自定义同意设置
  showCustomizeConsent() {
    // 移除基本同意弹窗
    const basicModal = document.getElementById('consent-modal');
    if (basicModal) {
      basicModal.remove();
    }
    
    // 创建自定义同意弹窗
    const modal = SecureDOMOperations.createElement('div', {
      id: 'consent-modal-custom',
      class: 'consent-modal'
    });
    
    // 创建弹窗内容
    const content = SecureDOMOperations.createElement('div', {
      class: 'consent-content'
    });
    
    // 标题
    const title = SecureDOMOperations.createElement('h2', {}, '自定义数据收集设置');
    content.appendChild(title);
    
    // 选项列表
    const optionsList = SecureDOMOperations.createElement('div', {
      class: 'consent-options'
    });
    
    // 必要Cookie
    const necessaryOption = this.createConsentOption('necessary', '必要Cookie', 
      '这些Cookie对于网站正常运行是必需的，不能被禁用。', true);
    optionsList.appendChild(necessaryOption);
    
    // 分析Cookie
    const analyticsOption = this.createConsentOption('analytics', '分析Cookie', 
      '这些Cookie帮助我们了解访问者如何与网站互动，通过收集和报告信息匿名。');
    optionsList.appendChild(analyticsOption);
    
    // 功能Cookie
    const functionalityOption = this.createConsentOption('functionality', '功能Cookie', 
      '这些Cookie使网站能够提供增强的功能和个性化。');
    optionsList.appendChild(functionalityOption);
    
    // 营销Cookie
    const marketingOption = this.createConsentOption('marketing', '营销Cookie', 
      '这些Cookie用于在您浏览网站时向您展示相关广告。');
    optionsList.appendChild(marketingOption);
    
    content.appendChild(optionsList);
    
    // 按钮容器
    const buttonContainer = SecureDOMOperations.createElement('div', {
      class: 'consent-buttons'
    });
    
    // 保存设置按钮
    const saveButton = SecureDOMOperations.createElement('button', {
      id: 'save-consent',
      class: 'btn btn-primary'
    }, '保存设置');
    buttonContainer.appendChild(saveButton);
    
    // 返回按钮
    const backButton = SecureDOMOperations.createElement('button', {
      id: 'back-consent',
      class: 'btn btn-secondary'
    }, '返回');
    buttonContainer.appendChild(backButton);
    
    content.appendChild(buttonContainer);
    modal.appendChild(content);
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 设置事件监听器
    saveButton.addEventListener('click', () => {
      this.saveCustomConsent();
    });
    
    backButton.addEventListener('click', () => {
      modal.remove();
      this.showConsentModal();
    });
  }
  
  // 创建同意选项
  createConsentOption(id, title, description, disabled = false) {
    const option = SecureDOMOperations.createElement('div', {
      class: 'consent-option'
    });
    
    // 复选框
    const checkbox = SecureDOMOperations.createElement('input', {
      type: 'checkbox',
      id: \`consent-\${id}\`,
      name: \`consent-\${id}\`,
      checked: !disabled,
      disabled: disabled
    });
    option.appendChild(checkbox);
    
    // 标签
    const label = SecureDOMOperations.createElement('label', {
      for: \`consent-\${id}\`
    });
    
    // 标题
    const labelTitle = SecureDOMOperations.createElement('div', {
      class: 'consent-option-title'
    }, title);
    label.appendChild(labelTitle);
    
    // 描述
    const labelDescription = SecureDOMOperations.createElement('div', {
      class: 'consent-option-description'
    }, description);
    label.appendChild(labelDescription);
    
    option.appendChild(label);
    
    return option;
  }
  
  // 授予同意
  grantConsent() {
    const consentData = {
      consent: true,
      categories: {
        necessary: true,
        analytics: true,
        functionality: true,
        marketing: true
      },
      date: new Date().toISOString()
    };
    
    // 保存同意Cookie
    this.saveConsentCookie(consentData);
    
    // 更新状态
    this.consentGiven = true;
    
    // 移除同意弹窗
    const modal = document.getElementById('consent-modal');
    if (modal) {
      modal.remove();
    }
    
    // 触发同意事件
    this.dispatchConsentEvent('granted', consentData);
    
    // 启用跟踪和分析
    this.enableTracking();
  }
  
  // 拒绝同意
  denyConsent() {
    const consentData = {
      consent: false,
      categories: {
        necessary: true,
        analytics: false,
        functionality: false,
        marketing: false
      },
      date: new Date().toISOString()
    };
    
    // 保存同意Cookie
    this.saveConsentCookie(consentData);
    
    // 更新状态
    this.consentGiven = false;
    
    // 移除同意弹窗
    const modal = document.getElementById('consent-modal');
    if (modal) {
      modal.remove();
    }
    
    // 触发同意事件
    this.dispatchConsentEvent('denied', consentData);
    
    // 禁用跟踪和分析
    this.disableTracking();
  }
  
  // 保存自定义同意
  saveCustomConsent() {
    const categories = {
      necessary: true, // 必要Cookie始终启用
      analytics: document.getElementById('consent-analytics').checked,
      functionality: document.getElementById('consent-functionality').checked,
      marketing: document.getElementById('consent-marketing').checked
    };
    
    const consentData = {
      consent: true,
      categories: categories,
      date: new Date().toISOString()
    };
    
    // 保存同意Cookie
    this.saveConsentCookie(consentData);
    
    // 更新状态
    this.consentGiven = true;
    
    // 移除同意弹窗
    const modal = document.getElementById('consent-modal-custom');
    if (modal) {
      modal.remove();
    }
    
    // 触发同意事件
    this.dispatchConsentEvent('customized', consentData);
    
    // 根据设置启用/禁用跟踪
    this.updateTrackingSettings(categories);
  }
  
  // 保存同意Cookie
  saveConsentCookie(consentData) {
    const expires = new Date();
    expires.setDate(expires.getDate() + this.options.consentExpirationDays);
    
    SecureCodingUtils.secureCookie.setCookie(
      this.options.consentCookieName,
      encodeURIComponent(JSON.stringify(consentData)),
      {
        expires: expires,
        path: '/',
        secure: true,
        sameSite: 'strict'
      }
    );
  }
  
  // 触发同意事件
  dispatchConsentEvent(type, data) {
    const event = new CustomEvent('consentUpdated', {
      detail: {
        type: type,
        data: data
      }
    });
    
    document.dispatchEvent(event);
  }
  
  // 启用跟踪
  enableTracking() {
    // 启用Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    }
    
    // 启用其他跟踪脚本
    const trackingScripts = document.querySelectorAll('.tracking-script');
    trackingScripts.forEach(script => {
      if (!script.hasAttribute('data-consent')) {
        script.setAttribute('data-consent', 'granted');
        // 如果脚本尚未加载，则加载它
        if (!script.src && script.textContent.trim()) {
          eval(script.textContent);
        }
      }
    });
  }
  
  // 禁用跟踪
  disableTracking() {
    // 禁用Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied'
      });
    }
    
    // 禁用其他跟踪脚本
    const trackingScripts = document.querySelectorAll('.tracking-script');
    trackingScripts.forEach(script => {
      script.setAttribute('data-consent', 'denied');
    });
    
    // 删除非必要的Cookie
    this.deleteNonEssentialCookies();
  }
  
  // 更新跟踪设置
  updateTrackingSettings(categories) {
    // 更新Google Analytics设置
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        analytics_storage: categories.analytics ? 'granted' : 'denied',
        ad_storage: categories.marketing ? 'granted' : 'denied',
        functionality_storage: categories.functionality ? 'granted' : 'denied'
      });
    }
    
    // 更新其他跟踪脚本
    const trackingScripts = document.querySelectorAll('.tracking-script');
    trackingScripts.forEach(script => {
      const scriptType = script.getAttribute('data-type');
      
      let shouldEnable = false;
      if (scriptType === 'analytics' && categories.analytics) {
        shouldEnable = true;
      } else if (scriptType === 'marketing' && categories.marketing) {
        shouldEnable = true;
      } else if (scriptType === 'functionality' && categories.functionality) {
        shouldEnable = true;
      }
      
      script.setAttribute('data-consent', shouldEnable ? 'granted' : 'denied');
      
      // 如果应该启用且脚本尚未加载，则加载它
      if (shouldEnable && !script.src && script.textContent.trim()) {
        eval(script.textContent);
      }
    });
    
    // 删除未授权的Cookie
    this.deleteUnauthorizedCookies(categories);
  }
  
  // 删除非必要的Cookie
  deleteNonEssentialCookies() {
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [name] = cookie.trim().split('=');
      
      // 保留必要Cookie
      if (!this.isEssentialCookie(name)) {
        SecureCodingUtils.secureCookie.deleteCookie(name);
      }
    }
  }
  
  // 删除未授权的Cookie
  deleteUnauthorizedCookies(categories) {
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [name] = cookie.trim().split('=');
      
      // 检查Cookie类型
      const cookieType = this.getCookieType(name);
      
      // 如果Cookie类型未获得授权，则删除它
      if (
        (cookieType === 'analytics' && !categories.analytics) ||
        (cookieType === 'marketing' && !categories.marketing) ||
        (cookieType === 'functionality' && !categories.functionality)
      ) {
        SecureCodingUtils.secureCookie.deleteCookie(name);
      }
    }
  }
  
  // 检查是否是必要Cookie
  isEssentialCookie(name) {
    const essentialCookies = [
      'sessionid',
      'csrf_token',
      this.options.consentCookieName
    ];
    
    return essentialCookies.some(essential => 
      name.toLowerCase().includes(essential.toLowerCase())
    );
  }
  
  // 获取Cookie类型
  getCookieType(name) {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('analytics') || lowerName.includes('ga') || lowerName.includes('utm')) {
      return 'analytics';
    } else if (lowerName.includes('ad') || lowerName.includes('marketing')) {
      return 'marketing';
    } else if (lowerName.includes('pref') || lowerName.includes('func')) {
      return 'functionality';
    } else if (this.isEssentialCookie(name)) {
      return 'necessary';
    }
    
    return 'unknown';
  }
  
  // 获取当前同意状态
  getCurrentConsent() {
    if (!this.consentGiven) {
      return null;
    }
    
    const consentCookie = SecureCodingUtils.secureCookie.getCookie(this.options.consentCookieName);
    
    if (!consentCookie) {
      return null;
    }
    
    try {
      return JSON.parse(decodeURIComponent(consentCookie));
    } catch (error) {
      console.error('Error parsing consent cookie:', error);
      return null;
    }
  }
  
  // 更新同意设置
  updateConsent(categories) {
    const currentConsent = this.getCurrentConsent();
    
    if (!currentConsent) {
      return;
    }
    
    // 更新同意数据
    const updatedConsent = {
      ...currentConsent,
      categories: {
        ...currentConsent.categories,
        ...categories
      },
      date: new Date().toISOString()
    };
    
    // 保存更新后的同意Cookie
    this.saveConsentCookie(updatedConsent);
    
    // 更新跟踪设置
    this.updateTrackingSettings(updatedConsent.categories);
    
    // 触发同意事件
    this.dispatchConsentEvent('updated', updatedConsent);
  }
  
  // 撤回同意
  withdrawConsent() {
    // 删除同意Cookie
    SecureCodingUtils.secureCookie.deleteCookie(this.options.consentCookieName);
    
    // 更新状态
    this.consentGiven = false;
    
    // 禁用跟踪
    this.disableTracking();
    
    // 删除非必要Cookie
    this.deleteNonEssentialCookies();
    
    // 触发同意事件
    this.dispatchConsentEvent('withdrawn', null);
    
    // 显示同意弹窗
    this.showConsentModal();
  }
}

// 2. 使用示例
document.addEventListener('DOMContentLoaded', () => {
  // 初始化数据保护合规工具
  const dataProtection = new DataProtectionCompliance({
    consentCookieName: 'myapp_consent',
    consentExpirationDays: 180,
    privacyPolicyUrl: '/privacy-policy'
  });
  
  // 监听同意更新事件
  document.addEventListener('consentUpdated', (event) => {
    const { type, data } = event.detail;
    
    console.log('Consent updated:', type, data);
    
    // 根据同意状态执行相应操作
    if (type === 'granted' || type === 'customized') {
      // 启用个性化功能
      enablePersonalization();
    } else if (type === 'denied' || type === 'withdrawn') {
      // 禁用个性化功能
      disablePersonalization();
    }
  });
  
  // 设置同意管理按钮
  const consentButton = document.getElementById('manage-consent');
  if (consentButton) {
    consentButton.addEventListener('click', () => {
      dataProtection.showCustomizeConsent();
    });
  }
  
  // 启用个性化功能
  function enablePersonalization() {
    // 加载个性化内容
    loadPersonalizedContent();
    
    // 启用推荐系统
    enableRecommendationSystem();
  }
  
  // 禁用个性化功能
  function disablePersonalization() {
    // 移除个性化内容
    removePersonalizedContent();
    
    // 禁用推荐系统
    disableRecommendationSystem();
  }
});
\`\`\`

## 综合安全架构设计

### 前端安全框架

\`\`\`javascript
// 1. 前端安全框架
class FrontendSecurityFramework {
  constructor(options = {}) {
    this.options = {
      enableXSSProtection: true,
      enableCSRFProtection: true,
      enableClickjackingProtection: true,
      enableContentSecurityPolicy: true,
      enableInputValidation: true,
      enableSecureStorage: true,
      enableSecurityMonitoring: true,
      enableDataProtection: true,
      ...options
    };
    
    this.components = {};
    this.init();
  }
  
  // 初始化安全框架
  init() {
    console.log('Initializing Frontend Security Framework...');
    
    // 初始化XSS防护
    if (this.options.enableXSSProtection) {
      this.components.xssProtection = new XSSProtection();
      this.components.xssProtection.init();
    }
    
    // 初始化CSRF防护
    if (this.options.enableCSRFProtection) {
      this.components.csrfProtection = new CSRFProtection();
      this.components.csrfProtection.init();
    }
    
    // 初始化点击劫持防护
    if (this.options.enableClickjackingProtection) {
      this.components.clickjackingProtection = new ClickjackingProtection();
      this.components.clickjackingProtection.init();
    }
    
    // 初始化内容安全策略
    if (this.options.enableContentSecurityPolicy) {
      this.components.contentSecurityPolicy = new ContentSecurityPolicy();
      this.components.contentSecurityPolicy.init();
    }
    
    // 初始化输入验证
    if (this.options.enableInputValidation) {
      this.components.inputValidation = new InputValidation();
      this.components.inputValidation.init();
    }
    
    // 初始化安全存储
    if (this.options.enableSecureStorage) {
      this.components.secureStorage = new SecureStorageManager();
      this.components.secureStorage.init();
    }
    
    // 初始化安全监控
    if (this.options.enableSecurityMonitoring) {
      this.components.securityMonitoring = new SecurityMonitoringSystem();
      this.components.securityMonitoring.init();
    }
    
    // 初始化数据保护
    if (this.options.enableDataProtection) {
      this.components.dataProtection = new DataProtectionCompliance();
    }
    
    console.log('Frontend Security Framework initialized successfully');
  }
  
  // 获取安全框架状态
  getStatus() {
    const status = {
      initialized: true,
      components: {}
    };
    
    for (const [name, component] of Object.entries(this.components)) {
      status.components[name] = {
        enabled: !!component,
        status: component && component.getStatus ? component.getStatus() : 'active'
      };
    }
    
    return status;
  }
  
  // 更新安全配置
  updateConfig(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    // 重新初始化受影响的组件
    this.init();
  }
  
  // 执行安全检查
  async performSecurityCheck() {
    const results = {};
    
    // XSS防护检查
    if (this.components.xssProtection) {
      results.xssProtection = await this.components.xssProtection.check();
    }
    
    // CSRF防护检查
    if (this.components.csrfProtection) {
      results.csrfProtection = await this.components.csrfProtection.check();
    }
    
    // 点击劫持防护检查
    if (this.components.clickjackingProtection) {
      results.clickjackingProtection = await this.components.clickjackingProtection.check();
    }
    
    // 内容安全策略检查
    if (this.components.contentSecurityPolicy) {
      results.contentSecurityPolicy = await this.components.contentSecurityPolicy.check();
    }
    
    // 输入验证检查
    if (this.components.inputValidation) {
      results.inputValidation = await this.components.inputValidation.check();
    }
    
    // 安全存储检查
    if (this.components.secureStorage) {
      results.secureStorage = await this.components.secureStorage.check();
    }
    
    return results;
  }
  
  // 生成安全报告
  async generateSecurityReport() {
    const securityCheck = await this.performSecurityCheck();
    const status = this.getStatus();
    
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      framework: {
        version: '1.0.0',
        status: status
      },
      securityCheck: securityCheck,
      recommendations: this.generateRecommendations(securityCheck)
    };
    
    return report;
  }
  
  // 生成安全建议
  generateRecommendations(securityCheck) {
    const recommendations = [];
    
    // XSS防护建议
    if (securityCheck.xssProtection && securityCheck.xssProtection.vulnerabilities > 0) {
      recommendations.push({
        category: 'XSS Protection',
        priority: 'high',
        description: '检测到XSS漏洞，建议立即修复',
        actions: [
          '对所有用户输入进行严格的验证和清理',
          '使用textContent代替innerHTML',
          '实施内容安全策略(CSP)'
        ]
      });
    }
    
    // CSRF防护建议
    if (securityCheck.csrfProtection && securityCheck.csrfProtection.issues > 0) {
      recommendations.push({
        category: 'CSRF Protection',
        priority: 'high',
        description: '检测到CSRF防护不足，建议加强防护',
        actions: [
          '为所有状态更改操作实施CSRF令牌',
          '设置SameSite Cookie属性',
          '验证Referer和Origin头'
        ]
      });
    }
    
    // 点击劫持防护建议
    if (securityCheck.clickjackingProtection && securityCheck.clickjackingProtection.issues > 0) {
      recommendations.push({
        category: 'Clickjacking Protection',
        priority: 'medium',
        description: '检测到点击劫持防护不足，建议加强防护',
        actions: [
          '设置X-Frame-Options响应头',
          '实施内容安全策略frame-ancestors指令',
          '使用JavaScript frame-busting技术'
        ]
      });
    }
    
    // 内容安全策略建议
    if (securityCheck.contentSecurityPolicy && securityCheck.contentSecurityPolicy.issues > 0) {
      recommendations.push({
        category: 'Content Security Policy',
        priority: 'medium',
        description: '检测到内容安全策略不足，建议加强策略',
        actions: [
          '实施严格的内容安全策略',
          '限制脚本执行源',
          '禁用不安全的内联脚本'
        ]
      });
    }
    
    // 输入验证建议
    if (securityCheck.inputValidation && securityCheck.inputValidation.issues > 0) {
      recommendations.push({
        category: 'Input Validation',
        priority: 'high',
        description: '检测到输入验证不足，建议加强验证',
        actions: [
          '对所有用户输入进行服务器端验证',
          '实施白名单验证策略',
          '使用参数化查询防止SQL注入'
        ]
      });
    }
    
    // 安全存储建议
    if (securityCheck.secureStorage && securityCheck.secureStorage.issues > 0) {
      recommendations.push({
        category: 'Secure Storage',
        priority: 'medium',
        description: '检测到安全存储问题，建议改进存储方式',
        actions: [
          '加密敏感数据后存储',
          '避免在localStorage中存储敏感信息',
          '使用HttpOnly和Secure Cookie'
        ]
      });
    }
    
    return recommendations;
  }
}

// 2. XSS防护组件
class XSSProtection {
  constructor() {
    this.xssPatterns = [
      /<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi,
      /<iframe\\b[^<]*(?:(?!<\\/iframe>)<[^<]*)*<\\/iframe>/gi,
      /javascript:/gi,
      /on\\w+\\s*=/gi
    ];
    
    this.sanitizers = [];
  }
  
  init() {
    // 拦截DOM操作
    this.interceptDOMOperations();
    
    // 拦截事件处理
    this.interceptEventHandlers();
    
    // 添加输入验证
    this.addInputValidation();
  }
  
  // 拦截DOM操作
  interceptDOMOperations() {
    // 保存原始方法
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;
    const originalOuterHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'outerHTML').set;
    
    // 重写innerHTML setter
    Object.defineProperty(Element.prototype, 'innerHTML', {
      set: function(value) {
        // 清理HTML内容
        const cleanValue = this.sanitizeHTML(value);
        originalInnerHTML.call(this, cleanValue);
      }
    });
    
    // 重写outerHTML setter
    Object.defineProperty(Element.prototype, 'outerHTML', {
      set: function(value) {
        // 清理HTML内容
        const cleanValue = this.sanitizeHTML(value);
        originalOuterHTML.call(this, cleanValue);
      }
    });
  }
  
  // 拦截事件处理
  interceptEventHandlers() {
    // 保存原始方法
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    
    // 重写addEventListener
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      // 检查是否是危险事件
      if (this.isDangerousEvent(type)) {
        console.warn(\`Potentially dangerous event listener: \${type}\`);
        
        // 包装监听器以进行额外检查
        const wrappedListener = function(event) {
          // 检查事件处理程序是否安全
          if (this.isSafeEventHandler(listener, event)) {
            return listener.call(this, event);
          } else {
            console.warn('Blocked potentially dangerous event handler');
            event.preventDefault();
            return false;
          }
        }.bind(this);
        
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      
      return originalAddEventListener.call(this, type, listener, options);
    };
  }
  
  // 添加输入验证
  addInputValidation() {
    // 监听输入事件
    document.addEventListener('input', (event) => {
      const element = event.target;
      const value = element.value;
      
      // 检查输入是否包含XSS模式
      if (this.containsXSS(value)) {
        console.warn('XSS attempt detected in input:', element);
        
        // 清理输入
        element.value = this.sanitizeInput(value);
        
        // 记录事件
        if (window.securityFramework && window.securityFramework.components.securityMonitoring) {
          window.securityFramework.components.securityMonitoring.logSecurityEvent(
            'xss_attempt_input', 
            { 
              element: element.tagName + (element.id ? \`#\${element.id}\` : ''),
              value: value 
            }, 
            'high'
          );
        }
      }
    });
  }
  
  // 检查是否包含XSS模式
  containsXSS(str) {
    for (const pattern of this.xssPatterns) {
      if (pattern.test(str)) {
        return true;
      }
    }
    return false;
  }
  
  // 清理HTML内容
  sanitizeHTML(html) {
    // 使用DOMPurify等库进行更严格的HTML清理
    // 这里提供一个简单实现
    const tempDiv = document.createElement('div');
    tempDiv.textContent = html;
    return tempDiv.innerHTML;
  }
  
  // 清理输入
  sanitizeInput(input) {
    return input.replace(/<[^>]*>?/gm, '');
  }
  
  // 检查是否是危险事件
  isDangerousEvent(type) {
    const dangerousEvents = [
      'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur',
      'onchange', 'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress'
    ];
    
    return dangerousEvents.includes(type.toLowerCase());
  }
  
  // 检查事件处理程序是否安全
  isSafeEventHandler(handler, event) {
    // 检查处理程序是否包含危险代码
    const handlerString = handler.toString();
    
    for (const pattern of this.xssPatterns) {
      if (pattern.test(handlerString)) {
        return false;
      }
    }
    
    return true;
  }
  
  // 检查XSS防护状态
  async check() {
    const results = {
      vulnerabilities: 0,
      issues: [],
      details: {}
    };
    
    // 检查表单输入
    const inputs = document.querySelectorAll('input[type="text"], input[type="search"], textarea');
    
    for (const input of inputs) {
      const value = input.value;
      
      if (this.containsXSS(value)) {
        results.vulnerabilities++;
        results.issues.push({
          element: input.tagName + (input.id ? \`#\${input.id}\` : ''),
          issue: 'Input contains XSS patterns'
        });
      }
    }
    
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    for (const [key, value] of urlParams.entries()) {
      if (this.containsXSS(value)) {
        results.vulnerabilities++;
        results.issues.push({
          element: \`URL parameter: \${key}\`,
          issue: 'URL parameter contains XSS patterns'
        });
      }
    }
    
    // 检查页面内容
    const pageContent = document.documentElement.outerHTML;
    if (this.containsXSS(pageContent)) {
      results.vulnerabilities++;
      results.issues.push({
        element: 'Page content',
        issue: 'Page content contains XSS patterns'
      });
    }
    
    return results;
  }
  
  getStatus() {
    return 'active';
  }
}

// 3. CSRF防护组件
class CSRFProtection {
  constructor() {
    this.token = null;
    this.tokenName = 'csrf-token';
  }
  
  init() {
    // 获取CSRF令牌
    this.fetchCSRFToken();
    
    // 拦截网络请求
    this.interceptNetworkRequests();
    
    // 添加CSRF令牌到表单
    this.addCSRFTokenToForms();
  }
  
  // 获取CSRF令牌
  async fetchCSRFToken() {
    // 从meta标签获取
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      this.token = metaTag.getAttribute('content');
      return;
    }
    
    // 从Cookie获取
    const cookieToken = SecureCodingUtils.secureCookie.getCookie('csrf_token');
    if (cookieToken) {
      this.token = cookieToken;
      return;
    }
    
    // 从服务器获取
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'same-origin'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.token = data.token;
        
        // 保存到Cookie
        SecureCodingUtils.secureCookie.setCookie('csrf_token', this.token, {
          secure: true,
          sameSite: 'strict'
        });
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
    }
  }
  
  // 拦截网络请求
  interceptNetworkRequests() {
    // 拦截fetch请求
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0];
      const options = args[1] || {};
      
      // 检查是否需要CSRF保护
      if (this.requiresCSRFProtection(url, options)) {
        // 添加CSRF令牌
        options.headers = options.headers || {};
        options.headers['X-CSRF-Token'] = this.token;
      }
      
      // 调用原始fetch
      return originalFetch(...args);
    };
    
    // 拦截XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      this._method = method;
      this._url = url;
      return originalXHROpen.call(this, method, url, async, user, password);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
      // 检查是否需要CSRF保护
      if (window.securityFramework && 
          window.securityFramework.components.csrfProtection &&
          window.securityFramework.components.csrfProtection.requiresCSRFProtection(
            this._url, 
            { method: this._method }
          )) {
        // 添加CSRF令牌
        this.setRequestHeader('X-CSRF-Token', window.securityFramework.components.csrfProtection.token);
      }
      
      return originalXHRSend.call(this, data);
    };
  }
  
  // 检查是否需要CSRF保护
  requiresCSRFProtection(url, options) {
    const method = options.method ? options.method.toUpperCase() : 'GET';
    
    // 只对状态更改方法进行CSRF保护
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return false;
    }
    
    // 检查是否是同源请求
    const requestUrl = typeof url === 'string' ? new URL(url, window.location.origin) : url;
    
    if (requestUrl.origin !== window.location.origin) {
      return true; // 跨域请求需要CSRF保护
    }
    
    return true; // 同源状态更改请求也需要CSRF保护
  }
  
  // 添加CSRF令牌到表单
  addCSRFTokenToForms() {
    const forms = document.querySelectorAll('form');
    
    for (const form of forms) {
      // 检查表单是否已有CSRF令牌
      const existingToken = form.querySelector(\`input[name="\${this.tokenName}"]\`);
      
      if (!existingToken) {
        // 创建CSRF令牌输入
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = this.tokenName;
        tokenInput.value = this.token;
        
        // 添加到表单
        form.appendChild(tokenInput);
      }
    }
  }
  
  // 检查CSRF防护状态
  async check() {
    const results = {
      issues: 0,
      details: []
    };
    
    // 检查是否有CSRF令牌
    if (!this.token) {
      results.issues++;
      results.details.push({
        issue: 'Missing CSRF token'
      });
    }
    
    // 检查表单是否有CSRF令牌
    const forms = document.querySelectorAll('form');
    
    for (const form of forms) {
      const method = form.method ? form.method.toLowerCase() : 'get';
      
      if (['post', 'put', 'delete', 'patch'].includes(method)) {
        const tokenInput = form.querySelector(\`input[name="\${this.tokenName}"]\`);
        
        if (!tokenInput) {
          results.issues++;
          results.details.push({
            element: 'form' + (form.id ? \`#\${form.id}\` : ''),
            issue: 'Form missing CSRF token'
          });
        } else if (!tokenInput.value) {
          results.issues++;
          results.details.push({
            element: 'form' + (form.id ? \`#\${form.id}\` : ''),
            issue: 'Form has empty CSRF token'
          });
        }
      }
    }
    
    return results;
  }
  
  getStatus() {
    return this.token ? 'active' : 'inactive';
  }
}

// 4. 点击劫持防护组件
class ClickjackingProtection {
  constructor() {
    this.frameBustingScript = \`
      if (self !== top) {
        top.location = self.location;
      }
    \`;
  }
  
  init() {
    // 添加frame-busting脚本
    this.addFrameBustingScript();
    
    // 添加样式防护
    this.addStyleProtection();
  }
  
  // 添加frame-busting脚本
  addFrameBustingScript() {
    // 检查是否已有frame-busting脚本
    const existingScript = document.querySelector('script[data-clickjacking-protection]');
    
    if (!existingScript) {
      // 创建frame-busting脚本
      const script = document.createElement('script');
      script.setAttribute('data-clickjacking-protection', 'true');
      script.textContent = this.frameBustingScript;
      
      // 添加到页面头部
      document.head.appendChild(script);
    }
  }
  
  // 添加样式防护
  addStyleProtection() {
    // 检查是否已有防护样式
    const existingStyle = document.querySelector('style[data-clickjacking-protection]');
    
    if (!existingStyle) {
      // 创建防护样式
      const style = document.createElement('style');
      style.setAttribute('data-clickjacking-protection', 'true');
      style.textContent = \`
        body {
          display: none !important;
        }
        
        html {
          display: block !important;
        }
        
        html:not(:target) {
          display: none !important;
        }
        
        html:target {
          display: block !important;
        }
      \`;
      
      // 添加到页面头部
      document.head.appendChild(style);
      
      // 显示body（防止样式影响正常显示）
      setTimeout(() => {
        document.body.style.display = 'block';
      }, 100);
    }
  }
  
  // 检查点击劫持防护状态
  async check() {
    const results = {
      issues: 0,
      details: []
    };
    
    // 检查是否有frame-busting脚本
    const frameBustingScript = document.querySelector('script[data-clickjacking-protection]');
    
    if (!frameBustingScript) {
      results.issues++;
      results.details.push({
        issue: 'Missing frame-busting script'
      });
    }
    
    // 检查是否有防护样式
    const protectionStyle = document.querySelector('style[data-clickjacking-protection]');
    
    if (!protectionStyle) {
      results.issues++;
      results.details.push({
        issue: 'Missing clickjacking protection styles'
      });
    }
    
    // 检查是否在iframe中
    if (self !== top) {
      results.issues++;
      results.details.push({
        issue: 'Page loaded in iframe (potential clickjacking)'
      });
    }
    
    return results;
  }
  
  getStatus() {
    return 'active';
  }
}

// 5. 内容安全策略组件
class ContentSecurityPolicy {
  constructor() {
    this.defaultPolicy = {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'frame-src': ["'none'"],
      'frame-ancestors': ["'none'"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'manifest-src': ["'self'"]
    };
    
    this.policy = { ...this.defaultPolicy };
  }
  
  init() {
    // 检查当前CSP
    this.checkCurrentCSP();
    
    // 添加CSP违规报告
    this.addCSPViolationReporting();
  }
  
  // 检查当前CSP
  checkCurrentCSP() {
    // 获取当前页面的CSP
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (cspMeta) {
      const cspContent = cspMeta.getAttribute('content');
      this.parseCSP(cspContent);
    }
  }
  
  // 解析CSP
  parseCSP(cspString) {
    const directives = cspString.split(';');
    
    for (const directive of directives) {
      const [name, ...values] = directive.trim().split(' ');
      
      if (name && values.length > 0) {
        this.policy[name] = values;
      }
    }
  }
  
  // 添加CSP违规报告
  addCSPViolationReporting() {
    // 监听CSP违规事件
    document.addEventListener('securitypolicyviolation', (event) => {
      console.warn('CSP Violation:', {
        blockedURI: event.blockedURI,
        documentURI: event.documentURI,
        referrer: event.referrer,
        violatedDirective: event.violatedDirective,
        effectiveDirective: event.effectiveDirective,
        originalPolicy: event.originalPolicy,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber
      });
      
      // 记录安全事件
      if (window.securityFramework && window.securityFramework.components.securityMonitoring) {
        window.securityFramework.components.securityMonitoring.logSecurityEvent(
          'csp_violation', 
          {
            blockedURI: event.blockedURI,
            violatedDirective: event.violatedDirective,
            sourceFile: event.sourceFile
          }, 
          'medium'
        );
      }
    });
  }
  
  // 更新CSP
  updateCSP(newPolicy) {
    this.policy = { ...this.policy, ...newPolicy };
    
    // 生成CSP字符串
    const cspString = this.generateCSPString();
    
    // 更新meta标签
    let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (!cspMeta) {
      cspMeta = document.createElement('meta');
      cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
      document.head.appendChild(cspMeta);
    }
    
    cspMeta.setAttribute('content', cspString);
  }
  
  // 生成CSP字符串
  generateCSPString() {
    const directives = [];
    
    for (const [name, values] of Object.entries(this.policy)) {
      directives.push(\`\${name} \${values.join(' ')}\`);
    }
    
    return directives.join('; ');
  }
  
  // 检查CSP状态
  async check() {
    const results = {
      issues: 0,
      details: []
    };
    
    // 检查是否有CSP
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (!cspMeta) {
      results.issues++;
      results.details.push({
        issue: 'Missing Content Security Policy'
      });
    }
    
    // 检查CSP是否包含frame-ancestors
    if (this.policy['frame-ancestors'] && !this.policy['frame-ancestors'].includes("'none'")) {
      results.issues++;
      results.details.push({
        issue: 'CSP frame-ancestors should be set to \\'none\\' for clickjacking protection'
      });
    }
    
    // 检查CSP是否包含unsafe-inline
    if (this.policy['script-src'] && this.policy['script-src'].includes("'unsafe-inline'")) {
      results.issues++;
      results.details.push({
        issue: 'CSP script-src should not include \\'unsafe-inline\\''
      });
    }
    
    return results;
  }
  
  getStatus() {
    return 'active';
  }
}

// 6. 输入验证组件
class InputValidation {
  constructor() {
    this.validators = {
      email: (value) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/.test(value),
      url: (value) => {
        try {
          new URL(value);
          return true;
        } catch (error) {
          return false;
        }
      },
      number: (value) => !isNaN(parseFloat(value)) && isFinite(value),
      required: (value) => value.trim() !== '',
      minLength: (value, min) => value.length >= min,
      maxLength: (value, max) => value.length <= max
    };
  }
  
  init() {
    // 添加表单验证
    this.addFormValidation();
  }
  
  // 添加表单验证
  addFormValidation() {
    // 监听表单提交
    document.addEventListener('submit', (event) => {
      const form = event.target;
      
      // 验证表单
      if (!this.validateForm(form)) {
        event.preventDefault();
        return false;
      }
    });
    
    // 监听输入事件
    document.addEventListener('input', (event) => {
      const element = event.target;
      
      // 验证输入
      this.validateInput(element);
    });
  }
  
  // 验证表单
  validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input, textarea, select');
    
    for (const input of inputs) {
      if (!this.validateInput(input)) {
        isValid = false;
      }
    }
    
    return isValid;
  }
  
  // 验证输入
  validateInput(input) {
    // 获取验证规则
    const rules = this.getValidationRules(input);
    
    if (rules.length === 0) {
      return true;
    }
    
    let isValid = true;
    const value = input.value;
    
    for (const rule of rules) {
      const validator = this.validators[rule.type];
      
      if (validator) {
        const result = validator(value, rule.param);
        
        if (!result) {
          isValid = false;
          this.showValidationError(input, rule.message);
          break;
        }
      }
    }
    
    if (isValid) {
      this.clearValidationError(input);
    }
    
    return isValid;
  }
  
  // 获取验证规则
  getValidationRules(input) {
    const rules = [];
    
    // 从data属性获取验证规则
    if (input.dataset.required) {
      rules.push({
        type: 'required',
        message: input.dataset.requiredMessage || '此字段是必填的'
      });
    }
    
    if (input.dataset.type) {
      rules.push({
        type: input.dataset.type,
        message: input.dataset.typeMessage || '请输入有效的' + input.dataset.type
      });
    }
    
    if (input.dataset.minLength) {
      rules.push({
        type: 'minLength',
        param: parseInt(input.dataset.minLength),
        message: input.dataset.minLengthMessage || \`最少需要\${input.dataset.minLength}个字符\`
      });
    }
    
    if (input.dataset.maxLength) {
      rules.push({
        type: 'maxLength',
        param: parseInt(input.dataset.maxLength),
        message: input.dataset.maxLengthMessage || \`最多允许\${input.dataset.maxLength}个字符\`
      });
    }
    
    return rules;
  }
  
  // 显示验证错误
  showValidationError(input, message) {
    // 移除现有错误
    this.clearValidationError(input);
    
    // 添加错误样式
    input.classList.add('validation-error');
    
    // 创建错误消息
    const errorElement = document.createElement('div');
    errorElement.className = 'validation-error-message';
    errorElement.textContent = message;
    
    // 添加到输入元素后面
    input.parentNode.insertBefore(errorElement, input.nextSibling);
  }
  
  // 清除验证错误
  clearValidationError(input) {
    // 移除错误样式
    input.classList.remove('validation-error');
    
    // 移除错误消息
    const errorElement = input.parentNode.querySelector('.validation-error-message');
    if (errorElement) {
      errorElement.remove();
    }
  }
  
  // 检查输入验证状态
  async check() {
    const results = {
      issues: 0,
      details: []
    };
    
    // 检查表单是否有验证
    const forms = document.querySelectorAll('form');
    
    for (const form of forms) {
      const inputs = form.querySelectorAll('input, textarea, select');
      let hasValidation = false;
      
      for (const input of inputs) {
        const rules = this.getValidationRules(input);
        if (rules.length > 0) {
          hasValidation = true;
          break;
        }
      }
      
      if (!hasValidation && inputs.length > 0) {
        results.issues++;
        results.details.push({
          element: 'form' + (form.id ? \`#\${form.id}\` : ''),
          issue: 'Form lacks input validation'
        });
      }
    }
    
    return results;
  }
  
  getStatus() {
    return 'active';
  }
}

// 7. 安全存储管理器
class SecureStorageManager {
  constructor() {
    this.encryptionKey = null;
    this.encryptedKeys = new Set();
  }
  
  init() {
    // 生成加密密钥
    this.generateEncryptionKey();
    
    // 拦截存储操作
    this.interceptStorageOperations();
  }
  
  // 生成加密密钥
  generateEncryptionKey() {
    // 在实际应用中，应该使用更安全的方法生成密钥
    this.encryptionKey = btoa('secure_key_' + Date.now() + '_' + Math.random());
  }
  
  // 拦截存储操作
  interceptStorageOperations() {
    // 保存原始方法
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalGetItem = localStorage.getItem.bind(localStorage);
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);
    
    // 重写localStorage.setItem
    localStorage.setItem = (key, value) => {
      if (this.shouldEncrypt(key)) {
        value = this.encrypt(value);
        this.encryptedKeys.add(key);
      }
      
      return originalSetItem(key, value);
    };
    
    // 重写localStorage.getItem
    localStorage.getItem = (key) => {
      const value = originalGetItem(key);
      
      if (value && this.encryptedKeys.has(key)) {
        return this.decrypt(value);
      }
      
      return value;
    };
    
    // 重写localStorage.removeItem
    localStorage.removeItem = (key) => {
      this.encryptedKeys.delete(key);
      return originalRemoveItem(key);
    };
  }
  
  // 检查是否应该加密
  shouldEncrypt(key) {
    const sensitiveKeys = [
      'token', 'password', 'secret', 'key', 'auth', 'session'
    ];
    
    return sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    );
  }
  
  // 加密数据
  encrypt(data) {
    // 在实际应用中，应该使用更安全的加密方法
    return btoa(data);
  }
  
  // 解密数据
  decrypt(data) {
    // 在实际应用中，应该使用更安全的解密方法
    try {
      return atob(data);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }
  
  // 检查安全存储状态
  async check() {
    const results = {
      issues: 0,
      details: []
    };
    
    // 检查localStorage中的敏感数据
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      
      if (this.shouldEncrypt(key) && !this.encryptedKeys.has(key)) {
        results.issues++;
        results.details.push({
          element: \`localStorage key: \${key}\`,
          issue: 'Sensitive data stored without encryption'
        });
      }
    }
    
    return results;
  }
  
  getStatus() {
    return 'active';
  }
}

// 8. 使用示例
document.addEventListener('DOMContentLoaded', () => {
  // 初始化前端安全框架
  window.securityFramework = new FrontendSecurityFramework({
    enableXSSProtection: true,
    enableCSRFProtection: true,
    enableClickjackingProtection: true,
    enableContentSecurityPolicy: true,
    enableInputValidation: true,
    enableSecureStorage: true,
    enableSecurityMonitoring: true,
    enableDataProtection: true
  });
  
  // 获取安全框架状态
  const status = window.securityFramework.getStatus();
  console.log('Security Framework Status:', status);
  
  // 执行安全检查
  window.securityFramework.performSecurityCheck().then(results => {
    console.log('Security Check Results:', results);
  });
  
  // 生成安全报告
  window.securityFramework.generateSecurityReport().then(report => {
    console.log('Security Report:', report);
  });
});
\`\`\`

## 实际应用案例

### 安全电子商务网站

\`\`\`javascript
// 1. 电子商务网站安全实现
class EcommerceSecurityImplementation {
  constructor() {
    this.securityFramework = new FrontendSecurityFramework({
      enableXSSProtection: true,
      enableCSRFProtection: true,
      enableClickjackingProtection: true,
      enableContentSecurityPolicy: true,
      enableInputValidation: true,
      enableSecureStorage: true,
      enableSecurityMonitoring: true,
      enableDataProtection: true
    });
    
    this.init();
  }
  
  init() {
    // 自定义CSP策略
    this.securityFramework.components.contentSecurityPolicy.updateCSP({
      'script-src': ["'self'", 'trusted-cdn.com'],
      'connect-src': ["'self'", 'api.example.com', 'payment.example.com'],
      'img-src': ["'self'", 'data:', 'cdn.example.com']
    });
    
    // 添加支付安全
    this.setupPaymentSecurity();
    
    // 添加用户账户安全
    this.setupAccountSecurity();
    
    // 添加产品评论安全
    this.setupReviewSecurity();
  }
  
  // 设置支付安全
  setupPaymentSecurity() {
    // 支付表单验证
    const paymentForm = document.getElementById('payment-form');
    
    if (paymentForm) {
      // 添加信用卡验证
      const cardNumberInput = document.getElementById('card-number');
      if (cardNumberInput) {
        cardNumberInput.dataset.type = 'creditcard';
        cardNumberInput.dataset.typeMessage = '请输入有效的信用卡号';
      }
      
      // 添加CVV验证
      const cvvInput = document.getElementById('cvv');
      if (cvvInput) {
        cvvInput.dataset.type = 'cvv';
        cvvInput.dataset.typeMessage = '请输入有效的CVV码';
        cvvInput.dataset.maxLength = '4';
        cvvInput.dataset.maxLengthMessage = 'CVV码最多4位';
      }
      
      // 添加过期日期验证
      const expiryInput = document.getElementById('expiry');
      if (expiryInput) {
        expiryInput.dataset.type = 'expiry';
        expiryInput.dataset.typeMessage = '请输入有效的过期日期 (MM/YY)';
      }
      
      // 添加支付提交安全检查
      paymentForm.addEventListener('submit', (event) => {
        if (!this.validatePaymentForm()) {
          event.preventDefault();
          return false;
        }
        
        // 记录支付尝试
        this.securityFramework.components.securityMonitoring.logSecurityEvent(
          'payment_attempt',
          {
            amount: document.getElementById('amount').value,
            timestamp: new Date().toISOString()
          },
          'high'
        );
      });
    }
  }
  
  // 验证支付表单
  validatePaymentForm() {
    const cardNumber = document.getElementById('card-number').value;
    const cvv = document.getElementById('cvv').value;
    const expiry = document.getElementById('expiry').value;
    
    // 验证信用卡号
    if (!this.validateCreditCard(cardNumber)) {
      alert('请输入有效的信用卡号');
      return false;
    }
    
    // 验证CVV
    if (!this.validateCVV(cvv)) {
      alert('请输入有效的CVV码');
      return false;
    }
    
    // 验证过期日期
    if (!this.validateExpiry(expiry)) {
      alert('请输入有效的过期日期');
      return false;
    }
    
    return true;
  }
  
  // 验证信用卡号
  validateCreditCard(cardNumber) {
    // 移除所有非数字字符
    const cleaned = cardNumber.replace(/\\D/g, '');
    
    // 检查长度
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }
    
    // Luhn算法验证
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }
  
  // 验证CVV
  validateCVV(cvv) {
    // 移除所有非数字字符
    const cleaned = cvv.replace(/\\D/g, '');
    
    // 检查长度
    return cleaned.length >= 3 && cleaned.length <= 4;
  }
  
  // 验证过期日期
  validateExpiry(expiry) {
    // 检查格式 MM/YY
    const match = expiry.match(/^(\\d{2})\\/(\\d{2})$/);
    
    if (!match) {
      return false;
    }
    
    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10) + 2000;
    
    // 检查月份
    if (month < 1 || month > 12) {
      return false;
    }
    
    // 检查是否过期
    const now = new Date();
    const expiryDate = new Date(year, month - 1, 1);
    
    if (expiryDate < now) {
      return false;
    }
    
    return true;
  }
  
  // 设置用户账户安全
  setupAccountSecurity() {
    // 登录表单安全
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
      loginForm.addEventListener('submit', (event) => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // 记录登录尝试
        this.securityFramework.components.securityMonitoring.logSecurityEvent(
          'login_attempt',
          {
            username: username,
            timestamp: new Date().toISOString()
          },
          'medium'
        );
        
        // 检查暴力破解
        this.checkBruteForce(username);
      });
    }
    
    // 注册表单安全
    const registerForm = document.getElementById('register-form');
    
    if (registerForm) {
      // 添加密码强度验证
      const passwordInput = document.getElementById('password');
      if (passwordInput) {
        passwordInput.addEventListener('input', (event) => {
          const password = event.target.value;
          const strength = this.calculatePasswordStrength(password);
          this.updatePasswordStrengthIndicator(strength);
        });
      }
      
      registerForm.addEventListener('submit', (event) => {
        const password = document.getElementById('password').value;
        
        // 检查密码强度
        if (this.calculatePasswordStrength(password) < 3) {
          alert('密码强度不足，请使用更强的密码');
          event.preventDefault();
          return false;
        }
      });
    }
    
    // 密码重置表单安全
    const resetForm = document.getElementById('reset-form');
    
    if (resetForm) {
      resetForm.addEventListener('submit', (event) => {
        const email = document.getElementById('email').value;
        
        // 记录密码重置尝试
        this.securityFramework.components.securityMonitoring.logSecurityEvent(
          'password_reset_attempt',
          {
            email: email,
            timestamp: new Date().toISOString()
          },
          'high'
        );
      });
    }
  }
  
  // 检查暴力破解
  checkBruteForce(username) {
    // 在实际应用中，这应该与服务器端验证结合
    const attempts = this.getLoginAttempts(username);
    
    if (attempts >= 5) {
      // 锁定账户或显示验证码
      this.showCaptcha();
      
      // 记录潜在的暴力破解尝试
      this.securityFramework.components.securityMonitoring.logSecurityEvent(
        'brute_force_attempt',
        {
          username: username,
          attempts: attempts,
          timestamp: new Date().toISOString()
        },
        'high'
      );
    }
  }
  
  // 获取登录尝试次数
  getLoginAttempts(username) {
    const key = \`login_attempts_\${username}\`;
    const attempts = localStorage.getItem(key);
    return attempts ? parseInt(attempts, 10) : 0;
  }
  
  // 增加登录尝试次数
  incrementLoginAttempts(username) {
    const key = \`login_attempts_\${username}\`;
    const attempts = this.getLoginAttempts(username);
    localStorage.setItem(key, (attempts + 1).toString());
    
    // 设置过期时间
    setTimeout(() => {
      localStorage.removeItem(key);
    }, 15 * 60 * 1000); // 15分钟后重置
  }
  
  // 重置登录尝试次数
  resetLoginAttempts(username) {
    const key = \`login_attempts_\${username}\`;
    localStorage.removeItem(key);
  }
  
  // 显示验证码
  showCaptcha() {
    // 在实际应用中，应该使用真正的验证码服务
    const captchaContainer = document.getElementById('captcha-container');
    
    if (captchaContainer) {
      captchaContainer.style.display = 'block';
      
      // 生成简单的验证码
      const captchaText = this.generateCaptchaText();
      const captchaImage = document.getElementById('captcha-image');
      
      if (captchaImage) {
        captchaImage.textContent = captchaText;
        captchaImage.dataset.captcha = captchaText;
      }
    }
  }
  
  // 生成验证码文本
  generateCaptchaText() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let captcha = '';
    
    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return captcha;
  }
  
  // 验证验证码
  validateCaptcha() {
    const captchaInput = document.getElementById('captcha-input');
    const captchaImage = document.getElementById('captcha-image');
    
    if (!captchaInput || !captchaImage) {
      return false;
    }
    
    return captchaInput.value === captchaImage.dataset.captcha;
  }
  
  // 计算密码强度
  calculatePasswordStrength(password) {
    let strength = 0;
    
    // 长度检查
    if (password.length >= 8) {
      strength += 1;
    }
    
    if (password.length >= 12) {
      strength += 1;
    }
    
    // 字符类型检查
    if (/[a-z]/.test(password)) {
      strength += 1;
    }
    
    if (/[A-Z]/.test(password)) {
      strength += 1;
    }
    
    if (/[0-9]/.test(password)) {
      strength += 1;
    }
    
    if (/[^a-zA-Z0-9]/.test(password)) {
      strength += 1;
    }
    
    // 常见密码检查
    if (!this.isCommonPassword(password)) {
      strength += 1;
    }
    
    return Math.min(strength, 5);
  }
  
  // 检查是否是常见密码
  isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }
  
  // 更新密码强度指示器
  updatePasswordStrengthIndicator(strength) {
    const indicator = document.getElementById('password-strength');
    
    if (!indicator) {
      return;
    }
    
    // 清除所有类
    indicator.className = 'password-strength';
    
    // 添加强度类
    if (strength <= 2) {
      indicator.classList.add('weak');
      indicator.textContent = '弱';
    } else if (strength <= 3) {
      indicator.classList.add('medium');
      indicator.textContent = '中';
    } else {
      indicator.classList.add('strong');
      indicator.textContent = '强';
    }
  }
  
  // 设置产品评论安全
  setupReviewSecurity() {
    // 评论表单
    const reviewForm = document.getElementById('review-form');
    
    if (reviewForm) {
      reviewForm.addEventListener('submit', (event) => {
        const reviewText = document.getElementById('review-text').value;
        const rating = document.getElementById('rating').value;
        
        // 检查评论内容
        if (this.containsSpam(reviewText)) {
          alert('评论内容疑似垃圾信息，请修改后重试');
          event.preventDefault();
          return false;
        }
        
        // 记录评论提交
        this.securityFramework.components.securityMonitoring.logSecurityEvent(
          'review_submission',
          {
            rating: rating,
            textLength: reviewText.length,
            timestamp: new Date().toISOString()
          },
          'low'
        );
      });
    }
  }
  
  // 检查是否包含垃圾信息
  containsSpam(text) {
    const spamKeywords = [
      'buy now', 'click here', 'free money', 'guarantee', 'limited offer',
      'act now', 'special promotion', 'exclusive deal', 'winner', 'congratulations'
    ];
    
    const lowerText = text.toLowerCase();
    
    return spamKeywords.some(keyword => lowerText.includes(keyword));
  }
}

// 2. 使用示例
document.addEventListener('DOMContentLoaded', () => {
  // 初始化电子商务安全实现
  const ecommerceSecurity = new EcommerceSecurityImplementation();
  
  // 监听安全事件
  document.addEventListener('securityEvent', (event) => {
    const securityEvent = event.detail;
    
    // 根据事件类型采取行动
    switch (securityEvent.type) {
      case 'brute_force_attempt':
        // 显示警告
        alert('检测到多次登录失败，请稍后再试或联系客服');
        break;
        
      case 'payment_attempt':
        // 记录支付尝试
        console.log('Payment attempt recorded:', securityEvent.data);
        break;
        
      case 'review_submission':
        // 记录评论提交
        console.log('Review submitted:', securityEvent.data);
        break;
    }
  });
});
\`\`\`

## 总结

前端安全是一个多层次、全方位的系统工程，需要从编码规范、安全测试、监控响应、合规性和架构设计等多个维度进行综合考虑。本文介绍了前端安全的最佳实践和综合防护策略，包括安全编码规范、安全测试方法、安全监控与响应、数据保护合规以及综合安全架构设计。

在实际应用中，我们应该根据具体场景和需求，选择合适的安全措施，并构建一个全面、灵活、可扩展的安全防护体系。同时，安全是一个持续的过程，需要不断更新和完善，以应对不断演变的安全威胁。

通过实施这些最佳实践，我们可以大大提高前端应用的安全性，保护用户数据和隐私，增强用户信任，并降低安全风险带来的潜在损失。记住，安全不是一次性的任务，而是一个需要持续关注和改进的过程。`;export{n as default};
//# sourceMappingURL=26-Co6R9knX.js.map
