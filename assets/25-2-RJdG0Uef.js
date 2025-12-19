const n=`---
title: "前端数据加密与传输安全（二）：HTTPS传输安全与实际应用案例"
excerpt: "本文深入探讨HTTPS传输安全、前端安全存储方案以及实际应用案例，包括安全表单提交和安全文件上传的实现"
coverImage: "/assets/blog/hello-world/cover.jpg"
date: "2025-11-12"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

## 前言

在上一篇文章中，我们介绍了前端数据加密的基础知识，包括对称加密、非对称加密、哈希算法与数字签名。本文将继续探讨HTTPS传输安全、前端安全存储方案以及实际应用案例，帮助您构建更安全的前端应用。

## HTTPS传输安全

### HTTPS基础与实现

HTTPS（HyperText Transfer Protocol Secure）是HTTP的安全版本，通过SSL/TLS协议加密传输数据，防止数据在传输过程中被窃听或篡改。

\`\`\`javascript
// 1. HTTPS安全检查
class HTTPSSecurityChecker {
  constructor() {
    this.secureProtocols = ['https:', 'wss:'];
    this.insecureProtocols = ['http:', 'ws:'];
  }
  
  // 检查当前页面是否使用HTTPS
  isCurrentPageSecure() {
    return window.location.protocol === 'https:';
  }
  
  // 检查URL是否使用安全协议
  isUrlSecure(url) {
    try {
      const urlObj = new URL(url);
      return this.secureProtocols.includes(urlObj.protocol);
    } catch (error) {
      console.error('Invalid URL:', error);
      return false;
    }
  }
  
  // 获取当前页面的安全信息
  getCurrentPageSecurityInfo() {
    return {
      protocol: window.location.protocol,
      isSecure: this.isCurrentPageSecure(),
      hostname: window.location.hostname,
      port: window.location.port
    };
  }
  
  // 检查页面中的不安全资源
  checkInsecureResources() {
    const resources = [];
    
    // 检查所有链接
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !this.isUrlSecure(href)) {
        resources.push({
          type: 'link',
          element: link,
          url: href,
          text: link.textContent
        });
      }
    });
    
    // 检查所有脚本
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && !this.isUrlSecure(src)) {
        resources.push({
          type: 'script',
          element: script,
          url: src
        });
      }
    });
    
    // 检查所有样式表
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"][href]');
    stylesheets.forEach(stylesheet => {
      const href = stylesheet.getAttribute('href');
      if (href && !this.isUrlSecure(href)) {
        resources.push({
          type: 'stylesheet',
          element: stylesheet,
          url: href
        });
      }
    });
    
    // 检查所有图片
    const images = document.querySelectorAll('img[src]');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && !this.isUrlSecure(src)) {
        resources.push({
          type: 'image',
          element: img,
          url: src,
          alt: img.alt
        });
      }
    });
    
    return resources;
  }
  
  // 修复不安全资源
  fixInsecureResources() {
    const insecureResources = this.checkInsecureResources();
    
    insecureResources.forEach(resource => {
      const secureUrl = resource.url.replace(/^http:/, 'https:');
      
      switch (resource.type) {
        case 'link':
          resource.element.setAttribute('href', secureUrl);
          break;
        case 'script':
          resource.element.setAttribute('src', secureUrl);
          break;
        case 'stylesheet':
          resource.element.setAttribute('href', secureUrl);
          break;
        case 'image':
          resource.element.setAttribute('src', secureUrl);
          break;
      }
    });
    
    return insecureResources.length;
  }
  
  // 使用示例
  example() {
    console.log('Current page security info:', this.getCurrentPageSecurityInfo());
    
    const insecureResources = this.checkInsecureResources();
    console.log('Insecure resources:', insecureResources);
    
    if (insecureResources.length > 0) {
      const fixedCount = this.fixInsecureResources();
      console.log(\`Fixed \${fixedCount} insecure resources\`);
    }
  }
}

// 2. 证书验证
class CertificateVerifier {
  constructor() {
    this.trustedCAs = [
      // 受信任的证书颁发机构列表
      // 实际应用中应使用完整的CA列表
    ];
  }
  
  // 获取当前页面的证书信息
  async getCurrentPageCertificateInfo() {
    try {
      // 使用Web Crypto API获取证书信息
      // 注意：浏览器API可能不直接提供证书信息
      // 这里提供一个概念性实现
      
      // 检查是否是HTTPS连接
      if (window.location.protocol !== 'https:') {
        return {
          error: 'Not a secure HTTPS connection'
        };
      }
      
      // 在实际应用中，可能需要使用扩展或服务端API获取证书信息
      return {
        subject: window.location.hostname,
        issuer: 'Unknown', // 需要API支持
        validFrom: 'Unknown', // 需要API支持
        validTo: 'Unknown', // 需要API支持
        fingerprint: 'Unknown' // 需要API支持
      };
    } catch (error) {
      console.error('Error getting certificate info:', error);
      return {
        error: error.message
      };
    }
  }
  
  // 验证证书链
  async verifyCertificateChain(certificate) {
    try {
      // 在实际应用中，这里会实现证书链验证逻辑
      // 包括检查证书是否由受信任的CA签发
      // 检查证书是否过期
      // 检查证书是否被撤销
      
      // 这是一个概念性实现
      return {
        isValid: true,
        errors: []
      };
    } catch (error) {
      console.error('Error verifying certificate chain:', error);
      return {
        isValid: false,
        errors: [error.message]
      };
    }
  }
  
  // 检查证书是否过期
  isCertificateExpired(validTo) {
    const expiryDate = new Date(validTo);
    const now = new Date();
    return now > expiryDate;
  }
  
  // 检查证书是否尚未生效
  isCertificateNotYetValid(validFrom) {
    const validFromDate = new Date(validFrom);
    const now = new Date();
    return now < validFromDate;
  }
  
  // 使用示例
  async example() {
    const certInfo = await this.getCurrentPageCertificateInfo();
    console.log('Certificate info:', certInfo);
    
    if (certInfo.error) {
      console.error('Certificate error:', certInfo.error);
      return;
    }
    
    const verification = await this.verifyCertificateChain(certInfo);
    console.log('Certificate verification:', verification);
    
    if (certInfo.validTo) {
      const isExpired = this.isCertificateExpired(certInfo.validTo);
      console.log('Certificate is expired:', isExpired);
    }
    
    if (certInfo.validFrom) {
      const isNotYetValid = this.isCertificateNotYetValid(certInfo.validFrom);
      console.log('Certificate is not yet valid:', isNotYetValid);
    }
  }
}

// 3. HSTS (HTTP Strict Transport Security)
class HSTSManager {
  constructor() {
    this.maxAge = 31536000; // 1年
    this.includeSubDomains = true;
    this.preload = false;
  }
  
  // 检查当前页面是否使用HSTS
  isCurrentPageUsingHSTS() {
    // 检查响应头中的Strict-Transport-Security
    // 注意：JavaScript无法直接访问响应头
    // 这里提供一个概念性实现
    
    // 在实际应用中，可能需要使用服务端API或浏览器扩展
    return false;
  }
  
  // 设置HSTS响应头（服务端实现）
  getHSTSHeader() {
    let header = \`max-age=\${this.maxAge}\`;
    
    if (this.includeSubDomains) {
      header += '; includeSubDomains';
    }
    
    if (this.preload) {
      header += '; preload';
    }
    
    return header;
  }
  
  // 检查域名是否在HSTS预加载列表中
  async isInHSTSPreloadList(domain) {
    try {
      // 使用HSTS预加载API
      const response = await fetch(\`https://hstspreload.org/api/v2/status?domain=\${domain}\`);
      const data = await response.json();
      
      return data.status === 'preloaded';
    } catch (error) {
      console.error('Error checking HSTS preload list:', error);
      return false;
    }
  }
  
  // 申请将域名添加到HSTS预加载列表
  async submitToHSTSPreloadList(domain) {
    try {
      // 使用HSTS预加载API
      const response = await fetch('https://hstspreload.org/api/v2/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain: domain,
          include_subdomains: this.includeSubDomains
        })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting to HSTS preload list:', error);
      return { error: error.message };
    }
  }
  
  // 使用示例
  async example() {
    const domain = window.location.hostname;
    
    console.log('Current domain:', domain);
    console.log('HSTS header:', this.getHSTSHeader());
    
    const isPreloaded = await this.isInHSTSPreloadList(domain);
    console.log('Domain is in HSTS preload list:', isPreloaded);
    
    if (!isPreloaded) {
      console.log('Consider submitting domain to HSTS preload list');
    }
  }
}
\`\`\`

## 前端安全存储

### 安全存储方案

在前端应用中，我们经常需要存储用户数据，但直接使用localStorage或sessionStorage存储敏感信息是不安全的。下面介绍几种安全存储方案。

\`\`\`javascript
// 1. 安全本地存储
class SecureLocalStorage {
  constructor() {
    this.storageKey = 'secure_storage';
    this.encryptionKey = null;
    this.symmetricEncryption = new SymmetricEncryption();
  }
  
  // 初始化加密密钥
  async initialize() {
    // 从安全存储中获取或生成密钥
    const storedKey = localStorage.getItem('encryption_key');
    
    if (storedKey) {
      // 导入存储的密钥
      this.encryptionKey = await this.symmetricEncryption.importKey(storedKey);
    } else {
      // 生成新密钥
      this.encryptionKey = await this.symmetricEncryption.generateKey();
      
      // 导出并存储密钥
      const exportedKey = await this.symmetricEncryption.exportKey(this.encryptionKey);
      localStorage.setItem('encryption_key', exportedKey);
    }
  }
  
  // 存储数据
  async setItem(key, value) {
    if (!this.encryptionKey) {
      await this.initialize();
    }
    
    // 加密数据
    const encrypted = await this.symmetricEncryption.encrypt(
      JSON.stringify({ key, value }),
      this.encryptionKey
    );
    
    // 获取现有存储
    const storage = this.getStorage();
    
    // 添加或更新数据
    storage[key] = encrypted;
    
    // 存储加密后的数据
    localStorage.setItem(this.storageKey, JSON.stringify(storage));
  }
  
  // 获取数据
  async getItem(key) {
    if (!this.encryptionKey) {
      await this.initialize();
    }
    
    // 获取存储
    const storage = this.getStorage();
    
    // 检查键是否存在
    if (!storage[key]) {
      return null;
    }
    
    try {
      // 解密数据
      const decrypted = await this.symmetricEncryption.decrypt(
        storage[key],
        this.encryptionKey
      );
      
      // 解析并返回值
      const parsed = JSON.parse(decrypted);
      return parsed.value;
    } catch (error) {
      console.error('Error decrypting data:', error);
      return null;
    }
  }
  
  // 删除数据
  removeItem(key) {
    const storage = this.getStorage();
    
    // 删除指定键
    delete storage[key];
    
    // 更新存储
    localStorage.setItem(this.storageKey, JSON.stringify(storage));
  }
  
  // 清空存储
  clear() {
    localStorage.removeItem(this.storageKey);
  }
  
  // 获取存储对象
  getStorage() {
    const storageData = localStorage.getItem(this.storageKey);
    return storageData ? JSON.parse(storageData) : {};
  }
  
  // 获取所有键
  getKeys() {
    const storage = this.getStorage();
    return Object.keys(storage);
  }
  
  // 使用示例
  async example() {
    // 存储数据
    await this.setItem('username', 'john_doe');
    await this.setItem('password', 'secure_password123');
    await this.setItem('token', 'jwt_token_here');
    
    // 获取数据
    const username = await this.getItem('username');
    const password = await this.getItem('password');
    const token = await this.getItem('token');
    
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('Token:', token);
    
    // 获取所有键
    const keys = this.getKeys();
    console.log('All keys:', keys);
    
    // 删除数据
    this.removeItem('token');
    
    // 清空存储
    this.clear();
  }
}

// 2. 安全会话存储
class SecureSessionStorage {
  constructor() {
    this.storageKey = 'secure_session';
    this.encryptionKey = null;
    this.symmetricEncryption = new SymmetricEncryption();
  }
  
  // 初始化加密密钥
  async initialize() {
    // 从会话存储中获取或生成密钥
    const storedKey = sessionStorage.getItem('session_encryption_key');
    
    if (storedKey) {
      // 导入存储的密钥
      this.encryptionKey = await this.symmetricEncryption.importKey(storedKey);
    } else {
      // 生成新密钥
      this.encryptionKey = await this.symmetricEncryption.generateKey();
      
      // 导出并存储密钥
      const exportedKey = await this.symmetricEncryption.exportKey(this.encryptionKey);
      sessionStorage.setItem('session_encryption_key', exportedKey);
    }
  }
  
  // 存储数据
  async setItem(key, value) {
    if (!this.encryptionKey) {
      await this.initialize();
    }
    
    // 加密数据
    const encrypted = await this.symmetricEncryption.encrypt(
      JSON.stringify({ key, value }),
      this.encryptionKey
    );
    
    // 获取现有存储
    const storage = this.getStorage();
    
    // 添加或更新数据
    storage[key] = encrypted;
    
    // 存储加密后的数据
    sessionStorage.setItem(this.storageKey, JSON.stringify(storage));
  }
  
  // 获取数据
  async getItem(key) {
    if (!this.encryptionKey) {
      await this.initialize();
    }
    
    // 获取存储
    const storage = this.getStorage();
    
    // 检查键是否存在
    if (!storage[key]) {
      return null;
    }
    
    try {
      // 解密数据
      const decrypted = await this.symmetricEncryption.decrypt(
        storage[key],
        this.encryptionKey
      );
      
      // 解析并返回值
      const parsed = JSON.parse(decrypted);
      return parsed.value;
    } catch (error) {
      console.error('Error decrypting data:', error);
      return null;
    }
  }
  
  // 删除数据
  removeItem(key) {
    const storage = this.getStorage();
    
    // 删除指定键
    delete storage[key];
    
    // 更新存储
    sessionStorage.setItem(this.storageKey, JSON.stringify(storage));
  }
  
  // 清空存储
  clear() {
    sessionStorage.removeItem(this.storageKey);
    sessionStorage.removeItem('session_encryption_key');
  }
  
  // 获取存储对象
  getStorage() {
    const storageData = sessionStorage.getItem(this.storageKey);
    return storageData ? JSON.parse(storageData) : {};
  }
  
  // 获取所有键
  getKeys() {
    const storage = this.getStorage();
    return Object.keys(storage);
  }
  
  // 使用示例
  async example() {
    // 存储数据
    await this.setItem('session_id', 'session_12345');
    await this.setItem('csrf_token', 'csrf_token_here');
    
    // 获取数据
    const sessionId = await this.getItem('session_id');
    const csrfToken = await this.getItem('csrf_token');
    
    console.log('Session ID:', sessionId);
    console.log('CSRF Token:', csrfToken);
    
    // 获取所有键
    const keys = this.getKeys();
    console.log('All keys:', keys);
    
    // 删除数据
    this.removeItem('csrf_token');
    
    // 清空存储
    this.clear();
  }
}

// 3. 安全Cookie管理
class SecureCookieManager {
  constructor() {
    this.cookies = {};
  }
  
  // 设置安全Cookie
  setCookie(name, value, options = {}) {
    let cookieString = \`\${name}=\${encodeURIComponent(value)}\`;
    
    // 设置过期时间
    if (options.expires) {
      const expires = new Date(options.expires);
      cookieString += \`; expires=\${expires.toUTCString()}\`;
    }
    
    // 设置最大年龄
    if (options.maxAge) {
      cookieString += \`; max-age=\${options.maxAge}\`;
    }
    
    // 设置路径
    if (options.path) {
      cookieString += \`; path=\${options.path}\`;
    }
    
    // 设置域
    if (options.domain) {
      cookieString += \`; domain=\${options.domain}\`;
    }
    
    // 设置安全标志（仅HTTPS）
    if (options.secure !== false && window.location.protocol === 'https:') {
      cookieString += '; secure';
    }
    
    // 设置HttpOnly标志（仅服务端可访问）
    if (options.httpOnly) {
      cookieString += '; httponly';
    }
    
    // 设置SameSite属性
    if (options.sameSite) {
      cookieString += \`; samesite=\${options.sameSite}\`;
    }
    
    // 设置Cookie
    document.cookie = cookieString;
    
    // 更新内部Cookie对象
    this.cookies[name] = value;
  }
  
  // 获取Cookie
  getCookie(name) {
    // 如果内部有缓存，直接返回
    if (this.cookies[name] !== undefined) {
      return this.cookies[name];
    }
    
    // 从document.cookie中解析
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      const [cookieName, cookieValue] = cookie.split('=');
      
      if (cookieName === name) {
        const value = decodeURIComponent(cookieValue);
        this.cookies[name] = value;
        return value;
      }
    }
    
    return null;
  }
  
  // 删除Cookie
  deleteCookie(name, options = {}) {
    // 设置过期时间为过去的时间
    this.setCookie(name, '', {
      ...options,
      expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT')
    });
    
    // 从内部对象中删除
    delete this.cookies[name];
  }
  
  // 获取所有Cookie
  getAllCookies() {
    const cookies = {};
    const cookieStrings = document.cookie.split(';');
    
    for (let i = 0; i < cookieStrings.length; i++) {
      const cookie = cookieStrings[i].trim();
      const [name, value] = cookie.split('=');
      
      if (name) {
        cookies[name] = decodeURIComponent(value || '');
      }
    }
    
    return cookies;
  }
  
  // 设置认证Cookie
  setAuthCookie(token, options = {}) {
    this.setCookie('auth_token', token, {
      // 默认安全选项
      secure: true,
      sameSite: 'strict',
      httpOnly: true, // 注意：JavaScript无法设置HttpOnly，需要服务端设置
      
      // 自定义选项
      ...options
    });
  }
  
  // 获取认证Cookie
  getAuthCookie() {
    return this.getCookie('auth_token');
  }
  
  // 删除认证Cookie
  deleteAuthCookie() {
    this.deleteCookie('auth_token');
  }
  
  // 使用示例
  example() {
    // 设置普通Cookie
    this.setCookie('username', 'john_doe', {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
      path: '/',
      secure: true,
      sameSite: 'strict'
    });
    
    // 设置认证Cookie
    this.setAuthCookie('jwt_token_here', {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1天后过期
      path: '/',
      secure: true,
      sameSite: 'strict'
    });
    
    // 获取Cookie
    const username = this.getCookie('username');
    const authToken = this.getAuthCookie();
    
    console.log('Username:', username);
    console.log('Auth Token:', authToken);
    
    // 获取所有Cookie
    const allCookies = this.getAllCookies();
    console.log('All cookies:', allCookies);
    
    // 删除Cookie
    this.deleteCookie('username');
    this.deleteAuthCookie();
  }
}
\`\`\`

## 实际应用案例

### 安全表单提交

\`\`\`javascript
// 1. 安全表单提交类
class SecureFormSubmission {
  constructor(formId, options = {}) {
    this.form = document.getElementById(formId);
    this.options = {
      encryptFields: ['password', 'ssn', 'credit-card'],
      csrfTokenName: 'csrf_token',
      encryptionEndpoint: '/api/encryption-key',
      submissionEndpoint: '/api/submit',
      ...options
    };
    
    this.encryptionKey = null;
    this.csrfToken = null;
    
    this.init();
  }
  
  // 初始化
  async init() {
    // 获取加密密钥
    await this.getEncryptionKey();
    
    // 获取CSRF令牌
    await this.getCsrfToken();
    
    // 设置表单提交事件
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }
  
  // 获取加密密钥
  async getEncryptionKey() {
    try {
      const response = await fetch(this.options.encryptionEndpoint);
      const data = await response.json();
      
      // 导入加密密钥
      const symmetricEncryption = new SymmetricEncryption();
      this.encryptionKey = await symmetricEncryption.importKey(data.key);
    } catch (error) {
      console.error('Error getting encryption key:', error);
    }
  }
  
  // 获取CSRF令牌
  async getCsrfToken() {
    try {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      this.csrfToken = data.token;
    } catch (error) {
      console.error('Error getting CSRF token:', error);
    }
  }
  
  // 处理表单提交
  async handleSubmit(event) {
    event.preventDefault();
    
    // 收集表单数据
    const formData = new FormData(this.form);
    const data = {};
    
    // 转换FormData为普通对象
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    // 加密敏感字段
    for (const field of this.options.encryptFields) {
      if (data[field]) {
        data[field] = await this.encryptField(data[field]);
      }
    }
    
    // 添加CSRF令牌
    data[this.options.csrfTokenName] = this.csrfToken;
    
    // 提交表单数据
    await this.submitForm(data);
  }
  
  // 加密字段
  async encryptField(value) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }
    
    const symmetricEncryption = new SymmetricEncryption();
    return await symmetricEncryption.encrypt(value, this.encryptionKey);
  }
  
  // 提交表单数据
  async submitForm(data) {
    try {
      const response = await fetch(this.options.submissionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        this.handleSuccess(result);
      } else {
        this.handleError(result);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      this.handleError({ error: error.message });
    }
  }
  
  // 处理成功响应
  handleSuccess(result) {
    if (this.options.onSuccess) {
      this.options.onSuccess(result);
    } else {
      console.log('Form submitted successfully:', result);
      alert('Form submitted successfully!');
    }
  }
  
  // 处理错误响应
  handleError(result) {
    if (this.options.onError) {
      this.options.onError(result);
    } else {
      console.error('Form submission error:', result);
      alert(\`Error: \${result.error || 'Unknown error'}\`);
    }
  }
}

// 2. 使用示例
document.addEventListener('DOMContentLoaded', () => {
  // 初始化安全表单提交
  const secureForm = new SecureFormSubmission('registration-form', {
    encryptFields: ['password', 'confirm-password', 'ssn'],
    onSuccess: (result) => {
      console.log('Registration successful:', result);
      window.location.href = '/dashboard';
    },
    onError: (result) => {
      console.error('Registration error:', result);
      const errorElement = document.getElementById('error-message');
      errorElement.textContent = result.error || 'Registration failed';
      errorElement.style.display = 'block';
    }
  });
});
\`\`\`

### 安全文件上传

\`\`\`javascript
// 1. 安全文件上传类
class SecureFileUploader {
  constructor(options = {}) {
    this.options = {
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      chunkSize: 1024 * 1024, // 1MB
      uploadEndpoint: '/api/upload',
      encryptionEndpoint: '/api/encryption-key',
      ...options
    };
    
    this.encryptionKey = null;
    this.csrfToken = null;
  }
  
  // 初始化
  async init() {
    // 获取加密密钥
    await this.getEncryptionKey();
    
    // 获取CSRF令牌
    await this.getCsrfToken();
  }
  
  // 获取加密密钥
  async getEncryptionKey() {
    try {
      const response = await fetch(this.options.encryptionEndpoint);
      const data = await response.json();
      
      // 导入加密密钥
      const symmetricEncryption = new SymmetricEncryption();
      this.encryptionKey = await symmetricEncryption.importKey(data.key);
    } catch (error) {
      console.error('Error getting encryption key:', error);
    }
  }
  
  // 获取CSRF令牌
  async getCsrfToken() {
    try {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      this.csrfToken = data.token;
    } catch (error) {
      console.error('Error getting CSRF token:', error);
    }
  }
  
  // 验证文件
  validateFile(file) {
    // 检查文件类型
    if (!this.options.allowedTypes.includes(file.type)) {
      throw new Error(\`File type \${file.type} is not allowed\`);
    }
    
    // 检查文件大小
    if (file.size > this.options.maxFileSize) {
      throw new Error(\`File size exceeds maximum allowed size of \${this.options.maxFileSize} bytes\`);
    }
    
    return true;
  }
  
  // 上传文件
  async uploadFile(file, onProgress) {
    // 验证文件
    this.validateFile(file);
    
    try {
      // 读取文件
      const fileBuffer = await this.readFileAsArrayBuffer(file);
      
      // 加密文件
      const encryptedFile = await this.encryptFile(fileBuffer);
      
      // 分块上传
      const result = await this.uploadFileInChunks(encryptedFile, file.name, onProgress);
      
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
  
  // 读取文件为ArrayBuffer
  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }
  
  // 加密文件
  async encryptFile(fileBuffer) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }
    
    const symmetricEncryption = new SymmetricEncryption();
    return await symmetricEncryption.encrypt(fileBuffer, this.encryptionKey);
  }
  
  // 分块上传文件
  async uploadFileInChunks(encryptedFile, fileName, onProgress) {
    const totalChunks = Math.ceil(encryptedFile.data.length / (this.options.chunkSize * 2));
    const fileId = this.generateFileId();
    
    // 上传每个块
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.options.chunkSize * 2;
      const end = Math.min(start + this.options.chunkSize * 2, encryptedFile.data.length);
      const chunkData = encryptedFile.data.substring(start, end);
      
      const chunk = {
        fileId,
        chunkIndex: i,
        totalChunks,
        fileName,
        data: chunkData,
        iv: encryptedFile.iv,
        csrfToken: this.csrfToken
      };
      
      await this.uploadChunk(chunk);
      
      // 报告进度
      if (onProgress) {
        const progress = ((i + 1) / totalChunks) * 100;
        onProgress(progress);
      }
    }
    
    // 通知服务器上传完成
    return await this.completeUpload(fileId, fileName);
  }
  
  // 上传块
  async uploadChunk(chunk) {
    const response = await fetch(\`\${this.options.uploadEndpoint}/chunk\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chunk)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload chunk');
    }
    
    return await response.json();
  }
  
  // 完成上传
  async completeUpload(fileId, fileName) {
    const response = await fetch(\`\${this.options.uploadEndpoint}/complete\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId,
        fileName,
        csrfToken: this.csrfToken
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete upload');
    }
    
    return await response.json();
  }
  
  // 生成文件ID
  generateFileId() {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }
}

// 2. 使用示例
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化文件上传器
  const fileUploader = new SecureFileUploader({
    allowedTypes: ['image/jpeg', 'image/png'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    uploadEndpoint: '/api/secure-upload'
  });
  
  // 初始化
  await fileUploader.init();
  
  // 设置文件选择事件
  const fileInput = document.getElementById('file-input');
  const progressBar = document.getElementById('upload-progress');
  const uploadStatus = document.getElementById('upload-status');
  
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    
    if (!file) return;
    
    try {
      uploadStatus.textContent = 'Uploading...';
      progressBar.style.width = '0%';
      
      // 上传文件
      const result = await fileUploader.uploadFile(file, (progress) => {
        progressBar.style.width = \`\${progress}%\`;
        uploadStatus.textContent = \`Uploading: \${Math.round(progress)}%\`;
      });
      
      uploadStatus.textContent = 'Upload complete!';
      console.log('Upload result:', result);
    } catch (error) {
      uploadStatus.textContent = \`Error: \${error.message}\`;
      console.error('Upload error:', error);
    }
  });
});
\`\`\`

## 总结

前端数据加密与传输安全是构建安全Web应用的关键环节。通过本文的介绍，我们了解了数据加密的基础概念、哈希算法、数字签名、HTTPS传输安全以及安全存储技术。

### 关键安全措施

1. **数据加密**：
   - 对称加密用于大量数据加密
   - 非对称加密用于密钥交换和数字签名
   - 使用Web Crypto API实现加密功能

2. **数据完整性**：
   - 哈希算法验证数据完整性
   - 数字签名确保数据来源和完整性
   - MAC用于消息认证

3. **传输安全**：
   - 使用HTTPS加密传输数据
   - 实施HSTS强制HTTPS连接
   - 验证SSL/TLS证书

4. **安全存储**：
   - 加密敏感数据后存储
   - 使用安全的Cookie设置
   - 避免在客户端存储敏感信息

### 最佳实践

1. **最小权限原则**：只收集和存储必要的用户数据
2. **深度防御**：结合多种安全措施，构建多层次安全体系
3. **定期更新**：保持加密算法和库的最新版本
4. **安全意识**：提高开发者和用户的安全意识

通过实施这些安全措施，我们可以有效保护前端应用中的数据安全，防止数据泄露和篡改，为用户提供更安全的服务体验。记住，数据安全是一个持续的过程，需要不断学习和更新安全策略。`;export{n as default};
//# sourceMappingURL=25-2-RJdG0Uef.js.map
