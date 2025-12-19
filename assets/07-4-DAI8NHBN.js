const n=`---
title: "JavaScript异步错误处理与调试技巧"
excerpt: "深入探讨JavaScript异步编程中的错误处理模式与调试技巧，包括全局错误处理、重试机制、超时控制、异步追踪等技术"
coverImage: "/assets/blog/hello-world/cover.jpg"
date: "2025-08-26"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---

# JavaScript异步错误处理与调试技巧

## 引言

在JavaScript异步编程中，错误处理和调试是确保应用稳定性的关键环节。异步操作的错误传播机制与同步代码不同，需要特殊的处理技巧。在前面的文章中，我们探讨了JavaScript异步编程的演进历程、事件循环机制和高级异步模式。本文将深入探讨JavaScript异步编程中的错误处理模式与调试技巧。

## 1. 异步错误处理模式

### 1.1 全局错误处理

\`\`\`javascript
// 全局Promise拒绝处理
window.addEventListener('unhandledrejection', event => {
  console.error('未处理的Promise拒绝:', event.reason);
  // 可以在这里发送错误报告
  reportError(event.reason);
});

// Node.js环境中的全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  // 记录错误或优雅关闭
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  // 优雅关闭应用
  process.exit(1);
});
\`\`\`

### 1.2 错误边界模式

\`\`\`javascript
// 异步错误边界类
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
\`\`\`

### 1.3 重试机制

\`\`\`javascript
// 基本重试机制
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

// 高级重试机制，支持条件重试
async function advancedRetry(asyncFn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    shouldRetry = () => true, // 默认总是重试
    onRetry = null
  } = options;
  
  let lastError;
  let delay = initialDelay;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }
      
      if (onRetry) {
        onRetry(error, attempt, delay);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // 指数退避，但不超过最大延迟
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }
}

// 使用示例
async function fetchWithRetry(url) {
  return advancedRetry(
    () => fetch(url),
    {
      maxAttempts: 5,
      shouldRetry: (error) => error.status >= 500 || error.code === 'ECONNRESET',
      onRetry: (error, attempt, delay) => {
        console.log(\`请求失败，\${delay}ms后进行第\${attempt}次重试\`);
      }
    }
  );
}
\`\`\`

### 1.4 超时控制

\`\`\`javascript
// 基本超时控制
function withTimeout(promise, timeoutMs) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(\`操作超时 (\${timeoutMs}ms)\`)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

// 可取消的超时控制
function withCancellableTimeout(promise, timeoutMs) {
  let timeoutId;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(\`操作超时 (\${timeoutMs}ms)\`));
    }, timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise])
    .finally(() => {
      clearTimeout(timeoutId);
    });
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

## 2. 异步代码调试技巧

### 2.1 异步函数追踪

\`\`\`javascript
// 异步函数追踪器
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
\`\`\`

### 2.2 Promise状态监控

\`\`\`javascript
// Promise状态监控
function monitorPromise(promise, label = 'Promise') {
  console.log(\`[\${label}] Promise创建\`);
  
  promise
    .then(result => console.log(\`[\${label}] Promise解决\`, result))
    .catch(error => console.error(\`[\${label}] Promise拒绝\`, error))
    .finally(() => console.log(\`[\${label}] Promise完成\`));
  
  return promise;
}

// Promise执行时间测量
function measurePromise(promise, label = 'Promise') {
  const startTime = performance.now();
  
  return promise
    .then(result => {
      const duration = performance.now() - startTime;
      console.log(\`[\${label}] Promise解决，耗时: \${duration.toFixed(2)}ms\`);
      return result;
    })
    .catch(error => {
      const duration = performance.now() - startTime;
      console.error(\`[\${label}] Promise拒绝，耗时: \${duration.toFixed(2)}ms\`, error);
      throw error;
    });
}
\`\`\`

### 2.3 异步操作日志记录

\`\`\`javascript
// 异步操作日志记录器
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

// 使用异步日志记录器
const logger = new AsyncLogger();

async function exampleAsyncOperation() {
  const operationId = Symbol();
  logger.start(operationId, '示例异步操作');
  
  try {
    const result = await fetchData();
    logger.complete(operationId, result);
    return result;
  } catch (error) {
    logger.fail(operationId, error);
    throw error;
  }
}
\`\`\`

### 2.4 异步流程可视化

\`\`\`javascript
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

// 使用流程可视化
const visualizer = visualizeAsyncFlow();

// 执行异步操作...
async function testAsync() {
  await new Promise(resolve => setTimeout(resolve, 100));
  return Promise.resolve('test');
}

testAsync().then(() => {
  // 查看时间线
  console.table(visualizer.generateTimeline());
});
\`\`\`

## 3. 异步测试策略

### 3.1 异步单元测试

\`\`\`javascript
// 使用Jest测试异步代码
describe('异步函数测试', () => {
  // 方法1：使用async/await
  test('async/await测试', async () => {
    const data = await fetchData();
    expect(data).toBe('test data');
  });
  
  // 方法2：使用Promise
  test('Promise测试', () => {
    return fetchData().then(data => {
      expect(data).toBe('test data');
    });
  });
  
  // 方法3：使用resolves/rejects匹配器
  test('使用resolves匹配器', () => {
    return expect(fetchData()).resolves.toBe('test data');
  });
  
  test('使用rejects匹配器', () => {
    return expect(fetchFailingData()).rejects.toThrow('Error message');
  });
  
  // 测试异步错误
  test('测试异步错误', async () => {
    await expect(fetchFailingData()).rejects.toThrow('Error message');
  });
});
\`\`\`

### 3.2 异步模拟测试

\`\`\`javascript
// 模拟异步函数
jest.mock('./api', () => ({
  fetchUser: jest.fn(() => Promise.resolve({ id: 1, name: 'Test User' })),
  fetchPosts: jest.fn(() => Promise.resolve([
    { id: 1, title: 'Test Post' }
  ]))
}));

// 测试异步组件
import { render, screen, waitFor } from '@testing-library/react';
import UserProfile from './UserProfile';

test('异步加载用户数据', async () => {
  render(<UserProfile userId={1} />);
  
  // 初始状态
  expect(screen.getByText('加载中...')).toBeInTheDocument();
  
  // 等待异步操作完成
  await waitFor(() => {
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
\`\`\`

## 结论

JavaScript异步编程中的错误处理和调试是确保应用稳定性的关键环节。通过全局错误处理、重试机制、超时控制等技术，我们可以构建更健壮的异步应用。同时，使用异步追踪、日志记录和流程可视化等调试技巧，可以更轻松地定位和解决异步代码中的问题。

掌握这些错误处理和调试技巧，不仅能提升开发效率，还能帮助我们构建更可靠、更稳定的异步应用。在下一篇文章中，我们将探讨JavaScript异步编程的实际应用场景与最佳实践。`;export{n as default};
//# sourceMappingURL=07-4-DAI8NHBN.js.map
