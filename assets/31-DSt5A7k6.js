const n=`---
title: "微前端部署与运维实践"
excerpt: "深入探讨微前端架构的部署策略和运维实践，帮助开发者实现微前端应用的持续集成、持续部署和高效运维"
coverImage: "/assets/blog/hello-world/cover.jpg"
date: "2025-12-11"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---- 部署
- 运维
- CI/CD
categories:
- 前端架构
---

# 微前端部署与运维实践

## 引言

微前端架构不仅改变了前端开发模式，也对部署和运维提出了新的挑战和要求。与传统单体前端应用不同，微前端系统由多个独立的应用组成，每个应用都可以独立开发、测试和部署。本文将深入探讨微前端的部署策略、运维实践和监控方案，帮助团队构建高效、可靠的微前端部署和运维体系。

## 微前端部署策略

### 1. 独立部署模式

独立部署是微前端的核心优势之一，每个应用可以独立发布，不影响其他应用。

\`\`\`javascript
// 微前端独立部署配置
class MicroFrontendDeployment {
  constructor(options = {}) {
    this.options = {
      apps: [],
      baseDomain: 'https://example.com',
      deploymentStrategy: 'independent', // 'independent', 'coordinated', 'blue-green'
      versioningStrategy: 'semantic', // 'semantic', 'timestamp', 'hash'
      ...options
    };
    
    this.deploymentRegistry = new Map();
    this.activeVersions = new Map();
    this.deploymentHistory = new Map();
    
    this.initializeDeployment();
  }
  
  // 初始化部署系统
  initializeDeployment() {
    // 注册应用
    this.options.apps.forEach(app => {
      this.registerApp(app);
    });
    
    // 设置部署监听
    this.setupDeploymentListeners();
  }
  
  // 注册应用
  registerApp(appConfig) {
    const app = {
      name: appConfig.name,
      repository: appConfig.repository,
      buildCommand: appConfig.buildCommand || 'npm run build',
      outputDirectory: appConfig.outputDirectory || 'dist',
      dependencies: appConfig.dependencies || [],
      deploymentHooks: appConfig.deploymentHooks || {},
      healthCheck: appConfig.healthCheck || '/health',
      rollbackStrategy: appConfig.rollbackStrategy || 'automatic',
      ...appConfig
    };
    
    this.deploymentRegistry.set(app.name, app);
    this.activeVersions.set(app.name, null);
    this.deploymentHistory.set(app.name, []);
    
    console.log(\`Registered app: \${app.name}\`);
  }
  
  // 部署应用
  async deployApp(appName, version, options = {}) {
    const app = this.deploymentRegistry.get(appName);
    
    if (!app) {
      throw new Error(\`App \${appName} not found\`);
    }
    
    const deploymentId = this.generateDeploymentId(appName, version);
    const deployment = {
      id: deploymentId,
      appName,
      version,
      status: 'pending',
      startTime: Date.now(),
      endTime: null,
      success: null,
      error: null,
      rollbackVersion: this.activeVersions.get(appName),
      ...options
    };
    
    try {
      // 更新部署状态
      this.updateDeploymentStatus(deployment, 'in_progress');
      
      // 执行部署前钩子
      await this.executeHook(app, 'beforeDeploy', deployment);
      
      // 构建应用
      const buildResult = await this.buildApp(app, version);
      
      // 部署应用
      const deployResult = await this.deployAppFiles(app, buildResult, deployment);
      
      // 健康检查
      await this.performHealthCheck(app, deployResult.url);
      
      // 更新活动版本
      this.activeVersions.set(appName, version);
      
      // 更新部署状态
      this.updateDeploymentStatus(deployment, 'success');
      deployment.endTime = Date.now();
      deployment.success = true;
      deployment.url = deployResult.url;
      
      // 执行部署后钩子
      await this.executeHook(app, 'afterDeploy', deployment);
      
      // 记录部署历史
      this.recordDeployment(deployment);
      
      console.log(\`Successfully deployed \${appName} version \${version}\`);
      return deployment;
    } catch (error) {
      console.error(\`Failed to deploy \${appName} version \${version}:\`, error);
      
      // 更新部署状态
      this.updateDeploymentStatus(deployment, 'failed');
      deployment.endTime = Date.now();
      deployment.success = false;
      deployment.error = error.message;
      
      // 执行回滚（如果配置了自动回滚）
      if (app.rollbackStrategy === 'automatic' && deployment.rollbackVersion) {
        console.log(\`Automatically rolling back \${appName} to version \${deployment.rollbackVersion}\`);
        await this.rollbackApp(appName, deployment.rollbackVersion);
      }
      
      // 记录部署历史
      this.recordDeployment(deployment);
      
      throw error;
    }
  }
  
  // 构建应用
  async buildApp(app, version) {
    console.log(\`Building \${app.name} version \${version}\`);
    
    // 在实际项目中，这里会触发CI/CD流水线
    // 这里简化为模拟构建过程
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟构建成功或失败
        if (Math.random() > 0.1) { // 90%成功率
          resolve({
            version,
            buildTime: Date.now(),
            artifacts: [
              { name: 'main.js', size: 150000 },
              { name: 'main.css', size: 25000 },
              { name: 'index.html', size: 5000 }
            ]
          });
        } else {
          reject(new Error('Build failed'));
        }
      }, 2000);
    });
  }
  
  // 部署应用文件
  async deployAppFiles(app, buildResult, deployment) {
    const versionedUrl = \`\${this.options.baseDomain}/apps/\${app.name}/\${buildResult.version}\`;
    
    console.log(\`Deploying \${app.name} to \${versionedUrl}\`);
    
    // 在实际项目中，这里会上传文件到CDN或静态资源服务器
    // 这里简化为模拟部署过程
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟部署成功或失败
        if (Math.random() > 0.05) { // 95%成功率
          resolve({
            url: versionedUrl,
            deploymentTime: Date.now(),
            files: buildResult.artifacts
          });
        } else {
          reject(new Error('Deployment failed'));
        }
      }, 1500);
    });
  }
  
  // 执行健康检查
  async performHealthCheck(app, url) {
    const healthCheckUrl = \`\${url}\${app.healthCheck}\`;
    
    console.log(\`Performing health check for \${app.name} at \${healthCheckUrl}\`);
    
    try {
      const response = await fetch(healthCheckUrl);
      
      if (!response.ok) {
        throw new Error(\`Health check failed with status \${response.status}\`);
      }
      
      const health = await response.json();
      
      if (!health.status || health.status !== 'ok') {
        throw new Error('Health check returned non-ok status');
      }
      
      console.log(\`Health check passed for \${app.name}\`);
      return health;
    } catch (error) {
      console.error(\`Health check failed for \${app.name}:\`, error);
      throw error;
    }
  }
  
  // 回滚应用
  async rollbackApp(appName, targetVersion) {
    const app = this.deploymentRegistry.get(appName);
    
    if (!app) {
      throw new Error(\`App \${appName} not found\`);
    }
    
    console.log(\`Rolling back \${appName} to version \${targetVersion}\`);
    
    try {
      // 执行回滚前钩子
      await this.executeHook(app, 'beforeRollback', { appName, targetVersion });
      
      // 查找目标版本的部署记录
      const deploymentHistory = this.deploymentHistory.get(appName);
      const targetDeployment = deploymentHistory.find(d => d.version === targetVersion);
      
      if (!targetDeployment) {
        throw new Error(\`Version \${targetVersion} not found in deployment history\`);
      }
      
      // 更新活动版本
      this.activeVersions.set(appName, targetVersion);
      
      // 执行回滚后钩子
      await this.executeHook(app, 'afterRollback', { appName, targetVersion });
      
      console.log(\`Successfully rolled back \${appName} to version \${targetVersion}\`);
      return {
        appName,
        previousVersion: this.activeVersions.get(appName),
        targetVersion,
        rollbackTime: Date.now()
      };
    } catch (error) {
      console.error(\`Failed to rollback \${appName} to version \${targetVersion}:\`, error);
      throw error;
    }
  }
  
  // 执行钩子
  async executeHook(app, hookName, context) {
    const hook = app.deploymentHooks[hookName];
    
    if (!hook || typeof hook !== 'function') {
      return;
    }
    
    console.log(\`Executing \${hookName} hook for \${app.name}\`);
    
    try {
      await hook(context);
    } catch (error) {
      console.error(\`Hook \${hookName} failed for \${app.name}:\`, error);
      throw error;
    }
  }
  
  // 更新部署状态
  updateDeploymentStatus(deployment, status) {
    deployment.status = status;
    
    // 在实际项目中，这里会通知监控系统
    console.log(\`Deployment \${deployment.id} status updated to \${status}\`);
  }
  
  // 记录部署历史
  recordDeployment(deployment) {
    const history = this.deploymentHistory.get(deployment.appName);
    history.push(deployment);
    
    // 限制历史记录数量
    if (history.length > 50) {
      history.shift();
    }
  }
  
  // 生成部署ID
  generateDeploymentId(appName, version) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return \`\${appName}-\${version}-\${timestamp}-\${random}\`;
  }
  
  // 获取应用状态
  getAppStatus(appName) {
    const app = this.deploymentRegistry.get(appName);
    const activeVersion = this.activeVersions.get(appName);
    const history = this.deploymentHistory.get(appName);
    const latestDeployment = history.length > 0 ? history[history.length - 1] : null;
    
    return {
      name: appName,
      activeVersion,
      latestDeployment,
      deploymentCount: history.length,
      successRate: this.calculateSuccessRate(history)
    };
  }
  
  // 计算成功率
  calculateSuccessRate(history) {
    if (history.length === 0) {
      return 1;
    }
    
    const successCount = history.filter(d => d.success).length;
    return successCount / history.length;
  }
  
  // 获取所有应用状态
  getAllAppsStatus() {
    const status = {};
    
    this.deploymentRegistry.forEach((app, appName) => {
      status[appName] = this.getAppStatus(appName);
    });
    
    return status;
  }
  
  // 设置部署监听
  setupDeploymentListeners() {
    // 在实际项目中，这里会设置Webhook或其他监听机制
    // 这里简化为空实现
  }
}

// 使用示例
const deployment = new MicroFrontendDeployment({
  apps: [
    {
      name: 'home',
      repository: 'https://github.com/example/home-app.git',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      healthCheck: '/health',
      deploymentHooks: {
        beforeDeploy: async (context) => {
          console.log('Before deploy hook for home app', context);
        },
        afterDeploy: async (context) => {
          console.log('After deploy hook for home app', context);
        }
      }
    },
    {
      name: 'product',
      repository: 'https://github.com/example/product-app.git',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      healthCheck: '/api/health',
      rollbackStrategy: 'manual'
    },
    {
      name: 'checkout',
      repository: 'https://github.com/example/checkout-app.git',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      healthCheck: '/health',
      dependencies: ['product', 'user']
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
setTimeout(() => {
  const status = deployment.getAllAppsStatus();
  console.log('Apps status:', status);
}, 5000);
\`\`\`

### 2. 协调部署模式

协调部署确保多个应用之间的兼容性，特别是在有共享依赖的情况下。

\`\`\`javascript
// 微前端协调部署管理
class CoordinatedDeployment {
  constructor(options = {}) {
    this.options = {
      deploymentGroup: [],
      dependencyGraph: new Map(),
      deploymentTimeout: 600000, // 10分钟
      rollbackOnFailure: true,
      ...options
    };
    
    this.deploymentStatus = new Map();
    this.deploymentQueue = [];
    this.activeDeployment = null;
    
    this.initializeDeployment();
  }
  
  // 初始化部署系统
  initializeDeployment() {
    // 构建依赖图
    this.buildDependencyGraph();
    
    // 设置部署监听
    this.setupDeploymentListeners();
  }
  
  // 构建依赖图
  buildDependencyGraph() {
    this.options.deploymentGroup.forEach(app => {
      this.options.dependencyGraph.set(app.name, app.dependencies || []);
    });
  }
  
  // 协调部署
  async coordinatedDeploy(deploymentPlan) {
    if (this.activeDeployment) {
      throw new Error('Another deployment is already in progress');
    }
    
    this.activeDeployment = {
      id: this.generateDeploymentId(),
      plan: deploymentPlan,
      startTime: Date.now(),
      status: 'in_progress',
      deployedApps: new Set(),
      failedApps: new Set(),
      rollbackApps: new Set()
    };
    
    try {
      // 按依赖顺序部署应用
      const deploymentOrder = this.getDeploymentOrder(deploymentPlan.apps);
      
      for (const appName of deploymentOrder) {
        const appPlan = deploymentPlan.apps.find(app => app.name === appName);
        
        if (!appPlan) {
          throw new Error(\`Deployment plan not found for app: \${appName}\`);
        }
        
        try {
          // 部署应用
          await this.deployAppWithDependencies(appName, appPlan);
          this.activeDeployment.deployedApps.add(appName);
        } catch (error) {
          console.error(\`Failed to deploy app \${appName}:\`, error);
          this.activeDeployment.failedApps.add(appName);
          
          // 如果配置了失败时回滚，则回滚已部署的应用
          if (this.options.rollbackOnFailure) {
            await this.rollbackDeployedApps();
          }
          
          throw error;
        }
      }
      
      // 部署成功
      this.activeDeployment.status = 'success';
      this.activeDeployment.endTime = Date.now();
      
      console.log('Coordinated deployment completed successfully');
      return this.activeDeployment;
    } catch (error) {
      console.error('Coordinated deployment failed:', error);
      
      this.activeDeployment.status = 'failed';
      this.activeDeployment.endTime = Date.now();
      this.activeDeployment.error = error.message;
      
      throw error;
    } finally {
      this.activeDeployment = null;
    }
  }
  
  // 获取部署顺序
  getDeploymentOrder(apps) {
    const order = [];
    const visited = new Set();
    const visiting = new Set();
    
    // 深度优先遍历依赖图
    const visit = (appName) => {
      if (visited.has(appName)) {
        return;
      }
      
      if (visiting.has(appName)) {
        throw new Error(\`Circular dependency detected involving \${appName}\`);
      }
      
      visiting.add(appName);
      
      const dependencies = this.options.dependencyGraph.get(appName) || [];
      
      for (const dep of dependencies) {
        // 只遍历计划中包含的依赖
        if (apps.some(app => app.name === dep)) {
          visit(dep);
        }
      }
      
      visiting.delete(appName);
      visited.add(appName);
      order.push(appName);
    };
    
    // 遍历所有应用
    for (const app of apps) {
      visit(app.name);
    }
    
    return order;
  }
  
  // 部署应用及其依赖
  async deployAppWithDependencies(appName, appPlan) {
    console.log(\`Deploying app \${appName} with version \${appPlan.version}\`);
    
    // 检查依赖是否已部署
    const dependencies = this.options.dependencyGraph.get(appName) || [];
    
    for (const dep of dependencies) {
      if (!this.activeDeployment.deployedApps.has(dep)) {
        throw new Error(\`Dependency \${dep} is not deployed\`);
      }
    }
    
    // 部署应用
    const deployment = {
      appName,
      version: appPlan.version,
      startTime: Date.now(),
      status: 'pending'
    };
    
    this.deploymentStatus.set(appName, deployment);
    
    try {
      // 更新状态
      deployment.status = 'in_progress';
      
      // 执行部署
      const result = await this.executeDeployment(appPlan);
      
      // 更新状态
      deployment.status = 'success';
      deployment.endTime = Date.now();
      deployment.result = result;
      
      console.log(\`Successfully deployed app \${appName}\`);
      return result;
    } catch (error) {
      console.error(\`Failed to deploy app \${appName}:\`, error);
      
      // 更新状态
      deployment.status = 'failed';
      deployment.endTime = Date.now();
      deployment.error = error.message;
      
      throw error;
    }
  }
  
  // 执行部署
  async executeDeployment(appPlan) {
    // 在实际项目中，这里会调用具体的部署API
    // 这里简化为模拟部署过程
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // 模拟部署成功或失败
        if (Math.random() > 0.1) { // 90%成功率
          resolve({
            url: \`https://example.com/apps/\${appPlan.name}/\${appPlan.version}\`,
            deploymentTime: Date.now()
          });
        } else {
          reject(new Error('Deployment failed'));
        }
      }, Math.random() * 3000 + 1000);
      
      // 设置部署超时
      if (this.options.deploymentTimeout) {
        setTimeout(() => {
          clearTimeout(timeout);
          reject(new Error('Deployment timeout'));
        }, this.options.deploymentTimeout);
      }
    });
  }
  
  // 回滚已部署的应用
  async rollbackDeployedApps() {
    const deployedApps = Array.from(this.activeDeployment.deployedApps);
    
    // 按相反顺序回滚
    deployedApps.reverse();
    
    for (const appName of deployedApps) {
      try {
        await this.rollbackApp(appName);
        this.activeDeployment.rollbackApps.add(appName);
      } catch (error) {
        console.error(\`Failed to rollback app \${appName}:\`, error);
      }
    }
  }
  
  // 回滚应用
  async rollbackApp(appName) {
    console.log(\`Rolling back app \${appName}\`);
    
    // 在实际项目中，这里会调用具体的回滚API
    // 这里简化为模拟回滚过程
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(\`Successfully rolled back app \${appName}\`);
        resolve();
      }, 1000);
    });
  }
  
  // 生成部署ID
  generateDeploymentId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return \`coordinated-\${timestamp}-\${random}\`;
  }
  
  // 获取部署状态
  getDeploymentStatus() {
    if (!this.activeDeployment) {
      return null;
    }
    
    return {
      id: this.activeDeployment.id,
      status: this.activeDeployment.status,
      startTime: this.activeDeployment.startTime,
      endTime: this.activeDeployment.endTime,
      deployedApps: Array.from(this.activeDeployment.deployedApps),
      failedApps: Array.from(this.activeDeployment.failedApps),
      rollbackApps: Array.from(this.activeDeployment.rollbackApps),
      appStatuses: Array.from(this.deploymentStatus.entries()).map(([name, status]) => ({
        name,
        ...status
      }))
    };
  }
  
  // 设置部署监听
  setupDeploymentListeners() {
    // 在实际项目中，这里会设置Webhook或其他监听机制
    // 这里简化为空实现
  }
}

// 使用示例
const coordinatedDeployment = new CoordinatedDeployment({
  deploymentGroup: [
    {
      name: 'shared',
      repository: 'https://github.com/example/shared-app.git',
      dependencies: []
    },
    {
      name: 'auth',
      repository: 'https://github.com/example/auth-app.git',
      dependencies: ['shared']
    },
    {
      name: 'product',
      repository: 'https://github.com/example/product-app.git',
      dependencies: ['shared', 'auth']
    },
    {
      name: 'checkout',
      repository: 'https://github.com/example/checkout-app.git',
      dependencies: ['shared', 'auth', 'product']
    }
  ],
  deploymentTimeout: 300000, // 5分钟
  rollbackOnFailure: true
});

// 协调部署
const deploymentPlan = {
  apps: [
    { name: 'shared', version: '2.1.0' },
    { name: 'auth', version: '1.5.2' },
    { name: 'product', version: '3.2.1' },
    { name: 'checkout', version: '2.0.5' }
  ]
};

coordinatedDeployment.coordinatedDeploy(deploymentPlan)
  .then(result => {
    console.log('Coordinated deployment result:', result);
  })
  .catch(error => {
    console.error('Coordinated deployment failed:', error);
  });

// 监控部署状态
setInterval(() => {
  const status = coordinatedDeployment.getDeploymentStatus();
  if (status) {
    console.log('Deployment status:', status);
  }
}, 2000);
\`\`\`

## CI/CD集成

### 1. 微前端CI/CD流水线

\`\`\`javascript
// 微前端CI/CD流水线管理
class MicroFrontendCICD {
  constructor(options = {}) {
    this.options = {
      pipelineName: 'micro-frontend-pipeline',
      stages: [
        'checkout',
        'install',
        'test',
        'build',
        'deploy'
      ],
      artifactsRetention: 30, // 天
      parallelDeployment: true,
      ...options
    };
    
    this.pipelines = new Map();
    this.artifacts = new Map();
    this.buildQueue = [];
    this.deploymentQueue = [];
    
    this.initializePipeline();
  }
  
  // 初始化流水线
  initializePipeline() {
    // 设置流水线监听
    this.setupPipelineListeners();
    
    // 启动构建处理器
    this.startBuildProcessor();
    
    // 启动部署处理器
    this.startDeploymentProcessor();
  }
  
  // 创建流水线
  createPipeline(appConfig) {
    const pipeline = {
      id: this.generatePipelineId(),
      appName: appConfig.name,
      repository: appConfig.repository,
      branch: appConfig.branch || 'main',
      stages: this.options.stages,
      currentStage: null,
      status: 'created',
      startTime: null,
      endTime: null,
      duration: null,
      stagesStatus: {},
      artifacts: [],
      error: null,
      config: appConfig
    };
    
    this.pipelines.set(pipeline.id, pipeline);
    
    console.log(\`Created pipeline \${pipeline.id} for app \${appConfig.name}\`);
    return pipeline;
  }
  
  // 执行流水线
  async executePipeline(pipelineId) {
    const pipeline = this.pipelines.get(pipelineId);
    
    if (!pipeline) {
      throw new Error(\`Pipeline \${pipelineId} not found\`);
    }
    
    if (pipeline.status !== 'created') {
      throw new Error(\`Pipeline \${pipelineId} is already running or completed\`);
    }
    
    pipeline.status = 'running';
    pipeline.startTime = Date.now();
    
    try {
      for (const stage of pipeline.stages) {
        pipeline.currentStage = stage;
        pipeline.stagesStatus[stage] = 'running';
        
        console.log(\`Executing stage \${stage} for pipeline \${pipelineId}\`);
        
        try {
          const result = await this.executeStage(pipeline, stage);
          
          pipeline.stagesStatus[stage] = 'success';
          
          if (result.artifacts) {
            pipeline.artifacts.push(...result.artifacts);
          }
        } catch (error) {
          console.error(\`Stage \${stage} failed for pipeline \${pipelineId}:\`, error);
          
          pipeline.stagesStatus[stage] = 'failed';
          pipeline.status = 'failed';
          pipeline.error = error.message;
          pipeline.endTime = Date.now();
          pipeline.duration = pipeline.endTime - pipeline.startTime;
          
          throw error;
        }
      }
      
      pipeline.status = 'success';
      pipeline.endTime = Date.now();
      pipeline.duration = pipeline.endTime - pipeline.startTime;
      
      console.log(\`Pipeline \${pipelineId} completed successfully\`);
      return pipeline;
    } catch (error) {
      console.error(\`Pipeline \${pipelineId} failed:\`, error);
      throw error;
    }
  }
  
  // 执行阶段
  async executeStage(pipeline, stage) {
    switch (stage) {
      case 'checkout':
        return this.checkoutStage(pipeline);
      case 'install':
        return this.installStage(pipeline);
      case 'test':
        return this.testStage(pipeline);
      case 'build':
        return this.buildStage(pipeline);
      case 'deploy':
        return this.deployStage(pipeline);
      default:
        throw new Error(\`Unknown stage: \${stage}\`);
    }
  }
  
  // 检出阶段
  async checkoutStage(pipeline) {
    console.log(\`Checking out repository \${pipeline.repository}\`);
    
    // 在实际项目中，这里会从Git仓库检出代码
    // 这里简化为模拟检出过程
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          artifacts: [
            {
              name: 'source',
              path: \`/tmp/\${pipeline.id}/source\`,
              type: 'directory'
            }
          ]
        });
      }, 1000);
    });
  }
  
  // 安装阶段
  async installStage(pipeline) {
    console.log(\`Installing dependencies for \${pipeline.appName}\`);
    
    // 在实际项目中，这里会执行npm install或yarn install
    // 这里简化为模拟安装过程
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟安装成功或失败
        if (Math.random() > 0.05) { // 95%成功率
          resolve({
            artifacts: [
              {
                name: 'node_modules',
                path: \`/tmp/\${pipeline.id}/node_modules\`,
                type: 'directory'
              }
            ]
          });
        } else {
          reject(new Error('Dependency installation failed'));
        }
      }, 5000);
    });
  }
  
  // 测试阶段
  async testStage(pipeline) {
    console.log(\`Running tests for \${pipeline.appName}\`);
    
    // 在实际项目中，这里会执行单元测试、集成测试等
    // 这里简化为模拟测试过程
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟测试成功或失败
        if (Math.random() > 0.1) { // 90%成功率
          resolve({
            artifacts: [
              {
                name: 'test-results',
                path: \`/tmp/\${pipeline.id}/test-results.xml\`,
                type: 'file'
              }
            ]
          });
        } else {
          reject(new Error('Tests failed'));
        }
      }, 3000);
    });
  }
  
  // 构建阶段
  async buildStage(pipeline) {
    console.log(\`Building \${pipeline.appName}\`);
    
    // 在实际项目中，这里会执行构建命令
    // 这里简化为模拟构建过程
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟构建成功或失败
        if (Math.random() > 0.05) { // 95%成功率
          const buildId = this.generateBuildId();
          const buildArtifacts = [
            {
              name: 'dist',
              path: \`/tmp/\${pipeline.id}/dist\`,
              type: 'directory'
            },
            {
              name: 'bundle.js',
              path: \`/tmp/\${pipeline.id}/dist/bundle.js\`,
              type: 'file',
              size: Math.floor(Math.random() * 200000) + 50000 // 50KB-250KB
            },
            {
              name: 'bundle.css',
              path: \`/tmp/\${pipeline.id}/dist/bundle.css\`,
              type: 'file',
              size: Math.floor(Math.random() * 50000) + 10000 // 10KB-60KB
            }
          ];
          
          // 记录构建产物
          this.artifacts.set(buildId, {
            pipelineId: pipeline.id,
            appName: pipeline.appName,
            version: this.generateVersion(),
            artifacts: buildArtifacts,
            buildTime: Date.now()
          });
          
          resolve({
            buildId,
            artifacts: buildArtifacts
          });
        } else {
          reject(new Error('Build failed'));
        }
      }, 4000);
    });
  }
  
  // 部署阶段
  async deployStage(pipeline) {
    console.log(\`Deploying \${pipeline.appName}\`);
    
    // 获取构建产物
    const buildArtifact = pipeline.artifacts.find(a => a.buildId);
    
    if (!buildArtifact) {
      throw new Error('No build artifacts found');
    }
    
    const build = this.artifacts.get(buildArtifact.buildId);
    
    if (!build) {
      throw new Error('Build not found');
    }
    
    // 添加到部署队列
    const deployment = {
      id: this.generateDeploymentId(),
      pipelineId: pipeline.id,
      appName: pipeline.appName,
      version: build.version,
      artifacts: build.artifacts,
      status: 'pending',
      startTime: null,
      endTime: null,
      error: null
    };
    
    this.deploymentQueue.push(deployment);
    
    // 等待部署完成
    return this.waitForDeployment(deployment.id);
  }
  
  // 等待部署完成
  async waitForDeployment(deploymentId) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const deployment = this.deploymentQueue.find(d => d.id === deploymentId);
        
        if (!deployment) {
          clearInterval(checkInterval);
          reject(new Error(\`Deployment \${deploymentId} not found\`));
          return;
        }
        
        if (deployment.status === 'success') {
          clearInterval(checkInterval);
          resolve({
            artifacts: [
              {
                name: 'deployment',
                path: \`https://example.com/apps/\${deployment.appName}/\${deployment.version}\`,
                type: 'url'
              }
            ]
          });
        } else if (deployment.status === 'failed') {
          clearInterval(checkInterval);
          reject(new Error(deployment.error || 'Deployment failed'));
        }
      }, 1000);
    });
  }
  
  // 启动构建处理器
  startBuildProcessor() {
    // 在实际项目中，这里会启动构建处理器
    // 这里简化为空实现
  }
  
  // 启动部署处理器
  startDeploymentProcessor() {
    setInterval(() => {
      if (this.deploymentQueue.length > 0) {
        const deployment = this.deploymentQueue.find(d => d.status === 'pending');
        
        if (deployment) {
          this.processDeployment(deployment);
        }
      }
    }, 1000);
  }
  
  // 处理部署
  async processDeployment(deployment) {
    deployment.status = 'in_progress';
    deployment.startTime = Date.now();
    
    console.log(\`Processing deployment \${deployment.id} for app \${deployment.appName}\`);
    
    try {
      // 模拟部署过程
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, Math.random() * 3000 + 2000);
      });
      
      deployment.status = 'success';
      deployment.endTime = Date.now();
      
      console.log(\`Deployment \${deployment.id} completed successfully\`);
    } catch (error) {
      console.error(\`Deployment \${deployment.id} failed:\`, error);
      
      deployment.status = 'failed';
      deployment.endTime = Date.now();
      deployment.error = error.message;
    }
  }
  
  // 获取流水线状态
  getPipelineStatus(pipelineId) {
    const pipeline = this.pipelines.get(pipelineId);
    
    if (!pipeline) {
      return null;
    }
    
    return {
      id: pipeline.id,
      appName: pipeline.appName,
      status: pipeline.status,
      currentStage: pipeline.currentStage,
      startTime: pipeline.startTime,
      endTime: pipeline.endTime,
      duration: pipeline.duration,
      stagesStatus: pipeline.stagesStatus,
      error: pipeline.error
    };
  }
  
  // 获取所有流水线状态
  getAllPipelineStatus() {
    const status = [];
    
    this.pipelines.forEach(pipeline => {
      status.push(this.getPipelineStatus(pipeline.id));
    });
    
    return status;
  }
  
  // 获取构建产物
  getBuildArtifacts(buildId) {
    return this.artifacts.get(buildId);
  }
  
  // 生成流水线ID
  generatePipelineId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return \`pipeline-\${timestamp}-\${random}\`;
  }
  
  // 生成构建ID
  generateBuildId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return \`build-\${timestamp}-\${random}\`;
  }
  
  // 生成部署ID
  generateDeploymentId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return \`deploy-\${timestamp}-\${random}\`;
  }
  
  // 生成版本号
  generateVersion() {
    const timestamp = Date.now();
    const hash = Math.random().toString(36).substring(2, 8);
    return \`1.0.\${timestamp}-\${hash}\`;
  }
  
  // 设置流水线监听
  setupPipelineListeners() {
    // 在实际项目中，这里会设置Webhook或其他监听机制
    // 这里简化为空实现
  }
}

// 使用示例
const cicd = new MicroFrontendCICD({
  pipelineName: 'micro-frontend-pipeline',
  stages: ['checkout', 'install', 'test', 'build', 'deploy'],
  artifactsRetention: 30,
  parallelDeployment: true
});

// 创建流水线
const homePipeline = cicd.createPipeline({
  name: 'home',
  repository: 'https://github.com/example/home-app.git',
  branch: 'main'
});

const productPipeline = cicd.createPipeline({
  name: 'product',
  repository: 'https://github.com/example/product-app.git',
  branch: 'develop'
});

// 执行流水线
cicd.executePipeline(homePipeline.id)
  .then(result => {
    console.log('Pipeline result:', result);
  })
  .catch(error => {
    console.error('Pipeline failed:', error);
  });

cicd.executePipeline(productPipeline.id)
  .then(result => {
    console.log('Pipeline result:', result);
  })
  .catch(error => {
    console.error('Pipeline failed:', error);
  });

// 监控流水线状态
setInterval(() => {
  const status = cicd.getAllPipelineStatus();
  console.log('Pipeline status:', status);
}, 3000);
\`\`\`

## 监控与告警

### 1. 微前端监控系统

\`\`\`javascript
// 微前端监控系统
class MicroFrontendMonitor {
  constructor(options = {}) {
    this.options = {
      metricsEndpoint: '/api/metrics',
      alertEndpoint: '/api/alerts',
      collectInterval: 30000, // 30秒
      alertThresholds: {
        errorRate: 0.05, // 5%
        responseTime: 3000, // 3秒
        availability: 0.99 // 99%
      },
      ...options
    };
    
    this.metrics = new Map();
    this.alerts = new Map();
    this.applications = new Map();
    
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
      alertRules: appConfig.alertRules || [],
      ...appConfig
    };
    
    this.applications.set(app.name, app);
    
    // 初始化应用指标
    this.metrics.set(app.name, {
      availability: {
        total: 0,
        success: 0,
        rate: 1
      },
      performance: {
        responseTime: [],
        avgResponseTime: 0,
        maxResponseTime: 0
      },
      errors: {
        count: 0,
        rate: 0,
        types: new Map()
      },
      custom: {}
    });
    
    console.log(\`Registered app for monitoring: \${app.name}\`);
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
    
    // 发送指标到监控系统
    this.sendMetrics();
  }
  
  // 收集可用性指标
  async collectAvailabilityMetrics(appName, app) {
    const healthCheckUrl = \`\${app.url}\${app.healthCheck}\`;
    const startTime = Date.now();
    
    try {
      const response = await fetch(healthCheckUrl, {
        method: 'GET',
        cache: 'no-cache'
      });
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;
      
      const metrics = this.metrics.get(appName);
      
      // 更新可用性指标
      metrics.availability.total++;
      
      if (isHealthy) {
        metrics.availability.success++;
      }
      
      metrics.availability.rate = metrics.availability.success / metrics.availability.total;
      
      // 更新性能指标
      metrics.performance.responseTime.push(responseTime);
      
      // 限制响应时间数组大小
      if (metrics.performance.responseTime.length > 100) {
        metrics.performance.responseTime.shift();
      }
      
      // 计算平均和最大响应时间
      metrics.performance.avgResponseTime = 
        metrics.performance.responseTime.reduce((sum, time) => sum + time, 0) / 
        metrics.performance.responseTime.length;
      
      metrics.performance.maxResponseTime = Math.max(...metrics.performance.responseTime);
    } catch (error) {
      // 健康检查失败
      const metrics = this.metrics.get(appName);
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

### 2. 运维最佳实践

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

## 总结

微前端部署与运维是确保微前端系统稳定运行的关键环节。本文详细介绍了微前端的部署策略、CI/CD集成、监控与告警方案，以及实际应用案例。

通过合理应用这些技术和实践，可以构建高效、可靠的微前端部署和运维体系，提高系统的可维护性和可扩展性。随着微前端技术的不断发展，部署与运维方案也将不断演进，为开发者提供更强大、更自动化的工具和方法。`;export{n as default};
//# sourceMappingURL=31-DSt5A7k6.js.map
