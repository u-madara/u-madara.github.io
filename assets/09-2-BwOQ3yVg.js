const n=`---
title: "JavaScript闭包的原理与特性"
excerpt: "深入解析JavaScript闭包的定义、原理与内存模型，探讨闭包与变量生命周期、常见模式及高级应用"
coverImage: "/assets/blog/hello-world/cover.jpg"
date: "2025-09-07"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
categories: ["JavaScript"]
---

# JavaScript闭包的原理与特性

## 3. 闭包的定义与原理

### 3.1 什么是闭包

闭包是指函数能够访问其外部（包围）函数作用域中的变量，即使在外部函数执行完毕后。简单来说，闭包就是函数和其词法环境的组合。

\`\`\`javascript
// 基本闭包示例
function outerFunction(x) {
  // 外部函数的变量
  var outerVariable = x;
  
  // 内部函数形成闭包
  function innerFunction() {
    console.log(outerVariable); // 访问外部变量
  }
  
  return innerFunction;
}

var closureExample = outerFunction('Hello, Closure!');
closureExample(); // 输出: 'Hello, Closure!'

// 即使outerFunction已经执行完毕，innerFunction仍然可以访问outerVariable
\`\`\`

### 3.2 闭包的内存模型

\`\`\`javascript
// 闭包内存模型示例
function closureMemoryModel() {
  var largeObject = {
    data: new Array(1000000).fill('data'),
    id: 'large-object'
  };
  
  function createClosure() {
    // 闭包引用了largeObject
    return function() {
      console.log('Object ID:', largeObject.id);
      // 只使用了largeObject的一小部分，但整个对象都被保留在内存中
    };
  }
  
  var closure = createClosure();
  
  // 即使largeObject在createClosure执行后"应该"被销毁，
  // 但由于闭包的存在，它仍然保留在内存中
  return closure;
}

var closure = closureMemoryModel();
closure(); // 可以访问largeObject.id

// 内存泄漏风险
function memoryLeakRisk() {
  var elements = document.querySelectorAll('div');
  
  for (var i = 0; i < elements.length; i++) {
    (function(index) {
      elements[i].addEventListener('click', function() {
        // 闭包引用了整个elements数组
        console.log('Element ' + index + ' clicked');
      });
    })(i);
  }
  
  // 即使函数执行完毕，elements数组仍然被所有事件处理器引用
  // 如果这些元素被移除，但事件处理器没有被清理，就会导致内存泄漏
}
\`\`\`

### 3.3 闭包与变量生命周期

\`\`\`javascript
// 闭包与变量生命周期
function variableLifecycle() {
  var counter = 0;
  
  return {
    increment: function() {
      counter++;
      console.log(counter);
    },
    decrement: function() {
      counter--;
      console.log(counter);
    },
    getValue: function() {
      return counter;
    }
  };
}

var counterClosure = variableLifecycle();
counterClosure.increment(); // 1
counterClosure.increment(); // 2
counterClosure.decrement(); // 1
console.log(counterClosure.getValue()); // 1

// counter变量一直存在于内存中，因为它被闭包引用

// 多个闭包共享同一外部变量
function sharedVariable() {
  var sharedData = 'shared';
  
  return {
    getter: function() {
      return sharedData;
    },
    setter: function(newValue) {
      sharedData = newValue;
    }
  };
}

var sharedClosure = sharedVariable();
console.log(sharedClosure.getter()); // 'shared'
sharedClosure.setter('modified');
console.log(sharedClosure.getter()); // 'modified'
\`\`\`

### 3.4 闭包的常见模式

#### 3.4.1 函数工厂模式

\`\`\`javascript
// 函数工厂模式
function createMultiplier(factor) {
  return function(number) {
    return number * factor;
  };
}

var double = createMultiplier(2);
var triple = createMultiplier(3);
var quadruple = createMultiplier(4);

console.log(double(5));   // 10
console.log(triple(5));   // 15
console.log(quadruple(5)); // 20

// 更复杂的函数工厂
function createCalculator(initialValue) {
  var result = initialValue || 0;
  
  return {
    add: function(value) {
      result += value;
      return result;
    },
    subtract: function(value) {
      result -= value;
      return result;
    },
    multiply: function(value) {
      result *= value;
      return result;
    },
    divide: function(value) {
      result /= value;
      return result;
    },
    getResult: function() {
      return result;
    },
    reset: function() {
      result = initialValue || 0;
      return result;
    }
  };
}

var calc = createCalculator(10);
console.log(calc.add(5));      // 15
console.log(calc.subtract(3)); // 12
console.log(calc.multiply(2)); // 24
console.log(calc.divide(4));   // 6
console.log(calc.getResult()); // 6
console.log(calc.reset());     // 10
\`\`\`

#### 3.4.2 模块模式

\`\`\`javascript
// 模块模式
var modulePattern = (function() {
  // 私有变量和函数
  var privateVariable = 'I am private';
  
  function privateFunction() {
    return privateVariable;
  }
  
  // 公共接口
  return {
    publicMethod: function() {
      return privateFunction();
    },
    publicVariable: 'I am public',
    setPrivateVariable: function(value) {
      privateVariable = value;
    }
  };
})();

console.log(modulePattern.publicMethod()); // 'I am private'
console.log(modulePattern.publicVariable); // 'I am public'
modulePattern.setPrivateVariable('Modified private');
console.log(modulePattern.publicMethod()); // 'Modified private'
// console.log(modulePattern.privateVariable); // undefined
// console.log(modulePattern.privateFunction()); // TypeError: modulePattern.privateFunction is not a function

// 增强的模块模式
var enhancedModule = (function() {
  // 私有变量
  var privateData = [];
  var idCounter = 0;
  
  // 私有函数
  function generateId() {
    return ++idCounter;
  }
  
  function findById(id) {
    return privateData.find(item => item.id === id);
  }
  
  // 公共接口
  return {
    add: function(item) {
      var newItem = Object.assign({}, item, { id: generateId() });
      privateData.push(newItem);
      return newItem;
    },
    get: function(id) {
      return findById(id);
    },
    getAll: function() {
      // 返回副本，防止外部修改
      return privateData.slice();
    },
    update: function(id, updates) {
      var item = findById(id);
      if (item) {
        Object.assign(item, updates);
        return item;
      }
      return null;
    },
    remove: function(id) {
      var index = privateData.findIndex(item => item.id === id);
      if (index !== -1) {
        return privateData.splice(index, 1)[0];
      }
      return null;
    },
    count: function() {
      return privateData.length;
    }
  };
})();

var item1 = enhancedModule.add({ name: 'Item 1' });
var item2 = enhancedModule.add({ name: 'Item 2' });

console.log(item1); // { id: 1, name: 'Item 1' }
console.log(item2); // { id: 2, name: 'Item 2' }

console.log(enhancedModule.get(1)); // { id: 1, name: 'Item 1' }
console.log(enhancedModule.getAll()); // [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]

enhancedModule.update(1, { name: 'Updated Item 1' });
console.log(enhancedModule.get(1)); // { id: 1, name: 'Updated Item 1' }

console.log(enhancedModule.remove(2)); // { id: 2, name: 'Item 2' }
console.log(enhancedModule.count()); // 1
\`\`\`

#### 3.4.3 立即执行函数表达式(IIFE)模式

\`\`\`javascript
// IIFE模式
var iifeExample = (function() {
  var privateCounter = 0;
  
  return {
    increment: function() {
      privateCounter++;
      console.log(privateCounter);
    },
    decrement: function() {
      privateCounter--;
      console.log(privateCounter);
    },
    reset: function() {
      privateCounter = 0;
      console.log(privateCounter);
    }
  };
})();

iifeExample.increment(); // 1
iifeExample.increment(); // 2
iifeExample.decrement(); // 1
iifeExample.reset();     // 0

// 带参数的IIFE
var parameterizedIIFE = (function(config) {
  var settings = Object.assign({
    theme: 'light',
    language: 'en',
    debug: false
  }, config);
  
  return {
    getSettings: function() {
      return Object.assign({}, settings);
    },
    updateSetting: function(key, value) {
      settings[key] = value;
    },
    log: function(message) {
      if (settings.debug) {
        console.log(\`[\${settings.theme}] \${message}\`);
      }
    }
  };
})({ theme: 'dark', debug: true });

console.log(parameterizedIIFE.getSettings()); // { theme: 'dark', language: 'en', debug: true }
parameterizedIIFE.updateSetting('language', 'zh');
parameterizedIIFE.log('Settings updated'); // [dark] Settings updated
\`\`\`

### 3.5 循环中的闭包问题与解决方案

\`\`\`javascript
// 循环中的闭包问题
function closureInLoopProblem() {
  var functions = [];
  
  for (var i = 0; i < 3; i++) {
    functions[i] = function() {
      console.log(i); // 所有函数都输出3，不是0, 1, 2
    };
  }
  
  return functions;
}

var problemFunctions = closureInLoopProblem();
problemFunctions[0](); // 3
problemFunctions[1](); // 3
problemFunctions[2](); // 3

// 解决方案1: 使用IIFE
function solutionWithIIFE() {
  var functions = [];
  
  for (var i = 0; i < 3; i++) {
    (function(index) {
      functions[index] = function() {
        console.log(index); // 输出0, 1, 2
      };
    })(i);
  }
  
  return functions;
}

var solution1Functions = solutionWithIIFE();
solution1Functions[0](); // 0
solution1Functions[1](); // 1
solution1Functions[2](); // 2

// 解决方案2: 使用let（ES6）
function solutionWithLet() {
  var functions = [];
  
  for (let i = 0; i < 3; i++) {
    functions[i] = function() {
      console.log(i); // 输出0, 1, 2
    };
  }
  
  return functions;
}

var solution2Functions = solutionWithLet();
solution2Functions[0](); // 0
solution2Functions[1](); // 1
solution2Functions[2](); // 2

// 解决方案3: 使用forEach
function solutionWithForEach() {
  var functions = [];
  
  [0, 1, 2].forEach(function(i) {
    functions[i] = function() {
      console.log(i); // 输出0, 1, 2
    };
  });
  
  return functions;
}

var solution3Functions = solutionWithForEach();
solution3Functions[0](); // 0
solution3Functions[1](); // 1
solution3Functions[2](); // 2
\`\`\`

## 结论

闭包是JavaScript中最强大的特性之一，它允许函数访问其外部作用域中的变量，即使在外部函数执行完毕后。这种机制为JavaScript提供了强大的编程能力，但也带来了内存管理的挑战。

通过理解闭包的原理和内存模型，我们可以更好地利用这一特性，同时避免潜在的内存泄漏问题。闭包的常见模式，如函数工厂模式、模块模式和IIFE模式，为我们提供了构建可维护、可扩展代码的强大工具。

在下一篇文章中，我们将探讨闭包的实际应用，包括函数柯里化、函数记忆化、事件处理等高级用法，展示闭包如何在真实场景中发挥作用。`;export{n as default};
//# sourceMappingURL=09-2-BwOQ3yVg.js.map
