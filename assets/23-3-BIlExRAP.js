const n=`---
title: "CSRF攻击与防护策略（三）：检测工具与实际应用案例"
excerpt: "在前两篇文章中，我们详细介绍了CSRF攻击的原理、类型以及各种防护策略。本文将重点介绍CSRF检测工具和实际应用案例，帮助开发者在项目中实现全面的CSRF防护。"
coverImage: "/assets/blog/hello-world/cover.jpg"
date: "2025-11-06"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

# CSRF攻击与防护策略（三）：检测工具与实际应用案例

## 前言

在前两篇文章中，我们详细介绍了CSRF攻击的原理、类型以及各种防护策略。本文将重点介绍CSRF检测工具和实际应用案例，帮助开发者在项目中实现全面的CSRF防护。我们将从自动化检测工具、实时监控系统到具体应用场景的实现，提供完整的解决方案和代码示例。

## CSRF检测与防御工具

### 客户端CSRF检测

#### CSRF漏洞扫描器

\`\`\`javascript
// CSRF漏洞扫描器
class CSRFScanner {
  constructor() {
    this.results = [];
    this.vulnerableEndpoints = [];
    this.testedEndpoints = [];
  }

  // 扫描网站CSRF漏洞
  async scanWebsite(baseUrl) {
    console.log(\`开始扫描 \${baseUrl} 的CSRF漏洞...\`);
    
    // 1. 发现所有端点
    const endpoints = await this.discoverEndpoints(baseUrl);
    
    // 2. 测试状态变更端点
    for (const endpoint of endpoints) {
      if (this.isStateChangingEndpoint(endpoint)) {
        await this.testCSRFVulnerability(endpoint);
      }
    }
    
    // 3. 生成报告
    return this.generateReport();
  }

  // 发现网站端点
  async discoverEndpoints(baseUrl) {
    const endpoints = [];
    
    // 从常见路径发现端点
    const commonPaths = [
      '/api/user',
      '/api/profile',
      '/api/settings',
      '/api/password',
      '/api/transfer',
      '/api/payment',
      '/api/delete',
      '/api/update'
    ];
    
    for (const path of commonPaths) {
      const url = \`\${baseUrl}\${path}\`;
      if (await this.checkEndpointExists(url)) {
        endpoints.push({
          url,
          path,
          methods: await this.discoverSupportedMethods(url)
        });
      }
    }
    
    // 从页面表单发现端点
    const formEndpoints = await this.discoverFormEndpoints(baseUrl);
    endpoints.push(...formEndpoints);
    
    return endpoints;
  }

  // 检查端点是否存在
  async checkEndpointExists(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // 发现支持的HTTP方法
  async discoverSupportedMethods(url) {
    const methods = [];
    const testMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    
    for (const method of testMethods) {
      try {
        const response = await fetch(url, { method });
        if (response.status !== 405) { // Method Not Allowed
          methods.push(method);
        }
      } catch (error) {
        // 忽略错误
      }
    }
    
    return methods;
  }

  // 从页面表单发现端点
  async discoverFormEndpoints(baseUrl) {
    const endpoints = [];
    
    try {
      const response = await fetch(baseUrl);
      const html = await response.text();
      
      // 解析HTML中的表单
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const forms = doc.querySelectorAll('form');
      
      forms.forEach(form => {
        const action = form.getAttribute('action');
        const method = (form.getAttribute('method') || 'GET').toUpperCase();
        
        if (action) {
          const fullUrl = action.startsWith('http') ? action : \`\${baseUrl}\${action}\`;
          endpoints.push({
            url: fullUrl,
            path: action,
            methods: [method],
            form: true
          });
        }
      });
    } catch (error) {
      console.error('Error discovering form endpoints:', error);
    }
    
    return endpoints;
  }

  // 判断是否是状态变更端点
  isStateChangingEndpoint(endpoint) {
    const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    return endpoint.methods.some(method => stateChangingMethods.includes(method));
  }

  // 测试CSRF漏洞
  async testCSRFVulnerability(endpoint) {
    console.log(\`测试端点: \${endpoint.url}\`);
    
    this.testedEndpoints.push(endpoint);
    
    // 为每个支持的方法测试
    for (const method of endpoint.methods) {
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        await this.testCSRFForMethod(endpoint, method);
      }
    }
  }

  // 测试特定方法的CSRF漏洞
  async testCSRFForMethod(endpoint, method) {
    try {
      // 1. 测试不带任何防护的请求
      const result1 = await this.testUnprotectedRequest(endpoint, method);
      
      // 2. 测试带Referer的请求
      const result2 = await this.testRefererRequest(endpoint, method);
      
      // 3. 测试带Origin的请求
      const result3 = await this.testOriginRequest(endpoint, method);
      
      // 4. 测试带CSRF令牌的请求
      const result4 = await this.testCSRFTokenRequest(endpoint, method);
      
      // 分析结果
      const vulnerability = this.analyzeResults(endpoint, method, [
        result1, result2, result3, result4
      ]);
      
      if (vulnerability) {
        this.vulnerableEndpoints.push(vulnerability);
      }
    } catch (error) {
      console.error(\`Error testing \${endpoint.url} with method \${method}:\`, error);
    }
  }

  // 测试不带防护的请求
  async testUnprotectedRequest(endpoint, method) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'csrf' })
      };
      
      const response = await fetch(endpoint.url, options);
      
      return {
        test: 'unprotected',
        status: response.status,
        success: response.ok || response.status !== 403
      };
    } catch (error) {
      return {
        test: 'unprotected',
        status: 0,
        success: false,
        error: error.message
      };
    }
  }

  // 测试带Referer的请求
  async testRefererRequest(endpoint, method) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://malicious-site.com/attack.html'
        },
        body: JSON.stringify({ test: 'csrf' })
      };
      
      const response = await fetch(endpoint.url, options);
      
      return {
        test: 'referer',
        status: response.status,
        success: response.ok || response.status !== 403
      };
    } catch (error) {
      return {
        test: 'referer',
        status: 0,
        success: false,
        error: error.message
      };
    }
  }

  // 测试带Origin的请求
  async testOriginRequest(endpoint, method) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://malicious-site.com'
        },
        body: JSON.stringify({ test: 'csrf' })
      };
      
      const response = await fetch(endpoint.url, options);
      
      return {
        test: 'origin',
        status: response.status,
        success: response.ok || response.status !== 403
      };
    } catch (error) {
      return {
        test: 'origin',
        status: 0,
        success: false,
        error: error.message
      };
    }
  }

  // 测试带CSRF令牌的请求
  async testCSRFTokenRequest(endpoint, method) {
    try {
      // 先获取页面以提取CSRF令牌
      const pageResponse = await fetch(endpoint.url);
      const html = await pageResponse.text();
      
      // 尝试提取CSRF令牌
      const tokenMatch = html.match(/name=["']_csrf["']\\s+value=["']([^"']+)["']/);
      const token = tokenMatch ? tokenMatch[1] : 'invalid-token';
      
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          test: 'csrf',
          _csrf: token
        })
      };
      
      const response = await fetch(endpoint.url, options);
      
      return {
        test: 'csrf-token',
        status: response.status,
        success: response.ok || response.status !== 403,
        hasToken: !!tokenMatch
      };
    } catch (error) {
      return {
        test: 'csrf-token',
        status: 0,
        success: false,
        error: error.message
      };
    }
  }

  // 分析测试结果
  analyzeResults(endpoint, method, results) {
    const unprotectedResult = results.find(r => r.test === 'unprotected');
    const refererResult = results.find(r => r.test === 'referer');
    const originResult = results.find(r => r.test === 'origin');
    const tokenResult = results.find(r => r.test === 'csrf-token');
    
    // 如果无防护请求成功，则存在CSRF漏洞
    if (unprotectedResult.success) {
      let protectionLevel = 'none';
      
      // 检查Referer验证
      if (!refererResult.success) {
        protectionLevel = 'referer';
      }
      
      // 检查Origin验证
      if (!originResult.success) {
        protectionLevel = 'origin';
      }
      
      // 检查CSRF令牌
      if (!tokenResult.success && tokenResult.hasToken) {
        protectionLevel = 'token';
      }
      
      return {
        endpoint: endpoint.url,
        method,
        vulnerability: 'CSRF',
        protectionLevel,
        risk: this.calculateRisk(endpoint, method, protectionLevel),
        details: results
      };
    }
    
    return null;
  }

  // 计算风险级别
  calculateRisk(endpoint, method, protectionLevel) {
    // 基础风险分数
    let riskScore = 0;
    
    // 根据端点路径评估风险
    const highRiskPaths = ['/api/transfer', '/api/payment', '/api/delete', '/api/admin'];
    const mediumRiskPaths = ['/api/update', '/api/settings', '/api/profile'];
    
    if (highRiskPaths.some(path => endpoint.path.includes(path))) {
      riskScore += 70;
    } else if (mediumRiskPaths.some(path => endpoint.path.includes(path))) {
      riskScore += 40;
    } else {
      riskScore += 20;
    }
    
    // 根据HTTP方法评估风险
    if (method === 'DELETE') {
      riskScore += 20;
    } else if (['PUT', 'PATCH'].includes(method)) {
      riskScore += 10;
    }
    
    // 根据防护级别调整风险
    if (protectionLevel === 'none') {
      // 无调整
    } else if (protectionLevel === 'referer' || protectionLevel === 'origin') {
      riskScore -= 30;
    } else if (protectionLevel === 'token') {
      riskScore -= 60;
    }
    
    // 确定风险级别
    if (riskScore >= 70) {
      return 'high';
    } else if (riskScore >= 40) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // 生成扫描报告
  generateReport() {
    const report = {
      summary: {
        totalEndpoints: this.testedEndpoints.length,
        vulnerableEndpoints: this.vulnerableEndpoints.length,
        highRiskVulnerabilities: this.vulnerableEndpoints.filter(v => v.risk === 'high').length,
        mediumRiskVulnerabilities: this.vulnerableEndpoints.filter(v => v.risk === 'medium').length,
        lowRiskVulnerabilities: this.vulnerableEndpoints.filter(v => v.risk === 'low').length
      },
      vulnerableEndpoints: this.vulnerableEndpoints,
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  // 生成修复建议
  generateRecommendations() {
    const recommendations = [];
    
    // 基于漏洞类型生成建议
    const vulnerabilities = this.vulnerableEndpoints;
    
    if (vulnerabilities.length === 0) {
      recommendations.push({
        type: 'congratulations',
        message: '未发现CSRF漏洞，您的应用已受到保护！'
      });
      return recommendations;
    }
    
    // 检查是否有无防护的端点
    const unprotectedEndpoints = vulnerabilities.filter(v => v.protectionLevel === 'none');
    if (unprotectedEndpoints.length > 0) {
      recommendations.push({
        type: 'critical',
        message: \`发现 \${unprotectedEndpoints.length} 个无CSRF防护的端点，请立即实施CSRF防护措施。\`,
        endpoints: unprotectedEndpoints.map(v => v.endpoint)
      });
    }
    
    // 检查是否有仅依赖Referer/Origin的端点
    const weakProtectionEndpoints = vulnerabilities.filter(v => 
      v.protectionLevel === 'referer' || v.protectionLevel === 'origin'
    );
    if (weakProtectionEndpoints.length > 0) {
      recommendations.push({
        type: 'warning',
        message: \`发现 \${weakProtectionEndpoints.length} 个仅依赖Referer/Origin验证的端点，建议实施更严格的CSRF令牌防护。\`,
        endpoints: weakProtectionEndpoints.map(v => v.endpoint)
      });
    }
    
    // 通用建议
    recommendations.push({
      type: 'general',
      message: '建议实施以下CSRF防护措施：',
      measures: [
        '为所有状态变更请求实施CSRF令牌验证',
        '使用SameSite Cookie属性',
        '验证Referer和Origin头',
        '实施双重提交Cookie模式',
        '定期进行安全审计和渗透测试'
      ]
    });
    
    return recommendations;
  }
}

// 使用CSRF扫描器
async function scanForCSRF() {
  const scanner = new CSRFScanner();
  const report = await scanner.scanWebsite('https://example.com');
  
  console.log('CSRF扫描报告:');
  console.log('总端点数:', report.summary.totalEndpoints);
  console.log('漏洞端点数:', report.summary.vulnerableEndpoints);
  console.log('高风险漏洞:', report.summary.highRiskVulnerabilities);
  
  report.recommendations.forEach(rec => {
    console.log(\`\${rec.type.toUpperCase()}: \${rec.message}\`);
  });
  
  return report;
}
\`\`\`

#### CSRF攻击监控器

\`\`\`javascript
// CSRF攻击监控器
class CSRFAttackMonitor {
  constructor() {
    this.suspiciousRequests = [];
    this.attackPatterns = [];
    this.blockedRequests = [];
    this.setupEventListeners();
  }

  // 设置事件监听器
  setupEventListeners() {
    // 监听所有网络请求
    this.interceptFetch();
    this.interceptXHR();
  }

  // 拦截fetch请求
  interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (url, options = {}) => {
      // 分析请求
      const analysis = this.analyzeRequest(url, options);
      
      // 如果请求可疑，记录并可能阻止
      if (analysis.isSuspicious) {
        this.handleSuspiciousRequest(analysis);
        
        if (analysis.shouldBlock) {
          throw new Error('CSRF: Suspicious request blocked');
        }
      }
      
      // 继续原始请求
      try {
        const response = await originalFetch.call(window, url, options);
        return response;
      } catch (error) {
        throw error;
      }
    };
  }

  // 拦截XMLHttpRequest
  interceptXHR() {
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._url = url;
      this._method = method;
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
      // 分析请求
      const analysis = window.csrfAttackMonitor.analyzeRequest(this._url, {
        method: this._method,
        body: data
      });
      
      // 如果请求可疑，记录并可能阻止
      if (analysis.isSuspicious) {
        window.csrfAttackMonitor.handleSuspiciousRequest(analysis);
        
        if (analysis.shouldBlock) {
          this.abort();
          return;
        }
      }
      
      return originalXHRSend.apply(this, arguments);
    };
  }

  // 分析请求
  analyzeRequest(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    
    // 只分析状态变更请求
    if (!isStateChanging) {
      return {
        url,
        method,
        isSuspicious: false,
        shouldBlock: false
      };
    }
    
    // 检查Referer和Origin
    const referer = document.referrer;
    const origin = window.location.origin;
    
    // 检查是否是跨站请求
    const isCrossSite = this.isCrossSiteRequest(url, referer, origin);
    
    // 检查CSRF令牌
    const hasCSRFToken = this.hasCSRFToken(options);
    
    // 检查请求头
    const headers = options.headers || {};
    const hasXRequestedWith = headers['X-Requested-With'] === 'XMLHttpRequest';
    
    // 计算可疑分数
    let suspiciousScore = 0;
    
    if (isCrossSite) {
      suspiciousScore += 40;
    }
    
    if (!hasCSRFToken) {
      suspiciousScore += 30;
    }
    
    if (!hasXRequestedWith && method === 'POST') {
      suspiciousScore += 10;
    }
    
    // 检查URL是否是敏感端点
    if (this.isSensitiveEndpoint(url)) {
      suspiciousScore += 20;
    }
    
    // 判断是否可疑
    const isSuspicious = suspiciousScore >= 30;
    const shouldBlock = suspiciousScore >= 60;
    
    return {
      url,
      method,
      isCrossSite,
      hasCSRFToken,
      hasXRequestedWith,
      suspiciousScore,
      isSuspicious,
      shouldBlock,
      timestamp: new Date().toISOString(),
      referer,
      origin
    };
  }

  // 检查是否是跨站请求
  isCrossSiteRequest(url, referer, origin) {
    try {
      const urlObj = new URL(url, window.location.href);
      
      // 如果是绝对URL，检查域名
      if (urlObj.origin !== origin) {
        return true;
      }
      
      // 如果有referer，检查referer域名
      if (referer) {
        const refererObj = new URL(referer);
        if (refererObj.origin !== origin) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      // 如果URL解析失败，视为跨站请求
      return true;
    }
  }

  // 检查是否有CSRF令牌
  hasCSRFToken(options) {
    // 检查请求头
    if (options.headers) {
      if (options.headers['X-CSRF-Token'] || options.headers['X-XSRF-Token']) {
        return true;
      }
    }
    
    // 检查请求体
    if (options.body) {
      if (typeof options.body === 'string') {
        try {
          const body = JSON.parse(options.body);
          if (body._csrf || body.csrfToken) {
            return true;
          }
        } catch (error) {
          // 不是JSON，检查表单数据
          if (options.body.includes('_csrf=') || options.body.includes('csrfToken=')) {
            return true;
          }
        }
      } else if (typeof options.body === 'object') {
        if (options.body._csrf || options.body.csrfToken) {
          return true;
        }
      }
    }
    
    return false;
  }

  // 检查是否是敏感端点
  isSensitiveEndpoint(url) {
    const sensitivePaths = [
      '/api/transfer',
      '/api/payment',
      '/api/purchase',
      '/api/delete',
      '/api/change-password',
      '/api/update-email',
      '/api/admin'
    ];
    
    return sensitivePaths.some(path => url.includes(path));
  }

  // 处理可疑请求
  handleSuspiciousRequest(analysis) {
    // 记录可疑请求
    this.suspiciousRequests.push(analysis);
    
    // 检查是否匹配已知攻击模式
    const attackPattern = this.matchAttackPattern(analysis);
    if (attackPattern) {
      this.handleAttackPattern(analysis, attackPattern);
    }
    
    // 如果应该阻止请求，记录
    if (analysis.shouldBlock) {
      this.blockedRequests.push(analysis);
      
      // 发送安全事件
      this.reportSecurityEvent(analysis);
    }
    
    // 限制可疑请求数量
    if (this.suspiciousRequests.length > 100) {
      this.suspiciousRequests = this.suspiciousRequests.slice(-50);
    }
  }

  // 匹配攻击模式
  matchAttackPattern(analysis) {
    return this.attackPatterns.find(pattern => {
      return pattern.matches(analysis);
    });
  }

  // 处理攻击模式
  handleAttackPattern(analysis, pattern) {
    console.warn(\`检测到CSRF攻击模式: \${pattern.name}\`);
    
    // 执行模式特定的处理
    pattern.handle(analysis);
  }

  // 报告安全事件
  reportSecurityEvent(analysis) {
    const event = {
      type: 'CSRF_ATTACK_BLOCKED',
      timestamp: analysis.timestamp,
      details: {
        url: analysis.url,
        method: analysis.method,
        referer: analysis.referer,
        suspiciousScore: analysis.suspiciousScore
      }
    };
    
    // 发送到服务器
    this.sendSecurityEventToServer(event);
    
    // 本地日志
    console.error('CSRF攻击已阻止:', event);
  }

  // 发送安全事件到服务器
  async sendSecurityEventToServer(event) {
    try {
      await fetch('/api/security/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('发送安全事件失败:', error);
    }
  }

  // 添加攻击模式
  addAttackPattern(pattern) {
    this.attackPatterns.push(pattern);
  }

  // 获取监控统计
  getMonitoringStats() {
    return {
      suspiciousRequests: this.suspiciousRequests.length,
      blockedRequests: this.blockedRequests.length,
      attackPatterns: this.attackPatterns.length,
      recentSuspiciousRequests: this.suspiciousRequests.slice(-10),
      recentBlockedRequests: this.blockedRequests.slice(-10)
    };
  }
}

// 定义攻击模式
const commonCSRFPatterns = [
  {
    name: '跨站表单提交',
    description: '来自不同站点的表单提交',
    matches: (analysis) => {
      return analysis.isCrossSite && 
             !analysis.hasCSRFToken && 
             analysis.method === 'POST';
    },
    handle: (analysis) => {
      console.warn('检测到跨站表单提交尝试');
    }
  },
  {
    name: '敏感操作无令牌',
    description: '敏感操作缺少CSRF令牌',
    matches: (analysis) => {
      return !analysis.hasCSRFToken && 
             analysis.suspiciousScore >= 40;
    },
    handle: (analysis) => {
      console.warn('检测到敏感操作缺少CSRF令牌');
    }
  },
  {
    name: '高频可疑请求',
    description: '短时间内大量可疑请求',
    matches: (analysis) => {
      const monitor = window.csrfAttackMonitor;
      const recentRequests = monitor.suspiciousRequests.filter(
        r => new Date(r.timestamp) > new Date(Date.now() - 60000) // 最近1分钟
      );
      
      return recentRequests.length >= 5;
    },
    handle: (analysis) => {
      console.warn('检测到高频可疑请求，可能是自动化攻击');
    }
  }
];

// 初始化CSRF攻击监控器
window.csrfAttackMonitor = new CSRFAttackMonitor();

// 添加常见攻击模式
commonCSRFPatterns.forEach(pattern => {
  window.csrfAttackMonitor.addAttackPattern(pattern);
});
\`\`\`

## 实际应用案例

### 电子商务网站的CSRF防护

#### 服务器端实现

\`\`\`javascript
// 电子商务网站CSRF防护实现
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const helmet = require('helmet');

const app = express();

// 安全中间件
app.use(helmet());

// 配置会话
app.use(session({
  name: 'sessionId',
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 60 * 1000 // 30分钟
  }
}));

// 解析请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 生成CSRF令牌
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 存储CSRF令牌到会话
function storeCSRFToken(req, token) {
  if (!req.session.csrfTokens) {
    req.session.csrfTokens = [];
  }
  
  // 限制令牌数量
  if (req.session.csrfTokens.length > 5) {
    req.session.csrfTokens = req.session.csrfTokens.slice(-3);
  }
  
  req.session.csrfTokens.push({
    token,
    createdAt: Date.now()
  });
}

// 验证CSRF令牌
function validateCSRFToken(req, token) {
  if (!req.session.csrfTokens || !token) {
    return false;
  }
  
  const tokenIndex = req.session.csrfTokens.findIndex(t => t.token === token);
  
  if (tokenIndex === -1) {
    return false;
  }
  
  // 检查令牌是否过期（15分钟）
  const tokenData = req.session.csrfTokens[tokenIndex];
  const isExpired = Date.now() - tokenData.createdAt > 15 * 60 * 1000;
  
  if (isExpired) {
    req.session.csrfTokens.splice(tokenIndex, 1);
    return false;
  }
  
  // 使用后移除令牌
  req.session.csrfTokens.splice(tokenIndex, 1);
  return true;
}

// 提供CSRF令牌的中间件
function csrfTokenMiddleware(req, res, next) {
  const token = generateCSRFToken();
  storeCSRFToken(req, token);
  
  res.locals.csrfToken = token;
  
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.json({ csrfToken: token });
  }
  
  next();
}

// 验证CSRF令牌的中间件
function csrfProtectionMiddleware(req, res, next) {
  // 只对状态变更请求进行验证
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // 从请求中获取令牌
  let token;
  
  if (req.body && req.body._csrf) {
    token = req.body._csrf;
  } else if (req.headers['x-csrf-token']) {
    token = req.headers['x-csrf-token'];
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

// 验证Referer和Origin头的中间件
function validateRefererAndOrigin(req, res, next) {
  // 只对状态变更请求进行验证
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const allowedOrigins = [
    'https://example.com',
    'https://www.example.com',
    'https://checkout.example.com'
  ];
  
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  // 验证Origin头
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Invalid origin' });
  }
  
  // 验证Referer头
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (!allowedOrigins.includes(refererUrl.origin)) {
        return res.status(403).json({ error: 'Invalid referer' });
      }
    } catch (error) {
      return res.status(403).json({ error: 'Invalid referer' });
    }
  }
  
  next();
}

// 应用安全中间件
app.use('/api', csrfProtectionMiddleware);
app.use('/api', validateRefererAndOrigin);

// 提供CSRF令牌的端点
app.get('/api/csrf-token', csrfTokenMiddleware);

// 用户登录
app.post('/api/login', (req, res) => {
  // 登录逻辑...
  res.json({ success: true, message: '登录成功' });
});

// 获取用户信息
app.get('/api/user', (req, res) => {
  // 获取用户信息逻辑...
  res.json({ user: { id: 1, name: 'John Doe', email: 'john@example.com' } });
});

// 更新用户信息
app.put('/api/user', (req, res) => {
  // 更新用户信息逻辑...
  res.json({ success: true, message: '用户信息已更新' });
});

// 添加商品到购物车
app.post('/api/cart/add', (req, res) => {
  const { productId, quantity } = req.body;
  
  // 添加到购物车逻辑...
  res.json({ 
    success: true, 
    message: '商品已添加到购物车',
    cart: { items: [{ productId, quantity }] }
  });
});

// 更新购物车
app.put('/api/cart/:itemId', (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  
  // 更新购物车逻辑...
  res.json({ 
    success: true, 
    message: '购物车已更新',
    cart: { items: [{ id: itemId, quantity }] }
  });
});

// 结账
app.post('/api/checkout', (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;
  
  // 结账逻辑...
  res.json({ 
    success: true, 
    message: '订单已创建',
    order: { id: 'ORD12345', status: 'pending' }
  });
});

// 支付
app.post('/api/payment', (req, res) => {
  const { orderId, amount, paymentDetails } = req.body;
  
  // 支付逻辑...
  res.json({ 
    success: true, 
    message: '支付成功',
    transaction: { id: 'TXN67890', status: 'completed' }
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`服务器运行在端口 \${PORT}\`);
});
\`\`\`

#### 前端实现

\`\`\`javascript
// 电子商务网站前端CSRF防护
class EcommerceCSRFProtection {
  constructor() {
    this.token = null;
    this.tokenRefreshInterval = null;
    this.init();
  }

  async init() {
    await this.fetchToken();
    this.setupTokenRefresh();
    this.setupFormProtection();
    this.setupAjaxProtection();
  }

  // 获取CSRF令牌
  async fetchToken() {
    try {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      this.token = data.csrfToken;
      return this.token;
    } catch (error) {
      console.error('获取CSRF令牌失败:', error);
      throw error;
    }
  }

  // 设置定期刷新令牌
  setupTokenRefresh() {
    // 每10分钟刷新一次令牌
    this.tokenRefreshInterval = setInterval(() => {
      this.fetchToken();
    }, 10 * 60 * 1000);
  }

  // 设置表单保护
  setupFormProtection() {
    // 监听DOM变化，处理动态添加的表单
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
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
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // 处理现有表单
    const existingForms = document.querySelectorAll('form');
    existingForms.forEach(form => this.injectTokenIntoForm(form));
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
    tokenInput.value = this.token;
    
    // 添加到表单
    form.appendChild(tokenInput);
  }

  // 判断是否是敏感表单
  isSensitiveForm(form) {
    const sensitiveActions = [
      'login',
      'register',
      'update-profile',
      'change-password',
      'add-to-cart',
      'update-cart',
      'checkout',
      'payment',
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

  // 设置AJAX保护
  setupAjaxProtection() {
    // 拦截fetch请求
    const originalFetch = window.fetch;
    
    window.fetch = (url, options = {}) => {
      // 只对同源敏感请求添加CSRF令牌
      if (this.isSensitiveRequest(url, options)) {
        options.headers = {
          ...options.headers,
          'X-CSRF-Token': this.token
        };
      }
      
      return originalFetch.call(window, url, options);
    };
    
    // 拦截XMLHttpRequest
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.send = function(data) {
      if (window.ecommerceCSRFProtection.isSensitiveRequest(this._url, { method: this._method })) {
        this.setRequestHeader('X-CSRF-Token', window.ecommerceCSRFProtection.token);
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
    
    return true;
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

// 初始化CSRF防护
document.addEventListener('DOMContentLoaded', () => {
  window.ecommerceCSRFProtection = new EcommerceCSRFProtection();
});

// 购物车功能
class ShoppingCart {
  constructor() {
    this.items = [];
    this.init();
  }

  init() {
    this.loadCart();
    this.setupEventListeners();
  }

  loadCart() {
    // 从本地存储或服务器加载购物车
    fetch('/api/cart')
      .then(response => response.json())
      .then(data => {
        this.items = data.items || [];
        this.renderCart();
      })
      .catch(error => {
        console.error('加载购物车失败:', error);
      });
  }

  setupEventListeners() {
    // 添加商品到购物车
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('add-to-cart')) {
        const productId = event.target.dataset.productId;
        const quantity = 1;
        this.addToCart(productId, quantity);
      }
    });
  }

  async addToCart(productId, quantity) {
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.items = data.cart.items;
        this.renderCart();
        this.showNotification('商品已添加到购物车');
      } else {
        this.showNotification('添加商品失败', 'error');
      }
    } catch (error) {
      console.error('添加商品到购物车失败:', error);
      this.showNotification('添加商品失败', 'error');
    }
  }

  async updateQuantity(itemId, quantity) {
    try {
      const response = await fetch(\`/api/cart/\${itemId}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.items = data.cart.items;
        this.renderCart();
      } else {
        this.showNotification('更新购物车失败', 'error');
      }
    } catch (error) {
      console.error('更新购物车失败:', error);
      this.showNotification('更新购物车失败', 'error');
    }
  }

  renderCart() {
    const cartElement = document.getElementById('cart-items');
    if (!cartElement) return;
    
    cartElement.innerHTML = '';
    
    this.items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'cart-item';
      itemElement.innerHTML = \`
        <div class="item-info">
          <h4>\${item.name}</h4>
          <p>单价: $\${item.price}</p>
        </div>
        <div class="item-quantity">
          <button class="decrease-quantity" data-item-id="\${item.id}">-</button>
          <span>\${item.quantity}</span>
          <button class="increase-quantity" data-item-id="\${item.id}">+</button>
        </div>
        <div class="item-total">
          $\${(item.price * item.quantity).toFixed(2)}
        </div>
      \`;
      
      cartElement.appendChild(itemElement);
    });
    
    // 更新总价
    this.updateTotal();
    
    // 设置数量变更事件
    document.querySelectorAll('.decrease-quantity').forEach(button => {
      button.addEventListener('click', () => {
        const itemId = button.dataset.itemId;
        const item = this.items.find(i => i.id === itemId);
        if (item && item.quantity > 1) {
          this.updateQuantity(itemId, item.quantity - 1);
        }
      });
    });
    
    document.querySelectorAll('.increase-quantity').forEach(button => {
      button.addEventListener('click', () => {
        const itemId = button.dataset.itemId;
        const item = this.items.find(i => i.id === itemId);
        if (item) {
          this.updateQuantity(itemId, item.quantity + 1);
        }
      });
    });
  }

  updateTotal() {
    const total = this.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    const totalElement = document.getElementById('cart-total');
    if (totalElement) {
      totalElement.textContent = \`$\${total.toFixed(2)}\`;
    }
  }

  showNotification(message, type = 'success') {
    // 实现通知显示逻辑
    const notification = document.createElement('div');
    notification.className = \`notification \${type}\`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  }
}

// 结账功能
class Checkout {
  constructor() {
    this.shippingAddress = {};
    this.paymentMethod = '';
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', (event) => {
        event.preventDefault();
        this.processCheckout();
      });
    }
  }

  async processCheckout() {
    // 收集表单数据
    const formData = new FormData(document.getElementById('checkout-form'));
    
    this.shippingAddress = {
      name: formData.get('name'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      zip: formData.get('zip'),
      country: formData.get('country')
    };
    
    this.paymentMethod = formData.get('payment-method');
    
    try {
      // 创建订单
      const orderResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shippingAddress: this.shippingAddress,
          paymentMethod: this.paymentMethod
        })
      });
      
      const orderData = await orderResponse.json();
      
      if (orderData.success) {
        // 处理支付
        await this.processPayment(orderData.order.id);
      } else {
        this.showError('创建订单失败');
      }
    } catch (error) {
      console.error('结账失败:', error);
      this.showError('结账过程中发生错误');
    }
  }

  async processPayment(orderId) {
    // 收集支付信息
    const formData = new FormData(document.getElementById('payment-form'));
    
    const paymentDetails = {
      cardNumber: formData.get('card-number'),
      expiryDate: formData.get('expiry-date'),
      cvv: formData.get('cvv'),
      cardholderName: formData.get('cardholder-name')
    };
    
    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          amount: this.calculateTotal(),
          paymentDetails
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.showSuccess('支付成功！订单已确认。');
        // 重定向到订单确认页面
        window.location.href = \`/order-confirmation?orderId=\${orderId}\`;
      } else {
        this.showError('支付失败');
      }
    } catch (error) {
      console.error('支付失败:', error);
      this.showError('支付过程中发生错误');
    }
  }

  calculateTotal() {
    // 计算订单总额
    const cartElement = document.getElementById('cart-total');
    const totalText = cartElement ? cartElement.textContent : '$0.00';
    return parseFloat(totalText.replace('$', ''));
  }

  showError(message) {
    const errorElement = document.getElementById('checkout-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  showSuccess(message) {
    const successElement = document.getElementById('checkout-success');
    if (successElement) {
      successElement.textContent = message;
      successElement.style.display = 'block';
    }
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.shoppingCart = new ShoppingCart();
  window.checkout = new Checkout();
});
\`\`\`

## 总结

CSRF攻击是Web应用中常见的安全威胁，但通过实施多层防护策略，可以有效地保护应用免受攻击。本文介绍了CSRF检测工具和实际应用案例，展示了如何在真实场景中实现全面的CSRF防护。

### 关键防护措施

1. **同步器令牌模式**：最有效的CSRF防护方法，通过验证请求中的唯一令牌来防止跨站请求伪造。

2. **双重提交Cookie**：不需要服务器端会话存储的CSRF防护方法，通过比较Cookie和请求参数中的令牌来验证请求。

3. **SameSite Cookie属性**：浏览器内置的CSRF防护机制，通过限制Cookie在跨站请求中的发送来防止CSRF攻击。

4. **Referer和Origin验证**：通过检查请求来源是否可信来防止CSRF攻击。

5. **自动化检测与监控**：使用CSRF扫描器和攻击监控器来发现和阻止CSRF攻击。

### 最佳实践

1. **实施多层防护**：不要依赖单一的防护措施，组合使用多种防护方法。

2. **定期安全审计**：定期进行安全审计和渗透测试，发现潜在的安全漏洞。

3. **安全编码规范**：遵循安全编码规范，避免常见的安全错误。

4. **安全培训**：对开发团队进行安全培训，提高安全意识和技能。

5. **及时更新**：及时更新依赖库和框架，修复已知的安全漏洞。

通过实施这些防护措施和最佳实践，可以有效地保护Web应用免受CSRF攻击，保护用户数据和系统安全。`;export{n as default};
//# sourceMappingURL=23-3-BIlExRAP.js.map
