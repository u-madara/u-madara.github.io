const n=`---
title: "JavaScript Web Workers限制、安全与最佳实践"
excerpt: "深入探讨JavaScript Web Workers的限制、安全考虑与最佳实践，包括DOM访问限制、API访问限制、同源策略与错误处理机制"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-09-18"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
categories: ["JavaScript"]
---

# JavaScript Web Workers与多线程编程 - 限制、安全与最佳实践

## 5. Web Workers的限制与注意事项

### 5.1 Web Workers的限制

虽然Web Workers提供了强大的多线程能力，但它们也有一些限制需要注意：

#### DOM访问限制

Web Workers无法直接访问DOM，这是为了防止多线程环境下的竞争条件。

\`\`\`javascript
// 错误示例：在Worker中尝试访问DOM
// worker.js
self.onmessage = (event) => {
  // 以下代码会导致错误
  const element = document.getElementById('myElement'); // 错误：document未定义
  element.textContent = 'Updated from worker';
  
  // 正确做法：通过消息传递与主线程通信
  self.postMessage({
    type: 'updateElement',
    id: 'myElement',
    text: 'Updated from worker'
  });
};

// 主线程代码
const worker = new Worker('worker.js');
worker.onmessage = (event) => {
  if (event.data.type === 'updateElement') {
    const element = document.getElementById(event.data.id);
    if (element) {
      element.textContent = event.data.text;
    }
  }
};
\`\`\`

#### API访问限制

Web Workers只能访问部分Web API，无法访问以下API：
- \`window\` 对象及其方法（如 \`alert\`, \`confirm\`, \`prompt\`）
- \`document\` 对象
- \`parent\` 对象
- 部分 \`localStorage\` 和 \`sessionStorage\`（虽然可以通过消息传递实现）

\`\`\`javascript
// limitations-worker.js
self.onmessage = (event) => {
  try {
    // 这些API在Worker中不可用
    // alert('Hello from worker'); // 错误
    // localStorage.setItem('key', 'value'); // 错误
    // document.title = 'New Title'; // 错误
    
    // 这些API在Worker中可用
    console.log('Worker can use console');
    fetch('/api/data').then(response => response.json());
    const timer = setTimeout(() => console.log('Timer expired'), 1000);
    const data = new ArrayBuffer(1024);
    
    self.postMessage({
      type: 'success',
      message: 'Worker APIs test completed'
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error.message
    });
  }
};
\`\`\`

#### 同源策略

Web Workers遵循同源策略，Worker脚本必须与主页面同源，或者使用CORS头。

\`\`\`html
<!-- 错误示例：加载不同域的Worker -->
<script>
// 如果worker.js托管在不同域且没有正确的CORS头，这会失败
const worker = new Worker('https://different-domain.com/worker.js');
<\/script>

<!-- 正确示例：使用同源Worker或启用CORS -->
<script>
// 同源Worker
const worker = new Worker('/workers/worker.js');

// 或者使用blob URL加载外部Worker（需要CORS支持）
fetch('https://different-domain.com/worker.js')
  .then(response => response.text())
  .then(workerCode => {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    
    // 使用完成后释放blob URL
    worker.onmessage = (event) => {
      if (event.data.type === 'complete') {
        URL.revokeObjectURL(workerUrl);
      }
    };
  });
<\/script>
\`\`\`

#### 数据共享方式

Web Workers之间不能直接共享变量，必须通过消息传递或使用SharedArrayBuffer共享内存。

\`\`\`javascript
// 主线程
const sharedBuffer = new SharedArrayBuffer(1024);
const sharedArray = new Int32Array(sharedBuffer);

const worker = new Worker('shared-array-worker.js');
worker.postMessage({ sharedBuffer }, [sharedBuffer]);

// 不能直接访问Worker中的变量
// worker.someVariable = 10; // 错误

// shared-array-worker.js
self.onmessage = (event) => {
  const { sharedBuffer } = event.data;
  const sharedArray = new Int32Array(sharedBuffer);
  
  // 使用Atomics进行原子操作
  Atomics.store(sharedArray, 0, 42);
  
  // 通知主线程
  self.postMessage({
    type: 'updated',
    value: Atomics.load(sharedArray, 0)
  });
};
\`\`\`

### 5.2 安全考虑

使用Web Workers时需要注意一些安全方面的问题：

#### Worker来源验证

确保Worker脚本来自可信来源，防止代码注入攻击。

\`\`\`javascript
// 安全的Worker加载
function loadWorkerSafely(url) {
  return fetch(url)
    .then(response => {
      // 验证响应类型
      if (!response.ok) {
        throw new Error(\`Failed to fetch worker: \${response.status}\`);
      }
      
      // 检查Content-Type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/javascript')) {
        throw new Error('Invalid worker script content type');
      }
      
      return response.text();
    })
    .then(workerCode => {
      // 可选：代码验证
      if (!validateWorkerCode(workerCode)) {
        throw new Error('Worker code validation failed');
      }
      
      // 创建Worker
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);
      
      // 设置清理
      worker._blobUrl = workerUrl;
      return worker;
    });
}

// 简单的代码验证函数
function validateWorkerCode(code) {
  // 检查是否包含危险操作
  const dangerousPatterns = [
    /eval\\s*\\(/,
    /Function\\s*\\(/,
    /importScripts\\s*\\(/,
    /document\\./,
    /window\\./,
    /localStorage\\./,
    /sessionStorage\\./
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      console.warn('Potentially dangerous code detected:', pattern);
      // 根据安全策略决定是否拒绝
      return false;
    }
  }
  
  return true;
}

// 使用示例
loadWorkerSafely('/workers/secure-worker.js')
  .then(worker => {
    worker.onmessage = (event) => {
      console.log('Worker message:', event.data);
    };
    
    worker.postMessage({ task: 'secureOperation' });
  })
  .catch(error => {
    console.error('Failed to load worker:', error);
  });
\`\`\`

#### 消息验证

验证来自Worker的消息，防止恶意数据注入。

\`\`\`javascript
// 主线程消息验证
function createSecureWorker(url) {
  const worker = new Worker(url);
  
  // 包装消息处理
  const originalOnMessage = worker.onmessage;
  
  worker.onmessage = (event) => {
    try {
      // 验证消息结构
      const message = validateMessage(event.data);
      
      // 调用原始处理器
      if (originalOnMessage) {
        originalOnMessage({ ...event, data: message });
      }
    } catch (error) {
      console.error('Invalid message from worker:', error);
      // 可选：终止Worker
      // worker.terminate();
    }
  };
  
  return worker;
}

// 消息验证函数
function validateMessage(data) {
  // 基本类型检查
  if (typeof data !== 'object' || data === null) {
    throw new Error('Message must be an object');
  }
  
  // 检查必需字段
  if (!data.type || typeof data.type !== 'string') {
    throw new Error('Message must have a valid type field');
  }
  
  // 根据类型验证数据
  switch (data.type) {
    case 'result':
      if (data.result === undefined) {
        throw new Error('Result message must have result field');
      }
      break;
      
    case 'error':
      if (!data.error || typeof data.error !== 'string') {
        throw new Error('Error message must have error field');
      }
      break;
      
    case 'progress':
      if (typeof data.percentage !== 'number' || 
          data.percentage < 0 || 
          data.percentage > 100) {
        throw new Error('Progress message must have valid percentage');
      }
      break;
      
    default:
      throw new Error(\`Unknown message type: \${data.type}\`);
  }
  
  return data;
}

// Worker端消息发送
// secure-worker.js
function sendSecureMessage(type, data) {
  self.postMessage({
    type,
    data,
    timestamp: Date.now(),
    workerId: self.id || 'unknown'
  });
}

// 使用示例
const secureWorker = createSecureWorker('secure-worker.js');
secureWorker.onmessage = (event) => {
  // 消息已经过验证
  const { type, data } = event.data;
  
  switch (type) {
    case 'result':
      console.log('Worker result:', data);
      break;
    case 'error':
      console.error('Worker error:', data);
      break;
    case 'progress':
      updateProgress(data.percentage);
      break;
  }
};
\`\`\`

#### XSS防护

虽然Web Workers本身不能直接操作DOM，但仍需防止通过消息传递进行XSS攻击。

\`\`\`javascript
// 主线程安全渲染
function renderWorkerData(data) {
  // 对数据进行清理
  const sanitizedData = sanitizeData(data);
  
  // 安全地渲染到DOM
  const container = document.getElementById('worker-output');
  
  // 使用textContent而不是innerHTML
  container.textContent = JSON.stringify(sanitizedData, null, 2);
  
  // 如果需要HTML，使用安全的DOM API
  const list = document.createElement('ul');
  sanitizedData.items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.name; // 安全设置文本内容
    list.appendChild(li);
  });
  
  container.appendChild(list);
}

// 数据清理函数
function sanitizeData(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  // 创建清理后的对象
  const sanitized = {};
  
  // 只允许已知的安全字段
  const allowedFields = ['id', 'name', 'value', 'timestamp', 'items'];
  
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (field === 'items' && Array.isArray(data[field])) {
        // 递归清理数组项
        sanitized[field] = data[field].map(item => 
          typeof item === 'object' ? sanitizeData(item) : item
        );
      } else {
        sanitized[field] = data[field];
      }
    }
  }
  
  return sanitized;
}

// Worker端数据准备
// xss-prevention-worker.js
self.onmessage = (event) => {
  const { taskId } = event.data;
  
  // 准备数据，只包含必要字段
  const result = {
    type: 'result',
    taskId,
    data: {
      id: taskId,
      name: \`Task \${taskId} result\`,
      value: Math.random() * 100,
      timestamp: Date.now(),
      items: [
        { id: 1, name: \`Item 1 for task \${taskId}\` },
        { id: 2, name: \`Item 2 for task \${taskId}\` }
      ]
    }
  };
  
  // 发送清理后的数据
  self.postMessage(result);
};
\`\`\`

#### CSP策略

确保内容安全策略(CSP)允许加载Worker脚本。

\`\`\`html
<!-- 在HTTP头部或meta标签中设置CSP -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               worker-src 'self'; 
               connect-src 'self' https://api.example.com;">

<!-- 或者更严格的策略 -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'none'; 
               script-src 'self'; 
               worker-src 'self'; 
               connect-src 'self' https://api.example.com;">

<!-- 动态创建Worker时检查CSP -->
function checkWorkerCSP(workerUrl) {
  // 检查当前页面的CSP策略
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  
  if (!cspMeta) {
    console.warn('No CSP policy found, proceeding with caution');
    return true;
  }
  
  const cspContent = cspMeta.getAttribute('content');
  
  // 检查worker-src策略
  if (cspContent.includes('worker-src')) {
    // 如果worker-src存在且不包含'self'或具体URL，则拒绝
    if (!cspContent.includes("'self'") && !cspContent.includes(workerUrl)) {
      console.error('CSP policy does not allow this worker');
      return false;
    }
  }
  
  return true;
}

// 安全创建Worker
function createWorkerWithCSPCheck(workerUrl) {
  if (!checkWorkerCSP(workerUrl)) {
    throw new Error('Worker creation blocked by CSP policy');
  }
  
  return new Worker(workerUrl);
}
\`\`\`

#### 权限限制

确保Worker只能访问其需要的资源，遵循最小权限原则。

\`\`\`javascript
// 权限受限的Worker
// permission-limited-worker.js
self.onmessage = (event) => {
  const { operation, url } = event.data;
  
  switch (operation) {
    case 'fetchData':
      // 只允许访问特定域名的API
      if (!isAllowedDomain(url)) {
        self.postMessage({
          type: 'error',
          message: 'Access to this domain is not allowed'
        });
        return;
      }
      
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(\`HTTP error: \${response.status}\`);
          }
          return response.json();
        })
        .then(data => {
          // 只返回必要的数据字段
          const filteredData = filterSensitiveData(data);
          
          self.postMessage({
            type: 'result',
            data: filteredData
          });
        })
        .catch(error => {
          self.postMessage({
            type: 'error',
            message: error.message
          });
        });
      break;
      
    default:
      self.postMessage({
        type: 'error',
        message: \`Unknown operation: \${operation}\`
      });
  }
};

// 检查域名是否在允许列表中
function isAllowedDomain(url) {
  const allowedDomains = [
    'https://api.example.com',
    'https://data.example.org'
  ];
  
  try {
    const urlObj = new URL(url);
    return allowedDomains.some(domain => 
      urlObj.origin === new URL(domain).origin
    );
  } catch (error) {
    return false;
  }
}

// 过滤敏感数据
function filterSensitiveData(data) {
  if (Array.isArray(data)) {
    return data.map(item => filterSensitiveData(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const filtered = {};
    
    // 只允许特定字段
    const allowedFields = ['id', 'name', 'value', 'timestamp'];
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        filtered[field] = data[field];
      }
    }
    
    return filtered;
  }
  
  return data;
}
\`\`\`

## 6. Web Workers最佳实践

### 6.1 性能优化

合理使用Web Workers可以显著提高应用性能，但需要注意一些优化技巧。

#### 任务分配优化

合理分配任务到Worker，避免过度分割导致通信开销过大。

\`\`\`javascript
// 任务分配优化示例
class TaskOptimizer {
  constructor(workerScript, maxWorkers = 4) {
    this.workerPool = new WorkerPool(workerScript, maxWorkers);
    this.taskQueue = [];
    this.batchSize = this.calculateOptimalBatchSize();
  }
  
  // 计算最优批处理大小
  calculateOptimalBatchSize() {
    // 基于Worker数量和任务复杂度计算
    const baseSize = 1000;
    const complexityFactor = 1.5; // 根据任务复杂度调整
    return Math.ceil(baseSize * complexityFactor / this.workerPool.poolSize);
  }
  
  // 处理大数据集
  processLargeDataset(dataset) {
    // 将数据分割成批次
    const batches = this.createBatches(dataset, this.batchSize);
    
    // 提交批次任务
    const promises = batches.map((batch, index) => 
      this.workerPool.postTask({
        batchIndex: index,
        data: batch,
        totalBatches: batches.length
      })
    );
    
    return Promise.all(promises);
  }
  
  // 创建数据批次
  createBatches(data, batchSize) {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    return batches;
  }
}

// 使用示例
const optimizer = new TaskOptimizer('data-processing-worker.js');
const largeDataset = Array.from({ length: 100000 }, (_, i) => ({
  id: i,
  value: Math.random() * 1000
}));

optimizer.processLargeDataset(largeDataset)
  .then(results => {
    // 合并结果
    const combinedResults = results.reduce((acc, batch) => 
      acc.concat(batch.data), []
    );
    
    console.log('Processed dataset:', combinedResults);
  });
\`\`\`

#### Worker池管理

使用Worker池可以减少创建和销毁Worker的开销。

\`\`\`javascript
// 高效的Worker池实现
class EfficientWorkerPool {
  constructor(workerScript, options = {}) {
    this.workerScript = workerScript;
    this.maxWorkers = options.maxWorkers || navigator.hardwareConcurrency || 4;
    this.minWorkers = options.minWorkers || 1;
    this.maxIdleTime = options.maxIdleTime || 30000; // 30秒
    
    this.workers = [];
    this.availableWorkers = [];
    this.busyWorkers = new Set();
    this.taskQueue = [];
    this.lastActivityTime = Date.now();
    
    // 初始化最小数量的Worker
    this.initWorkers(this.minWorkers);
    
    // 定期检查空闲Worker
    this.startIdleCheck();
  }
  
  // 初始化Worker
  initWorkers(count) {
    for (let i = 0; i < count; i++) {
      this.createWorker();
    }
  }
  
  // 创建新Worker
  createWorker() {
    const worker = new Worker(this.workerScript);
    worker.id = Date.now() + Math.random();
    worker.createdAt = Date.now();
    worker.lastUsed = Date.now();
    
    worker.onmessage = (event) => {
      this.handleWorkerMessage(worker, event);
    };
    
    worker.onerror = (error) => {
      console.error(\`Worker \${worker.id} error:\`, error);
      this.releaseWorker(worker);
      // 可选：重新创建Worker
      this.createWorker();
    };
    
    this.workers.push(worker);
    this.availableWorkers.push(worker);
    
    return worker;
  }
  
  // 提交任务
  postTask(data, transferables) {
    return new Promise((resolve, reject) => {
      const task = {
        data,
        transferables,
        resolve,
        reject,
        timestamp: Date.now()
      };
      
      // 尝试立即执行任务
      if (!this.executeTask(task)) {
        // 如果没有可用Worker，加入队列
        this.taskQueue.push(task);
        
        // 如果可以创建更多Worker且队列过长，创建新Worker
        if (this.workers.length < this.maxWorkers && 
            this.taskQueue.length > this.availableWorkers.length) {
          this.createWorker();
        }
      }
    });
  }
  
  // 执行任务
  executeTask(task) {
    const worker = this.getAvailableWorker();
    
    if (!worker) {
      return false;
    }
    
    // 标记Worker为忙碌
    this.busyWorkers.add(worker);
    worker.lastUsed = Date.now();
    this.lastActivityTime = Date.now();
    
    // 存储任务回调
    worker.currentTask = task;
    
    // 发送任务到Worker
    if (task.transferables) {
      worker.postMessage(task.data, task.transferables);
    } else {
      worker.postMessage(task.data);
    }
    
    return true;
  }
  
  // 获取可用Worker
  getAvailableWorker() {
    if (this.availableWorkers.length === 0) {
      return null;
    }
    
    return this.availableWorkers.pop();
  }
  
  // 处理Worker消息
  handleWorkerMessage(worker, event) {
    const task = worker.currentTask;
    
    if (!task) {
      console.warn(\`Received message from idle worker \${worker.id}\`);
      return;
    }
    
    // 解决任务Promise
    task.resolve(event.data);
    
    // 释放Worker
    this.releaseWorker(worker);
    
    // 处理队列中的下一个任务
    this.processQueue();
  }
  
  // 释放Worker
  releaseWorker(worker) {
    this.busyWorkers.delete(worker);
    worker.currentTask = null;
    this.availableWorkers.push(worker);
  }
  
  // 处理任务队列
  processQueue() {
    if (this.taskQueue.length === 0) {
      return;
    }
    
    const task = this.taskQueue.shift();
    if (!this.executeTask(task)) {
      // 如果仍然没有可用Worker，将任务放回队列前端
      this.taskQueue.unshift(task);
    }
  }
  
  // 开始空闲检查
  startIdleCheck() {
    this.idleCheckInterval = setInterval(() => {
      this.checkIdleWorkers();
    }, 10000); // 每10秒检查一次
  }
  
  // 检查空闲Worker
  checkIdleWorkers() {
    const now = Date.now();
    const idleTime = now - this.lastActivityTime;
    
    // 如果整体空闲时间超过阈值，减少Worker数量
    if (idleTime > this.maxIdleTime && 
        this.workers.length > this.minWorkers &&
        this.taskQueue.length === 0) {
      
      // 找出最久未使用的Worker
      const oldestWorker = this.availableWorkers
        .sort((a, b) => a.lastUsed - b.lastUsed)[0];
      
      if (oldestWorker) {
        this.terminateWorker(oldestWorker);
      }
    }
  }
  
  // 终止Worker
  terminateWorker(worker) {
    worker.terminate();
    
    // 从数组中移除
    const workerIndex = this.workers.indexOf(worker);
    if (workerIndex !== -1) {
      this.workers.splice(workerIndex, 1);
    }
    
    const availableIndex = this.availableWorkers.indexOf(worker);
    if (availableIndex !== -1) {
      this.availableWorkers.splice(availableIndex, 1);
    }
    
    console.log(\`Terminated worker \${worker.id}\`);
  }
  
  // 获取池状态
  getStatus() {
    return {
      totalWorkers: this.workers.length,
      busyWorkers: this.busyWorkers.size,
      availableWorkers: this.availableWorkers.length,
      queuedTasks: this.taskQueue.length,
      lastActivityTime: this.lastActivityTime
    };
  }
  
  // 终止所有Worker
  terminate() {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
    }
    
    this.workers.forEach(worker => {
      worker.terminate();
    });
    
    this.workers = [];
    this.availableWorkers = [];
    this.busyWorkers.clear();
    this.taskQueue = [];
  }
}
\`\`\`

#### 使用Transferable Objects

使用Transferable Objects可以减少数据复制开销，提高性能。

\`\`\`javascript
// 使用Transferable Objects优化性能
function optimizedDataTransfer() {
  // 创建大型数据
  const largeArray = new Float32Array(1000000);
  for (let i = 0; i < largeArray.length; i++) {
    largeArray[i] = Math.random();
  }
  
  const worker = new Worker('transferable-worker.js');
  
  // 使用Transferable Objects传递数据
  worker.postMessage({
    type: 'process',
    data: largeArray.buffer
  }, [largeArray.buffer]); // 转移所有权
  
  worker.onmessage = (event) => {
    if (event.data.type === 'result') {
      // 接收处理后的数据
      const resultBuffer = event.data.data;
      const resultArray = new Float32Array(resultBuffer);
      
      console.log('Processed data:', resultArray);
      
      // 使用完成后释放
      resultArray.buffer = null;
    }
  };
}

// Worker端处理Transferable Objects
// transferable-worker.js
self.onmessage = (event) => {
  const { type, data } = event.data;
  
  if (type === 'process') {
    // 接收Transferable Object
    const arrayBuffer = data;
    const floatArray = new Float32Array(arrayBuffer);
    
    // 处理数据
    for (let i = 0; i < floatArray.length; i++) {
      floatArray[i] = floatArray[i] * 2;
    }
    
    // 发送处理后的数据（转移所有权）
    self.postMessage({
      type: 'result',
      data: arrayBuffer
    }, [arrayBuffer]);
  }
};
\`\`\`

#### 批量处理消息

批量处理消息可以减少通信开销。

\`\`\`javascript
// 批量处理消息示例
class BatchProcessor {
  constructor(worker, batchSize = 10, batchTimeout = 100) {
    this.worker = worker;
    this.batchSize = batchSize;
    this.batchTimeout = batchTimeout;
    
    this.pendingTasks = [];
    this.batchTimer = null;
    this.pendingPromises = new Map();
    
    this.worker.onmessage = (event) => {
      this.handleWorkerMessage(event);
    };
  }
  
  // 添加任务到批次
  addTask(taskData) {
    return new Promise((resolve, reject) => {
      const taskId = Date.now() + Math.random();
      
      // 存储Promise解析器
      this.pendingPromises.set(taskId, { resolve, reject });
      
      // 添加到待处理任务列表
      this.pendingTasks.push({
        taskId,
        data: taskData
      });
      
      // 检查是否需要立即处理批次
      if (this.pendingTasks.length >= this.batchSize) {
        this.processBatch();
      } else if (!this.batchTimer) {
        // 设置超时处理
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, this.batchTimeout);
      }
    });
  }
  
  // 处理批次
  processBatch() {
    if (this.pendingTasks.length === 0) {
      return;
    }
    
    // 清除定时器
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // 获取当前批次
    const batch = this.pendingTasks.splice(0, this.batchSize);
    
    // 发送批次到Worker
    this.worker.postMessage({
      type: 'batch',
      tasks: batch
    });
  }
  
  // 处理Worker消息
  handleWorkerMessage(event) {
    const { type, results } = event.data;
    
    if (type === 'batchResults') {
      // 处理批次结果
      results.forEach(result => {
        const { taskId, data, error } = result;
        const promise = this.pendingPromises.get(taskId);
        
        if (promise) {
          if (error) {
            promise.reject(new Error(error));
          } else {
            promise.resolve(data);
          }
          
          // 清理
          this.pendingPromises.delete(taskId);
        }
      });
    }
  }
}

// Worker端批量处理
// batch-worker.js
self.onmessage = (event) => {
  const { type, tasks } = event.data;
  
  if (type === 'batch') {
    // 处理批次中的每个任务
    const results = tasks.map(task => {
      try {
        const result = processTask(task.data);
        
        return {
          taskId: task.taskId,
          data: result
        };
      } catch (error) {
        return {
          taskId: task.taskId,
          error: error.message
        };
      }
    });
    
    // 发送批量结果
    self.postMessage({
      type: 'batchResults',
      results
    });
  }
};

function processTask(data) {
  // 模拟处理任务
  const { operation, value } = data;
  
  switch (operation) {
    case 'square':
      return value * value;
    case 'sqrt':
      return Math.sqrt(value);
    case 'log':
      return Math.log(value);
    default:
      throw new Error(\`Unknown operation: \${operation}\`);
  }
}
\`\`\`

### 6.2 错误处理与调试

良好的错误处理和调试策略对于Web Workers应用至关重要。

#### 全局错误处理

在Worker中设置全局错误处理，捕获未处理的异常。

\`\`\`javascript
// Worker全局错误处理
// error-handling-worker.js
// 设置全局错误处理
self.onerror = (message, source, lineno, colno, error) => {
  console.error('Worker global error:', {
    message,
    source,
    lineno,
    colno,
    error: error ? error.stack : 'No error object'
  });
  
  // 通知主线程
  self.postMessage({
    type: 'error',
    error: {
      message,
      source,
      lineno,
      colno,
      stack: error ? error.stack : null
    }
  });
  
  // 阻止默认错误处理
  return true;
};

// 处理未捕获的Promise拒绝
self.onunhandledrejection = (event) => {
  console.error('Worker unhandled promise rejection:', event.reason);
  
  // 通知主线程
  self.postMessage({
    type: 'unhandledRejection',
    reason: event.reason
  });
  
  // 阻止默认处理
  event.preventDefault();
};

// 任务处理逻辑
self.onmessage = (event) => {
  const { taskId, operation, data } = event.data;
  
  try {
    // 执行任务
    const result = executeOperation(operation, data);
    
    // 发送成功结果
    self.postMessage({
      type: 'success',
      taskId,
      result
    });
  } catch (error) {
    // 发送错误信息
    self.postMessage({
      type: 'taskError',
      taskId,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
};

function executeOperation(operation, data) {
  switch (operation) {
    case 'processData':
      return processData(data);
    case 'calculate':
      return calculate(data);
    default:
      throw new Error(\`Unknown operation: \${operation}\`);
  }
}

function processData(data) {
  // 模拟可能出错的处理
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid data: expected an array');
  }
  
  return data.map(item => item * 2);
}

function calculate(data) {
  // 模拟可能出错的计算
  if (typeof data !== 'number') {
    throw new Error('Invalid data: expected a number');
  }
  
  if (data < 0) {
    throw new Error('Cannot calculate square root of negative number');
  }
  
  return Math.sqrt(data);
}
\`\`\`

#### 超时处理

为长时间运行的任务设置超时，防止Worker无响应。

\`\`\`javascript
// 带超时的Worker任务
class TimeoutWorker {
  constructor(workerScript, defaultTimeout = 10000) {
    this.worker = new Worker(workerScript);
    this.defaultTimeout = defaultTimeout;
    this.pendingTasks = new Map();
    
    this.worker.onmessage = (event) => {
      this.handleMessage(event);
    };
    
    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
      this.rejectAllTasks(error);
    };
  }
  
  // 发送带超时的任务
  postTask(data, timeout = this.defaultTimeout) {
    return new Promise((resolve, reject) => {
      const taskId = Date.now() + Math.random();
      
      // 存储任务信息
      this.pendingTasks.set(taskId, {
        resolve,
        reject,
        timeoutId: setTimeout(() => {
          this.handleTimeout(taskId);
        }, timeout)
      });
      
      // 发送任务到Worker
      this.worker.postMessage({
        taskId,
        data
      });
    });
  }
  
  // 处理Worker消息
  handleMessage(event) {
    const { taskId, type, result, error } = event.data;
    
    const task = this.pendingTasks.get(taskId);
    if (!task) {
      console.warn(\`Received message for unknown task: \${taskId}\`);
      return;
    }
    
    // 清除超时定时器
    clearTimeout(task.timeoutId);
    
    // 从待处理任务中移除
    this.pendingTasks.delete(taskId);
    
    // 处理结果
    if (type === 'success') {
      task.resolve(result);
    } else if (type === 'error') {
      task.reject(new Error(error.message));
    }
  }
  
  // 处理超时
  handleTimeout(taskId) {
    const task = this.pendingTasks.get(taskId);
    if (!task) {
      return;
    }
    
    // 从待处理任务中移除
    this.pendingTasks.delete(taskId);
    
    // 拒绝Promise
    task.reject(new Error(\`Task \${taskId} timed out\`));
  }
  
  // 拒绝所有待处理任务
  rejectAllTasks(error) {
    for (const [taskId, task] of this.pendingTasks) {
      clearTimeout(task.timeoutId);
      task.reject(error);
    }
    
    this.pendingTasks.clear();
  }
  
  // 终止Worker
  terminate() {
    // 拒绝所有待处理任务
    this.rejectAllTasks(new Error('Worker terminated'));
    
    // 终止Worker
    this.worker.terminate();
  }
}

// 使用示例
const timeoutWorker = new TimeoutWorker('long-running-worker.js');

timeoutWorker.postTask({ operation: 'complexCalculation', iterations: 100000000 }, 5000)
  .then(result => {
    console.log('Task completed:', result);
  })
  .catch(error => {
    console.error('Task failed:', error.message);
  });
\`\`\`

#### 调试日志

实现结构化的日志系统，便于调试Worker代码。

\`\`\`javascript
// Worker调试日志系统
// debug-worker.js
// 日志级别
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// 当前日志级别（可配置）
let currentLogLevel = LogLevel.INFO;

// 日志缓冲区
const logBuffer = [];
const maxLogBuffer = 100;

// 设置日志级别
function setLogLevel(level) {
  currentLogLevel = level;
}

// 日志函数
function log(level, message, data = null) {
  if (level < currentLogLevel) {
    return;
  }
  
  const logEntry = {
    timestamp: Date.now(),
    level: getLevelName(level),
    message,
    data
  };
  
  // 添加到缓冲区
  logBuffer.push(logEntry);
  
  // 限制缓冲区大小
  if (logBuffer.length > maxLogBuffer) {
    logBuffer.shift();
  }
  
  // 发送日志到主线程
  self.postMessage({
    type: 'log',
    log: logEntry
  });
}

// 获取日志级别名称
function getLevelName(level) {
  switch (level) {
    case LogLevel.DEBUG: return 'DEBUG';
    case LogLevel.INFO: return 'INFO';
    case LogLevel.WARN: return 'WARN';
    case LogLevel.ERROR: return 'ERROR';
    default: return 'UNKNOWN';
  }
}

// 便捷日志函数
function debug(message, data) {
  log(LogLevel.DEBUG, message, data);
}

function info(message, data) {
  log(LogLevel.INFO, message, data);
}

function warn(message, data) {
  log(LogLevel.WARN, message, data);
}

function error(message, data) {
  log(LogLevel.ERROR, message, data);
}

// 获取所有日志
function getLogs() {
  return [...logBuffer];
}

// 清除日志
function clearLogs() {
  logBuffer.length = 0;
}

// Worker消息处理
self.onmessage = (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'task':
      info('Starting task', { taskId: data.taskId });
      
      try {
        const result = executeTask(data);
        info('Task completed successfully', { taskId: data.taskId });
        
        self.postMessage({
          type: 'result',
          taskId: data.taskId,
          result
        });
      } catch (error) {
        error('Task failed', { 
          taskId: data.taskId, 
          error: error.message,
          stack: error.stack
        });
        
        self.postMessage({
          type: 'error',
          taskId: data.taskId,
          error: error.message
        });
      }
      break;
      
    case 'setLogLevel':
      setLogLevel(data.level);
      info('Log level updated', { level: getLevelName(data.level) });
      break;
      
    case 'getLogs':
      self.postMessage({
        type: 'logs',
        logs: getLogs()
      });
      break;
      
    case 'clearLogs':
      clearLogs();
      info('Log buffer cleared');
      break;
  }
};

// 执行任务
function executeTask(taskData) {
  const { operation, parameters } = taskData;
  
  debug('Executing operation', { operation, parameters });
  
  switch (operation) {
    case 'calculate':
      return calculate(parameters);
    case 'processData':
      return processData(parameters);
    default:
      throw new Error(\`Unknown operation: \${operation}\`);
  }
}

function calculate(parameters) {
  const { iterations } = parameters;
  let result = 0;
  
  debug('Starting calculation', { iterations });
  
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i);
    
    // 每10000次迭代记录一次进度
    if (i % 10000 === 0) {
      debug('Calculation progress', { 
        current: i, 
        total: iterations,
        percentage: Math.round(i / iterations * 100)
      });
    }
  }
  
  debug('Calculation completed', { result });
  return result;
}

function processData(parameters) {
  const { data } = parameters;
  
  debug('Processing data', { dataSize: data.length });
  
  // 模拟数据处理
  const processedData = data.map(item => {
    const processed = item * 2;
    
    // 记录处理异常值
    if (processed > 1000) {
      warn('Large value detected', { original: item, processed });
    }
    
    return processed;
  });
  
  debug('Data processing completed', { 
    inputSize: data.length,
    outputSize: processedData.length
  });
  
  return processedData;
}
\`\`\`

#### 状态监控

监控Worker状态，便于调试和性能分析。

\`\`\`javascript
// Worker状态监控
class WorkerMonitor {
  constructor(worker) {
    this.worker = worker;
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      taskCount: 0,
      completedTasks: 0,
      averageTaskTime: 0
    };
    
    this.taskTimes = [];
    
    // 包装原始消息处理
    const originalOnMessage = this.worker.onmessage;
    const originalPostMessage = this.worker.postMessage.bind(this.worker);
    
    // 监控消息接收
    this.worker.onmessage = (event) => {
      this.stats.messagesReceived++;
      this.stats.lastActivityTime = Date.now();
      
      // 处理任务完成
      if (event.data.type === 'result' || event.data.type === 'error') {
        this.handleTaskCompletion(event.data.taskId);
      }
      
      if (originalOnMessage) {
        originalOnMessage(event);
      }
    };
    
    // 监控消息发送
    this.worker.postMessage = (data, transferables) => {
      this.stats.messagesSent++;
      this.stats.lastActivityTime = Date.now();
      
      // 处理新任务
      if (data.taskId) {
        this.handleNewTask(data.taskId);
      }
      
      return originalPostMessage(data, transferables);
    };
    
    // 监控错误
    this.worker.onerror = (error) => {
      this.stats.errors++;
      this.stats.lastActivityTime = Date.now();
      
      console.error('Worker error:', error);
    };
  }
  
  // 处理新任务
  handleNewTask(taskId) {
    this.stats.taskCount++;
    this.taskTimes[taskId] = {
      startTime: performance.now()
    };
  }
  
  // 处理任务完成
  handleTaskCompletion(taskId) {
    const taskTime = this.taskTimes[taskId];
    if (taskTime) {
      const duration = performance.now() - taskTime.startTime;
      
      // 更新平均任务时间
      const totalTaskTime = this.stats.averageTaskTime * this.stats.completedTasks + duration;
      this.stats.completedTasks++;
      this.stats.averageTaskTime = totalTaskTime / this.stats.completedTasks;
      
      // 清理任务时间记录
      delete this.taskTimes[taskId];
    }
  }
  
  // 获取统计信息
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const idleTime = Date.now() - this.stats.lastActivityTime;
    
    return {
      ...this.stats,
      uptime,
      idleTime,
      messagesPerSecond: (this.stats.messagesReceived / uptime) * 1000,
      taskSuccessRate: this.stats.taskCount > 0 
        ? (this.stats.completedTasks / this.stats.taskCount) * 100 
        : 0,
      pendingTasks: this.stats.taskCount - this.stats.completedTasks
    };
  }
  
  // 重置统计信息
  resetStats() {
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      taskCount: 0,
      completedTasks: 0,
      averageTaskTime: 0
    };
    
    this.taskTimes = [];
  }
}

// 使用示例
const worker = new Worker('monitored-worker.js');
const monitor = new WorkerMonitor(worker);

// 定期输出统计信息
setInterval(() => {
  const stats = monitor.getStats();
  console.log('Worker stats:', stats);
}, 5000);
\`\`\`

通过以上最佳实践，我们可以构建更健壮、高效的Web Workers应用，提高用户体验和应用性能。

## 总结

Web Workers为JavaScript提供了真正的多线程能力，使我们能够在后台执行计算密集型任务，避免阻塞主线程。通过合理使用Web Workers，我们可以：

1. 提高应用响应性，避免UI冻结
2. 充分利用多核CPU资源
3. 构建更复杂、更强大的Web应用

然而，Web Workers也有一些限制和安全考虑，需要我们在设计和实现时注意。通过遵循最佳实践，我们可以充分发挥Web Workers的优势，同时避免潜在的问题。

随着Web技术的不断发展，Web Workers的能力也在不断增强，例如SharedArrayBuffer和Atomics API的引入，使得Worker间的数据共享和同步更加高效。未来，Web Workers将在构建高性能Web应用中扮演更加重要的角色。`;export{n as default};
//# sourceMappingURL=11-3-rcrV4_Ek.js.map
