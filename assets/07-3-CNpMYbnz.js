const n=`---
title: "JavaScript高级异步模式详解"
excerpt: "深入探讨JavaScript中的高级异步模式，包括异步迭代器、并发控制、资源管理等技术，提升异步编程能力"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-08-25"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---

# JavaScript高级异步模式详解

## 引言

在JavaScript异步编程中，除了基本的Promise和async/await，还有许多高级模式可以帮助我们更优雅地处理复杂的异步场景。在前面的文章中，我们探讨了JavaScript异步编程的演进历程和事件循环机制。本文将深入探讨JavaScript中的高级异步模式，包括异步迭代器、并发控制、资源管理等技术。

## 1. 异步迭代器

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

## 2. 异步生成器与数据流

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

## 3. 并发控制与资源管理

### 3.1 并发限制器

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
\`\`\`

### 3.2 资源池管理

\`\`\`javascript
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

## 4. 异步函数组合

### 4.1 管道模式

\`\`\`javascript
// 异步函数管道
class AsyncPipeline {
  constructor() {
    this.steps = [];
  }
  
  pipe(asyncFn) {
    this.steps.push(asyncFn);
    return this;
  }
  
  async process(data) {
    let result = data;
    
    for (const step of this.steps) {
      result = await step(result);
    }
    
    return result;
  }
}

// 使用管道
const pipeline = new AsyncPipeline()
  .pipe(data => fetch(data.url))
  .pipe(response => response.json())
  .pipe(data => data.items)
  .pipe(items => items.filter(item => item.active));

// 执行管道
const result = await pipeline.process({ url: '/api/products' });
\`\`\`

### 4.2 异步函数组合器

\`\`\`javascript
// 异步函数组合器
function composeAsync(...fns) {
  return async (x) => {
    let result = x;
    
    for (const fn of fns.reverse()) {
      result = await fn(result);
    }
    
    return result;
  };
}

// 使用组合器
const processUser = composeAsync(
  user => saveToDatabase(user),
  user => enrichUserData(user),
  user => validateUser(user),
  id => fetchUser(id)
);

const processedUser = await processUser(123);
\`\`\`

## 5. 异步状态管理

\`\`\`javascript
// 异步状态管理器
class AsyncStateManager {
  constructor(initialState = {}) {
    this.state = initialState;
    this.subscribers = [];
    this.pendingOperations = new Set();
  }
  
  subscribe(listener) {
    this.subscribers.push(listener);
    return () => {
      const index = this.subscribers.indexOf(listener);
      if (index !== -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }
  
  async setState(updateFn) {
    const operationId = Symbol();
    this.pendingOperations.add(operationId);
    
    try {
      const prevState = this.state;
      const nextState = await updateFn(prevState);
      
      this.state = nextState;
      
      // 通知所有订阅者
      for (const listener of this.subscribers) {
        listener(nextState, prevState);
      }
    } finally {
      this.pendingOperations.delete(operationId);
    }
  }
  
  async waitForAllOperations() {
    while (this.pendingOperations.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

// 使用异步状态管理器
const stateManager = new AsyncStateManager({ users: [], loading: false });

stateManager.subscribe((newState, prevState) => {
  console.log('状态更新:', newState);
});

async function loadUsers() {
  await stateManager.setState(async (state) => ({
    ...state,
    loading: true
  }));
  
  try {
    const users = await fetchUsers();
    
    await stateManager.setState((state) => ({
      ...state,
      users,
      loading: false
    }));
  } catch (error) {
    await stateManager.setState((state) => ({
      ...state,
      loading: false,
      error: error.message
    }));
  }
}
\`\`\`

## 结论

JavaScript的高级异步模式提供了处理复杂异步场景的强大工具。异步迭代器使处理数据流更加优雅，并发控制和资源管理帮助我们更有效地利用系统资源，而异步函数组合和状态管理则提供了构建复杂异步应用的抽象层。

掌握这些高级模式不仅能提升代码质量，还能帮助我们构建更高效、更可维护的异步应用。在下一篇文章中，我们将探讨JavaScript异步编程中的错误处理与调试技巧。`;export{n as default};
//# sourceMappingURL=07-3-CNpMYbnz.js.map
