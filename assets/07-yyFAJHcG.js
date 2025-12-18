const n=`---
title: "JavaScript异步编程深度解析"
excerpt: "深入解析JavaScript异步编程机制，从回调函数到Promise再到async/await的演进，探讨事件循环、微任务与宏任务，以及实际开发中的异步模式与最佳实践"
coverImage: "/assets/blog/hello-world/cover.jpg"
date: "2025-11-17"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---

# JavaScript异步编程深度解析

## 引言

JavaScript作为单线程语言，却能够高效处理异步操作，这得益于其精妙的事件循环机制和不断演进的异步编程模型。本文将深入探讨JavaScript异步编程的核心概念、发展历程和最佳实践，帮助开发者全面掌握这一关键技能。

## 1. 异步编程的演进历程

### 1.1 回调函数时代

JavaScript最早的异步编程模式是回调函数，它简单直接但容易导致"回调地狱"：

\`\`\`javascript
// 基本回调示例
function fetchData(callback) {
  setTimeout(() => {
    const data = { id: 1, name: '异步数据' };
    callback(data);
  }, 1000);
}

fetchData(function(result) {
  console.log('获取到数据:', result);
});

// 回调地狱示例
function getUser(userId, callback) {
  setTimeout(() => {
    callback({ id: userId, name: '用户名' });
  }, 500);
}

function getPosts(user, callback) {
  setTimeout(() => {
    callback([
      { id: 1, title: '文章1', userId: user.id },
      { id: 2, title: '文章2', userId: user.id }
    ]);
  }, 500);
}

function getComments(post, callback) {
  setTimeout(() => {
    callback([
      { id: 1, text: '评论1', postId: post.id },
      { id: 2, text: '评论2', postId: post.id }
    ]);
  }, 500);
}

// 嵌套回调形成回调地狱
getUser(1, function(user) {
  getPosts(user, function(posts) {
    getComments(posts[0], function(comments) {
      console.log('用户:', user);
      console.log('文章:', posts[0]);
      console.log('评论:', comments);
      // 更多嵌套...
    });
  });
});
\`\`\`

回调函数的主要问题：
- 嵌套过深导致代码难以阅读和维护
- 错误处理复杂且不一致
- 无法直接使用return和throw等控制流语句
- 并发控制困难

### 1.2 Promise革命

ES6引入的Promise彻底改变了JavaScript异步编程的面貌，提供了更优雅的异步处理方式：

\`\`\`javascript
// 基本Promise示例
function fetchData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const success = true; // 模拟成功/失败
      if (success) {
        resolve({ id: 1, name: '异步数据' });
      } else {
        reject(new Error('获取数据失败'));
      }
    }, 1000);
  });
}

// 使用Promise
fetchData()
  .then(data => console.log('获取到数据:', data))
  .catch(error => console.error('错误:', error.message));

// Promise链式调用解决回调地狱
function getUser(userId) {
  return new Promise(resolve => {
    setTimeout(() => resolve({ id: userId, name: '用户名' }), 500);
  });
}

function getPosts(user) {
  return new Promise(resolve => {
    setTimeout(() => resolve([
      { id: 1, title: '文章1', userId: user.id },
      { id: 2, title: '文章2', userId: user.id }
    ]), 500);
  });
}

function getComments(post) {
  return new Promise(resolve => {
    setTimeout(() => resolve([
      { id: 1, text: '评论1', postId: post.id },
      { id: 2, text: '评论2', postId: post.id }
    ]), 500);
  });
}

// 链式调用替代嵌套回调
getUser(1)
  .then(user => getPosts(user))
  .then(posts => getComments(posts[0]))
  .then(comments => {
    console.log('评论:', comments);
  })
  .catch(error => console.error('处理过程中出错:', error));

// Promise静态方法
Promise.all([
  getUser(1),
  getPosts({ id: 1 }),
  getComments({ id: 1 })
]).then(([user, posts, comments]) => {
  console.log('并行获取数据:', { user, posts, comments });
});

Promise.race([
  fetchDataFromSource1(),
  fetchDataFromSource2()
]).then(result => {
  console.log('最快返回的结果:', result);
});
\`\`\`

Promise的核心优势：
- 链式调用使代码更扁平、可读
- 统一的错误处理机制
- 状态不可变，更可预测
- 丰富的组合方法（all、race、allSettled等）

### 1.3 async/await语法糖

ES2017引入的async/await是基于Promise的语法糖，使异步代码看起来像同步代码：

\`\`\`javascript
// async/await基础示例
async function fetchUserData() {
  try {
    const user = await getUser(1);
    const posts = await getPosts(user);
    const comments = await getComments(posts[0]);
    
    console.log('用户:', user);
    console.log('文章:', posts[0]);
    console.log('评论:', comments);
    
    return { user, posts, comments };
  } catch (error) {
    console.error('获取数据失败:', error);
    throw error; // 可以选择重新抛出或处理错误
  }
}

// 调用async函数
fetchUserData()
  .then(data => console.log('完整数据:', data))
  .catch(error => console.error('最终错误:', error));

// 并行执行多个异步操作
async function fetchAllData() {
  const [user, posts, comments] = await Promise.all([
    getUser(1),
    getPosts({ id: 1 }),
    getComments({ id: 1 })
  ]);
  
  return { user, posts, comments };
}

// 错误处理最佳实践
async function robustFetch() {
  try {
    const data = await fetchData();
    return { success: true, data };
  } catch (error) {
    console.error('获取数据失败:', error);
    return { 
      success: false, 
      error: error.message,
      fallbackData: getDefaultData() // 提供降级数据
    };
  }
}

// 循环中的异步操作
async function processItems(items) {
  const results = [];
  
  // 顺序处理（每个await等待前一个完成）
  for (const item of items) {
    const result = await processItem(item);
    results.push(result);
  }
  
  // 并行处理（所有操作同时开始）
  const parallelResults = await Promise.all(
    items.map(item => processItem(item))
  );
  
  return { sequential: results, parallel: parallelResults };
}
\`\`\`

async/await的优势：
- 代码更接近同步思维模式，易于理解
- try/catch错误处理更直观
- 调试更方便（断点、调用栈）
- 更好的IDE支持和静态分析

## 2. 事件循环与任务队列

### 2.1 事件循环机制

JavaScript的异步能力基于事件循环（Event Loop）机制，理解它对掌握异步编程至关重要：

\`\`\`javascript
// 事件循环示例
console.log('开始');

setTimeout(() => console.log('定时器'), 0);

Promise.resolve().then(() => console.log('Promise'));

console.log('结束');

// 输出顺序：
// 开始
// 结束
// Promise
// 定时器
\`\`\`

事件循环的工作原理：
1. 执行全局脚本代码（宏任务）
2. 执行完当前宏任务后，检查微任务队列
3. 执行所有微任务，直到微任务队列为空
4. 执行下一个宏任务
5. 重复步骤2-4

### 2.2 宏任务与微任务

JavaScript中有两种任务队列：

\`\`\`javascript
// 宏任务（Macrotask）示例
setTimeout(() => console.log('宏任务1'), 0);
setInterval(() => console.log('间隔宏任务'), 1000);
setImmediate(() => console.log('立即宏任务')); // Node.js环境
requestAnimationFrame(() => console.log('动画帧宏任务'));
I/O操作、UI渲染等

// 微任务（Microtask）示例
Promise.resolve().then(() => console.log('微任务1'));
queueMicrotask(() => console.log('微任务2')); // 显式创建微任务
process.nextTick(() => console.log('nextTick微任务')); // Node.js环境
MutationObserver回调

// 任务执行顺序演示
console.log('同步代码1');

setTimeout(() => console.log('宏任务1'), 0);

Promise.resolve().then(() => {
  console.log('微任务1');
  Promise.resolve().then(() => console.log('微任务2'));
});

setTimeout(() => console.log('宏任务2'), 0);

Promise.resolve().then(() => console.log('微任务3'));

console.log('同步代码2');

// 输出顺序：
// 同步代码1
// 同步代码2
// 微任务1
// 微任务2
// 微任务3
// 宏任务1
// 宏任务2
\`\`\`

### 2.3 实际应用中的事件循环

\`\`\`javascript
// 实际场景：批量处理数据并更新UI
async function processLargeDataset(data) {
  const batchSize = 100;
  const results = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    // 处理当前批次
    const batchResults = await processBatch(batch);
    results.push(...batchResults);
    
    // 让出控制权，避免阻塞UI
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // 更新进度
    updateProgress((i + batchSize) / data.length);
  }
  
  return results;
}

// 防抖与节流中的异步控制
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
\`\`\`

## 3. 高级异步模式

### 3.1 异步迭代器

ES2018引入的异步迭代器使处理异步数据流更加优雅：

\`\`\`javascript
// 异步迭代器基础
async function* asyncGenerator() {
  let i = 0;
  while (i < 5) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    yield i++;
  }
}

// 使用for-await-of循环
(async () => {
  for await (const value of asyncGenerator()) {
    console.log('异步生成值:', value);
  }
})();

// 实际应用：分页获取数据
async function* paginatedDataFetcher(url) {
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(\`\${url}?page=\${page}\`);
    const data = await response.json();
    
    yield* data.items; // 生成当前页的所有项
    
    hasMore = data.hasMore;
    page++;
  }
}

// 使用异步迭代器处理分页数据
(async () => {
  const users = [];
  
  for await (const user of paginatedDataFetcher('/api/users')) {
    users.push(user);
    console.log(\`已获取用户: \${user.name}\`);
  }
  
  console.log(\`总共获取了 \${users.length} 个用户\`);
})();
\`\`\`

### 3.2 异步生成器与数据流

\`\`\`javascript
// 异步生成器实现数据流处理
async function* streamProcessor(stream) {
  for await (const chunk of stream) {
    // 处理每个数据块
    const processed = await processChunk(chunk);
    yield processed;
  }
}

// 实际应用：文件读取与处理
const fs = require('fs').promises;
async function* fileLineReader(filePath) {
  const fileHandle = await fs.open(filePath, 'r');
  let buffer = Buffer.alloc(0);
  
  try {
    while (true) {
      const { bytesRead } = await fileHandle.read(buffer, 0, 1024, null);
      
      if (bytesRead === 0) break;
      
      const chunk = buffer.slice(0, bytesRead).toString();
      const lines = chunk.split('\\n');
      
      // 保留最后一行（可能不完整）
      buffer = Buffer.from(lines.pop() || '');
      
      for (const line of lines) {
        if (line) yield line;
      }
    }
    
    // 处理最后的缓冲区内容
    if (buffer.length > 0) {
      yield buffer.toString();
    }
  } finally {
    await fileHandle.close();
  }
}

// 使用异步生成器处理大文件
(async () => {
  let lineCount = 0;
  
  for await (const line of fileLineReader('large-file.txt')) {
    lineCount++;
    if (lineCount % 1000 === 0) {
      console.log(\`已处理 \${lineCount} 行\`);
    }
  }
  
  console.log(\`文件总行数: \${lineCount}\`);
})();
\`\`\`

### 3.3 并发控制与资源管理

\`\`\`javascript
// 并发限制器
class ConcurrencyLimiter {
  constructor(limit) {
    this.limit = limit;
    this.running = 0;
    this.queue = [];
  }
  
  async execute(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }
  
  async process() {
    if (this.running >= this.limit || this.queue.length === 0) {
      return;
    }
    
    this.running++;
    const { task, resolve, reject } = this.queue.shift();
    
    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process(); // 处理队列中的下一个任务
    }
  }
}

// 使用并发限制器
async function processUrls(urls) {
  const limiter = new ConcurrencyLimiter(5); // 最多5个并发请求
  
  const results = await Promise.all(
    urls.map(url => 
      limiter.execute(() => fetch(url).then(res => res.json()))
    )
  );
  
  return results;
}

// 资源池管理
class ResourcePool {
  constructor(createResource, destroyResource, maxPoolSize = 10) {
    this.createResource = createResource;
    this.destroyResource = destroyResource;
    this.maxPoolSize = maxPoolSize;
    this.pool = [];
    this.waitingQueue = [];
  }
  
  async acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    
    if (this.pool.length + this.waitingQueue.length < this.maxPoolSize) {
      return this.createResource();
    }
    
    return new Promise(resolve => {
      this.waitingQueue.push(resolve);
    });
  }
  
  release(resource) {
    if (this.waitingQueue.length > 0) {
      const resolve = this.waitingQueue.shift();
      resolve(resource);
    } else {
      this.pool.push(resource);
    }
  }
  
  async destroy() {
    // 销毁所有资源
    const allResources = [...this.pool];
    this.pool = [];
    
    await Promise.all(
      allResources.map(resource => this.destroyResource(resource))
    );
  }
}

// 数据库连接池示例
class DatabaseConnectionPool extends ResourcePool {
  constructor(connectionConfig, maxConnections = 10) {
    super(
      () => createDatabaseConnection(connectionConfig),
      conn => conn.close(),
      maxConnections
    );
  }
  
  async query(sql, params) {
    const connection = await this.acquire();
    try {
      return await connection.query(sql, params);
    } finally {
      this.release(connection);
    }
  }
}
\`\`\`

## 4. 错误处理与调试

### 4.1 异步错误处理模式

\`\`\`javascript
// 全局错误处理
window.addEventListener('unhandledrejection', event => {
  console.error('未处理的Promise拒绝:', event.reason);
  // 可以在这里发送错误报告
  reportError(event.reason);
});

// 错误边界模式
class AsyncErrorBoundary {
  constructor() {
    this.errorHandlers = [];
  }
  
  register(handler) {
    this.errorHandlers.push(handler);
  }
  
  async execute(asyncFn) {
    try {
      return await asyncFn();
    } catch (error) {
      for (const handler of this.errorHandlers) {
        try {
          await handler(error);
        } catch (handlerError) {
          console.error('错误处理器失败:', handlerError);
        }
      }
      throw error; // 重新抛出
    }
  }
}

// 使用错误边界
const errorBoundary = new AsyncErrorBoundary();
errorBoundary.register(error => logError(error));
errorBoundary.register(error => showUserNotification(error));

// 安全的异步函数包装器
function safeAsync(asyncFn, fallbackValue = null) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      console.error('异步操作失败:', error);
      return fallbackValue;
    }
  };
}

// 使用安全包装器
const safeFetch = safeAsync(fetch, null);
const safeJson = safeAsync(res => res.json(), {});

// 重试机制
async function retry(asyncFn, maxAttempts = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw new Error(\`操作失败，已重试\${maxAttempts}次: \${error.message}\`);
      }
      
      // 指数退避延迟
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}

// 超时控制
function withTimeout(promise, timeoutMs) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(\`操作超时 (\${timeoutMs}ms)\`)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

// 组合使用
async function robustApiCall(url, options = {}) {
  return retry(
    () => withTimeout(fetch(url, options), 5000),
    3,
    1000
  );
}
\`\`\`

### 4.2 异步代码调试技巧

\`\`\`javascript
// 异步函数追踪
function traceAsync(asyncFn, name = 'asyncFn') {
  return async function(...args) {
    console.log(\`[\${name}] 开始执行\`, args);
    const startTime = performance.now();
    
    try {
      const result = await asyncFn(...args);
      const duration = performance.now() - startTime;
      console.log(\`[\${name}] 执行成功\`, { result, duration: \`\${duration.toFixed(2)}ms\` });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(\`[\${name}] 执行失败\`, { error, duration: \`\${duration.toFixed(2)}ms\` });
      throw error;
    }
  };
}

// 使用追踪器
const tracedFetch = traceAsync(fetch, 'fetchAPI');

// Promise状态监控
function monitorPromise(promise, label = 'Promise') {
  console.log(\`[\${label}] Promise创建\`);
  
  promise
    .then(result => console.log(\`[\${label}] Promise解决\`, result))
    .catch(error => console.error(\`[\${label}] Promise拒绝\`, error))
    .finally(() => console.log(\`[\${label}] Promise完成\`));
  
  return promise;
}

// 异步操作日志记录
class AsyncLogger {
  constructor() {
    this.operations = new Map();
  }
  
  start(id, description) {
    this.operations.set(id, {
      description,
      startTime: performance.now(),
      status: 'running'
    });
    console.log(\`[\${id}] 开始: \${description}\`);
  }
  
  complete(id, result) {
    const operation = this.operations.get(id);
    if (!operation) return;
    
    const duration = performance.now() - operation.startTime;
    operation.status = 'completed';
    operation.duration = duration;
    
    console.log(\`[\${id}] 完成: \${operation.description} (\${duration.toFixed(2)}ms)\`);
  }
  
  fail(id, error) {
    const operation = this.operations.get(id);
    if (!operation) return;
    
    const duration = performance.now() - operation.startTime;
    operation.status = 'failed';
    operation.duration = duration;
    operation.error = error;
    
    console.error(\`[\${id}] 失败: \${operation.description} (\${duration.toFixed(2)}ms)\`, error);
  }
  
  getStats() {
    const operations = Array.from(this.operations.values());
    return {
      total: operations.length,
      completed: operations.filter(op => op.status === 'completed').length,
      failed: operations.filter(op => op.status === 'failed').length,
      averageDuration: operations.reduce((sum, op) => sum + (op.duration || 0), 0) / operations.length
    };
  }
}

// 异步流程可视化
function visualizeAsyncFlow() {
  const events = [];
  
  // 重写Promise方法以捕获事件
  const originalThen = Promise.prototype.then;
  Promise.prototype.then = function(onFulfilled, onRejected) {
    events.push({
      type: 'then',
      timestamp: performance.now(),
      stack: new Error().stack
    });
    
    return originalThen.call(this, onFulfilled, onRejected);
  };
  
  // 重写setTimeout以捕获事件
  const originalSetTimeout = global.setTimeout;
  global.setTimeout = function(callback, delay) {
    events.push({
      type: 'setTimeout',
      delay,
      timestamp: performance.now(),
      stack: new Error().stack
    });
    
    return originalSetTimeout.call(this, callback, delay);
  };
  
  return {
    getEvents: () => events,
    generateTimeline: () => {
      // 生成可视化时间线
      return events.map(event => ({
        type: event.type,
        time: event.timestamp,
        delay: event.delay,
        stack: event.stack.split('\\n').slice(2, 5) // 只保留关键堆栈信息
      }));
    }
  };
}
\`\`\`

## 5. 实际应用场景与最佳实践

### 5.1 数据获取与状态管理

\`\`\`javascript
// 通用数据获取Hook（React示例）
function useAsyncData(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetcher();
        
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, deps);
  
  return { data, loading, error };
}

// 使用示例
function UserProfile({ userId }) {
  const { data: user, loading, error } = useAsyncData(
    () => fetch(\`/api/users/\${userId}\`).then(res => res.json()),
    [userId]
  );
  
  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!user) return <div>未找到用户</div>;
  
  return <div>{user.name}</div>;
}

// 请求缓存与去重
class RequestCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }
  
  async get(key, fetcher, ttl = 60000) { // 默认缓存1分钟
    // 检查缓存
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    // 检查是否有正在进行的相同请求
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    // 发起新请求
    const promise = fetcher().then(data => {
      this.cache.set(key, { data, timestamp: Date.now() });
      this.pendingRequests.delete(key);
      return data;
    }).catch(error => {
      this.pendingRequests.delete(key);
      throw error;
    });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
  
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// 使用请求缓存
const requestCache = new RequestCache();

async function getUser(id) {
  return requestCache.get(
    \`user:\${id}\`,
    () => fetch(\`/api/users/\${id}\`).then(res => res.json())
  );
}
\`\`\`

### 5.2 文件处理与上传

\`\`\`javascript
// 分片文件上传
class FileUploader {
  constructor(file, chunkSize = 1024 * 1024) { // 默认1MB分片
    this.file = file;
    this.chunkSize = chunkSize;
    this.chunks = Math.ceil(file.size / chunkSize);
    this.uploadedChunks = new Set();
    this.onProgress = () => {};
    this.onComplete = () => {};
    this.onError = () => {};
  }
  
  async upload(uploadUrl) {
    try {
      // 获取已上传的分片信息（如果支持断点续传）
      const uploadedInfo = await this.getUploadedChunks(uploadUrl);
      this.uploadedChunks = new Set(uploadedInfo.chunks);
      
      // 并行上传未完成的分片
      const uploadPromises = [];
      
      for (let i = 0; i < this.chunks; i++) {
        if (!this.uploadedChunks.has(i)) {
          uploadPromises.push(this.uploadChunk(uploadUrl, i));
        }
      }
      
      await Promise.all(uploadPromises);
      
      // 通知服务器合并分片
      await this.completeUpload(uploadUrl);
      
      this.onComplete();
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }
  
  async uploadChunk(uploadUrl, chunkIndex) {
    const start = chunkIndex * this.chunkSize;
    const end = Math.min(start + this.chunkSize, this.file.size);
    const chunk = this.file.slice(start, end);
    
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('chunkIndex', chunkIndex);
    formData.append('totalChunks', this.chunks);
    formData.append('fileName', this.file.name);
    
    await fetch(\`\${uploadUrl}/chunk\`, {
      method: 'POST',
      body: formData
    });
    
    this.uploadedChunks.add(chunkIndex);
    this.onProgress(this.uploadedChunks.size / this.chunks);
  }
  
  async getUploadedChunks(uploadUrl) {
    try {
      const response = await fetch(\`\${uploadUrl}/status?fileName=\${this.file.name}\`);
      return response.json();
    } catch {
      return { chunks: [] }; // 如果不支持断点续传，返回空数组
    }
  }
  
  async completeUpload(uploadUrl) {
    return fetch(\`\${uploadUrl}/complete\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: this.file.name,
        totalChunks: this.chunks
      })
    });
  }
}

// 使用文件上传器
const fileInput = document.getElementById('file-input');
const progressBar = document.getElementById('progress-bar');

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const uploader = new FileUploader(file);
  
  uploader.onProgress = (progress) => {
    progressBar.style.width = \`\${progress * 100}%\`;
  };
  
  uploader.onComplete = () => {
    console.log('文件上传完成');
  };
  
  uploader.onError = (error) => {
    console.error('上传失败:', error);
  };
  
  await uploader.upload('/api/upload');
});

// 文件拖放上传
class DragDropUploader {
  constructor(dropZone, options = {}) {
    this.dropZone = dropZone;
    this.options = {
      multiple: options.multiple || false,
      accept: options.accept || '*',
      maxSize: options.maxSize || 10 * 1024 * 1024, // 默认10MB
      ...options
    };
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // 防止默认拖放行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });
    
    // 高亮拖放区域
    ['dragenter', 'dragover'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, this.highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, this.unhighlight, false);
    });
    
    // 处理文件拖放
    this.dropZone.addEventListener('drop', this.handleDrop.bind(this), false);
  }
  
  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  highlight() {
    this.dropZone.classList.add('highlight');
  }
  
  unhighlight() {
    this.dropZone.classList.remove('highlight');
  }
  
  async handleDrop(e) {
    const files = e.dataTransfer.files;
    
    if (!this.options.multiple && files.length > 1) {
      alert('只支持单个文件上传');
      return;
    }
    
    for (const file of files) {
      if (!this.validateFile(file)) {
        continue;
      }
      
      await this.uploadFile(file);
    }
  }
  
  validateFile(file) {
    // 检查文件类型
    if (this.options.accept !== '*' && !file.type.match(this.options.accept)) {
      alert(\`不支持的文件类型: \${file.type}\`);
      return false;
    }
    
    // 检查文件大小
    if (file.size > this.options.maxSize) {
      alert(\`文件过大: \${file.size} bytes (最大: \${this.options.maxSize} bytes)\`);
      return false;
    }
    
    return true;
  }
  
  async uploadFile(file) {
    const uploader = new FileUploader(file);
    
    if (this.options.onProgress) {
      uploader.onProgress = this.options.onProgress;
    }
    
    if (this.options.onComplete) {
      uploader.onComplete = () => this.options.onComplete(file);
    }
    
    if (this.options.onError) {
      uploader.onError = this.options.onError;
    }
    
    await uploader.upload(this.options.uploadUrl || '/api/upload');
  }
}

// 使用拖放上传
const dropZone = document.getElementById('drop-zone');
const dragDropUploader = new DragDropUploader(dropZone, {
  accept: 'image/*',
  maxSize: 5 * 1024 * 1024, // 5MB
  onProgress: (progress) => {
    console.log(\`上传进度: \${Math.round(progress * 100)}%\`);
  },
  onComplete: (file) => {
    console.log(\`文件上传完成: \${file.name}\`);
  },
  onError: (error) => {
    console.error('上传失败:', error);
  }
});
\`\`\`

### 5.3 实时数据与WebSocket

\`\`\`javascript
// WebSocket管理器
class WebSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...options
    };
    
    this.ws = null;
    this.reconnectAttempts = 0;
    this.messageQueue = [];
    this.eventHandlers = {
      open: [],
      message: [],
      error: [],
      close: []
    };
    
    this.connect();
  }
  
  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.scheduleReconnect();
    }
  }
  
  setupEventListeners() {
    this.ws.onopen = () => {
      console.log('WebSocket连接已建立');
      this.reconnectAttempts = 0;
      
      // 发送队列中的消息
      this.flushMessageQueue();
      
      this.eventHandlers.open.forEach(handler => handler());
    };
    
    this.ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        data = event.data;
      }
      
      this.eventHandlers.message.forEach(handler => handler(data));
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
      this.eventHandlers.error.forEach(handler => handler(error));
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket连接已关闭');
      this.eventHandlers.close.forEach(handler => handler());
      
      // 尝试重连
      this.scheduleReconnect();
    };
  }
  
  scheduleReconnect() {
    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(\`尝试重连 (\${this.reconnectAttempts}/\${this.options.maxReconnectAttempts})...\`);
      
      setTimeout(() => {
        this.connect();
      }, this.options.reconnectInterval);
    } else {
      console.error('已达到最大重连次数');
    }
  }
  
  send(data) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      // 连接未就绪，将消息加入队列
      this.messageQueue.push(message);
    }
  }
  
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(message);
    }
  }
  
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }
  
  off(event, handler) {
    if (this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    }
  }
  
  close() {
    this.options.maxReconnectAttempts = 0; // 防止重连
    if (this.ws) {
      this.ws.close();
    }
  }
}

// 使用WebSocket管理器
const wsManager = new WebSocketManager('wss://api.example.com/realtime');

wsManager.on('message', (data) => {
  console.log('收到消息:', data);
  
  if (data.type === 'notification') {
    showNotification(data.content);
  } else if (data.type === 'data_update') {
    updateUI(data.payload);
  }
});

wsManager.on('error', (error) => {
  console.error('WebSocket错误:', error);
  showConnectionError();
});

// 实时协作编辑
class CollaborativeEditor {
  constructor(editorElement, documentId) {
    this.editor = editorElement;
    this.documentId = documentId;
    this.wsManager = new WebSocketManager(\`wss://api.example.com/collab/\${documentId}\`);
    this.localChanges = [];
    this.remoteChanges = [];
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // 监听本地编辑
    this.editor.addEventListener('input', this.handleLocalChange.bind(this));
    
    // 监听远程更改
    this.wsManager.on('message', this.handleRemoteChange.bind(this));
  }
  
  handleLocalChange(event) {
    const change = {
      type: 'text_change',
      position: this.editor.selectionStart,
      content: this.editor.value,
      timestamp: Date.now()
    };
    
    this.localChanges.push(change);
    this.wsManager.send(change);
  }
  
  handleRemoteChange(data) {
    if (data.type === 'text_change') {
      // 应用远程更改
      this.applyRemoteChange(data);
    } else if (data.type === 'cursor_position') {
      // 显示其他用户的 cursor
      this.updateRemoteCursor(data);
    }
  }
  
  applyRemoteChange(change) {
    // 保存当前光标位置
    const cursorPosition = this.editor.selectionStart;
    
    // 应用更改
    this.editor.value = change.content;
    
    // 恢复光标位置（考虑远程更改的影响）
    const newPosition = this.calculateNewCursorPosition(cursorPosition, change);
    this.editor.setSelectionRange(newPosition, newPosition);
  }
  
  calculateNewCursorPosition(currentPosition, remoteChange) {
    // 简化版本：实际实现需要更复杂的算法
    return currentPosition;
  }
  
  updateRemoteCursor(data) {
    // 显示远程用户的光标位置
    // 实际实现需要创建DOM元素表示远程光标
  }
  
  sendCursorPosition() {
    this.wsManager.send({
      type: 'cursor_position',
      position: this.editor.selectionStart,
      userId: this.getCurrentUserId()
    });
  }
}

// 实时数据同步
class RealtimeDataSync {
  constructor(apiUrl, wsUrl) {
    this.apiUrl = apiUrl;
    this.wsUrl = wsUrl;
    this.localData = new Map();
    this.pendingUpdates = new Map();
    this.conflictResolver = this.defaultConflictResolver;
    
    this.setupWebSocket();
  }
  
  async setupWebSocket() {
    this.wsManager = new WebSocketManager(this.wsUrl);
    
    this.wsManager.on('message', (data) => {
      this.handleRemoteUpdate(data);
    });
  }
  
  async get(key) {
    // 首先检查本地数据
    if (this.localData.has(key)) {
      return this.localData.get(key);
    }
    
    // 从服务器获取
    try {
      const response = await fetch(\`\${this.apiUrl}/data/\${key}\`);
      const data = await response.json();
      
      this.localData.set(key, data);
      return data;
    } catch (error) {
      console.error('获取数据失败:', error);
      throw error;
    }
  }
  
  async set(key, value) {
    // 更新本地数据
    this.localData.set(key, value);
    
    // 标记为待同步
    this.pendingUpdates.set(key, {
      value,
      timestamp: Date.now(),
      version: (this.pendingUpdates.get(key)?.version || 0) + 1
    });
    
    // 通知服务器
    this.wsManager.send({
      type: 'update',
      key,
      value,
      timestamp: Date.now(),
      version: this.pendingUpdates.get(key).version
    });
  }
  
  handleRemoteUpdate(data) {
    if (data.type === 'update') {
      const { key, value, timestamp, version } = data;
      const pendingUpdate = this.pendingUpdates.get(key);
      
      // 检查是否有冲突
      if (pendingUpdate && pendingUpdate.timestamp > timestamp) {
        // 本地更新更新，忽略远程更新
        return;
      }
      
      if (pendingUpdate && pendingUpdate.timestamp < timestamp) {
        // 远程更新更新，解决冲突
        const resolvedValue = this.conflictResolver(
          this.localData.get(key),
          value,
          pendingUpdate.value
        );
        
        this.localData.set(key, resolvedValue);
        this.pendingUpdates.delete(key);
        
        // 通知UI更新
        this.notifyUpdate(key, resolvedValue);
      } else {
        // 没有冲突，直接应用远程更新
        this.localData.set(key, value);
        this.notifyUpdate(key, value);
      }
    }
  }
  
  defaultConflictResolver(localValue, remoteValue, pendingValue) {
    // 默认冲突解决策略：使用时间戳最新的值
    // 实际应用中可能需要更复杂的逻辑
    return pendingValue;
  }
  
  notifyUpdate(key, value) {
    // 通知UI更新
    const event = new CustomEvent('dataUpdate', {
      detail: { key, value }
    });
    document.dispatchEvent(event);
  }
}
\`\`\`

## 6. 性能优化与最佳实践

### 6.1 异步操作性能优化

\`\`\`javascript
// 批量异步操作优化
async function batchProcess(items, processor, batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );
    
    results.push(...batchResults);
    
    // 让出控制权，避免阻塞UI
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return results;
}

// 使用示例
const users = await fetchUsers();
const processedUsers = await batchProcess(
  users,
  user => processUserData(user),
  20 // 每批处理20个用户
);

// 请求缓存与去重优化
class RequestOptimizer {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }
  
  async request(key, fetcher, ttl = 60000) {
    // 检查缓存
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    // 检查是否有正在进行的相同请求
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    // 发起新请求
    const promise = fetcher()
      .then(data => {
        this.cache.set(key, { data, timestamp: Date.now() });
        this.pendingRequests.delete(key);
        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        throw error;
      });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
  
  // 预加载资源
  async preload(keys, fetcher) {
    const preloadPromises = keys.map(key => 
      this.request(key, () => fetcher(key)).catch(error => {
        console.warn(\`预加载失败 \${key}:\`, error);
        return null;
      })
    );
    
    return Promise.allSettled(preloadPromises);
  }
  
  // 清理过期缓存
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > 300000) { // 5分钟过期
        this.cache.delete(key);
      }
    }
  }
}

// 使用请求优化器
const requestOptimizer = new RequestOptimizer();

// 定期清理缓存
setInterval(() => requestOptimizer.cleanup(), 60000);

// 智能重试与退避策略
class SmartRetry {
  constructor(options = {}) {
    this.options = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true,
      ...options
    };
  }
  
  async execute(fn, context = null) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await fn.call(context);
      } catch (error) {
        lastError = error;
        
        // 检查是否应该重试
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }
        
        // 计算延迟时间
        const delay = this.calculateDelay(attempt);
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
  
  shouldRetry(error, attempt) {
    // 达到最大重试次数
    if (attempt >= this.options.maxAttempts) {
      return false;
    }
    
    // 根据错误类型决定是否重试
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true; // 网络错误可以重试
    }
    
    if (error.status >= 500) {
      return true; // 服务器错误可以重试
    }
    
    if (error.status === 429) {
      return true; // 限流错误可以重试
    }
    
    return false; // 其他错误不重试
  }
  
  calculateDelay(attempt) {
    // 指数退避
    let delay = this.options.baseDelay * Math.pow(this.options.backoffFactor, attempt - 1);
    
    // 限制最大延迟
    delay = Math.min(delay, this.options.maxDelay);
    
    // 添加随机抖动，避免雷群效应
    if (this.options.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return delay;
  }
}

// 使用智能重试
const smartRetry = new SmartRetry({
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 10000
});

async function robustFetch(url, options) {
  return smartRetry.execute(async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = new Error(\`HTTP error: \${response.status}\`);
      error.status = response.status;
      throw error;
    }
    
    return response.json();
  });
}
\`\`\`

### 6.2 内存管理与资源释放

\`\`\`javascript
// 异步资源管理器
class AsyncResourceManager {
  constructor() {
    this.resources = new Set();
  }
  
  register(resource) {
    this.resources.add(resource);
    return resource;
  }
  
  unregister(resource) {
    this.resources.delete(resource);
  }
  
  async releaseAll() {
    const releasePromises = Array.from(this.resources).map(async resource => {
      try {
        if (typeof resource.close === 'function') {
          await resource.close();
        } else if (typeof resource.abort === 'function') {
          resource.abort();
        } else if (typeof resource.destroy === 'function') {
          await resource.destroy();
        }
      } catch (error) {
        console.error('释放资源失败:', error);
      }
    });
    
    await Promise.allSettled(releasePromises);
    this.resources.clear();
  }
}

// 使用资源管理器
const resourceManager = new AsyncResourceManager();

// 页面卸载时释放所有资源
window.addEventListener('beforeunload', () => {
  resourceManager.releaseAll();
});

// 可取消的异步操作
class CancellablePromise {
  constructor(executor) {
    this.isCancelled = false;
    this.cancelCallbacks = [];
    
    this.promise = new Promise((resolve, reject) => {
      executor(
        value => {
          if (!this.isCancelled) resolve(value);
        },
        error => {
          if (!this.isCancelled) reject(error);
        }
      );
    });
  }
  
  then(onFulfilled, onRejected) {
    return this.promise.then(onFulfilled, onRejected);
  }
  
  catch(onRejected) {
    return this.promise.catch(onRejected);
  }
  
  finally(onFinally) {
    return this.promise.finally(onFinally);
  }
  
  cancel() {
    this.isCancelled = true;
    this.cancelCallbacks.forEach(callback => callback());
    this.cancelCallbacks = [];
  }
  
  onCancel(callback) {
    this.cancelCallbacks.push(callback);
  }
}

// 创建可取消的fetch
function cancellableFetch(url, options) {
  const controller = new AbortController();
  const signal = controller.signal;
  
  const cancellablePromise = new CancellablePromise((resolve, reject) => {
    fetch(url, { ...options, signal })
      .then(response => {
        if (!response.ok) {
          throw new Error(\`HTTP error: \${response.status}\`);
        }
        return response.json();
      })
      .then(resolve)
      .catch(reject);
  });
  
  cancellablePromise.onCancel(() => {
    controller.abort();
  });
  
  return cancellablePromise;
}

// 使用可取消的异步操作
const request = cancellableFetch('/api/data');

// 取消请求
request.cancel();

// 异步操作超时控制
function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(\`操作超时 (\${timeoutMs}ms)\`));
    }, timeoutMs);
    
    promise
      .then(value => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

// 使用超时控制
async function fetchWithTimeout(url, options, timeout = 5000) {
  return withTimeout(fetch(url, options), timeout);
}

// 内存泄漏防护
class MemoryLeakGuard {
  constructor() {
    this.timers = new Set();
    this.listeners = new Map();
    this.observers = new Set();
  }
  
  // 定时器管理
  setTimeout(callback, delay) {
    const timerId = setTimeout(() => {
      this.timers.delete(timerId);
      callback();
    }, delay);
    
    this.timers.add(timerId);
    return timerId;
  }
  
  clearTimeout(timerId) {
    clearTimeout(timerId);
    this.timers.delete(timerId);
  }
  
  // 事件监听器管理
  addEventListener(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    
    if (!this.listeners.has(element)) {
      this.listeners.set(element, []);
    }
    
    this.listeners.get(element).push({ event, handler, options });
  }
  
  removeEventListener(element, event, handler) {
    element.removeEventListener(event, handler);
    
    if (this.listeners.has(element)) {
      const elementListeners = this.listeners.get(element);
      const index = elementListeners.findIndex(
        listener => listener.event === event && listener.handler === handler
      );
      
      if (index > -1) {
        elementListeners.splice(index, 1);
      }
    }
  }
  
  // 观察者管理
  addObserver(observer) {
    this.observers.add(observer);
    return observer;
  }
  
  removeObserver(observer) {
    if (observer && typeof observer.disconnect === 'function') {
      observer.disconnect();
    }
    this.observers.delete(observer);
  }
  
  // 清理所有资源
  cleanup() {
    // 清理定时器
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers.clear();
    
    // 清理事件监听器
    this.listeners.forEach((elementListeners, element) => {
      elementListeners.forEach(({ event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
    });
    this.listeners.clear();
    
    // 清理观察者
    this.observers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    this.observers.clear();
  }
}

// 使用内存泄漏防护
const memoryGuard = new MemoryLeakGuard();

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  memoryGuard.cleanup();
});
\`\`\`

## 7. 未来发展与趋势

### 7.1 新兴异步API

\`\`\`javascript
// Scheduler API - 任务调度优先级
async function schedulerExample() {
  // 高优先级任务
  Scheduler.postTask(() => {
    console.log('高优先级任务');
  }, { priority: 'user-blocking' });
  
  // 正常优先级任务
  Scheduler.postTask(() => {
    console.log('正常优先级任务');
  }, { priority: 'user-visible' });
  
  // 后台优先级任务
  Scheduler.postTask(() => {
    console.log('后台优先级任务');
  }, { priority: 'background' });
  
  // 可中断任务
  const controller = new TaskController();
  
  Scheduler.postTask(() => {
    // 长时间运行的任务
    for (let i = 0; i < 1000000; i++) {
      if (controller.signal.aborted) {
        console.log('任务被中断');
        return;
      }
      // 执行工作
    }
  }, { signal: controller.signal });
  
  // 5秒后中断任务
  setTimeout(() => controller.abort(), 5000);
}

// Streams API - 流处理
async function streamExample() {
  try {
    const response = await fetch('https://api.example.com/large-data');
    const reader = response.body.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('流读取完成');
        break;
      }
      
      // 处理数据块
      console.log('接收到数据块:', value);
    }
  } catch (error) {
    console.error('流处理错误:', error);
  }
}

// 创建自定义可读流
function createCounterStream(max) {
  return new ReadableStream({
    start(controller) {
      let count = 0;
      
      const interval = setInterval(() => {
        if (count >= max) {
          controller.close();
          clearInterval(interval);
          return;
        }
        
        controller.enqueue(count);
        count++;
      }, 1000);
    }
  });
}

// 使用自定义流
async function processCounterStream() {
  const stream = createCounterStream(10);
  const reader = stream.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    
    if (done) {
      console.log('计数器流结束');
      break;
    }
    
    console.log('计数:', value);
  }
}

// Web Locks API - 异步锁
async function webLockExample() {
  // 请求独占锁
  await navigator.locks.request('my_resource', async lock => {
    console.log('获取到锁，开始操作资源');
    
    try {
      // 执行需要独占访问的操作
      await updateCriticalResource();
    } finally {
      console.log('操作完成，释放锁');
    }
  });
  
  // 请求共享锁
  await navigator.locks.request('shared_resource', { mode: 'shared' }, async lock => {
    console.log('获取到共享锁，读取资源');
    
    // 执行只读操作
    const data = await readSharedResource();
    console.log('读取到数据:', data);
  });
  
  // 请求锁但设置超时
  try {
    await navigator.locks.request('busy_resource', async lock => {
      // 操作资源
    }, { signal: AbortSignal.timeout(5000) }); // 5秒超时
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.log('获取锁超时');
    }
  }
}

// File System Access API - 文件系统访问
async function fileSystemExample() {
  try {
    // 选择文件
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    console.log('选择文件:', file.name);
    
    // 读取文件内容
    const contents = await file.text();
    console.log('文件内容:', contents);
    
    // 选择目录
    const dirHandle = await window.showDirectoryPicker();
    console.log('选择目录:', dirHandle.name);
    
    // 在目录中创建新文件
    const newFileHandle = await dirHandle.getFileHandle('new-file.txt', { create: true });
    const writable = await newFileHandle.createWritable();
    
    await writable.write('Hello, World!');
    await writable.close();
    
    console.log('文件创建成功');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('用户取消了文件选择');
    } else {
      console.error('文件操作错误:', error);
    }
  }
}

// WebAssembly 与 JavaScript 异步交互
async function wasmAsyncExample() {
  // 加载 WebAssembly 模块
  const wasmModule = await WebAssembly.compileStreaming(fetch('async-module.wasm'));
  const wasmInstance = await WebAssembly.instantiate(wasmModule, {
    env: {
      // 异步回调函数
      asyncCallback: async function(ptr, size) {
        // 从 WebAssembly 内存中读取数据
        const data = new Uint8Array(wasmInstance.exports.memory.buffer, ptr, size);
        
        // 处理数据
        const result = await processData(data);
        
        // 将结果写回 WebAssembly 内存
        const resultPtr = wasmInstance.exports.allocateBuffer(result.length);
        new Uint8Array(wasmInstance.exports.memory.buffer, resultPtr, result.length).set(result);
        
        return resultPtr;
      }
    }
  });
  
  // 调用 WebAssembly 导出的异步函数
  const result = await wasmInstance.exports.asyncOperation();
  console.log('WebAssembly 异步操作结果:', result);
}
\`\`\`

### 7.2 异步编程的未来方向

\`\`\`javascript
// 顶层 await（ES2022）
// 在模块顶层使用 await，无需包装在 async 函数中
// top-level-await.js
const data = await fetch('/api/initial-data').then(res => res.json());
export default data;

// Promise.try() 提案
// 安全地创建 Promise，自动处理同步异常
function safeAsyncOperation() {
  return Promise.try(() => {
    // 可能抛出异常的同步代码
    const result = JSON.parse(malformedJsonString);
    return result;
  }).catch(error => {
    console.error('解析失败:', error);
    return null; // 提供默认值
  });
}

// Promise.withResolvers() 提案
// 更灵活的 Promise 创建方式
function createDeferredPromise() {
  const { promise, resolve, reject } = Promise.withResolvers();
  
  // 可以在外部随时 resolve 或 reject
  setTimeout(() => {
    resolve('延迟解决');
  }, 1000);
  
  return promise;
}

// 异步迭代器的改进
// async dispose 模式
class AsyncResource {
  async *[Symbol.asyncIterator]() {
    try {
      yield await this.fetchData();
      yield await this.processData();
    } finally {
      await this.cleanup(); // 确保资源被清理
    }
  }
  
  async [Symbol.asyncDispose]() {
    await this.cleanup();
  }
}

// 使用 await using
async function useResource() {
  await using resource = new AsyncResource();
  
  for await (const data of resource) {
    console.log(data);
  }
  
  // resource 会被自动清理
}

// 更强大的并发控制
// Promise.allSettled() 的增强版本
Promise.allSettledWithLimit = function(promises, limit = 5) {
  return new Promise(resolve => {
    const results = [];
    let completed = 0;
    let started = 0;
    
    function startNext() {
      if (started >= promises.length || completed >= promises.length) {
        return;
      }
      
      const index = started++;
      const promise = promises[index];
      
      promise
        .then(value => {
          results[index] = { status: 'fulfilled', value };
          completed++;
          startNext();
          checkCompletion();
        })
        .catch(reason => {
          results[index] = { status: 'rejected', reason };
          completed++;
          startNext();
          checkCompletion();
        });
    }
    
    function checkCompletion() {
      if (completed === promises.length) {
        resolve(results);
      }
    }
    
    // 启动初始批次
    for (let i = 0; i < Math.min(limit, promises.length); i++) {
      startNext();
    }
  });
};

// 异步函数的元编程
function withLogging(asyncFn) {
  return async function(...args) {
    const start = performance.now();
    console.log(\`开始执行 \${asyncFn.name}\`);
    
    try {
      const result = await asyncFn.apply(this, args);
      const duration = performance.now() - start;
      console.log(\`\${asyncFn.name} 执行成功，耗时: \${duration.toFixed(2)}ms\`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(\`\${asyncFn.name} 执行失败，耗时: \${duration.toFixed(2)}ms\`, error);
      throw error;
    }
  };
}

// 使用装饰器增强异步函数
function retry(options = {}) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const maxAttempts = options.maxAttempts || 3;
      const delay = options.delay || 1000;
      
      let lastError;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;
          
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
          }
        }
      }
      
      throw lastError;
    };
    
    return descriptor;
  };
}

class DataService {
  @retry({ maxAttempts: 3, delay: 1000 })
  async fetchCriticalData() {
    // 可能失败的网络请求
    const response = await fetch('/api/critical-data');
    if (!response.ok) {
      throw new Error(\`请求失败: \${response.status}\`);
    }
    return response.json();
  }
}
\`\`\`

## 结论

JavaScript异步编程已经从简单的回调函数发展到复杂而强大的异步生态系统。理解事件循环、掌握Promise和async/await、熟悉高级异步模式，以及关注性能优化和资源管理，是每个现代JavaScript开发者的必备技能。

随着Web平台的发展，新的异步API和模式不断涌现，为开发者提供了更强大的工具来构建高性能、响应式的应用程序。持续学习和实践这些技术，将帮助我们在日益复杂的前端开发环境中保持竞争力。

异步编程不仅是技术问题，更是一种思维方式。掌握它，意味着我们能够更好地处理不确定性、管理并发操作，并构建出更可靠、更高效的应用程序。在未来的JavaScript开发中，异步编程将继续扮演核心角色，值得我们深入研究和探索。`;export{n as default};
//# sourceMappingURL=07-yyFAJHcG.js.map
