const n=`---
title: "前端安全监控、合规与架构设计"
excerpt: "介绍前端安全监控与响应、数据保护合规以及综合安全架构设计，帮助构建全面的前端安全防护体系，确保应用安全性和合规性"
coverImage: "/assets/blog/hello-world/cover.jpg"
date: "2025-11-15"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/preview/cover.jpg"
---

# 前端安全监控、合规与架构设计

## 前言

在上一篇文章中，我们介绍了前端安全编码规范和测试方法。本文将继续探讨前端安全监控与响应、数据保护合规以及综合安全架构设计，帮助构建更加全面的前端安全防护体系。

## 安全监控与响应

### 实时安全监控系统

\`\`\`javascript
// 1. 安全监控系统
class SecurityMonitoringSystem {
  constructor(options = {}) {
    this.options = {
      enableRealTimeMonitoring: true,
      enableAnomalyDetection: true,
      enableThreatIntelligence: true,
      enableLogging: true,
      logEndpoint: '/api/security/logs',
      alertEndpoint: '/api/security/alerts',
      maxLogEntries: 1000,
      ...options
    };
    
    this.securityEvents = [];
    this.threatPatterns = new Map();
    this.userBehaviorProfile = new Map();
    this.isMonitoring = false;
    
    this.init();
  }
  
  // 初始化监控系统
  init() {
    if (this.options.enableRealTimeMonitoring) {
      this.startMonitoring();
    }
    
    if (this.options.enableThreatIntelligence) {
      this.loadThreatPatterns();
    }
    
    if (this.options.enableAnomalyDetection) {
      this.initializeUserBehaviorProfiling();
    }
  }
  
  // 开始监控
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // 设置事件监听器
    this.setupEventListeners();
    
    // 定期检查安全状态
    this.securityCheckInterval = setInterval(() => {
      this.performSecurityCheck();
    }, 30000); // 每30秒检查一次
    
    console.log('Security monitoring started');
  }
  
  // 停止监控
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    // 清除事件监听器
    this.removeEventListeners();
    
    // 清除定期检查
    if (this.securityCheckInterval) {
      clearInterval(this.securityCheckInterval);
      this.securityCheckInterval = null;
    }
    
    console.log('Security monitoring stopped');
  }
  
  // 设置事件监听器
  setupEventListeners() {
    // 监控网络请求
    this.interceptFetch();
    
    // 监控DOM变化
    this.observeDOMChanges();
    
    // 监控错误
    window.addEventListener('error', this.handleGlobalError.bind(this));
    
    // 监控未处理的Promise拒绝
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    
    // 监控页面可见性变化
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // 监控焦点事件
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
    window.addEventListener('blur', this.handleWindowBlur.bind(this));
    
    // 监控在线/离线状态
    window.addEventListener('online', this.handleOnlineStatus.bind(this));
    window.addEventListener('offline', this.handleOfflineStatus.bind(this));
    
    // 监控页面卸载
    window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
  }
  
  // 移除事件监听器
  removeEventListeners() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.handleWindowFocus);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('online', this.handleOnlineStatus);
    window.removeEventListener('offline', this.handleOfflineStatus);
    window.removeEventListener('beforeunload', this.handlePageUnload);
  }
  
  // 记录安全事件
  logSecurityEvent(eventType, details, severity = 'medium') {
    const event = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: eventType,
      details: details,
      severity: severity,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId()
    };
    
    // 添加到事件列表
    this.securityEvents.push(event);
    
    // 限制事件数量
    if (this.securityEvents.length > this.options.maxLogEntries) {
      this.securityEvents.shift();
    }
    
    // 发送到服务器
    if (this.options.enableLogging) {
      this.sendLogToServer(event);
    }
    
    // 检查是否需要发出警报
    this.checkForAlert(event);
    
    // 更新用户行为档案
    if (this.options.enableAnomalyDetection) {
      this.updateUserBehaviorProfile(event);
    }
    
    return event;
  }
  
  // 检测可疑活动
  detectSuspiciousActivity() {
    // 检测异常键盘输入
    this.detectAnomalousKeystrokes();
    
    // 检测异常鼠标移动
    this.detectAnomalousMouseMovement();
    
    // 检测异常表单提交
    this.detectAnomalousFormSubmissions();
    
    // 检测异常网络请求
    this.detectAnomalousNetworkRequests();
    
    // 检测异常DOM操作
    this.detectAnomalousDOMOperations();
  }
  
  // 检测异常键盘输入
  detectAnomalousKeystrokes() {
    let keystrokeCount = 0;
    let lastKeystrokeTime = Date.now();
    const keystrokeThreshold = 20; // 每秒最多20次击键
    const keystrokeTimeWindow = 1000; // 1秒时间窗口
    
    const handleKeystroke = () => {
      const currentTime = Date.now();
      
      // 如果超过时间窗口，重置计数
      if (currentTime - lastKeystrokeTime > keystrokeTimeWindow) {
        keystrokeCount = 0;
      }
      
      keystrokeCount++;
      lastKeystrokeTime = currentTime;
      
      // 检查是否超过阈值
      if (keystrokeCount > keystrokeThreshold) {
        this.logSecurityEvent('anomalous_keystrokes', {
          count: keystrokeCount,
          timeWindow: keystrokeTimeWindow
        }, 'high');
        
        // 重置计数
        keystrokeCount = 0;
      }
    };
    
    document.addEventListener('keydown', handleKeystroke);
    
    // 存储事件处理器以便后续移除
    this.eventHandlers = this.eventHandlers || {};
    this.eventHandlers.keystroke = handleKeystroke;
  }
  
  // 检测异常鼠标移动
  detectAnomalousMouseMovement() {
    let mouseMovements = [];
    const movementThreshold = 100; // 100次移动
    const movementTimeWindow = 1000; // 1秒时间窗口
    
    const handleMouseMove = (event) => {
      const currentTime = Date.now();
      
      // 添加移动记录
      mouseMovements.push({
        x: event.clientX,
        y: event.clientY,
        time: currentTime
      });
      
      // 移除超出时间窗口的记录
      mouseMovements = mouseMovements.filter(
        movement => currentTime - movement.time <= movementTimeWindow
      );
      
      // 检查是否超过阈值
      if (mouseMovements.length > movementThreshold) {
        this.logSecurityEvent('anomalous_mouse_movement', {
          count: mouseMovements.length,
          timeWindow: movementTimeWindow
        }, 'medium');
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    // 存储事件处理器以便后续移除
    this.eventHandlers = this.eventHandlers || {};
    this.eventHandlers.mousemove = handleMouseMove;
  }
  
  // 检测异常表单提交
  detectAnomalousFormSubmissions() {
    const formSubmissions = new Map();
    const submissionThreshold = 5; // 5次提交
    const submissionTimeWindow = 60000; // 1分钟时间窗口
    
    const handleFormSubmit = (event) => {
      const form = event.target;
      const formId = form.id || 'unnamed_form';
      const currentTime = Date.now();
      
      // 获取表单提交记录
      let submissions = formSubmissions.get(formId) || [];
      
      // 添加新提交
      submissions.push(currentTime);
      
      // 移除超出时间窗口的记录
      submissions = submissions.filter(
        time => currentTime - time <= submissionTimeWindow
      );
      
      // 检查是否超过阈值
      if (submissions.length > submissionThreshold) {
        this.logSecurityEvent('anomalous_form_submission', {
          formId: formId,
          count: submissions.length,
          timeWindow: submissionTimeWindow
        }, 'high');
        
        // 阻止表单提交
        event.preventDefault();
      }
      
      // 更新记录
      formSubmissions.set(formId, submissions);
    };
    
    document.addEventListener('submit', handleFormSubmit);
    
    // 存储事件处理器以便后续移除
    this.eventHandlers = this.eventHandlers || {};
    this.eventHandlers.formsubmit = handleFormSubmit;
  }
  
  // 拦截fetch请求
  interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = args[0];
      const options = args[1] || {};
      
      try {
        // 记录请求
        this.logSecurityEvent('fetch_request', {
          url: url,
          method: options.method || 'GET',
          headers: options.headers
        }, 'low');
        
        // 发送请求
        const response = await originalFetch(...args);
        
        // 记录响应
        const responseTime = Date.now() - startTime;
        this.logSecurityEvent('fetch_response', {
          url: url,
          status: response.status,
          responseTime: responseTime
        }, 'low');
        
        // 检查响应是否可疑
        if (response.status >= 400) {
          this.logSecurityEvent('fetch_error', {
            url: url,
            status: response.status,
            statusText: response.statusText
          }, 'medium');
        }
        
        return response;
      } catch (error) {
        // 记录错误
        const responseTime = Date.now() - startTime;
        this.logSecurityEvent('fetch_error', {
          url: url,
          error: error.message,
          responseTime: responseTime
        }, 'high');
        
        throw error;
      }
    };
  }
  
  // 观察DOM变化
  observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // 检查添加的节点
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 检查是否添加了可疑元素
              if (node.tagName === 'SCRIPT' || node.tagName === 'IFRAME') {
                this.logSecurityEvent('suspicious_dom_addition', {
                  tagName: node.tagName,
                  src: node.src || node.getAttribute('src'),
                  id: node.id || 'unnamed'
                }, 'high');
              }
            }
          }
        }
        
        // 检查属性变化
        if (mutation.type === 'attributes') {
          const element = mutation.target;
          const attributeName = mutation.attributeName;
          
          // 检查是否修改了危险属性
          if (['src', 'href', 'onclick', 'onload'].includes(attributeName)) {
            this.logSecurityEvent('suspicious_attribute_change', {
              tagName: element.tagName,
              attributeName: attributeName,
              oldValue: mutation.oldValue,
              newValue: element.getAttribute(attributeName),
              id: element.id || 'unnamed'
            }, 'medium');
          }
        }
      }
    });
    
    // 配置观察器
    const config = {
      childList: true,
      attributes: true,
      subtree: true,
      attributeOldValue: true
    };
    
    // 开始观察
    observer.observe(document.body, config);
    
    // 存储观察器以便后续断开
    this.domObserver = observer;
  }
  
  // 处理全局错误
  handleGlobalError(event) {
    this.logSecurityEvent('javascript_error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error ? event.error.stack : null
    }, 'medium');
  }
  
  // 处理未处理的Promise拒绝
  handleUnhandledRejection(event) {
    this.logSecurityEvent('unhandled_promise_rejection', {
      reason: event.reason
    }, 'medium');
  }
  
  // 处理页面可见性变化
  handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      this.logSecurityEvent('page_hidden', {
        timestamp: Date.now()
      }, 'low');
    } else if (document.visibilityState === 'visible') {
      this.logSecurityEvent('page_visible', {
        timestamp: Date.now()
      }, 'low');
    }
  }
  
  // 处理窗口焦点事件
  handleWindowFocus() {
    this.logSecurityEvent('window_focused', {
      timestamp: Date.now()
    }, 'low');
  }
  
  // 处理窗口失焦事件
  handleWindowBlur() {
    this.logSecurityEvent('window_blurred', {
      timestamp: Date.now()
    }, 'low');
  }
  
  // 处理在线状态
  handleOnlineStatus() {
    this.logSecurityEvent('online_status', {
      status: 'online',
      timestamp: Date.now()
    }, 'low');
  }
  
  // 处理离线状态
  handleOfflineStatus() {
    this.logSecurityEvent('online_status', {
      status: 'offline',
      timestamp: Date.now()
    }, 'medium');
  }
  
  // 处理页面卸载
  handlePageUnload() {
    this.logSecurityEvent('page_unload', {
      timestamp: Date.now()
    }, 'low');
    
    // 发送剩余日志
    this.flushLogs();
  }
  
  // 执行安全检查
  performSecurityCheck() {
    // 检测可疑活动
    this.detectSuspiciousActivity();
    
    // 检查安全配置
    this.checkSecurityConfiguration();
    
    // 检查威胁模式
    this.checkThreatPatterns();
  }
  
  // 检查安全配置
  checkSecurityConfiguration() {
    // 检查CSP
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      this.logSecurityEvent('missing_csp', {
        message: 'Content Security Policy not found'
      }, 'medium');
    }
    
    // 检查X-Frame-Options
    const xFrameOptionsMeta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
    if (!xFrameOptionsMeta) {
      this.logSecurityEvent('missing_x_frame_options', {
        message: 'X-Frame-Options not found'
      }, 'medium');
    }
    
    // 检查是否有不安全的资源
    const insecureResources = document.querySelectorAll('[src^="http://"]');
    if (insecureResources.length > 0) {
      this.logSecurityEvent('insecure_resources', {
        count: insecureResources.length,
        resources: Array.from(insecureResources).map(el => el.src)
      }, 'medium');
    }
  }
  
  // 加载威胁模式
  loadThreatPatterns() {
    // 从服务器加载威胁模式
    fetch('/api/security/threat-patterns')
      .then(response => response.json())
      .then(patterns => {
        for (const pattern of patterns) {
          this.threatPatterns.set(pattern.id, pattern);
        }
        console.log(\`Loaded \${patterns.length} threat patterns\`);
      })
      .catch(error => {
        console.error('Failed to load threat patterns:', error);
        
        // 加载默认威胁模式
        this.loadDefaultThreatPatterns();
      });
  }
  
  // 加载默认威胁模式
  loadDefaultThreatPatterns() {
    const defaultPatterns = [
      {
        id: 'xss_injection',
        name: 'XSS注入攻击',
        pattern: /<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi,
        severity: 'high',
        description: '检测可能的XSS注入攻击'
      },
      {
        id: 'sql_injection',
        name: 'SQL注入攻击',
        pattern: /(\\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\\b)/gi,
        severity: 'high',
        description: '检测可能的SQL注入攻击'
      },
      {
        id: 'suspicious_urls',
        name: '可疑URL',
        pattern: /(javascript:|data:|vbscript:)/gi,
        severity: 'high',
        description: '检测可疑的URL协议'
      }
    ];
    
    for (const pattern of defaultPatterns) {
      this.threatPatterns.set(pattern.id, pattern);
    }
    
    console.log(\`Loaded \${defaultPatterns.length} default threat patterns\`);
  }
  
  // 检查威胁模式
  checkThreatPatterns() {
    // 获取页面内容
    const pageContent = document.documentElement.outerHTML;
    
    // 检查每个威胁模式
    for (const [id, pattern] of this.threatPatterns) {
      const matches = pageContent.match(pattern.pattern);
      if (matches) {
        this.logSecurityEvent('threat_pattern_detected', {
          patternId: id,
          patternName: pattern.name,
          matches: matches,
          severity: pattern.severity
        }, pattern.severity);
      }
    }
  }
  
  // 初始化用户行为档案
  initializeUserBehaviorProfiling() {
    // 初始化当前用户的档案
    const userId = this.getCurrentUserId();
    if (!userId) return;
    
    // 从服务器加载用户档案
    fetch(\`/api/security/user-profile/\${userId}\`)
      .then(response => response.json())
      .then(profile => {
        this.userBehaviorProfile.set(userId, profile);
        console.log('Loaded user behavior profile');
      })
      .catch(error => {
        console.error('Failed to load user behavior profile:', error);
        
        // 创建默认档案
        this.userBehaviorProfile.set(userId, {
          userId: userId,
          averageKeystrokeRate: 0,
          averageMouseMovementRate: 0,
          averageFormSubmissionRate: 0,
          averageRequestRate: 0,
          lastUpdated: new Date().toISOString()
        });
      });
  }
  
  // 更新用户行为档案
  updateUserBehaviorProfile(event) {
    const userId = this.getCurrentUserId();
    if (!userId) return;
    
    let profile = this.userBehaviorProfile.get(userId);
    if (!profile) {
      profile = {
        userId: userId,
        averageKeystrokeRate: 0,
        averageMouseMovementRate: 0,
        averageFormSubmissionRate: 0,
        averageRequestRate: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // 根据事件类型更新档案
    switch (event.type) {
      case 'anomalous_keystrokes':
        profile.averageKeystrokeRate = this.updateAverage(
          profile.averageKeystrokeRate,
          event.details.count
        );
        break;
        
      case 'anomalous_mouse_movement':
        profile.averageMouseMovementRate = this.updateAverage(
          profile.averageMouseMovementRate,
          event.details.count
        );
        break;
        
      case 'anomalous_form_submission':
        profile.averageFormSubmissionRate = this.updateAverage(
          profile.averageFormSubmissionRate,
          event.details.count
        );
        break;
        
      case 'fetch_request':
        profile.averageRequestRate = this.updateAverage(
          profile.averageRequestRate,
          1
        );
        break;
    }
    
    // 更新时间戳
    profile.lastUpdated = new Date().toISOString();
    
    // 保存档案
    this.userBehaviorProfile.set(userId, profile);
    
    // 定期将档案发送到服务器
    if (Math.random() < 0.1) { // 10%的概率发送
      this.sendUserProfileToServer(userId, profile);
    }
  }
  
  // 更新平均值
  updateAverage(currentAverage, newValue, weight = 0.1) {
    return currentAverage * (1 - weight) + newValue * weight;
  }
  
  // 发送用户档案到服务器
  sendUserProfileToServer(userId, profile) {
    fetch('/api/security/user-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profile)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      return response.json();
    })
    .then(data => {
      console.log('User behavior profile updated');
    })
    .catch(error => {
      console.error('Failed to update user behavior profile:', error);
    });
  }
  
  // 检查是否需要发出警报
  checkForAlert(event) {
    // 高严重性事件立即发出警报
    if (event.severity === 'high') {
      this.sendAlert(event);
      return;
    }
    
    // 检查是否有重复的中等严重性事件
    const recentEvents = this.securityEvents.filter(e => 
      e.type === event.type && 
      e.severity === 'medium' && 
      new Date(e.timestamp) > new Date(Date.now() - 300000) // 最近5分钟
    );
    
    if (recentEvents.length >= 3) {
      this.sendAlert({
        ...event,
        type: 'repeated_medium_severity_events',
        details: {
          originalEvent: event,
          count: recentEvents.length
        }
      });
    }
  }
  
  // 发送警报
  sendAlert(event) {
    // 在页面上显示警报
    this.displayAlert(event);
    
    // 发送到服务器
    fetch(this.options.alertEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })
    .catch(error => {
      console.error('Failed to send alert:', error);
    });
  }
  
  // 显示警报
  displayAlert(event) {
    // 创建警报元素
    const alertElement = document.createElement('div');
    alertElement.className = 'security-alert';
    alertElement.innerHTML = \`
      <div class="alert-header">
        <h3>安全警报</h3>
        <button class="alert-close">&times;</button>
      </div>
      <div class="alert-body">
        <p><strong>类型:</strong> \${event.type}</p>
        <p><strong>严重性:</strong> \${event.severity}</p>
        <p><strong>时间:</strong> \${new Date(event.timestamp).toLocaleString()}</p>
        <p><strong>详情:</strong> \${JSON.stringify(event.details)}</p>
      </div>
    \`;
    
    // 添加样式
    alertElement.style.position = 'fixed';
    alertElement.style.top = '20px';
    alertElement.style.right = '20px';
    alertElement.style.width = '300px';
    alertElement.style.padding = '10px';
    alertElement.style.backgroundColor = event.severity === 'high' ? '#ffebee' : '#fff3e0';
    alertElement.style.border = \`1px solid \${event.severity === 'high' ? '#f44336' : '#ff9800'}\`;
    alertElement.style.borderRadius = '4px';
    alertElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    alertElement.style.zIndex = '9999';
    
    // 添加到页面
    document.body.appendChild(alertElement);
    
    // 添加关闭事件
    const closeButton = alertElement.querySelector('.alert-close');
    closeButton.addEventListener('click', () => {
      document.body.removeChild(alertElement);
    });
    
    // 自动关闭
    setTimeout(() => {
      if (document.body.contains(alertElement)) {
        document.body.removeChild(alertElement);
      }
    }, 10000); // 10秒后自动关闭
  }
  
  // 发送日志到服务器
  sendLogToServer(event) {
    // 批量发送日志
    this.pendingLogs = this.pendingLogs || [];
    this.pendingLogs.push(event);
    
    // 如果达到批量大小或定时器未设置，则发送
    if (this.pendingLogs.length >= 10 || !this.logFlushTimer) {
      this.flushLogs();
    }
  }
  
  // 刷新日志
  flushLogs() {
    if (!this.pendingLogs || this.pendingLogs.length === 0) return;
    
    const logs = [...this.pendingLogs];
    this.pendingLogs = [];
    
    fetch(this.options.logEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logs)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      return response.json();
    })
    .then(data => {
      console.log(\`Sent \${logs.length} security logs to server\`);
    })
    .catch(error => {
      console.error('Failed to send security logs:', error);
      
      // 如果发送失败，将日志重新添加到队列
      this.pendingLogs = [...logs, ...(this.pendingLogs || [])];
    })
    .finally(() => {
      // 设置定时器，定期刷新日志
      if (this.logFlushTimer) {
        clearTimeout(this.logFlushTimer);
      }
      
      this.logFlushTimer = setTimeout(() => {
        this.flushLogs();
      }, 30000); // 30秒后再次尝试
    });
  }
  
  // 获取当前用户ID
  getCurrentUserId() {
    // 这里需要根据实际应用获取用户ID
    // 可能从Cookie、localStorage或其他地方获取
    return SecureCodingUtils.secureCookie.getCookie('user_id') || 
           SecureCodingUtils.secureLocalStorage.getItem('user_id') || 
           'anonymous';
  }
  
  // 生成事件ID
  generateEventId() {
    return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // 获取安全事件
  getSecurityEvents(options = {}) {
    let events = [...this.securityEvents];
    
    // 按类型过滤
    if (options.type) {
      events = events.filter(event => event.type === options.type);
    }
    
    // 按严重性过滤
    if (options.severity) {
      events = events.filter(event => event.severity === options.severity);
    }
    
    // 按时间范围过滤
    if (options.startTime) {
      const startTime = new Date(options.startTime);
      events = events.filter(event => new Date(event.timestamp) >= startTime);
    }
    
    if (options.endTime) {
      const endTime = new Date(options.endTime);
      events = events.filter(event => new Date(event.timestamp) <= endTime);
    }
    
    // 按用户过滤
    if (options.userId) {
      events = events.filter(event => event.userId === options.userId);
    }
    
    // 限制数量
    if (options.limit) {
      events = events.slice(0, options.limit);
    }
    
    return events;
  }
  
  // 获取用户行为档案
  getUserBehaviorProfile(userId) {
    return this.userBehaviorProfile.get(userId);
  }
  
  // 获取威胁模式
  getThreatPatterns() {
    return Array.from(this.threatPatterns.values());
  }
  
  // 添加威胁模式
  addThreatPattern(pattern) {
    this.threatPatterns.set(pattern.id, pattern);
  }
  
  // 移除威胁模式
  removeThreatPattern(patternId) {
    return this.threatPatterns.delete(patternId);
  }
}

// 2. 使用示例
document.addEventListener('DOMContentLoaded', () => {
  // 创建安全监控系统
  const securityMonitor = new SecurityMonitoringSystem({
    enableRealTimeMonitoring: true,
    enableAnomalyDetection: true,
    enableThreatIntelligence: true,
    enableLogging: true,
    logEndpoint: '/api/security/logs',
    alertEndpoint: '/api/security/alerts'
  });
  
  // 将监控系统暴露到全局，以便其他模块使用
  window.securityMonitor = securityMonitor;
  
  // 添加自定义安全检查
  securityMonitor.addThreatPattern({
    id: 'custom_pattern',
    name: '自定义威胁模式',
    pattern: /custom-pattern/gi,
    severity: 'medium',
    description: '检测自定义威胁模式'
  });
  
  // 监听自定义事件
  document.addEventListener('customSecurityEvent', (event) => {
    securityMonitor.logSecurityEvent('custom_security_event', {
      details: event.detail
    }, 'medium');
  });
});
\`\`\`

## 数据保护合规

### GDPR合规实现

\`\`\`javascript
// 1. GDPR合规管理器
class GDPRComplianceManager {
  constructor(options = {}) {
    this.options = {
      cookieConsentRequired: true,
      dataProcessingConsentRequired: true,
      consentStorageKey: 'gdpr_consent',
      consentExpiryDays: 365,
      privacyPolicyUrl: '/privacy-policy',
      ...options
    };
    
    this.consent = this.loadConsent();
    this.consentCallbacks = [];
    
    this.init();
  }
  
  // 初始化
  init() {
    // 检查是否需要显示同意横幅
    if (this.needsConsent()) {
      this.showConsentBanner();
    }
    
    // 设置Cookie同意检查
    if (this.options.cookieConsentRequired) {
      this.interceptCookieAccess();
    }
    
    // 设置数据处理同意检查
    if (this.options.dataProcessingConsentRequired) {
      this.interceptDataProcessing();
    }
  }
  
  // 检查是否需要同意
  needsConsent() {
    // 如果没有同意记录，需要同意
    if (!this.consent) {
      return true;
    }
    
    // 如果同意已过期，需要重新同意
    if (this.isConsentExpired()) {
      return true;
    }
    
    // 如果同意版本不匹配，需要重新同意
    if (this.consent.version !== this.getCurrentConsentVersion()) {
      return true;
    }
    
    return false;
  }
  
  // 检查同意是否过期
  isConsentExpired() {
    if (!this.consent || !this.consent.timestamp) {
      return true;
    }
    
    const consentDate = new Date(this.consent.timestamp);
    const expiryDate = new Date(consentDate);
    expiryDate.setDate(expiryDate.getDate() + this.options.consentExpiryDays);
    
    return new Date() > expiryDate;
  }
  
  // 获取当前同意版本
  getCurrentConsentVersion() {
    // 这里应该从服务器获取当前版本
    // 简化示例，使用固定版本
    return '1.0';
  }
  
  // 加载同意记录
  loadConsent() {
    try {
      const consentData = SecureCodingUtils.secureLocalStorage.getItem(
        this.options.consentStorageKey,
        false
      );
      return consentData;
    } catch (error) {
      console.error('Failed to load consent:', error);
      return null;
    }
  }
  
  // 保存同意记录
  saveConsent(consentData) {
    try {
      const consent = {
        version: this.getCurrentConsentVersion(),
        timestamp: new Date().toISOString(),
        ...consentData
      };
      
      SecureCodingUtils.secureLocalStorage.setItem(
        this.options.consentStorageKey,
        consent,
        false
      );
      
      this.consent = consent;
      
      // 通知回调
      this.consentCallbacks.forEach(callback => {
        try {
          callback(consent);
        } catch (error) {
          console.error('Error in consent callback:', error);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to save consent:', error);
      return false;
    }
  }
  
  // 显示同意横幅
  showConsentBanner() {
    // 创建横幅元素
    const banner = document.createElement('div');
    banner.id = 'gdpr-consent-banner';
    banner.className = 'gdpr-consent-banner';
    
    // 创建横幅内容
    banner.innerHTML = \`
      <div class="consent-content">
        <h3>隐私与Cookie使用</h3>
        <p>我们使用Cookie和类似技术来提供、保护和改进我们的服务。通过使用我们的网站，您同意我们根据我们的<a href="\${this.options.privacyPolicyUrl}" target="_blank">隐私政策</a>收集和使用数据。</p>
        <div class="consent-options">
          <label>
            <input type="checkbox" id="consent-necessary" checked disabled>
            必要Cookie（必需）
          </label>
          <label>
            <input type="checkbox" id="consent-analytics">
            分析Cookie
          </label>
          <label>
            <input type="checkbox" id="consent-marketing">
            营销Cookie
          </label>
          <label>
            <input type="checkbox" id="consent-personalization">
            个性化Cookie
          </label>
        </div>
        <div class="consent-buttons">
          <button id="consent-accept-all">接受所有</button>
          <button id="consent-accept-selected">接受所选</button>
          <button id="consent-reject-all">拒绝所有</button>
          <button id="consent-settings">设置</button>
        </div>
      </div>
    \`;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = \`
      .gdpr-consent-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: #f8f9fa;
        border-top: 1px solid #dee2e6;
        padding: 20px;
        z-index: 10000;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      }
      
      .consent-content h3 {
        margin-top: 0;
        margin-bottom: 10px;
      }
      
      .consent-options {
        margin: 15px 0;
      }
      
      .consent-options label {
        display: block;
        margin-bottom: 8px;
      }
      
      .consent-buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      
      .consent-buttons button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }
      
      #consent-accept-all {
        background-color: #28a745;
        color: white;
      }
      
      #consent-accept-selected {
        background-color: #007bff;
        color: white;
      }
      
      #consent-reject-all {
        background-color: #6c757d;
        color: white;
      }
      
      #consent-settings {
        background-color: #f8f9fa;
        color: #212529;
        border: 1px solid #dee2e6;
      }
    \`;
    
    // 添加到页面
    document.head.appendChild(style);
    document.body.appendChild(banner);
    
    // 添加事件监听器
    this.setupConsentBannerEvents(banner);
  }
  
  // 设置同意横幅事件
  setupConsentBannerEvents(banner) {
    // 接受所有按钮
    const acceptAllButton = banner.querySelector('#consent-accept-all');
    acceptAllButton.addEventListener('click', () => {
      this.acceptAll();
      this.hideConsentBanner();
    });
    
    // 接受所选按钮
    const acceptSelectedButton = banner.querySelector('#consent-accept-selected');
    acceptSelectedButton.addEventListener('click', () => {
      this.acceptSelected();
      this.hideConsentBanner();
    });
    
    // 拒绝所有按钮
    const rejectAllButton = banner.querySelector('#consent-reject-all');
    rejectAllButton.addEventListener('click', () => {
      this.rejectAll();
      this.hideConsentBanner();
    });
    
    // 设置按钮
    const settingsButton = banner.querySelector('#consent-settings');
    settingsButton.addEventListener('click', () => {
      this.showConsentSettings();
    });
  }
  
  // 隐藏同意横幅
  hideConsentBanner() {
    const banner = document.getElementById('gdpr-consent-banner');
    if (banner) {
      document.body.removeChild(banner);
    }
  }
  
  // 接受所有
  acceptAll() {
    const consentData = {
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
      dataProcessing: true
    };
    
    this.saveConsent(consentData);
  }
  
  // 接受所选
  acceptSelected() {
    const banner = document.getElementById('gdpr-consent-banner');
    
    const consentData = {
      necessary: true, // 必要Cookie总是被接受
      analytics: banner.querySelector('#consent-analytics').checked,
      marketing: banner.querySelector('#consent-marketing').checked,
      personalization: banner.querySelector('#consent-personalization').checked,
      dataProcessing: banner.querySelector('#consent-analytics').checked || 
                     banner.querySelector('#consent-marketing').checked || 
                     banner.querySelector('#consent-personalization').checked
    };
    
    this.saveConsent(consentData);
  }
  
  // 拒绝所有
  rejectAll() {
    const consentData = {
      necessary: true, // 必要Cookie总是被接受
      analytics: false,
      marketing: false,
      personalization: false,
      dataProcessing: false
    };
    
    this.saveConsent(consentData);
  }
  
  // 显示同意设置
  showConsentSettings() {
    // 创建设置模态框
    const modal = document.createElement('div');
    modal.id = 'gdpr-consent-settings-modal';
    modal.className = 'gdpr-consent-modal';
    
    // 创建模态框内容
    modal.innerHTML = \`
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>Cookie设置</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p>我们使用不同类型的Cookie来提供、保护和分析我们的服务。您可以选择接受或拒绝某些类型的Cookie。</p>
          
          <div class="cookie-category">
            <h3>必要Cookie</h3>
            <p>这些Cookie对于网站正常运行是必需的，不能被禁用。</p>
            <label>
              <input type="checkbox" id="settings-necessary" checked disabled>
              启用必要Cookie
            </label>
          </div>
          
          <div class="cookie-category">
            <h3>分析Cookie</h3>
            <p>这些Cookie帮助我们了解访问者如何与我们的网站互动，收集和报告信息 anonymously。</p>
            <label>
              <input type="checkbox" id="settings-analytics">
              启用分析Cookie
            </label>
          </div>
          
          <div class="cookie-category">
            <h3>营销Cookie</h3>
            <p>这些Cookie用于跟踪访问者在不同网站上的活动，以显示相关广告。</p>
            <label>
              <input type="checkbox" id="settings-marketing">
              启用营销Cookie
            </label>
          </div>
          
          <div class="cookie-category">
            <h3>个性化Cookie</h3>
            <p>这些Cookie允许网站记住您做出的选择，并提供增强的个性化和功能。</p>
            <label>
              <input type="checkbox" id="settings-personalization">
              启用个性化Cookie
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button id="settings-save">保存设置</button>
          <button id="settings-cancel">取消</button>
        </div>
      </div>
    \`;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = \`
      .gdpr-consent-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10001;
      }
      
      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
      }
      
      .modal-content {
        position: relative;
        max-width: 600px;
        margin: 50px auto;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        max-height: 80vh;
        overflow-y: auto;
      }
      
      .modal-header {
        padding: 20px;
        border-bottom: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .modal-header h2 {
        margin: 0;
      }
      
      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
      }
      
      .modal-body {
        padding: 20px;
      }
      
      .cookie-category {
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid #f1f3f4;
      }
      
      .cookie-category:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }
      
      .modal-footer {
        padding: 20px;
        border-top: 1px solid #dee2e6;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      
      .modal-footer button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }
      
      #settings-save {
        background-color: #28a745;
        color: white;
      }
      
      #settings-cancel {
        background-color: #6c757d;
        color: white;
      }
    \`;
    
    // 添加到页面
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // 设置当前状态
    if (this.consent) {
      modal.querySelector('#settings-analytics').checked = this.consent.analytics || false;
      modal.querySelector('#settings-marketing').checked = this.consent.marketing || false;
      modal.querySelector('#settings-personalization').checked = this.consent.personalization || false;
    }
    
    // 添加事件监听器
    this.setupConsentSettingsEvents(modal);
  }
  
  // 设置同意设置事件
  setupConsentSettingsEvents(modal) {
    // 关闭按钮
    const closeButton = modal.querySelector('.modal-close');
    closeButton.addEventListener('click', () => {
      this.hideConsentSettings();
    });
    
    // 取消按钮
    const cancelButton = modal.querySelector('#settings-cancel');
    cancelButton.addEventListener('click', () => {
      this.hideConsentSettings();
    });
    
    // 保存设置按钮
    const saveButton = modal.querySelector('#settings-save');
    saveButton.addEventListener('click', () => {
      const consentData = {
        necessary: true, // 必要Cookie总是被接受
        analytics: modal.querySelector('#settings-analytics').checked,
        marketing: modal.querySelector('#settings-marketing').checked,
        personalization: modal.querySelector('#settings-personalization').checked,
        dataProcessing: modal.querySelector('#settings-analytics').checked || 
                       modal.querySelector('#settings-marketing').checked || 
                       modal.querySelector('#settings-personalization').checked
      };
      
      this.saveConsent(consentData);
      this.hideConsentSettings();
    });
    
    // 点击遮罩关闭
    const overlay = modal.querySelector('.modal-overlay');
    overlay.addEventListener('click', () => {
      this.hideConsentSettings();
    });
  }
  
  // 隐藏同意设置
  hideConsentSettings() {
    const modal = document.getElementById('gdpr-consent-settings-modal');
    if (modal) {
      document.body.removeChild(modal);
    }
  }
  
  // 拦截Cookie访问
  interceptCookieAccess() {
    // 保存原始的Cookie访问方法
    const originalCookieDescriptor = Object.getOwnPropertyDescriptor(
      Document.prototype, 'cookie'
    );
    
    // 重写Cookie getter
    Object.defineProperty(document, 'cookie', {
      get: function() {
        // 如果没有同意，只返回必要Cookie
        if (!window.gdprManager || !window.gdprManager.hasConsent()) {
          return window.gdprManager.getNecessaryCookies();
        }
        
        // 返回所有Cookie
        return originalCookieDescriptor.get.call(this);
      },
      
      set: function(value) {
        // 如果没有同意，只允许设置必要Cookie
        if (!window.gdprManager || !window.gdprManager.hasConsent()) {
          if (!window.gdprManager.isNecessaryCookie(value)) {
            console.warn('Attempt to set non-necessary cookie without consent:', value);
            return;
          }
        }
        
        // 设置Cookie
        return originalCookieDescriptor.set.call(this, value);
      },
      
      configurable: true
    });
  }
  
  // 拦截数据处理
  interceptDataProcessing() {
    // 保存原始的fetch方法
    const originalFetch = window.fetch;
    
    // 重写fetch方法
    window.fetch = async (...args) => {
      // 如果没有同意数据处理，阻止某些请求
      if (!window.gdprManager || !window.gdprManager.hasDataProcessingConsent()) {
        const url = args[0];
        
        // 检查是否是数据处理请求
        if (window.gdprManager.isDataProcessingRequest(url)) {
          console.warn('Attempt to process data without consent:', url);
          throw new Error('Data processing consent required');
        }
      }
      
      // 发送请求
      return originalFetch(...args);
    };
  }
  
  // 检查是否有同意
  hasConsent() {
    return !!this.consent;
  }
  
  // 检查是否有数据处理同意
  hasDataProcessingConsent() {
    return !!(this.consent && this.consent.dataProcessing);
  }
  
  // 检查是否有特定类型的同意
  hasConsentFor(type) {
    return !!(this.consent && this.consent[type]);
  }
  
  // 获取必要Cookie
  getNecessaryCookies() {
    // 这里应该返回必要Cookie
    // 简化示例，返回空字符串
    return '';
  }
  
  // 检查是否是必要Cookie
  isNecessaryCookie(cookieString) {
    // 这里应该检查Cookie是否是必要的
    // 简化示例，只允许sessionid和csrf_token
    return cookieString.includes('sessionid') || cookieString.includes('csrf_token');
  }
  
  // 检查是否是数据处理请求
  isDataProcessingRequest(url) {
    // 这里应该检查URL是否是数据处理请求
    // 简化示例，检查是否包含analytics或tracking
    return url.includes('analytics') || url.includes('tracking');
  }
  
  // 添加同意回调
  onConsentChange(callback) {
    this.consentCallbacks.push(callback);
  }
  
  // 移除同意回调
  removeConsentChangeCallback(callback) {
    const index = this.consentCallbacks.indexOf(callback);
    if (index > -1) {
      this.consentCallbacks.splice(index, 1);
    }
  }
  
  // 撤销同意
  revokeConsent() {
    this.consent = null;
    SecureCodingUtils.secureLocalStorage.removeItem(this.options.consentStorageKey);
    
    // 重新显示同意横幅
    this.showConsentBanner();
    
    // 通知回调
    this.consentCallbacks.forEach(callback => {
      try {
        callback(null);
      } catch (error) {
        console.error('Error in consent callback:', error);
      }
    });
  }
  
  // 获取同意记录
  getConsent() {
    return this.consent;
  }
}

// 2. 使用示例
document.addEventListener('DOMContentLoaded', () => {
  // 创建GDPR合规管理器
  const gdprManager = new GDPRComplianceManager({
    cookieConsentRequired: true,
    dataProcessingConsentRequired: true,
    consentStorageKey: 'gdpr_consent',
    consentExpiryDays: 365,
    privacyPolicyUrl: '/privacy-policy'
  });
  
  // 将管理器暴露到全局
  window.gdprManager = gdprManager;
  
  // 添加同意变化回调
  gdprManager.onConsentChange((consent) => {
    if (consent && consent.analytics) {
      // 启用分析
      console.log('Analytics consent granted');
      // 这里可以初始化分析工具
    } else {
      // 禁用分析
      console.log('Analytics consent not granted');
      // 这里可以禁用分析工具
    }
    
    if (consent && consent.marketing) {
      // 启用营销
      console.log('Marketing consent granted');
      // 这里可以初始化营销工具
    } else {
      // 禁用营销
      console.log('Marketing consent not granted');
      // 这里可以禁用营销工具
    }
  });
  
  // 添加Cookie设置按钮
  const settingsButton = document.createElement('button');
  settingsButton.textContent = 'Cookie设置';
  settingsButton.addEventListener('click', () => {
    gdprManager.showConsentSettings();
  });
  
  // 添加到页脚
  const footer = document.querySelector('footer');
  if (footer) {
    footer.appendChild(settingsButton);
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
      enableInputValidation: true,
      enableXSSProtection: true,
      enableCSRFProtection: true,
      enableClickjackingProtection: true,
      enableSecurityMonitoring: true,
      enableGDPRCompliance: true,
      ...options
    };
    
    this.components = {};
    this.init();
  }
  
  // 初始化安全框架
  init() {
    // 初始化输入验证
    if (this.options.enableInputValidation) {
      this.components.inputValidator = new SecureInputValidator();
    }
    
    // 初始化XSS保护
    if (this.options.enableXSSProtection) {
      this.components.xssProtector = new XSSProtector();
    }
    
    // 初始化CSRF保护
    if (this.options.enableCSRFProtection) {
      this.components.csrfProtector = new CSRFProtector();
    }
    
    // 初始化点击劫持保护
    if (this.options.enableClickjackingProtection) {
      this.components.clickjackingProtector = new ClickjackingProtector();
    }
    
    // 初始化安全监控
    if (this.options.enableSecurityMonitoring) {
      this.components.securityMonitor = new SecurityMonitoringSystem();
    }
    
    // 初始化GDPR合规
    if (this.options.enableGDPRCompliance) {
      this.components.gdprManager = new GDPRComplianceManager();
    }
    
    // 初始化安全存储
    this.components.secureStorage = new SecureStorageManager();
    
    // 初始化安全路由
    this.components.secureRouter = new SecureRouter();
    
    console.log('Frontend Security Framework initialized');
  }
  
  // 执行安全检查
  performSecurityCheck() {
    const results = {
      inputValidation: this.components.inputValidator ? 
        this.components.inputValidator.validateAll() : null,
      xssProtection: this.components.xssProtector ? 
        this.components.xssProtector.checkXSSProtection() : null,
      csrfProtection: this.components.csrfProtector ? 
        this.components.csrfProtector.checkCSRFProtection() : null,
      clickjackingProtection: this.components.clickjackingProtector ? 
        this.components.clickjackingProtector.checkClickjackingProtection() : null,
      gdprCompliance: this.components.gdprManager ? 
        this.components.gdprManager.getConsent() : null
    };
    
    return results;
  }
  
  // 获取安全组件
  getComponent(name) {
    return this.components[name];
  }
  
  // 添加安全组件
  addComponent(name, component) {
    this.components[name] = component;
  }
  
  // 移除安全组件
  removeComponent(name) {
    delete this.components[name];
  }
}

// 2. 安全输入验证器
class SecureInputValidator {
  constructor() {
    this.validationRules = new Map();
    this.init();
  }
  
  // 初始化
  init() {
    // 设置默认验证规则
    this.setDefaultValidationRules();
    
    // 监听表单提交
    document.addEventListener('submit', this.handleFormSubmit.bind(this));
    
    // 监听输入事件
    document.addEventListener('input', this.handleInput.bind(this));
  }
  
  // 设置默认验证规则
  setDefaultValidationRules() {
    // 邮箱验证规则
    this.addValidationRule('email', {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/,
      errorMessage: '请输入有效的邮箱地址'
    });
    
    // 密码验证规则
    this.addValidationRule('password', {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      errorMessage: '密码必须至少8个字符，包含大小写字母、数字和特殊字符'
    });
    
    // 用户名验证规则
    this.addValidationRule('username', {
      minLength: 3,
      maxLength: 20,
      pattern: /^[a-zA-Z0-9_-]+$/,
      errorMessage: '用户名必须3-20个字符，只能包含字母、数字、下划线和连字符'
    });
    
    // URL验证规则
    this.addValidationRule('url', {
      pattern: /^https?:\\/\\/.+/,
      errorMessage: '请输入有效的URL地址'
    });
    
    // 数字验证规则
    this.addValidationRule('number', {
      pattern: /^\\d+$/,
      errorMessage: '请输入有效的数字'
    });
    
    // 电话号码验证规则
    this.addValidationRule('phone', {
      pattern: /^[\\d\\s\\-\\+\\(\\)]+$/,
      minLength: 10,
      errorMessage: '请输入有效的电话号码'
    });
  }
  
  // 添加验证规则
  addValidationRule(name, rule) {
    this.validationRules.set(name, rule);
  }
  
  // 移除验证规则
  removeValidationRule(name) {
    return this.validationRules.delete(name);
  }
  
  // 验证输入
  validateInput(value, ruleName) {
    const rule = this.validationRules.get(ruleName);
    if (!rule) {
      return { valid: true, message: '' };
    }
    
    // 检查最小长度
    if (rule.minLength && value.length < rule.minLength) {
      return { valid: false, message: rule.errorMessage };
    }
    
    // 检查最大长度
    if (rule.maxLength && value.length > rule.maxLength) {
      return { valid: false, message: rule.errorMessage };
    }
    
    // 检查模式
    if (rule.pattern && !rule.pattern.test(value)) {
      return { valid: false, message: rule.errorMessage };
    }
    
    // 检查大写字母
    if (rule.requireUppercase && !/[A-Z]/.test(value)) {
      return { valid: false, message: rule.errorMessage };
    }
    
    // 检查小写字母
    if (rule.requireLowercase && !/[a-z]/.test(value)) {
      return { valid: false, message: rule.errorMessage };
    }
    
    // 检查数字
    if (rule.requireNumbers && !/\\d/.test(value)) {
      return { valid: false, message: rule.errorMessage };
    }
    
    // 检查特殊字符
    if (rule.requireSpecialChars && !/[!@#$%^&*()_+\\-=\\[\\]{};':"\\\\|,.<>\\/?]/.test(value)) {
      return { valid: false, message: rule.errorMessage };
    }
    
    return { valid: true, message: '' };
  }
  
  // 验证表单
  validateForm(form) {
    const results = [];
    let isValid = true;
    
    // 获取所有输入元素
    const inputs = form.querySelectorAll('input, textarea, select');
    
    for (const input of inputs) {
      // 获取验证规则
      const ruleName = input.dataset.validationRule;
      if (!ruleName) continue;
      
      // 验证输入
      const validation = this.validateInput(input.value, ruleName);
      
      // 显示验证结果
      this.showValidationResult(input, validation);
      
      // 更新整体验证状态
      if (!validation.valid) {
        isValid = false;
      }
      
      // 添加到结果列表
      results.push({
        element: input,
        rule: ruleName,
        valid: validation.valid,
        message: validation.message
      });
    }
    
    return {
      valid: isValid,
      results: results
    };
  }
  
  // 验证所有表单
  validateAll() {
    const forms = document.querySelectorAll('form[data-validate="true"]');
    const results = [];
    let allValid = true;
    
    for (const form of forms) {
      const formValidation = this.validateForm(form);
      results.push({
        form: form,
        valid: formValidation.valid,
        results: formValidation.results
      });
      
      if (!formValidation.valid) {
        allValid = false;
      }
    }
    
    return {
      valid: allValid,
      results: results
    };
  }
  
  // 显示验证结果
  showValidationResult(input, validation) {
    // 移除旧的验证结果
    this.removeValidationResult(input);
    
    if (!validation.valid) {
      // 添加错误样式
      input.classList.add('validation-error');
      
      // 创建错误消息元素
      const errorElement = document.createElement('div');
      errorElement.className = 'validation-error-message';
      errorElement.textContent = validation.message;
      
      // 添加到输入元素后面
      input.parentNode.insertBefore(errorElement, input.nextSibling);
    } else {
      // 添加成功样式
      input.classList.add('validation-success');
    }
  }
  
  // 移除验证结果
  removeValidationResult(input) {
    // 移除样式类
    input.classList.remove('validation-error', 'validation-success');
    
    // 移除错误消息元素
    const errorElement = input.parentNode.querySelector('.validation-error-message');
    if (errorElement) {
      input.parentNode.removeChild(errorElement);
    }
  }
  
  // 处理表单提交
  handleFormSubmit(event) {
    const form = event.target;
    
    // 检查表单是否需要验证
    if (form.dataset.validate !== 'true') {
      return;
    }
    
    // 验证表单
    const validation = this.validateForm(form);
    
    // 如果验证失败，阻止提交
    if (!validation.valid) {
      event.preventDefault();
      
      // 聚焦到第一个错误输入
      const firstError = validation.results.find(result => !result.valid);
      if (firstError) {
        firstError.element.focus();
      }
    }
  }
  
  // 处理输入事件
  handleInput(event) {
    const input = event.target;
    
    // 检查输入是否需要验证
    const ruleName = input.dataset.validationRule;
    if (!ruleName) {
      return;
    }
    
    // 如果输入为空，清除验证结果
    if (!input.value) {
      this.removeValidationResult(input);
      return;
    }
    
    // 验证输入
    const validation = this.validateInput(input.value, ruleName);
    
    // 显示验证结果
    this.showValidationResult(input, validation);
  }
}

// 3. XSS保护器
class XSSProtector {
  constructor() {
    this.init();
  }
  
  // 初始化
  init() {
    // 拦截innerHTML设置
    this.interceptInnerHTML();
    
    // 拦截outerHTML设置
    this.interceptOuterHTML();
    
    // 拦截DOM插入方法
    this.interceptDOMInsertion();
    
    // 拦截eval
    this.interceptEval();
    
    // 拦截setTimeout/setInterval
    this.interceptTimers();
  }
  
  // 拦截innerHTML设置
  interceptInnerHTML() {
    const originalDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    
    Object.defineProperty(Element.prototype, 'innerHTML', {
      set: function(value) {
        // 清理HTML内容
        const cleanHTML = window.securityFramework.getComponent('xssProtector').sanitizeHTML(value);
        return originalDescriptor.set.call(this, cleanHTML);
      },
      
      get: function() {
        return originalDescriptor.get.call(this);
      },
      
      configurable: true
    });
  }
  
  // 拦截outerHTML设置
  interceptOuterHTML() {
    const originalDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'outerHTML');
    
    Object.defineProperty(Element.prototype, 'outerHTML', {
      set: function(value) {
        // 清理HTML内容
        const cleanHTML = window.securityFramework.getComponent('xssProtector').sanitizeHTML(value);
        return originalDescriptor.set.call(this, cleanHTML);
      },
      
      get: function() {
        return originalDescriptor.get.call(this);
      },
      
      configurable: true
    });
  }
  
  // 拦截DOM插入方法
  interceptDOMInsertion() {
    // 保存原始方法
    const originalInsertAdjacentHTML = Element.prototype.insertAdjacentHTML;
    
    // 重写方法
    Element.prototype.insertAdjacentHTML = function(position, text) {
      // 清理HTML内容
      const cleanHTML = window.securityFramework.getComponent('xssProtector').sanitizeHTML(text);
      return originalInsertAdjacentHTML.call(this, position, cleanHTML);
    };
    
    // 保存原始方法
    const originalCreateContextualFragment = Range.prototype.createContextualFragment;
    
    // 重写方法
    Range.prototype.createContextualFragment = function(tagString) {
      // 清理HTML内容
      const cleanHTML = window.securityFramework.getComponent('xssProtector').sanitizeHTML(tagString);
      return originalCreateContextualFragment.call(this, cleanHTML);
    };
  }
  
  // 拦截eval
  interceptEval() {
    const originalEval = window.eval;
    
    window.eval = function(code) {
      // 检查代码是否包含危险内容
      if (window.securityFramework.getComponent('xssProtector').containsDangerousCode(code)) {
        console.warn('Dangerous code detected in eval:', code);
        throw new Error('Dangerous code detected');
      }
      
      return originalEval.call(this, code);
    };
  }
  
  // 拦截setTimeout/setInterval
  interceptTimers() {
    // 保存原始方法
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    
    // 重写setTimeout
    window.setTimeout = function(callback, delay, ...args) {
      if (typeof callback === 'string') {
        // 检查字符串是否包含危险内容
        if (window.securityFramework.getComponent('xssProtector').containsDangerousCode(callback)) {
          console.warn('Dangerous code detected in setTimeout:', callback);
          throw new Error('Dangerous code detected');
        }
      }
      
      return originalSetTimeout.call(this, callback, delay, ...args);
    };
    
    // 重写setInterval
    window.setInterval = function(callback, delay, ...args) {
      if (typeof callback === 'string') {
        // 检查字符串是否包含危险内容
        if (window.securityFramework.getComponent('xssProtector').containsDangerousCode(callback)) {
          console.warn('Dangerous code detected in setInterval:', callback);
          throw new Error('Dangerous code detected');
        }
      }
      
      return originalSetInterval.call(this, callback, delay, ...args);
    };
  }
  
  // 清理HTML
  sanitizeHTML(html) {
    // 这里应该使用专业的HTML清理库，如DOMPurify
    // 简化示例，只做基本清理
    
    // 移除脚本标签
    let cleanHTML = html.replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '');
    
    // 移除事件处理器
    cleanHTML = cleanHTML.replace(/\\s+on\\w+="[^"]*"/gi, '');
    cleanHTML = cleanHTML.replace(/\\s+on\\w+='[^']*'/gi, '');
    
    // 移除javascript:协议
    cleanHTML = cleanHTML.replace(/javascript:/gi, '');
    
    // 移除data:协议（除了图片）
    cleanHTML = cleanHTML.replace(/data:(?!image\\/)/gi, '');
    
    return cleanHTML;
  }
  
  // 检查是否包含危险代码
  containsDangerousCode(code) {
    // 检查常见危险模式
    const dangerousPatterns = [
      /eval\\s*\\(/gi,
      /Function\\s*\\(/gi,
      /setTimeout\\s*\\(\\s*["']/gi,
      /setInterval\\s*\\(\\s*["']/gi,
      /document\\.write\\s*\\(/gi,
      /document\\.writeln\\s*\\(/gi,
      /innerHTML\\s*=/gi,
      /outerHTML\\s*=/gi,
      /insertAdjacentHTML\\s*\\(/gi,
      /createContextualFragment\\s*\\(/gi
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return true;
      }
    }
    
    return false;
  }
  
  // 检查XSS保护
  checkXSSProtection() {
    // 检查CSP
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      return {
        status: 'warning',
        message: 'Content Security Policy not found'
      };
    }
    
    // 检查X-XSS-Protection
    const xXSSProtectionMeta = document.querySelector('meta[http-equiv="X-XSS-Protection"]');
    if (!xXSSProtectionMeta) {
      return {
        status: 'warning',
        message: 'X-XSS-Protection header not found'
      };
    }
    
    return {
      status: 'pass',
      message: 'XSS protection is enabled'
    };
  }
}

// 4. CSRF保护器
class CSRFProtector {
  constructor() {
    this.token = null;
    this.init();
  }
  
  // 初始化
  init() {
    // 获取CSRF令牌
    this.fetchCSRFToken();
    
    // 拦截表单提交
    this.interceptFormSubmit();
    
    // 拦截AJAX请求
    this.interceptAJAX();
  }
  
  // 获取CSRF令牌
  fetchCSRFToken() {
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
    this.requestCSRFToken();
  }
  
  // 请求CSRF令牌
  requestCSRFToken() {
    fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
      this.token = data.token;
      
      // 存储到Cookie
      SecureCodingUtils.secureCookie.setCookie('csrf_token', this.token, {
        secure: window.location.protocol === 'https:',
        sameSite: 'strict'
      });
    })
    .catch(error => {
      console.error('Failed to fetch CSRF token:', error);
    });
  }
  
  // 拦截表单提交
  interceptFormSubmit() {
    document.addEventListener('submit', (event) => {
      const form = event.target;
      
      // 只拦截POST、PUT、DELETE、PATCH表单
      const method = form.method ? form.method.toLowerCase() : 'get';
      if (!['post', 'put', 'delete', 'patch'].includes(method)) {
        return;
      }
      
      // 查找CSRF令牌字段
      let tokenField = form.querySelector('input[name="csrf_token"]');
      
      // 如果没有找到，创建一个
      if (!tokenField) {
        tokenField = document.createElement('input');
        tokenField.type = 'hidden';
        tokenField.name = 'csrf_token';
        form.appendChild(tokenField);
      }
      
      // 设置令牌值
      tokenField.value = this.token;
    });
  }
  
  // 拦截AJAX请求
  interceptAJAX() {
    // 保存原始fetch
    const originalFetch = window.fetch;
    
    // 重写fetch
    window.fetch = async (url, options = {}) => {
      // 只拦截POST、PUT、DELETE、PATCH请求
      const method = options.method ? options.method.toUpperCase() : 'GET';
      if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        return originalFetch(url, options);
      }
      
      // 准备请求头
      const headers = new Headers(options.headers || {});
      
      // 添加CSRF令牌
      if (this.token) {
        headers.set('X-CSRF-Token', this.token);
      }
      
      // 更新选项
      options.headers = headers;
      
      // 发送请求
      return originalFetch(url, options);
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
      // 只拦截POST、PUT、DELETE、PATCH请求
      const method = this._method ? this._method.toUpperCase() : 'GET';
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        // 添加CSRF令牌
        if (window.securityFramework.getComponent('csrfProtector').token) {
          this.setRequestHeader('X-CSRF-Token', 
            window.securityFramework.getComponent('csrfProtector').token);
        }
      }
      
      return originalXHRSend.call(this, data);
    };
  }
  
  // 检查CSRF保护
  checkCSRFProtection() {
    // 检查是否有CSRF令牌
    if (!this.token) {
      return {
        status: 'fail',
        message: 'CSRF token not found'
      };
    }
    
    // 检查表单是否有CSRF令牌
    const forms = document.querySelectorAll('form[method="post"], form[method="POST"], ' +
      'form[method="put"], form[method="PUT"], ' +
      'form[method="delete"], form[method="DELETE"], ' +
      'form[method="patch"], form[method="PATCH"]');
    
    let formsWithoutToken = 0;
    for (const form of forms) {
      const tokenField = form.querySelector('input[name="csrf_token"]');
      if (!tokenField) {
        formsWithoutToken++;
      }
    }
    
    if (formsWithoutToken > 0) {
      return {
        status: 'warning',
        message: \`\${formsWithoutToken} forms without CSRF token\`
      };
    }
    
    return {
      status: 'pass',
      message: 'CSRF protection is enabled'
    };
  }
}

// 5. 点击劫持保护器
class ClickjackingProtector {
  constructor() {
    this.init();
  }
  
  // 初始化
  init() {
    // 设置frame-busting脚本
    this.setupFrameBusting();
    
    // 检查是否在iframe中
    this.checkForIframe();
  }
  
  // 设置frame-busting脚本
  setupFrameBusting() {
    // 检查是否在iframe中
    if (window.self !== window.top) {
      // 如果在iframe中，跳出iframe
      window.top.location = window.location;
    }
  }
  
  // 检查是否在iframe中
  checkForIframe() {
    // 检查X-Frame-Options头
    const xFrameOptionsMeta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
    if (!xFrameOptionsMeta) {
      console.warn('X-Frame-Options header not found');
    }
    
    // 检查CSP frame-ancestors
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
      const cspContent = cspMeta.getAttribute('content');
      if (!cspContent.includes('frame-ancestors')) {
        console.warn('CSP frame-ancestors directive not found');
      }
    }
  }
  
  // 检查点击劫持保护
  checkClickjackingProtection() {
    // 检查X-Frame-Options头
    const xFrameOptionsMeta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
    if (!xFrameOptionsMeta) {
      return {
        status: 'warning',
        message: 'X-Frame-Options header not found'
      };
    }
    
    // 检查CSP frame-ancestors
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      return {
        status: 'warning',
        message: 'Content Security Policy not found'
      };
    }
    
    const cspContent = cspMeta.getAttribute('content');
    if (!cspContent.includes('frame-ancestors')) {
      return {
        status: 'warning',
        message: 'CSP frame-ancestors directive not found'
      };
    }
    
    return {
      status: 'pass',
      message: 'Clickjacking protection is enabled'
    };
  }
}

// 6. 安全存储管理器
class SecureStorageManager {
  constructor() {
    this.init();
  }
  
  // 初始化
  init() {
    // 拦截localStorage
    this.interceptLocalStorage();
    
    // 拦截sessionStorage
    this.interceptSessionStorage();
    
    // 拦截Cookie
    this.interceptCookie();
  }
  
  // 拦截localStorage
  interceptLocalStorage() {
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    const originalRemoveItem = localStorage.removeItem;
    
    localStorage.setItem = function(key, value) {
      // 加密敏感数据
      if (window.securityFramework.getComponent('secureStorage').isSensitiveData(key)) {
        value = window.securityFramework.getComponent('secureStorage').encrypt(value);
      }
      
      return originalSetItem.call(this, key, value);
    };
    
    localStorage.getItem = function(key) {
      const value = originalGetItem.call(this, key);
      
      // 解密敏感数据
      if (value && window.securityFramework.getComponent('secureStorage').isSensitiveData(key)) {
        return window.securityFramework.getComponent('secureStorage').decrypt(value);
      }
      
      return value;
    };
    
    localStorage.removeItem = function(key) {
      return originalRemoveItem.call(this, key);
    };
  }
  
  // 拦截sessionStorage
  interceptSessionStorage() {
    const originalSetItem = sessionStorage.setItem;
    const originalGetItem = sessionStorage.getItem;
    const originalRemoveItem = sessionStorage.removeItem;
    
    sessionStorage.setItem = function(key, value) {
      // 加密敏感数据
      if (window.securityFramework.getComponent('secureStorage').isSensitiveData(key)) {
        value = window.securityFramework.getComponent('secureStorage').encrypt(value);
      }
      
      return originalSetItem.call(this, key, value);
    };
    
    sessionStorage.getItem = function(key) {
      const value = originalGetItem.call(this, key);
      
      // 解密敏感数据
      if (value && window.securityFramework.getComponent('secureStorage').isSensitiveData(key)) {
        return window.securityFramework.getComponent('secureStorage').decrypt(value);
      }
      
      return value;
    };
    
    sessionStorage.removeItem = function(key) {
      return originalRemoveItem.call(this, key);
    };
  }
  
  // 拦截Cookie
  interceptCookie() {
    const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    
    Object.defineProperty(document, 'cookie', {
      set: function(value) {
        // 加密敏感数据
        if (window.securityFramework.getComponent('secureStorage').isSensitiveCookie(value)) {
          value = window.securityFramework.getComponent('secureStorage').encryptCookie(value);
        }
        
        return originalDescriptor.set.call(this, value);
      },
      
      get: function() {
        const cookies = originalDescriptor.get.call(this);
        
        // 解密敏感Cookie
        return window.securityFramework.getComponent('secureStorage').decryptCookies(cookies);
      },
      
      configurable: true
    });
  }
  
  // 检查是否是敏感数据
  isSensitiveData(key) {
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'session',
      'credit', 'card', 'ssn', 'social', 'security', 'private'
    ];
    
    return sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey)
    );
  }
  
  // 检查是否是敏感Cookie
  isSensitiveCookie(cookieString) {
    const cookieName = cookieString.split('=')[0];
    return this.isSensitiveData(cookieName);
  }
  
  // 加密数据
  encrypt(data) {
    // 这里应该使用专业的加密库，如CryptoJS
    // 简化示例，使用Base64编码
    return btoa(data);
  }
  
  // 解密数据
  decrypt(encryptedData) {
    try {
      // 这里应该使用专业的解密库，如CryptoJS
      // 简化示例，使用Base64解码
      return atob(encryptedData);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  }
  
  // 加密Cookie
  encryptCookie(cookieString) {
    const parts = cookieString.split(';');
    const mainPart = parts[0];
    const attributes = parts.slice(1);
    
    const [name, value] = mainPart.split('=');
    const encryptedValue = this.encrypt(value);
    
    const encryptedCookie = \`\${name}=\${encryptedValue}\`;
    
    if (attributes.length > 0) {
      return \`\${encryptedCookie}; \${attributes.join('; ')}\`;
    }
    
    return encryptedCookie;
  }
  
  // 解密Cookie
  decryptCookies(cookieString) {
    if (!cookieString) {
      return cookieString;
    }
    
    const cookies = cookieString.split('; ');
    const decryptedCookies = [];
    
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      
      if (this.isSensitiveData(name)) {
        try {
          const decryptedValue = this.decrypt(value);
          decryptedCookies.push(\`\${name}=\${decryptedValue}\`);
        } catch (error) {
          console.error('Failed to decrypt cookie:', error);
          decryptedCookies.push(cookie);
        }
      } else {
        decryptedCookies.push(cookie);
      }
    }
    
    return decryptedCookies.join('; ');
  }
}

// 7. 安全路由
class SecureRouter {
  constructor() {
    this.protectedRoutes = new Map();
    this.init();
  }
  
  // 初始化
  init() {
    // 监听路由变化
    this.setupRouteListeners();
  }
  
  // 设置路由监听器
  setupRouteListeners() {
    // 监听hash变化
    window.addEventListener('hashchange', this.handleRouteChange.bind(this));
    
    // 监听popstate事件
    window.addEventListener('popstate', this.handleRouteChange.bind(this));
    
    // 拦截pushState和replaceState
    this.interceptHistoryMethods();
    
    // 检查当前路由
    this.checkCurrentRoute();
  }
  
  // 拦截History方法
  interceptHistoryMethods() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(state, title, url) {
      const result = originalPushState.call(this, state, title, url);
      
      // 触发路由变化事件
      window.dispatchEvent(new Event('routechange'));
      
      return result;
    };
    
    history.replaceState = function(state, title, url) {
      const result = originalReplaceState.call(this, state, title, url);
      
      // 触发路由变化事件
      window.dispatchEvent(new Event('routechange'));
      
      return result;
    };
  }
  
  // 处理路由变化
  handleRouteChange() {
    this.checkCurrentRoute();
  }
  
  // 检查当前路由
  checkCurrentRoute() {
    const currentPath = window.location.pathname;
    
    // 检查是否是受保护的路由
    if (this.protectedRoutes.has(currentPath)) {
      const routeConfig = this.protectedRoutes.get(currentPath);
      
      // 检查权限
      if (!this.checkPermissions(routeConfig.requiredPermissions)) {
        this.handleUnauthorizedAccess(routeConfig);
      }
    }
  }
  
  // 检查权限
  checkPermissions(requiredPermissions) {
    // 这里应该根据实际应用检查用户权限
    // 简化示例，假设用户有所有权限
    return true;
  }
  
  // 处理未授权访问
  handleUnauthorizedAccess(routeConfig) {
    // 记录安全事件
    if (window.securityFramework && window.securityFramework.getComponent('securityMonitor')) {
      window.securityFramework.getComponent('securityMonitor').logSecurityEvent(
        'unauthorized_route_access',
        {
          route: window.location.pathname,
          requiredPermissions: routeConfig.requiredPermissions
        },
        'high'
      );
    }
    
    // 重定向到登录页面或403页面
    if (routeConfig.redirectUrl) {
      window.location.href = routeConfig.redirectUrl;
    } else {
      window.location.href = '/login';
    }
  }
  
  // 添加受保护的路由
  addProtectedRoute(path, config) {
    this.protectedRoutes.set(path, config);
  }
  
  // 移除受保护的路由
  removeProtectedRoute(path) {
    return this.protectedRoutes.delete(path);
  }
}

// 8. 使用示例
document.addEventListener('DOMContentLoaded', () => {
  // 创建前端安全框架
  const securityFramework = new FrontendSecurityFramework({
    enableInputValidation: true,
    enableXSSProtection: true,
    enableCSRFProtection: true,
    enableClickjackingProtection: true,
    enableSecurityMonitoring: true,
    enableGDPRCompliance: true
  });
  
  // 将框架暴露到全局
  window.securityFramework = securityFramework;
  
  // 添加受保护的路由
  securityFramework.getComponent('secureRouter').addProtectedRoute('/admin', {
    requiredPermissions: ['admin'],
    redirectUrl: '/login'
  });
  
  securityFramework.getComponent('secureRouter').addProtectedRoute('/profile', {
    requiredPermissions: ['user'],
    redirectUrl: '/login'
  });
  
  // 执行安全检查
  const securityCheck = securityFramework.performSecurityCheck();
  console.log('Security check results:', securityCheck);
  
  // 添加自定义安全检查
  setInterval(() => {
    const results = securityFramework.performSecurityCheck();
    
    // 如果有任何检查失败，记录事件
    for (const [component, result] of Object.entries(results)) {
      if (result && result.status === 'fail') {
        securityFramework.getComponent('securityMonitor').logSecurityEvent(
          'security_check_failed',
          {
            component: component,
            message: result.message
          },
          'medium'
        );
      }
    }
  }, 300000); // 每5分钟检查一次
});
\`\`\`

## 总结

本文介绍了前端安全监控与响应、数据保护合规以及综合安全架构设计，包括：

1. **安全监控与响应**：
   - 实时安全监控系统
   - 异常活动检测
   - 安全事件记录与警报

2. **数据保护合规**：
   - GDPR合规管理
   - Cookie同意管理
   - 数据处理同意检查

3. **综合安全架构设计**：
   - 前端安全框架
   - 安全输入验证
   - XSS保护
   - CSRF保护
   - 点击劫持保护
   - 安全存储管理
   - 安全路由

通过这些技术和方法，可以构建全面的前端安全防护体系，确保应用的安全性和合规性。在实际项目中，还需要根据具体需求和安全威胁，不断调整和完善安全策略。`;export{n as default};
//# sourceMappingURL=26-2-DVJRYOGN.js.map
