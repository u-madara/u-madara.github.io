const e=`---
title: "微前端监控与运维实践"
excerpt: "深入探讨微前端的监控方案、告警机制、性能优化策略，以及如何构建高效的微前端运维体系，帮助开发者构建可靠、可观测的微前端系统"
coverImage: "/assets/blog/hello-world/cover.jpg"
date: "2025-11-30"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---

# 微前端监控与运维实践

## 引言

微前端架构将大型前端应用拆分为多个独立的小型应用，这种架构带来了许多优势，但同时也给监控和运维带来了新的挑战。在微前端架构中，我们需要监控多个独立应用的健康状况、性能指标和用户体验，确保整个系统的稳定运行。

本文将深入探讨微前端的监控方案、告警机制、性能优化策略，以及如何构建高效的微前端运维体系，帮助开发者构建可靠、可观测的微前端系统。

## 微前端监控方案

### 微前端监控系统

微前端监控系统需要能够监控各个微前端应用的健康状况、性能指标和用户体验，并提供统一的监控视图。

\`\`\`javascript
// 微前端监控系统
class MicroFrontendMonitor {
  constructor(options = {}) {
    this.applications = new Map();
    this.metrics = new Map();
    this.alerts = new Map();
    this.options = {
      // 指标收集间隔，默认30秒
      collectInterval: 30000,
      // 指标发送端点
      metricsEndpoint: '/api/metrics',
      // 告警发送端点
      alertEndpoint: '/api/alerts',
      // 告警阈值
      alertThresholds: {
        errorRate: 0.05, // 5%
        responseTime: 3000, // 3秒
        availability: 0.99 // 99%
      },
      ...options
    };
    
    this.initializeMonitoring();
  }
  
  // 初始化监控系统
  initializeMonitoring() {
    // 启动指标收集
    this.startMetricsCollection();
    
    // 启动告警检查
    this.startAlertChecking();
    
    // 设置性能监控
    this.setupPerformanceMonitoring();
    
    // 设置错误监控
    this.setupErrorMonitoring();
  }
  
  // 注册应用
  registerApp(appConfig) {
    const app = {
      name: appConfig.name,
      url: appConfig.url,
      healthCheck: appConfig.healthCheck || '/health',
      dependencies: appConfig.dependencies || [],
      customMetrics: appConfig.customMetrics || [],
      alertRules: appConfig.alertRules || []
    };
    
    this.applications.set(appConfig.name, app);
    
    // 初始化应用指标
    this.metrics.set(appConfig.name, {
      availability: {
        success: 0,
        total: 0,
        rate: 0
      },
      performance: {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity,
        responseTimeSum: 0,
        responseTimeCount: 0
      },
      errors: {
        count: 0,
        rate: 0,
        types: new Map()
      },
      custom: {}
    });
    
    console.log(\`Registered app for monitoring: \${appConfig.name}\`);
  }
  
  // 启动指标收集
  startMetricsCollection() {
    setInterval(() => {
      this.collectMetrics();
    }, this.options.collectInterval);
  }
  
  // 收集指标
  async collectMetrics() {
    for (const [appName, app] of this.applications) {
      try {
        // 收集可用性指标
        await this.collectAvailabilityMetrics(appName, app);
        
        // 收集性能指标
        await this.collectPerformanceMetrics(appName, app);
        
        // 收集自定义指标
        await this.collectCustomMetrics(appName, app);
      } catch (error) {
        console.error(\`Failed to collect metrics for \${appName}:\`, error);
      }
    }
    
    // 发送指标
    this.sendMetrics();
  }
  
  // 收集可用性指标
  async collectAvailabilityMetrics(appName, app) {
    const metrics = this.metrics.get(appName);
    const healthCheckUrl = \`\${app.url}\${app.healthCheck}\`;
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(healthCheckUrl, {
        method: 'GET',
        cache: 'no-cache'
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        metrics.availability.success++;
        metrics.performance.responseTimeSum += responseTime;
        metrics.performance.responseTimeCount++;
        
        if (responseTime > metrics.performance.maxResponseTime) {
          metrics.performance.maxResponseTime = responseTime;
        }
        
        if (responseTime < metrics.performance.minResponseTime) {
          metrics.performance.minResponseTime = responseTime;
        }
      } else {
        metrics.availability.total++;
        metrics.availability.rate = metrics.availability.success / metrics.availability.total;
        
        // 记录错误
        this.recordError(appName, 'health_check_failed', \`HTTP \${response.status}\`);
      }
    } catch (error) {
      metrics.availability.total++;
      metrics.availability.rate = metrics.availability.success / metrics.availability.total;
      
      // 记录错误
      this.recordError(appName, 'health_check_failed', error.message);
    }
  }
  
  // 收集性能指标
  async collectPerformanceMetrics(appName, app) {
    // 在实际项目中，这里会收集更多性能指标
    // 这里简化为空实现
  }
  
  // 收集自定义指标
  async collectCustomMetrics(appName, app) {
    for (const metricConfig of app.customMetrics) {
      try {
        const metricUrl = \`\${app.url}\${metricConfig.endpoint}\`;
        const response = await fetch(metricUrl);
        
        if (response.ok) {
          const data = await response.json();
          
          const metrics = this.metrics.get(appName);
          metrics.custom[metricConfig.name] = data.value;
        }
      } catch (error) {
        console.error(\`Failed to collect custom metric \${metricConfig.name} for \${appName}:\`, error);
      }
    }
  }
  
  // 记录错误
  recordError(appName, errorType, errorMessage) {
    const metrics = this.metrics.get(appName);
    
    metrics.errors.count++;
    
    if (!metrics.errors.types.has(errorType)) {
      metrics.errors.types.set(errorType, {
        count: 0,
        messages: []
      });
    }
    
    const errorTypeInfo = metrics.errors.types.get(errorType);
    errorTypeInfo.count++;
    
    // 限制错误消息数量
    if (errorTypeInfo.messages.length < 10) {
      errorTypeInfo.messages.push(errorMessage);
    }
    
    // 计算错误率
    metrics.errors.rate = metrics.errors.count / metrics.availability.total;
  }
  
  // 发送指标
  sendMetrics() {
    const metricsData = {
      timestamp: Date.now(),
      applications: {}
    };
    
    this.metrics.forEach((metrics, appName) => {
      // 计算平均响应时间
      if (metrics.performance.responseTimeCount > 0) {
        metrics.performance.avgResponseTime = 
          metrics.performance.responseTimeSum / metrics.performance.responseTimeCount;
      }
      
      metricsData.applications[appName] = {
        availability: metrics.availability.rate,
        avgResponseTime: metrics.performance.avgResponseTime,
        maxResponseTime: metrics.performance.maxResponseTime,
        errorRate: metrics.errors.rate,
        errorCount: metrics.errors.count,
        custom: metrics.custom
      };
    });
    
    // 在实际项目中，这里会发送到监控系统
    console.log('Sending metrics:', metricsData);
    
    // 也可以使用sendBeacon API
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon(this.options.metricsEndpoint, JSON.stringify(metricsData));
    }
  }
  
  // 启动告警检查
  startAlertChecking() {
    setInterval(() => {
      this.checkAlerts();
    }, this.options.collectInterval);
  }
  
  // 检查告警
  checkAlerts() {
    for (const [appName, app] of this.applications) {
      const metrics = this.metrics.get(appName);
      
      // 检查可用性告警
      if (metrics.availability.rate < this.options.alertThresholds.availability) {
        this.triggerAlert(appName, 'availability', \`Availability is \${(metrics.availability.rate * 100).toFixed(2)}%\`, 'warning');
      }
      
      // 检查响应时间告警
      if (metrics.performance.avgResponseTime > this.options.alertThresholds.responseTime) {
        this.triggerAlert(appName, 'response_time', \`Average response time is \${metrics.performance.avgResponseTime.toFixed(2)}ms\`, 'warning');
      }
      
      // 检查错误率告警
      if (metrics.errors.rate > this.options.alertThresholds.errorRate) {
        this.triggerAlert(appName, 'error_rate', \`Error rate is \${(metrics.errors.rate * 100).toFixed(2)}%\`, 'critical');
      }
      
      // 检查自定义告警规则
      for (const rule of app.alertRules) {
        this.checkCustomAlert(appName, rule, metrics);
      }
    }
  }
  
  // 检查自定义告警
  checkCustomAlert(appName, rule, metrics) {
    let value;
    
    if (rule.metricType === 'custom') {
      value = metrics.custom[rule.metricName];
    } else {
      value = metrics[rule.metricType][rule.metricName];
    }
    
    if (value === undefined) {
      return;
    }
    
    let triggered = false;
    
    switch (rule.operator) {
      case 'gt':
        triggered = value > rule.threshold;
        break;
      case 'lt':
        triggered = value < rule.threshold;
        break;
      case 'eq':
        triggered = value === rule.threshold;
        break;
      case 'ne':
        triggered = value !== rule.threshold;
        break;
      default:
        console.warn(\`Unknown alert operator: \${rule.operator}\`);
        return;
    }
    
    if (triggered) {
      this.triggerAlert(
        appName,
        rule.name,
        \`\${rule.metricName} is \${value} (threshold: \${rule.threshold})\`,
        rule.severity || 'warning'
      );
    }
  }
  
  // 触发告警
  triggerAlert(appName, alertType, message, severity) {
    const alertId = \`\${appName}-\${alertType}-\${Date.now()}\`;
    
    // 检查是否已有相同的活跃告警
    const existingAlert = Array.from(this.alerts.values()).find(alert => 
      alert.appName === appName &&
      alert.type === alertType &&
      alert.status === 'active'
    );
    
    if (existingAlert) {
      // 更新现有告警
      existingAlert.lastTriggered = Date.now();
      existingAlert.count++;
      return;
    }
    
    const alert = {
      id: alertId,
      appName,
      type: alertType,
      message,
      severity,
      status: 'active',
      created: Date.now(),
      lastTriggered: Date.now(),
      count: 1,
      acknowledged: false,
      resolved: false
    };
    
    this.alerts.set(alertId, alert);
    
    // 发送告警通知
    this.sendAlert(alert);
    
    console.warn(\`Alert triggered: \${alertId} - \${message}\`);
  }
  
  // 发送告警
  sendAlert(alert) {
    const alertData = {
      id: alert.id,
      appName: alert.appName,
      type: alert.type,
      message: alert.message,
      severity: alert.severity,
      timestamp: alert.created
    };
    
    // 在实际项目中，这里会发送到告警系统
    console.log('Sending alert:', alertData);
    
    // 也可以使用sendBeacon API
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon(this.options.alertEndpoint, JSON.stringify(alertData));
    }
  }
  
  // 确认告警
  acknowledgeAlert(alertId) {
    const alert = this.alerts.get(alertId);
    
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      
      console.log(\`Alert \${alertId} acknowledged\`);
      return true;
    }
    
    return false;
  }
  
  // 解决告警
  resolveAlert(alertId) {
    const alert = this.alerts.get(alertId);
    
    if (alert) {
      alert.status = 'resolved';
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      
      console.log(\`Alert \${alertId} resolved\`);
      return true;
    }
    
    return false;
  }
  
  // 设置性能监控
  setupPerformanceMonitoring() {
    // 监控页面加载性能
    if ('PerformanceObserver' in window) {
      const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            // 记录页面加载性能
            this.recordPagePerformance(entry);
          }
        }
      });
      
      perfObserver.observe({ entryTypes: ['navigation'] });
    }
    
    // 监控资源加载性能
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            // 记录资源加载性能
            this.recordResourcePerformance(entry);
          }
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }
  
  // 记录页面性能
  recordPagePerformance(entry) {
    // 在实际项目中，这里会记录页面性能指标
    console.log('Page performance:', {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      domParse: entry.domContentLoadedEventStart - entry.responseEnd,
      domReady: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart
    });
  }
  
  // 记录资源性能
  recordResourcePerformance(entry) {
    // 在实际项目中，这里会记录资源性能指标
    console.log('Resource performance:', {
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize || 0
    });
  }
  
  // 设置错误监控
  setupErrorMonitoring() {
    // 监控JavaScript错误
    window.addEventListener('error', (event) => {
      this.recordError('global', 'javascript_error', event.message);
    });
    
    // 监控Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('global', 'promise_rejection', event.reason);
    });
  }
  
  // 获取应用指标
  getAppMetrics(appName) {
    return this.metrics.get(appName);
  }
  
  // 获取所有应用指标
  getAllMetrics() {
    const allMetrics = {};
    
    this.metrics.forEach((metrics, appName) => {
      allMetrics[appName] = metrics;
    });
    
    return allMetrics;
  }
  
  // 获取告警
  getAlerts(options = {}) {
    let alerts = Array.from(this.alerts.values());
    
    // 过滤状态
    if (options.status) {
      alerts = alerts.filter(alert => alert.status === options.status);
    }
    
    // 过滤应用
    if (options.appName) {
      alerts = alerts.filter(alert => alert.appName === options.appName);
    }
    
    // 过滤严重程度
    if (options.severity) {
      alerts = alerts.filter(alert => alert.severity === options.severity);
    }
    
    // 排序
    alerts.sort((a, b) => b.created - a.created);
    
    return alerts;
  }
  
  // 获取告警统计
  getAlertStats() {
    const stats = {
      total: this.alerts.size,
      active: 0,
      resolved: 0,
      bySeverity: {
        critical: 0,
        warning: 0,
        info: 0
      },
      byApp: {}
    };
    
    this.alerts.forEach(alert => {
      // 按状态统计
      if (alert.status === 'active') {
        stats.active++;
      } else if (alert.status === 'resolved') {
        stats.resolved++;
      }
      
      // 按严重程度统计
      if (stats.bySeverity[alert.severity] !== undefined) {
        stats.bySeverity[alert.severity]++;
      }
      
      // 按应用统计
      if (!stats.byApp[alert.appName]) {
        stats.byApp[alert.appName] = 0;
      }
      stats.byApp[alert.appName]++;
    });
    
    return stats;
  }
}

// 使用示例
const monitor = new MicroFrontendMonitor({
  metricsEndpoint: '/api/metrics',
  alertEndpoint: '/api/alerts',
  collectInterval: 30000,
  alertThresholds: {
    errorRate: 0.05,
    responseTime: 3000,
    availability: 0.99
  }
});

// 注册应用
monitor.registerApp({
  name: 'home',
  url: 'https://example.com/apps/home',
  healthCheck: '/health',
  customMetrics: [
    {
      name: 'active_users',
      endpoint: '/api/metrics/active-users'
    }
  ],
  alertRules: [
    {
      name: 'high_active_users',
      metricType: 'custom',
      metricName: 'active_users',
      operator: 'gt',
      threshold: 1000,
      severity: 'warning'
    }
  ]
});

monitor.registerApp({
  name: 'product',
  url: 'https://example.com/apps/product',
  healthCheck: '/api/health',
  dependencies: ['auth', 'catalog']
});

// 获取指标
setTimeout(() => {
  const metrics = monitor.getAllMetrics();
  console.log('Metrics:', metrics);
}, 60000);

// 获取告警
setTimeout(() => {
  const alerts = monitor.getAlerts({ status: 'active' });
  console.log('Active alerts:', alerts);
  
  const stats = monitor.getAlertStats();
  console.log('Alert stats:', stats);
}, 60000);
\`\`\`

## 实际应用案例

### 电商平台微前端部署与运维

下面是一个完整的电商平台微前端部署与运维案例：

\`\`\`javascript
// 电商平台微前端部署与运维系统
class EcommercePlatformOps {
  constructor() {
    this.deployment = new MicroFrontendDeployment({
      apps: [
        {
          name: 'shell',
          repository: 'https://github.com/ecommerce/shell.git',
          buildCommand: 'npm run build',
          outputDirectory: 'dist',
          healthCheck: '/health',
          deploymentHooks: {
            beforeDeploy: async (context) => {
              console.log('Before deploy hook for shell app', context);
            },
            afterDeploy: async (context) => {
              console.log('After deploy hook for shell app', context);
            }
          }
        },
        {
          name: 'home',
          repository: 'https://github.com/ecommerce/home.git',
          buildCommand: 'npm run build',
          outputDirectory: 'dist',
          healthCheck: '/health',
          dependencies: ['shell']
        },
        {
          name: 'product',
          repository: 'https://github.com/ecommerce/product.git',
          buildCommand: 'npm run build',
          outputDirectory: 'dist',
          healthCheck: '/api/health',
          dependencies: ['shell', 'auth']
        },
        {
          name: 'cart',
          repository: 'https://github.com/ecommerce/cart.git',
          buildCommand: 'npm run build',
          outputDirectory: 'dist',
          healthCheck: '/api/health',
          dependencies: ['shell', 'auth']
        },
        {
          name: 'checkout',
          repository: 'https://github.com/ecommerce/checkout.git',
          buildCommand: 'npm run build',
          outputDirectory: 'dist',
          healthCheck: '/api/health',
          dependencies: ['shell', 'auth', 'cart']
        }
      ]
    });
    
    this.coordinatedDeployment = new CoordinatedDeployment({
      deploymentGroup: [
        {
          name: 'shell',
          repository: 'https://github.com/ecommerce/shell.git',
          dependencies: []
        },
        {
          name: 'auth',
          repository: 'https://github.com/ecommerce/auth.git',
          dependencies: ['shell']
        },
        {
          name: 'home',
          repository: 'https://github.com/ecommerce/home.git',
          dependencies: ['shell']
        },
        {
          name: 'product',
          repository: 'https://github.com/ecommerce/product.git',
          dependencies: ['shell', 'auth']
        },
        {
          name: 'cart',
          repository: 'https://github.com/ecommerce/cart.git',
          dependencies: ['shell', 'auth']
        },
        {
          name: 'checkout',
          repository: 'https://github.com/ecommerce/checkout.git',
          dependencies: ['shell', 'auth', 'cart']
        }
      ],
      deploymentTimeout: 600000, // 10分钟
      rollbackOnFailure: true
    });
    
    this.cicd = new MicroFrontendCICD({
      pipelineName: 'ecommerce-pipeline',
      stages: ['checkout', 'install', 'test', 'build', 'deploy'],
      artifactsRetention: 30,
      parallelDeployment: true
    });
    
    this.monitor = new MicroFrontendMonitor({
      metricsEndpoint: '/api/metrics',
      alertEndpoint: '/api/alerts',
      collectInterval: 30000,
      alertThresholds: {
        errorRate: 0.02, // 2%
        responseTime: 2000, // 2秒
        availability: 0.995 // 99.5%
      }
    });
    
    this.initializeMonitoring();
  }
  
  // 初始化监控
  initializeMonitoring() {
    // 注册应用监控
    this.monitor.registerApp({
      name: 'shell',
      url: 'https://ecommerce.example.com',
      healthCheck: '/health',
      customMetrics: [
        {
          name: 'page_views',
          endpoint: '/api/metrics/page-views'
        }
      ],
      alertRules: [
        {
          name: 'high_error_rate',
          metricType: 'errors',
          metricName: 'rate',
          operator: 'gt',
          threshold: 0.01,
          severity: 'critical'
        }
      ]
    });
    
    this.monitor.registerApp({
      name: 'home',
      url: 'https://ecommerce.example.com/apps/home',
      healthCheck: '/health',
      dependencies: ['shell']
    });
    
    this.monitor.registerApp({
      name: 'product',
      url: 'https://ecommerce.example.com/apps/product',
      healthCheck: '/api/health',
      dependencies: ['shell', 'auth'],
      customMetrics: [
        {
          name: 'product_views',
          endpoint: '/api/metrics/product-views'
        }
      ]
    });
    
    this.monitor.registerApp({
      name: 'cart',
      url: 'https://ecommerce.example.com/apps/cart',
      healthCheck: '/api/health',
      dependencies: ['shell', 'auth'],
      customMetrics: [
        {
          name: 'cart_additions',
          endpoint: '/api/metrics/cart-additions'
        }
      ]
    });
    
    this.monitor.registerApp({
      name: 'checkout',
      url: 'https://ecommerce.example.com/apps/checkout',
      healthCheck: '/api/health',
      dependencies: ['shell', 'auth', 'cart'],
      customMetrics: [
        {
          name: 'checkouts',
          endpoint: '/api/metrics/checkouts'
        }
      ],
      alertRules: [
        {
          name: 'low_checkout_rate',
          metricType: 'custom',
          metricName: 'checkouts',
          operator: 'lt',
          threshold: 10,
          severity: 'warning'
        }
      ]
    });
  }
  
  // 部署应用
  async deployApp(appName, version) {
    console.log(\`Deploying app \${appName} version \${version}\`);
    
    try {
      const result = await this.deployment.deployApp(appName, version);
      console.log(\`Deployment result:\`, result);
      return result;
    } catch (error) {
      console.error(\`Deployment failed:\`, error);
      throw error;
    }
  }
  
  // 协调部署
  async coordinatedDeploy(deploymentPlan) {
    console.log('Starting coordinated deployment');
    
    try {
      const result = await this.coordinatedDeployment.coordinatedDeploy(deploymentPlan);
      console.log(\`Coordinated deployment result:\`, result);
      return result;
    } catch (error) {
      console.error(\`Coordinated deployment failed:\`, error);
      throw error;
    }
  }
  
  // 创建并执行流水线
  async createAndExecutePipeline(appConfig) {
    console.log(\`Creating pipeline for app \${appConfig.name}\`);
    
    try {
      const pipeline = this.cicd.createPipeline(appConfig);
      const result = await this.cicd.executePipeline(pipeline.id);
      console.log(\`Pipeline result:\`, result);
      return result;
    } catch (error) {
      console.error(\`Pipeline failed:\`, error);
      throw error;
    }
  }
  
  // 获取系统状态
  getSystemStatus() {
    return {
      deployment: this.deployment.getAllAppsStatus(),
      pipeline: this.cicd.getAllPipelineStatus(),
      metrics: this.monitor.getAllMetrics(),
      alerts: this.monitor.getAlerts({ status: 'active' }),
      alertStats: this.monitor.getAlertStats()
    };
  }
  
  // 生成部署报告
  generateDeploymentReport() {
    const deploymentStatus = this.deployment.getAllAppsStatus();
    const metrics = this.monitor.getAllMetrics();
    
    const report = {
      timestamp: Date.now(),
      apps: {}
    };
    
    Object.keys(deploymentStatus).forEach(appName => {
      const appDeployment = deploymentStatus[appName];
      const appMetrics = metrics[appName];
      
      report.apps[appName] = {
        deployment: {
          activeVersion: appDeployment.activeVersion,
          latestDeployment: appDeployment.latestDeployment,
          deploymentCount: appDeployment.deploymentCount,
          successRate: appDeployment.successRate
        },
        metrics: {
          availability: appMetrics.availability.rate,
          avgResponseTime: appMetrics.performance.avgResponseTime,
          errorRate: appMetrics.errors.rate
        }
      };
    });
    
    return report;
  }
}

// 使用示例
const platformOps = new EcommercePlatformOps();

// 部署单个应用
platformOps.deployApp('home', '2.1.0')
  .then(result => {
    console.log('App deployment result:', result);
  })
  .catch(error => {
    console.error('App deployment failed:', error);
  });

// 协调部署
const deploymentPlan = {
  apps: [
    { name: 'shell', version: '1.5.0' },
    { name: 'auth', version: '2.3.1' },
    { name: 'home', version: '2.1.0' },
    { name: 'product', version: '3.0.2' },
    { name: 'cart', version: '1.8.1' },
    { name: 'checkout', version: '2.2.0' }
  ]
};

platformOps.coordinatedDeploy(deploymentPlan)
  .then(result => {
    console.log('Coordinated deployment result:', result);
  })
  .catch(error => {
    console.error('Coordinated deployment failed:', error);
  });

// 创建并执行流水线
platformOps.createAndExecutePipeline({
  name: 'home',
  repository: 'https://github.com/ecommerce/home.git',
  branch: 'feature/new-design'
})
  .then(result => {
    console.log('Pipeline result:', result);
  })
  .catch(error => {
    console.error('Pipeline failed:', error);
  });

// 获取系统状态
setInterval(() => {
  const status = platformOps.getSystemStatus();
  console.log('System status:', status);
}, 60000);

// 生成部署报告
setInterval(() => {
  const report = platformOps.generateDeploymentReport();
  console.log('Deployment report:', report);
}, 300000); // 每5分钟生成一次报告
\`\`\`

## 最佳实践

### 1. 运维最佳实践

1. **监控与告警**：
   - 监控关键指标，如可用性、响应时间、错误率
   - 设置合理的告警阈值，避免告警风暴
   - 实现多级告警机制，区分不同严重程度

2. **日志管理**：
   - 统一日志格式，便于集中处理
   - 实现分布式链路追踪，快速定位问题
   - 设置日志保留策略，平衡存储成本和查询需求

3. **容量规划**：
   - 监控资源使用情况，提前进行容量规划
   - 实现自动扩缩容，应对流量波动
   - 定期进行性能测试，验证系统容量

### 2. 性能优化策略

1. **资源加载优化**：
   - 实现资源预加载和懒加载
   - 使用CDN加速资源访问
   - 优化资源大小和格式

2. **应用切换优化**：
   - 实现应用预加载，减少切换延迟
   - 优化应用沙箱，提高启动速度
   - 使用缓存策略，减少重复加载

3. **运行时优化**：
   - 实现非关键任务的暂停和恢复
   - 根据网络条件调整加载策略
   - 优化内存使用，防止内存泄漏

## 总结

微前端监控与运维是确保微前端系统稳定运行的关键环节。本文详细介绍了微前端的监控方案、告警机制、性能优化策略，以及实际应用案例。

通过合理应用这些技术和实践，可以构建高效、可靠的微前端监控和运维体系，提高系统的可维护性和可扩展性。随着微前端技术的不断发展，监控与运维方案也将不断演进，为开发者提供更强大、更自动化的工具和方法。`;export{e as default};
//# sourceMappingURL=31-2-ZQC8RTFj.js.map
