const n=`---
title: "JavaScript闭包的实际应用"
excerpt: "深入探讨JavaScript闭包的实际应用场景，包括函数柯里化、函数记忆化和事件处理等高级技巧"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-09-08"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
categories: ["JavaScript"]
---

# JavaScript闭包的实际应用

## 4. 闭包的实际应用

### 4.1 函数柯里化

函数柯里化（Currying）是一种将接受多个参数的函数转换为一系列接受单个参数的函数的技术。闭包是实现柯里化的关键。

\`\`\`javascript
// 基本柯里化
function curry(fn) {
  return function(a) {
    return function(b) {
      return fn(a, b);
    };
  };
}

function add(a, b) {
  return a + b;
}

var curriedAdd = curry(add);
console.log(curriedAdd(5)(3)); // 8

// 更通用的柯里化函数
function genericCurry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    } else {
      return function(...nextArgs) {
        return curried.apply(this, args.concat(nextArgs));
      };
    }
  };
}

function multiply(a, b, c) {
  return a * b * c;
}

var curriedMultiply = genericCurry(multiply);
console.log(curriedMultiply(2)(3)(4)); // 24
console.log(curriedMultiply(2, 3)(4)); // 24
console.log(curriedMultiply(2)(3, 4)); // 24
console.log(curriedMultiply(2, 3, 4)); // 24

// 实际应用：配置函数
function configureRequest(baseUrl) {
  return function(endpoint) {
    return function(params) {
      const url = \`\${baseUrl}/\${endpoint}\`;
      console.log(\`Request to \${url} with params:\`, params);
      // 实际应用中这里会发送HTTP请求
      return { url, params };
    };
  };
}

const apiRequest = configureRequest('https://api.example.com');
const userRequest = apiRequest('users');
const getUser = userRequest({ id: 123 });
console.log(getUser); // { url: 'https://api.example.com/users', params: { id: 123 } }
\`\`\`

### 4.2 函数记忆化

函数记忆化（Memoization）是一种优化技术，通过缓存函数的计算结果来避免重复计算。闭包是实现记忆化的理想工具。

\`\`\`javascript
// 基本记忆化
function memoize(fn) {
  const cache = {};
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (cache[key] === undefined) {
      cache[key] = fn.apply(this, args);
    }
    
    return cache[key];
  };
}

// 斐波那契数列示例
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const memoizedFibonacci = memoize(fibonacci);

console.time('fibonacci');
console.log(fibonacci(40)); // 耗时较长
console.timeEnd('fibonacci');

console.time('memoizedFibonacci');
console.log(memoizedFibonacci(40)); // 第一次计算，耗时较长
console.timeEnd('memoizedFibonacci');

console.time('memoizedFibonacci2');
console.log(memoizedFibonacci(40)); // 从缓存获取，几乎不耗时
console.timeEnd('memoizedFibonacci2');

// 高级记忆化：带缓存大小限制
function memoizeWithLimit(fn, limit = 10) {
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      // 移动到末尾（LRU策略）
      const value = cache.get(key);
      cache.delete(key);
      cache.set(key, value);
      return value;
    }
    
    const result = fn.apply(this, args);
    
    // 如果缓存已满，删除最旧的条目
    if (cache.size >= limit) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, result);
    return result;
  };
}

// 高级记忆化：带TTL（生存时间）
function memoizeWithTTL(fn, ttl = 60000) { // 默认TTL为1分钟
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    const now = Date.now();
    
    if (cache.has(key)) {
      const { value, timestamp } = cache.get(key);
      
      // 检查是否过期
      if (now - timestamp < ttl) {
        return value;
      }
      
      // 过期，删除缓存
      cache.delete(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, { value: result, timestamp: now });
    return result;
  };
}

// 记忆化与递归
function memoizedRecursive(fn) {
  const cache = {};
  
  return function memoized(...args) {
    const key = JSON.stringify(args);
    
    if (cache[key] !== undefined) {
      return cache[key];
    }
    
    const result = fn.apply(this, [memoized, ...args]);
    cache[key] = result;
    return result;
  };
}

const memoizedRecursiveFib = memoizedRecursive((memoized, n) => {
  if (n <= 1) return n;
  return memoized(n - 1) + memoized(n - 2);
});

console.time('memoizedRecursiveFib');
console.log(memoizedRecursiveFib(40)); // 快速计算
console.timeEnd('memoizedRecursiveFib');
\`\`\`

### 4.3 事件处理与回调

闭包在事件处理和异步编程中扮演着重要角色，它允许我们保持状态和处理上下文。

\`\`\`javascript
// 事件处理中的闭包
function createButtonHandlers() {
  const buttons = document.querySelectorAll('button');
  const clickCounts = {};
  
  buttons.forEach(button => {
    const id = button.id || \`button-\${Math.random().toString(36).substr(2, 9)}\`;
    clickCounts[id] = 0;
    
    button.addEventListener('click', function() {
      clickCounts[id]++;
      console.log(\`Button \${id} clicked \${clickCounts[id]} times\`);
    });
  });
  
  return {
    getCounts: () => Object.assign({}, clickCounts)
  };
}

// 事件处理器状态保持
function createCounter(initialValue = 0) {
  let count = initialValue;
  
  return {
    increment: () => ++count,
    decrement: () => --count,
    reset: () => count = initialValue,
    getValue: () => count,
    createClickHandler: (element) => {
      element.addEventListener('click', () => {
        count++;
        console.log(\`Count: \${count}\`);
      });
    }
  };
}

// 异步操作中的闭包
function asyncOperations() {
  const results = [];
  
  // 模拟异步操作
  function simulateAsyncOperation(id, delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        const result = \`Result \${id}\`;
        results.push(result);
        resolve(result);
      }, delay);
    });
  }
  
  // 使用闭包保持异步操作的状态
  function createAsyncTracker() {
    const operations = new Map();
    
    return {
      start: (id, operation) => {
        operations.set(id, { status: 'pending', startTime: Date.now() });
        
        return operation()
          .then(result => {
            operations.set(id, { 
              status: 'completed', 
              startTime: operations.get(id).startTime,
              endTime: Date.now(),
              result 
            });
            return result;
          })
          .catch(error => {
            operations.set(id, { 
              status: 'failed', 
              startTime: operations.get(id).startTime,
              endTime: Date.now(),
              error 
            });
            throw error;
          });
      },
      
      getStatus: (id) => operations.get(id),
      
      getAllStatuses: () => Array.from(operations.entries())
    };
  }
  
  return { simulateAsyncOperation, createAsyncTracker };
}

// 定时器中的闭包
function timerExamples() {
  // 使用闭包保持定时器状态
  function createIntervalCounter(interval = 1000) {
    let count = 0;
    let timerId = null;
    
    return {
      start: (callback) => {
        if (timerId) return;
        
        timerId = setInterval(() => {
          count++;
          callback(count);
        }, interval);
      },
      
      stop: () => {
        if (timerId) {
          clearInterval(timerId);
          timerId = null;
        }
      },
      
      reset: () => {
        count = 0;
      },
      
      getCount: () => count
    };
  }
  
  // 防抖函数
  function debounce(func, wait) {
    let timeout;
    
    return function(...args) {
      const context = this;
      
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }
  
  // 节流函数
  function throttle(func, limit) {
    let inThrottle;
    
    return function(...args) {
      const context = this;
      
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  return { createIntervalCounter, debounce, throttle };
}

// Promise链中的闭包
function promiseChaining() {
  // 使用闭包在Promise链中传递状态
  function createAsyncPipeline(initialValue) {
    let state = initialValue;
    
    return {
      pipe: (transformer) => {
        return Promise.resolve(state)
          .then(transformer)
          .then(newState => {
            state = newState;
            return newState;
          });
      },
      
      getState: () => state,
      
      reset: (newState = initialValue) => {
        state = newState;
        return state;
      }
    };
  }
  
  // 使用闭包处理异步错误
  function createAsyncErrorHandler() {
    const errors = [];
    
    return {
      handle: (error) => {
        errors.push({
          error,
          timestamp: new Date(),
          stack: error.stack
        });
        
        console.error('Async error caught:', error);
      },
      
      getErrors: () => errors.slice(),
      
      clearErrors: () => errors.length = 0
    };
  }
  
  return { createAsyncPipeline, createAsyncErrorHandler };
}

// 回调函数中的闭包
function callbackExamples() {
  // 使用闭包创建配置好的回调
  function createCallback(config) {
    const { prefix, suffix, transform } = config;
    
    return function(data) {
      let result = data;
      
      if (transform && typeof transform === 'function') {
        result = transform(result);
      }
      
      return \`\${prefix}\${result}\${suffix}\`;
    };
  }
  
  // 使用闭包管理回调队列
  function createCallbackQueue() {
    const queue = [];
    let isProcessing = false;
    
    return {
      add: (callback) => {
        queue.push(callback);
        
        if (!isProcessing) {
          processQueue();
        }
      },
      
      process: async (data) => {
        isProcessing = true;
        
        while (queue.length > 0) {
          const callback = queue.shift();
          try {
            await callback(data);
          } catch (error) {
            console.error('Callback error:', error);
          }
        }
        
        isProcessing = false;
      }
    };
    
    async function processQueue() {
      // 内部函数，使用闭包访问queue和isProcessing
      while (queue.length > 0 && !isProcessing) {
        const callback = queue.shift();
        try {
          isProcessing = true;
          await callback();
        } catch (error) {
          console.error('Callback error:', error);
        } finally {
          isProcessing = false;
        }
      }
    }
  }
  
  return { createCallback, createCallbackQueue };
}
\`\`\`

## 结论

闭包在实际应用中展现出强大的能力，从函数柯里化到函数记忆化，从事件处理到异步编程，闭包都扮演着关键角色。通过闭包，我们可以创建更加灵活、可维护和高效的代码。

函数柯里化允许我们创建部分应用的函数，提高代码的复用性和可读性。函数记忆化通过缓存计算结果显著提高性能，特别是在处理递归算法和昂贵的计算时。在事件处理和异步编程中，闭包帮助我们保持状态和管理上下文，使代码更加清晰和可控。

在下一篇文章中，我们将探讨闭包的高级应用和现代JavaScript中的闭包，包括函数式编程模式、状态管理、设计模式以及在React等现代框架中的应用。`;export{n as default};
//# sourceMappingURL=09-3-NgSZn_LT.js.map
