const n=`---
title: "微前端部署策略与CI/CD实践（一）- 部署策略"
excerpt: "深入探讨微前端部署策略与CI/CD实践，包括独立部署模式、协调部署模式、CI/CD流水线设计和部署最佳实践，帮助团队构建高效的微前端部署体系"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-11-29"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---

# 微前端部署策略与CI/CD实践

## 引言

微前端架构将大型前端应用拆分为多个独立的小型应用，每个应用可以独立开发、测试和部署。这种架构带来了许多优势，如团队自治、技术栈灵活性和独立部署能力，但同时也给部署和运维带来了新的挑战。

本文将深入探讨微前端的部署策略、CI/CD集成方案，以及如何构建高效的微前端部署流水线，帮助开发者构建可靠、自动化的微前端部署体系。

## 微前端部署策略

### 独立部署模式

独立部署是微前端架构的核心优势之一，每个微前端应用可以独立部署，不影响其他应用的运行。

\`\`\`javascript
// 微前端独立部署管理器
class MicroFrontendDeployment {
  constructor(options = {}) {
    this.apps = new Map();
    this.deploymentHistory = new Map();
    this.deploymentListeners = new Set();
    this.options = {
      // 部署超时时间，默认5分钟
      deploymentTimeout: 5 * 60 * 1000,
      // 是否启用自动回滚
      autoRollback: true,
      // 健康检查重试次数
      healthCheckRetries: 3,
      // 健康检查间隔
      healthCheckInterval: 5000,
      ...options
    };
    
    this.initializeDeployment();
  }
  
  // 初始化部署系统
  initializeDeployment() {
    // 注册应用
    if (this.options.apps) {
      this.options.apps.forEach(appConfig => {
        this.registerApp(appConfig);
      });
    }
  }
  
  // 注册应用
  registerApp(appConfig) {
    const app = {
      name: appConfig.name,
      repository: appConfig.repository,
      branch: appConfig.branch || 'main',
      buildCommand: appConfig.buildCommand || 'npm run build',
      outputDirectory: appConfig.outputDirectory || 'dist',
      healthCheck: appConfig.healthCheck || '/health',
      dependencies: appConfig.dependencies || [],
      deploymentHooks: appConfig.deploymentHooks || {},
      deploymentStatus: 'inactive',
      activeVersion: null,
      deploymentHistory: []
    };
    
    this.apps.set(appConfig.name, app);
    console.log(\`Registered app: \${appConfig.name}\`);
  }
  
  // 部署应用
  async deployApp(appName, version) {
    const app = this.apps.get(appName);
    
    if (!app) {
      throw new Error(\`App \${appName} not found\`);
    }
    
    // 检查是否已经在部署中
    if (app.deploymentStatus === 'deploying') {
      throw new Error(\`App \${appName} is already being deployed\`);
    }
    
    console.log(\`Starting deployment of \${appName} version \${version}\`);
    
    // 更新部署状态
    app.deploymentStatus = 'deploying';
    
    const deploymentId = this.generateDeploymentId();
    const deployment = {
      id: deploymentId,
      appName,
      version,
      status: 'in_progress',
      startTime: Date.now(),
      endTime: null,
      logs: []
    };
    
    try {
      // 执行beforeDeploy钩子
      await this.executeHook(app, 'beforeDeploy', { deployment });
      
      // 构建应用
      const buildResult = await this.buildApp(app, version);
      
      // 部署应用
      const deployResult = await this.deployAppFiles(app, buildResult);
      
      // 健康检查
      await this.performHealthCheck(app);
      
      // 执行afterDeploy钩子
      await this.executeHook(app, 'afterDeploy', { deployment, buildResult, deployResult });
      
      // 更新部署状态
      app.deploymentStatus = 'active';
      app.activeVersion = version;
      
      deployment.status = 'success';
      deployment.endTime = Date.now();
      
      // 记录部署历史
      this.recordDeployment(appName, deployment);
      
      // 通知部署监听器
      this.notifyDeploymentListeners(appName, 'success', deployment);
      
      console.log(\`Successfully deployed \${appName} version \${version}\`);
      return { success: true, deploymentId, version };
      
    } catch (error) {
      console.error(\`Failed to deploy \${appName}:\`, error);
      
      // 如果启用自动回滚，则回滚到上一个版本
      if (this.options.autoRollback && app.activeVersion) {
        console.log(\`Auto-rolling back \${appName} to version \${app.activeVersion}\`);
        try {
          await this.rollbackApp(appName);
        } catch (rollbackError) {
          console.error(\`Failed to rollback \${appName}:\`, rollbackError);
        }
      }
      
      app.deploymentStatus = 'failed';
      
      deployment.status = 'failed';
      deployment.endTime = Date.now();
      deployment.error = error.message;
      
      // 记录部署历史
      this.recordDeployment(appName, deployment);
      
      // 通知部署监听器
      this.notifyDeploymentListeners(appName, 'failed', deployment);
      
      throw error;
    }
  }
  
  // 构建应用
  async buildApp(app, version) {
    console.log(\`Building \${app.name} version \${version}\`);
    
    // 在实际项目中，这里会执行真实的构建过程
    // 这里简化为模拟过程
    
    const buildSteps = [
      { name: 'checkout', duration: 2000 },
      { name: 'install', duration: 10000 },
      { name: 'build', duration: 15000 },
      { name: 'test', duration: 8000 }
    ];
    
    const buildResult = {
      version,
      startTime: Date.now(),
      endTime: null,
      steps: []
    };
    
    for (const step of buildSteps) {
      const stepStart = Date.now();
      console.log(\`Running build step: \${step.name}\`);
      
      // 模拟构建步骤
      await this.sleep(step.duration);
      
      const stepEnd = Date.now();
      buildResult.steps.push({
        name: step.name,
        startTime: stepStart,
        endTime: stepEnd,
        duration: stepEnd - stepStart,
        status: 'success'
      });
    }
    
    buildResult.endTime = Date.now();
    buildResult.duration = buildResult.endTime - buildResult.startTime;
    
    console.log(\`Build completed in \${buildResult.duration}ms\`);
    return buildResult;
  }
  
  // 部署应用文件
  async deployAppFiles(app, buildResult) {
    console.log(\`Deploying files for \${app.name}\`);
    
    // 在实际项目中，这里会执行真实的文件部署过程
    // 这里简化为模拟过程
    
    const deploySteps = [
      { name: 'upload', duration: 3000 },
      { name: 'configure', duration: 2000 },
      { name: 'activate', duration: 1000 }
    ];
    
    const deployResult = {
      version: buildResult.version,
      startTime: Date.now(),
      endTime: null,
      steps: []
    };
    
    for (const step of deploySteps) {
      const stepStart = Date.now();
      console.log(\`Running deploy step: \${step.name}\`);
      
      // 模拟部署步骤
      await this.sleep(step.duration);
      
      const stepEnd = Date.now();
      deployResult.steps.push({
        name: step.name,
        startTime: stepStart,
        endTime: stepEnd,
        duration: stepEnd - stepStart,
        status: 'success'
      });
    }
    
    deployResult.endTime = Date.now();
    deployResult.duration = deployResult.endTime - deployResult.startTime;
    
    console.log(\`Deployment completed in \${deployResult.duration}ms\`);
    return deployResult;
  }
  
  // 执行健康检查
  async performHealthCheck(app) {
    console.log(\`Performing health check for \${app.name}\`);
    
    let retries = 0;
    const maxRetries = this.options.healthCheckRetries;
    
    while (retries < maxRetries) {
      try {
        // 在实际项目中，这里会执行真实的健康检查
        // 这里简化为模拟过程
        
        const healthCheckUrl = \`\${app.url || \`https://example.com/apps/\${app.name}\`}\${app.healthCheck}\`;
        
        // 模拟健康检查
        const isHealthy = await this.simulateHealthCheck();
        
        if (isHealthy) {
          console.log(\`Health check passed for \${app.name}\`);
          return true;
        }
        
        retries++;
        console.log(\`Health check failed for \${app.name}, retrying (\${retries}/\${maxRetries})\`);
        
        if (retries < maxRetries) {
          await this.sleep(this.options.healthCheckInterval);
        }
      } catch (error) {
        retries++;
        console.error(\`Health check error for \${app.name}:\`, error.message);
        
        if (retries < maxRetries) {
          await this.sleep(this.options.healthCheckInterval);
        }
      }
    }
    
    throw new Error(\`Health check failed for \${app.name} after \${maxRetries} retries\`);
  }
  
  // 模拟健康检查
  async simulateHealthCheck() {
    // 模拟健康检查过程
    await this.sleep(1000);
    
    // 90%的概率健康检查通过
    return Math.random() > 0.1;
  }
  
  // 回滚应用
  async rollbackApp(appName) {
    const app = this.apps.get(appName);
    
    if (!app) {
      throw new Error(\`App \${appName} not found\`);
    }
    
    if (!app.activeVersion) {
      throw new Error(\`No active version to rollback for \${appName}\`);
    }
    
    // 获取上一个版本
    const previousDeployment = app.deploymentHistory
      .filter(d => d.status === 'success' && d.version !== app.activeVersion)
      .sort((a, b) => b.endTime - a.endTime)[0];
    
    if (!previousDeployment) {
      throw new Error(\`No previous version to rollback for \${appName}\`);
    }
    
    console.log(\`Rolling back \${appName} from version \${app.activeVersion} to version \${previousDeployment.version}\`);
    
    // 更新部署状态
    app.deploymentStatus = 'rolling_back';
    
    const rollbackId = this.generateDeploymentId();
    const rollback = {
      id: rollbackId,
      appName,
      type: 'rollback',
      fromVersion: app.activeVersion,
      toVersion: previousDeployment.version,
      status: 'in_progress',
      startTime: Date.now(),
      endTime: null
    };
    
    try {
      // 执行beforeRollback钩子
      await this.executeHook(app, 'beforeRollback', { rollback });
      
      // 部署上一个版本
      const deployResult = await this.deployAppFiles(app, { version: previousDeployment.version });
      
      // 健康检查
      await this.performHealthCheck(app);
      
      // 执行afterRollback钩子
      await this.executeHook(app, 'afterRollback', { rollback, deployResult });
      
      // 更新应用状态
      app.deploymentStatus = 'active';
      app.activeVersion = previousDeployment.version;
      
      rollback.status = 'success';
      rollback.endTime = Date.now();
      
      // 记录回滚历史
      this.recordDeployment(appName, rollback);
      
      // 通知部署监听器
      this.notifyDeploymentListeners(appName, 'rollback', rollback);
      
      console.log(\`Successfully rolled back \${appName} to version \${previousDeployment.version}\`);
      return { success: true, rollbackId, version: previousDeployment.version };
      
    } catch (error) {
      console.error(\`Failed to rollback \${appName}:\`, error);
      
      app.deploymentStatus = 'failed';
      
      rollback.status = 'failed';
      rollback.endTime = Date.now();
      rollback.error = error.message;
      
      // 记录回滚历史
      this.recordDeployment(appName, rollback);
      
      // 通知部署监听器
      this.notifyDeploymentListeners(appName, 'rollback_failed', rollback);
      
      throw error;
    }
  }
  
  // 执行钩子
  async executeHook(app, hookName, context) {
    const hook = app.deploymentHooks[hookName];
    
    if (typeof hook === 'function') {
      console.log(\`Executing \${hookName} hook for \${app.name}\`);
      await hook(context);
    }
  }
  
  // 更新部署状态
  updateDeploymentStatus(appName, status, details = {}) {
    const app = this.apps.get(appName);
    
    if (app) {
      app.deploymentStatus = status;
      
      // 通知部署监听器
      this.notifyDeploymentListeners(appName, 'status_change', { status, ...details });
    }
  }
  
  // 记录部署历史
  recordDeployment(appName, deployment) {
    const app = this.apps.get(appName);
    
    if (app) {
      app.deploymentHistory.push(deployment);
      
      // 限制历史记录数量
      if (app.deploymentHistory.length > 50) {
        app.deploymentHistory = app.deploymentHistory.slice(-50);
      }
    }
    
    if (!this.deploymentHistory.has(appName)) {
      this.deploymentHistory.set(appName, []);
    }
    
    this.deploymentHistory.get(appName).push(deployment);
    
    // 限制历史记录数量
    if (this.deploymentHistory.get(appName).length > 100) {
      this.deploymentHistory.set(appName, this.deploymentHistory.get(appName).slice(-100));
    }
  }
  
  // 生成部署ID
  generateDeploymentId() {
    return \`deploy_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  }
  
  // 获取应用状态
  getAppStatus(appName) {
    const app = this.apps.get(appName);
    
    if (!app) {
      throw new Error(\`App \${appName} not found\`);
    }
    
    const successCount = app.deploymentHistory.filter(d => d.status === 'success').length;
    const totalCount = app.deploymentHistory.length;
    
    return {
      name: app.name,
      status: app.deploymentStatus,
      activeVersion: app.activeVersion,
      deploymentCount: totalCount,
      successRate: totalCount > 0 ? successCount / totalCount : 0,
      latestDeployment: app.deploymentHistory.length > 0 ? 
        app.deploymentHistory[app.deploymentHistory.length - 1] : null
    };
  }
  
  // 获取所有应用状态
  getAllAppsStatus() {
    const status = {};
    
    this.apps.forEach((app, appName) => {
      status[appName] = this.getAppStatus(appName);
    });
    
    return status;
  }
  
  // 设置部署监听器
  setDeploymentListener(listener) {
    this.deploymentListeners.add(listener);
  }
  
  // 移除部署监听器
  removeDeploymentListener(listener) {
    this.deploymentListeners.delete(listener);
  }
  
  // 通知部署监听器
  notifyDeploymentListeners(appName, eventType, data) {
    this.deploymentListeners.forEach(listener => {
      try {
        listener(appName, eventType, data);
      } catch (error) {
        console.error('Error in deployment listener:', error);
      }
    });
  }
  
  // 工具方法：睡眠
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 使用示例
const deployment = new MicroFrontendDeployment({
  apps: [
    {
      name: 'home',
      repository: 'https://github.com/example/home.git',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      healthCheck: '/health'
    },
    {
      name: 'product',
      repository: 'https://github.com/example/product.git',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      healthCheck: '/api/health'
    },
    {
      name: 'checkout',
      repository: 'https://github.com/example/checkout.git',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      healthCheck: '/api/health'
    }
  ]
});

// 部署应用
deployment.deployApp('home', '1.2.0')
  .then(result => {
    console.log('Deployment result:', result);
  })
  .catch(error => {
    console.error('Deployment failed:', error);
  });

// 获取应用状态
const status = deployment.getAppStatus('home');
console.log('App status:', status);
\`\`\`

### 协调部署模式

协调部署适用于有依赖关系的微前端应用，确保按正确顺序部署，避免兼容性问题。

\`\`\`javascript
// 微前端协调部署管理器
class CoordinatedDeployment {
  constructor(options = {}) {
    this.deploymentGroup = new Map();
    this.dependencyGraph = new Map();
    this.deploymentQueue = [];
    this.deploymentHistory = [];
    this.deploymentListeners = new Set();
    this.options = {
      // 部署超时时间，默认10分钟
      deploymentTimeout: 10 * 60 * 1000,
      // 是否在失败时回滚
      rollbackOnFailure: true,
      // 是否并行部署无依赖关系的应用
      parallelDeployment: true,
      ...options
    };
    
    this.initializeDeployment();
  }
  
  // 初始化部署系统
  initializeDeployment() {
    // 注册应用
    if (this.options.deploymentGroup) {
      this.options.deploymentGroup.forEach(appConfig => {
        this.registerApp(appConfig);
      });
    }
    
    // 构建依赖图
    this.buildDependencyGraph();
  }
  
  // 注册应用
  registerApp(appConfig) {
    const app = {
      name: appConfig.name,
      repository: appConfig.repository,
      branch: appConfig.branch || 'main',
      buildCommand: appConfig.buildCommand || 'npm run build',
      outputDirectory: appConfig.outputDirectory || 'dist',
      healthCheck: appConfig.healthCheck || '/health',
      dependencies: appConfig.dependencies || [],
      deploymentStatus: 'inactive',
      activeVersion: null,
      deploymentHistory: []
    };
    
    this.deploymentGroup.set(appConfig.name, app);
    console.log(\`Registered app: \${appConfig.name}\`);
  }
  
  // 构建依赖图
  buildDependencyGraph() {
    // 清空现有依赖图
    this.dependencyGraph.clear();
    
    // 为每个应用构建依赖关系
    this.deploymentGroup.forEach((app, appName) => {
      this.dependencyGraph.set(appName, {
        app,
        dependencies: app.dependencies || [],
        dependents: []
      });
    });
    
    // 构建反向依赖关系
    this.dependencyGraph.forEach((node, appName) => {
      node.dependencies.forEach(depName => {
        if (this.dependencyGraph.has(depName)) {
          this.dependencyGraph.get(depName).dependents.push(appName);
        }
      });
    });
    
    // 检查循环依赖
    if (this.hasCircularDependency()) {
      throw new Error('Circular dependency detected in deployment group');
    }
  }
  
  // 检查循环依赖
  hasCircularDependency() {
    const visited = new Set();
    const recursionStack = new Set();
    
    const hasCycle = (appName) => {
      if (recursionStack.has(appName)) {
        return true;
      }
      
      if (visited.has(appName)) {
        return false;
      }
      
      visited.add(appName);
      recursionStack.add(appName);
      
      const node = this.dependencyGraph.get(appName);
      if (node) {
        for (const depName of node.dependencies) {
          if (hasCycle(depName)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(appName);
      return false;
    };
    
    for (const appName of this.dependencyGraph.keys()) {
      if (hasCycle(appName)) {
        return true;
      }
    }
    
    return false;
  }
  
  // 协调部署
  async coordinatedDeploy(deploymentPlan) {
    console.log('Starting coordinated deployment');
    
    const deploymentId = this.generateDeploymentId();
    const deployment = {
      id: deploymentId,
      plan: deploymentPlan,
      status: 'in_progress',
      startTime: Date.now(),
      endTime: null,
      deployedApps: [],
      failedApps: [],
      logs: []
    };
    
    try {
      // 获取部署顺序
      const deploymentOrder = this.getDeploymentOrder(deploymentPlan.apps);
      
      console.log('Deployment order:', deploymentOrder.map(app => app.name));
      
      // 按顺序部署应用
      if (this.options.parallelDeployment) {
        // 并行部署无依赖关系的应用
        await this.deployInParallel(deployment, deploymentOrder);
      } else {
        // 串行部署所有应用
        await this.deployInSequence(deployment, deploymentOrder);
      }
      
      deployment.status = 'success';
      deployment.endTime = Date.now();
      
      // 记录部署历史
      this.deploymentHistory.push(deployment);
      
      // 通知部署监听器
      this.notifyDeploymentListeners('coordinated_deployment', 'success', deployment);
      
      console.log('Coordinated deployment completed successfully');
      return { success: true, deploymentId };
      
    } catch (error) {
      console.error('Coordinated deployment failed:', error);
      
      deployment.status = 'failed';
      deployment.endTime = Date.now();
      deployment.error = error.message;
      
      // 如果启用失败回滚，则回滚已部署的应用
      if (this.options.rollbackOnFailure && deployment.deployedApps.length > 0) {
        console.log('Rolling back deployed apps');
        try {
          await this.rollbackDeployedApps(deployment);
        } catch (rollbackError) {
          console.error('Failed to rollback deployed apps:', rollbackError);
        }
      }
      
      // 记录部署历史
      this.deploymentHistory.push(deployment);
      
      // 通知部署监听器
      this.notifyDeploymentListeners('coordinated_deployment', 'failed', deployment);
      
      throw error;
    }
  }
  
  // 获取部署顺序
  getDeploymentOrder(apps) {
    const appMap = new Map();
    apps.forEach(app => {
      appMap.set(app.name, app);
    });
    
    const order = [];
    const visited = new Set();
    
    const visit = (appName) => {
      if (visited.has(appName)) {
        return;
      }
      
      visited.add(appName);
      
      const node = this.dependencyGraph.get(appName);
      if (node) {
        // 先访问依赖
        node.dependencies.forEach(depName => {
          if (appMap.has(depName)) {
            visit(depName);
          }
        });
      }
      
      // 添加到部署顺序
      if (appMap.has(appName)) {
        order.push(appMap.get(appName));
      }
    };
    
    // 访问所有应用
    apps.forEach(app => {
      visit(app.name);
    });
    
    return order;
  }
  
  // 并行部署应用
  async deployInParallel(deployment, deploymentOrder) {
    const levels = this.getDeploymentLevels(deploymentOrder);
    
    for (const level of levels) {
      console.log(\`Deploying level \${level.index} with apps: \${level.apps.map(app => app.name).join(', ')}\`);
      
      // 并行部署当前级别的所有应用
      const deployPromises = level.apps.map(app => 
        this.deployApp(deployment, app)
      );
      
      await Promise.all(deployPromises);
    }
  }
  
  // 串行部署应用
  async deployInSequence(deployment, deploymentOrder) {
    for (const app of deploymentOrder) {
      console.log(\`Deploying app: \${app.name}\`);
      await this.deployApp(deployment, app);
    }
  }
  
  // 获取部署层级
  getDeploymentLevels(deploymentOrder) {
    const levels = [];
    const processed = new Set();
    
    // 创建应用映射
    const appMap = new Map();
    deploymentOrder.forEach(app => {
      appMap.set(app.name, app);
    });
    
    // 分层
    let currentLevel = 0;
    let remainingApps = new Set(deploymentOrder.map(app => app.name));
    
    while (remainingApps.size > 0) {
      const levelApps = [];
      
      for (const appName of remainingApps) {
        const node = this.dependencyGraph.get(appName);
        
        // 检查所有依赖是否已处理
        const allDepsProcessed = node.dependencies.every(dep => 
          !appMap.has(dep) || processed.has(dep)
        );
        
        if (allDepsProcessed) {
          levelApps.push(appMap.get(appName));
        }
      }
      
      if (levelApps.length === 0) {
        throw new Error('Cannot determine deployment levels: circular dependency or missing dependencies');
      }
      
      levels.push({
        index: currentLevel,
        apps: levelApps
      });
      
      // 标记已处理的应用
      levelApps.forEach(app => {
        processed.add(app.name);
        remainingApps.delete(app.name);
      });
      
      currentLevel++;
    }
    
    return levels;
  }
  
  // 部署单个应用
  async deployApp(deployment, app) {
    console.log(\`Deploying app: \${app.name} version \${app.version}\`);
    
    try {
      // 在实际项目中，这里会调用实际的部署系统
      // 这里简化为模拟过程
      
      // 模拟部署过程
      const deploySteps = [
        { name: 'build', duration: 10000 },
        { name: 'deploy', duration: 5000 },
        { name: 'health_check', duration: 3000 }
      ];
      
      for (const step of deploySteps) {
        console.log(\`Running \${step.name} for \${app.name}\`);
        await this.sleep(step.duration);
      }
      
      // 更新应用状态
      const appNode = this.deploymentGroup.get(app.name);
      if (appNode) {
        appNode.deploymentStatus = 'active';
        appNode.activeVersion = app.version;
      }
      
      // 记录已部署应用
      deployment.deployedApps.push({
        name: app.name,
        version: app.version,
        deployedAt: Date.now()
      });
      
      console.log(\`Successfully deployed \${app.name} version \${app.version}\`);
      return { success: true, appName: app.name, version: app.version };
      
    } catch (error) {
      console.error(\`Failed to deploy \${app.name}:\`, error);
      
      // 记录失败应用
      deployment.failedApps.push({
        name: app.name,
        version: app.version,
        error: error.message,
        failedAt: Date.now()
      });
      
      throw error;
    }
  }
  
  // 回滚已部署的应用
  async rollbackDeployedApps(deployment) {
    // 按相反顺序回滚应用
    const appsToRollback = [...deployment.deployedApps].reverse();
    
    for (const app of appsToRollback) {
      try {
        console.log(\`Rolling back app: \${app.name}\`);
        
        // 在实际项目中，这里会调用实际的回滚系统
        // 这里简化为模拟过程
        await this.sleep(3000);
        
        // 更新应用状态
        const appNode = this.deploymentGroup.get(app.name);
        if (appNode) {
          appNode.deploymentStatus = 'rolled_back';
          appNode.activeVersion = null;
        }
        
        console.log(\`Successfully rolled back \${app.name}\`);
      } catch (error) {
        console.error(\`Failed to rollback \${app.name}:\`, error);
      }
    }
  }
  
  // 回滚应用
  async rollbackApp(appName) {
    const app = this.deploymentGroup.get(appName);
    
    if (!app) {
      throw new Error(\`App \${appName} not found\`);
    }
    
    console.log(\`Rolling back app: \${appName}\`);
    
    // 在实际项目中，这里会调用实际的回滚系统
    // 这里简化为模拟过程
    await this.sleep(3000);
    
    // 更新应用状态
    app.deploymentStatus = 'rolled_back';
    app.activeVersion = null;
    
    console.log(\`Successfully rolled back \${appName}\`);
    return { success: true, appName };
  }
  
  // 生成部署ID
  generateDeploymentId() {
    return \`coordinated_deploy_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  }
  
  // 获取部署状态
  getDeploymentStatus(deploymentId) {
    return this.deploymentHistory.find(d => d.id === deploymentId);
  }
  
  // 设置部署监听器
  setDeploymentListener(listener) {
    this.deploymentListeners.add(listener);
  }
  
  // 移除部署监听器
  removeDeploymentListener(listener) {
    this.deploymentListeners.delete(listener);
  }
  
  // 通知部署监听器
  notifyDeploymentListeners(eventType, status, data) {
    this.deploymentListeners.forEach(listener => {
      try {
        listener(eventType, status, data);
      } catch (error) {
        console.error('Error in deployment listener:', error);
      }
    });
  }
  
  // 工具方法：睡眠
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 使用示例
const coordinatedDeployment = new CoordinatedDeployment({
  deploymentGroup: [
    {
      name: 'shared',
      repository: 'https://github.com/example/shared.git',
      dependencies: []
    },
    {
      name: 'auth',
      repository: 'https://github.com/example/auth.git',
      dependencies: ['shared']
    },
    {
      name: 'product',
      repository: 'https://github.com/example/product.git',
      dependencies: ['shared', 'auth']
    },
    {
      name: 'checkout',
      repository: 'https://github.com/example/checkout.git',
      dependencies: ['shared', 'auth']
    }
  ],
  parallelDeployment: true,
  rollbackOnFailure: true
});

// 协调部署
const deploymentPlan = {
  apps: [
    { name: 'shared', version: '1.2.0' },
    { name: 'auth', version: '2.1.0' },
    { name: 'product', version: '3.0.1' },
    { name: 'checkout', version: '1.5.2' }
  ]
};

coordinatedDeployment.coordinatedDeploy(deploymentPlan)
  .then(result => {
    console.log('Coordinated deployment result:', result);
  })
  .catch(error => {
    console.error('Coordinated deployment failed:', error);
  });
\`\`\`

## CI/CD集成

### 微前端CI/CD流水线

微前端架构需要专门的CI/CD流水线来支持独立构建、测试和部署。

\`\`\`javascript
// 微前端CI/CD流水线管理器
class MicroFrontendCICD {
  constructor(options = {}) {
    this.pipelines = new Map();
    this.buildQueue = [];
    this.deployQueue = [];
    this.pipelineListeners = new Set();
    this.options = {
      // 流水线名称
      pipelineName: 'micro-frontend-pipeline',
      // 流水线阶段
      stages: ['checkout', 'install', 'test', 'build', 'deploy'],
      // 构建产物保留天数
      artifactsRetention: 30,
      // 是否启用并行构建
      parallelBuild: true,
      // 是否启用并行部署
      parallelDeployment: false,
      // 最大并行构建数
      maxParallelBuilds: 3,
      // 最大并行部署数
      maxParallelDeploys: 2,
      ...options
    };
    
    this.initializeCICD();
  }
  
  // 初始化CI/CD系统
  initializeCICD() {
    // 启动构建处理器
    this.startBuildProcessor();
    
    // 启动部署处理器
    this.startDeployProcessor();
  }
  
  // 创建流水线
  createPipeline(appConfig) {
    const pipelineId = this.generatePipelineId();
    
    const pipeline = {
      id: pipelineId,
      name: this.options.pipelineName,
      app: {
        name: appConfig.name,
        repository: appConfig.repository,
        branch: appConfig.branch || 'main',
        buildCommand: appConfig.buildCommand || 'npm run build',
        outputDirectory: appConfig.outputDirectory || 'dist',
        testCommand: appConfig.testCommand || 'npm test',
        deployTarget: appConfig.deployTarget || 'production'
      },
      stages: this.options.stages.map(stageName => ({
        name: stageName,
        status: 'pending',
        startTime: null,
        endTime: null,
        duration: null,
        logs: []
      })),
      status: 'created',
      created: Date.now(),
      started: null,
      completed: null,
      buildId: null,
      deployId: null,
      artifacts: []
    };
    
    this.pipelines.set(pipelineId, pipeline);
    console.log(\`Created pipeline \${pipelineId} for app \${appConfig.name}\`);
    
    return pipeline;
  }
  
  // 执行流水线
  async executePipeline(pipelineId) {
    const pipeline = this.pipelines.get(pipelineId);
    
    if (!pipeline) {
      throw new Error(\`Pipeline \${pipelineId} not found\`);
    }
    
    if (pipeline.status !== 'created') {
      throw new Error(\`Pipeline \${pipelineId} is not in created status\`);
    }
    
    console.log(\`Executing pipeline \${pipelineId} for app \${pipeline.app.name}\`);
    
    // 更新流水线状态
    pipeline.status = 'running';
    pipeline.started = Date.now();
    
    try {
      // 按顺序执行各个阶段
      for (const stage of pipeline.stages) {
        await this.executeStage(pipeline, stage);
      }
      
      // 更新流水线状态
      pipeline.status = 'success';
      pipeline.completed = Date.now();
      
      // 通知流水线监听器
      this.notifyPipelineListeners(pipelineId, 'completed', pipeline);
      
      console.log(\`Pipeline \${pipelineId} completed successfully\`);
      return { success: true, pipelineId, artifacts: pipeline.artifacts };
      
    } catch (error) {
      console.error(\`Pipeline \${pipelineId} failed:\`, error);
      
      // 更新流水线状态
      pipeline.status = 'failed';
      pipeline.completed = Date.now();
      pipeline.error = error.message;
      
      // 通知流水线监听器
      this.notifyPipelineListeners(pipelineId, 'failed', pipeline);
      
      throw error;
    }
  }
  
  // 执行阶段
  async executeStage(pipeline, stage) {
    console.log(\`Executing stage \${stage.name} for pipeline \${pipeline.id}\`);
    
    // 更新阶段状态
    stage.status = 'running';
    stage.startTime = Date.now();
    
    try {
      // 根据阶段类型执行不同的操作
      switch (stage.name) {
        case 'checkout':
          await this.checkoutStage(pipeline, stage);
          break;
        case 'install':
          await this.installStage(pipeline, stage);
          break;
        case 'test':
          await this.testStage(pipeline, stage);
          break;
        case 'build':
          await this.buildStage(pipeline, stage);
          break;
        case 'deploy':
          await this.deployStage(pipeline, stage);
          break;
        default:
          throw new Error(\`Unknown stage: \${stage.name}\`);
      }
      
      // 更新阶段状态
      stage.status = 'success';
      stage.endTime = Date.now();
      stage.duration = stage.endTime - stage.startTime;
      
      console.log(\`Stage \${stage.name} completed in \${stage.duration}ms\`);
      
    } catch (error) {
      console.error(\`Stage \${stage.name} failed:\`, error);
      
      // 更新阶段状态
      stage.status = 'failed';
      stage.endTime = Date.now();
      stage.duration = stage.endTime - stage.startTime;
      stage.error = error.message;
      
      throw error;
    }
  }
  
  // 检出代码阶段
  async checkoutStage(pipeline, stage) {
    console.log(\`Checking out code for \${pipeline.app.name}\`);
    
    // 模拟检出过程
    await this.sleep(2000);
    
    // 记录日志
    stage.logs.push({
      timestamp: Date.now(),
      message: \`Checked out \${pipeline.app.repository} at branch \${pipeline.app.branch}\`
    });
    
    // 90%的成功率
    if (Math.random() > 0.1) {
      return { success: true };
    } else {
      throw new Error('Failed to checkout code');
    }
  }
  
  // 安装依赖阶段
  async installStage(pipeline, stage) {
    console.log(\`Installing dependencies for \${pipeline.app.name}\`);
    
    // 模拟安装过程
    await this.sleep(8000);
    
    // 记录日志
    stage.logs.push({
      timestamp: Date.now(),
      message: 'Installed dependencies'
    });
    
    // 95%的成功率
    if (Math.random() > 0.05) {
      return { success: true };
    } else {
      throw new Error('Failed to install dependencies');
    }
  }
  
  // 测试阶段
  async testStage(pipeline, stage) {
    console.log(\`Running tests for \${pipeline.app.name}\`);
    
    // 模拟测试过程
    await this.sleep(5000);
    
    // 记录日志
    stage.logs.push({
      timestamp: Date.now(),
      message: 'Running unit tests'
    });
    
    await this.sleep(3000);
    
    stage.logs.push({
      timestamp: Date.now(),
      message: 'Running integration tests'
    });
    
    await this.sleep(2000);
    
    stage.logs.push({
      timestamp: Date.now(),
      message: 'All tests passed'
    });
    
    // 90%的成功率
    if (Math.random() > 0.1) {
      return { success: true };
    } else {
      throw new Error('Tests failed');
    }
  }
  
  // 构建阶段
  async buildStage(pipeline, stage) {
    console.log(\`Building \${pipeline.app.name}\`);
    
    // 生成构建ID
    const buildId = this.generateBuildId();
    pipeline.buildId = buildId;
    
    // 添加到构建队列
    this.buildQueue.push({
      pipelineId: pipeline.id,
      buildId,
      app: pipeline.app,
      status: 'queued'
    });
    
    // 记录日志
    stage.logs.push({
      timestamp: Date.now(),
      message: \`Queued build with ID \${buildId}\`
    });
    
    // 等待构建完成
    return this.waitForBuildCompletion(buildId);
  }
  
  // 部署阶段
  async deployStage(pipeline, stage) {
    console.log(\`Deploying \${pipeline.app.name}\`);
    
    // 生成部署ID
    const deployId = this.generateDeployId();
    pipeline.deployId = deployId;
    
    // 添加到部署队列
    this.deployQueue.push({
      pipelineId: pipeline.id,
      deployId,
      buildId: pipeline.buildId,
      app: pipeline.app,
      status: 'queued'
    });
    
    // 记录日志
    stage.logs.push({
      timestamp: Date.now(),
      message: \`Queued deployment with ID \${deployId}\`
    });
    
    // 等待部署完成
    return this.waitForDeploymentCompletion(deployId);
  }
  
  // 记录构建产物
  recordBuildArtifacts(buildId, artifacts) {
    // 查找对应的流水线
    let pipeline = null;
    for (const [id, p] of this.pipelines) {
      if (p.buildId === buildId) {
        pipeline = p;
        break;
      }
    }
    
    if (pipeline) {
      pipeline.artifacts = artifacts;
    }
  }
  
  // 等待构建完成
  async waitForBuildCompletion(buildId) {
    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const buildItem = this.buildQueue.find(item => item.buildId === buildId);
        
        if (!buildItem) {
          reject(new Error(\`Build \${buildId} not found\`));
          return;
        }
        
        if (buildItem.status === 'success') {
          resolve(buildItem);
        } else if (buildItem.status === 'failed') {
          reject(new Error(buildItem.error || 'Build failed'));
        } else {
          // 继续等待
          setTimeout(checkStatus, 1000);
        }
      };
      
      // 开始检查状态
      checkStatus();
    });
  }
  
  // 等待部署完成
  async waitForDeploymentCompletion(deployId) {
    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const deployItem = this.deployQueue.find(item => item.deployId === deployId);
        
        if (!deployItem) {
          reject(new Error(\`Deployment \${deployId} not found\`));
          return;
        }
        
        if (deployItem.status === 'success') {
          resolve(deployItem);
        } else if (deployItem.status === 'failed') {
          reject(new Error(deployItem.error || 'Deployment failed'));
        } else {
          // 继续等待
          setTimeout(checkStatus, 1000);
        }
      };
      
      // 开始检查状态
      checkStatus();
    });
  }
  
  // 启动构建处理器
  startBuildProcessor() {
    setInterval(() => {
      this.processBuildQueue();
    }, 1000);
  }
  
  // 启动部署处理器
  startDeployProcessor() {
    setInterval(() => {
      this.processDeployQueue();
    }, 1000);
  }
  
  // 处理构建队列
  processBuildQueue() {
    // 获取正在进行的构建数量
    const runningBuilds = this.buildQueue.filter(item => item.status === 'running').length;
    
    // 如果已达到最大并行构建数，则不处理新的构建
    if (runningBuilds >= this.options.maxParallelBuilds) {
      return;
    }
    
    // 获取待处理的构建
    const queuedBuilds = this.buildQueue.filter(item => item.status === 'queued');
    
    // 启动新的构建
    const buildsToStart = queuedBuilds.slice(0, this.options.maxParallelBuilds - runningBuilds);
    
    buildsToStart.forEach(buildItem => {
      this.startBuild(buildItem);
    });
  }
  
  // 处理部署队列
  processDeployQueue() {
    // 获取正在进行的部署数量
    const runningDeploys = this.deployQueue.filter(item => item.status === 'running').length;
    
    // 如果已达到最大并行部署数，则不处理新的部署
    if (runningDeploys >= this.options.maxParallelDeploys) {
      return;
    }
    
    // 获取待处理的部署
    const queuedDeploys = this.deployQueue.filter(item => item.status === 'queued');
    
    // 启动新的部署
    const deploysToStart = queuedDeploys.slice(0, this.options.maxParallelDeploys - runningDeploys);
    
    deploysToStart.forEach(deployItem => {
      this.startDeploy(deployItem);
    });
  }
  
  // 开始构建
  async startBuild(buildItem) {
    console.log(\`Starting build \${buildItem.buildId} for app \${buildItem.app.name}\`);
    
    // 更新状态
    buildItem.status = 'running';
    buildItem.startTime = Date.now();
    
    try {
      // 模拟构建过程
      await this.sleep(10000);
      
      // 生成构建产物
      const artifacts = [
        {
          name: 'app.js',
          path: \`\${buildItem.app.outputDirectory}/app.js\`,
          size: 1024000
        },
        {
          name: 'app.css',
          path: \`\${buildItem.app.outputDirectory}/app.css\`,
          size: 256000
        },
        {
          name: 'index.html',
          path: \`\${buildItem.app.outputDirectory}/index.html\`,
          size: 5000
        }
      ];
      
      // 记录构建产物
      this.recordBuildArtifacts(buildItem.buildId, artifacts);
      
      // 更新状态
      buildItem.status = 'success';
      buildItem.endTime = Date.now();
      buildItem.duration = buildItem.endTime - buildItem.startTime;
      buildItem.artifacts = artifacts;
      
      console.log(\`Build \${buildItem.buildId} completed successfully\`);
      
    } catch (error) {
      console.error(\`Build \${buildItem.buildId} failed:\`, error);
      
      // 更新状态
      buildItem.status = 'failed';
      buildItem.endTime = Date.now();
      buildItem.duration = buildItem.endTime - buildItem.startTime;
      buildItem.error = error.message;
    }
  }
  
  // 开始部署
  async startDeploy(deployItem) {
    console.log(\`Starting deployment \${deployItem.deployId} for app \${deployItem.app.name}\`);
    
    // 更新状态
    deployItem.status = 'running';
    deployItem.startTime = Date.now();
    
    try {
      // 模拟部署过程
      await this.sleep(8000);
      
      // 更新状态
      deployItem.status = 'success';
      deployItem.endTime = Date.now();
      deployItem.duration = deployItem.endTime - deployItem.startTime;
      
      console.log(\`Deployment \${deployItem.deployId} completed successfully\`);
      
    } catch (error) {
      console.error(\`Deployment \${deployItem.deployId} failed:\`, error);
      
      // 更新状态
      deployItem.status = 'failed';
      deployItem.endTime = Date.now();
      deployItem.duration = deployItem.endTime - deployItem.startTime;
      deployItem.error = error.message;
    }
  }
  
  // 获取流水线状态
  getPipelineStatus(pipelineId) {
    return this.pipelines.get(pipelineId);
  }
  
  // 获取所有流水线状态
  getAllPipelineStatus() {
    const status = {};
    
    this.pipelines.forEach((pipeline, id) => {
      status[id] = {
        id: pipeline.id,
        app: pipeline.app.name,
        status: pipeline.status,
        created: pipeline.created,
        started: pipeline.started,
        completed: pipeline.completed,
        stages: pipeline.stages.map(stage => ({
          name: stage.name,
          status: stage.status,
          duration: stage.duration
        }))
      };
    });
    
    return status;
  }
  
  // 获取构建产物
  getBuildArtifacts(buildId) {
    // 查找对应的流水线
    let pipeline = null;
    for (const [id, p] of this.pipelines) {
      if (p.buildId === buildId) {
        pipeline = p;
        break;
      }
    }
    
    return pipeline ? pipeline.artifacts : null;
  }
  
  // 生成流水线ID
  generatePipelineId() {
    return \`pipeline_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  }
  
  // 生成构建ID
  generateBuildId() {
    return \`build_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  }
  
  // 生成部署ID
  generateDeployId() {
    return \`deploy_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  }
  
  // 生成版本号
  generateVersion() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return \`\${year}.\${month}.\${day}.\${hours}\${minutes}\`;
  }
  
  // 设置流水线监听器
  setPipelineListener(listener) {
    this.pipelineListeners.add(listener);
  }
  
  // 移除流水线监听器
  removePipelineListener(listener) {
    this.pipelineListeners.delete(listener);
  }
  
  // 通知流水线监听器
  notifyPipelineListeners(pipelineId, eventType, data) {
    this.pipelineListeners.forEach(listener => {
      try {
        listener(pipelineId, eventType, data);
      } catch (error) {
        console.error('Error in pipeline listener:', error);
      }
    });
  }
  
  // 工具方法：睡眠
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 使用示例
const cicd = new MicroFrontendCICD({
  pipelineName: 'micro-frontend-pipeline',
  stages: ['checkout', 'install', 'test', 'build', 'deploy'],
  artifactsRetention: 30,
  parallelBuild: true,
  parallelDeployment: false,
  maxParallelBuilds: 3,
  maxParallelDeploys: 2
});

// 创建并执行流水线
const homePipeline = cicd.createPipeline({
  name: 'home',
  repository: 'https://github.com/example/home.git',
  branch: 'main',
  buildCommand: 'npm run build',
  testCommand: 'npm test',
  outputDirectory: 'dist',
  deployTarget: 'production'
});

cicd.executePipeline(homePipeline.id)
  .then(result => {
    console.log('Pipeline result:', result);
  })
  .catch(error => {
    console.error('Pipeline failed:', error);
  });

// 创建并执行另一个流水线
const productPipeline = cicd.createPipeline({
  name: 'product',
  repository: 'https://github.com/example/product.git',
  branch: 'main',
  buildCommand: 'npm run build',
  testCommand: 'npm test',
  outputDirectory: 'dist',
  deployTarget: 'production'
});

cicd.executePipeline(productPipeline.id)
  .then(result => {
    console.log('Pipeline result:', result);
  })
  .catch(error => {
    console.error('Pipeline failed:', error);
  });

// 获取所有流水线状态
setInterval(() => {
  const status = cicd.getAllPipelineStatus();
  console.log('Pipeline status:', status);
}, 5000);
\`\`\`

## 最佳实践

### 1. 部署最佳实践

1. **独立部署**：
   - 每个微前端应用应能独立部署，不影响其他应用
   - 使用语义化版本控制，明确版本变更内容
   - 实现蓝绿部署或金丝雀发布，降低部署风险

2. **协调部署**：
   - 对于有依赖关系的应用，使用协调部署确保兼容性
   - 建立清晰的依赖关系图，按正确顺序部署
   - 实现自动回滚机制，快速恢复服务

3. **CI/CD集成**：
   - 建立完整的CI/CD流水线，自动化构建、测试和部署
   - 实现并行构建和部署，提高效率
   - 设置合理的构建产物保留策略，节省存储空间

## 总结

微前端部署策略与CI/CD实践是确保微前端系统高效交付的关键环节。本文详细介绍了微前端的独立部署和协调部署模式，以及如何构建高效的CI/CD流水线。

通过合理应用这些技术和实践，可以构建高效、可靠的微前端部署体系，提高开发效率和系统稳定性。随着微前端技术的不断发展，部署策略和CI/CD方案也将不断演进，为开发者提供更强大、更自动化的工具和方法。`;export{n as default};
//# sourceMappingURL=31-1-BbWWV3Za.js.map
