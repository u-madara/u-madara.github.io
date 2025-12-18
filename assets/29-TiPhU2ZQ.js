const n=`---
title: "微前端样式隔离与沙箱机制"
excerpt: "深入探讨微前端架构中的样式隔离和沙箱机制，帮助开发者解决微前端应用间的样式冲突和全局污染问题"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-12-09"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/preview/cover.jpg"
---

# 微前端样式隔离与沙箱机制

## 引言

在微前端架构中，样式隔离和沙箱机制是确保应用间独立性和安全性的关键技术。由于多个微前端应用可能在同一页面中运行，它们之间的样式和JavaScript代码可能会相互干扰，导致UI异常或功能故障。本文将深入探讨微前端中的样式隔离技术和沙箱机制，帮助开发者构建稳定、安全的微前端系统。

## 样式隔离技术

### 1. CSS Scoped

CSS Scoped是一种通过为CSS选择器添加特定属性前缀来实现样式隔离的技术。

#### 基本实现原理

\`\`\`javascript
// CSS Scoped实现示例
class ScopedCSS {
  constructor(prefix) {
    this.prefix = prefix;
  }
  
  // 处理CSS文本，添加前缀
  process(cssText) {
    // 匹配CSS选择器的正则表达式
    const selectorRegex = /([^{}]+){([^{}]+)}/g;
    
    return cssText.replace(selectorRegex, (match, selector, rules) => {
      // 跳过已经处理过的选择器
      if (selector.includes(this.prefix)) {
        return match;
      }
      
      // 处理选择器
      const processedSelector = this.processSelector(selector.trim());
      return \`\${processedSelector} { \${rules} }\`;
    });
  }
  
  // 处理单个选择器
  processSelector(selector) {
    // 分割选择器（处理逗号分隔的多个选择器）
    return selector.split(',').map(part => {
      part = part.trim();
      
      // 跳过全局选择器
      if (part === 'html' || part === 'body' || part === ':root') {
        return part;
      }
      
      // 跳过@规则
      if (part.startsWith('@')) {
        return part;
      }
      
      // 跳过带:global()的选择器
      if (part.includes(':global(')) {
        return part.replace(/:global\\(([^)]+)\\)/g, '$1');
      }
      
      // 为选择器添加前缀
      return \`\${this.prefix} \${part}\`;
    }).join(', ');
  }
  
  // 应用样式到DOM
  apply(cssText, container) {
    const processedCSS = this.process(cssText);
    const styleElement = document.createElement('style');
    styleElement.textContent = processedCSS;
    styleElement.setAttribute('data-scoped', this.prefix);
    
    if (container) {
      container.appendChild(styleElement);
    } else {
      document.head.appendChild(styleElement);
    }
    
    return styleElement;
  }
}

// 使用示例
const scopedCSS = new ScopedCSS('micro-app-1');

// 原始CSS
const originalCSS = \`
  .button {
    background-color: blue;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
  }
  
  .card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }
  
  :global(.global-style) {
    font-family: Arial, sans-serif;
  }
\`;

// 处理后的CSS
const processedCSS = scopedCSS.process(originalCSS);
console.log(processedCSS);
/*
输出:
micro-app-1 .button {
  background-color: blue;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
}

micro-app-1 .card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.global-style {
  font-family: Arial, sans-serif;
}
*/

// 应用样式
const appContainer = document.getElementById('micro-app-1');
scopedCSS.apply(originalCSS, appContainer);
\`\`\`

#### Vue风格的Scoped CSS

\`\`\`javascript
// Vue风格的Scoped CSS实现
class VueScopedCSS {
  constructor() {
    this.styleId = 0;
  }
  
  // 生成唯一ID
  generateId() {
    return \`data-v-\${++this.styleId}\`;
  }
  
  // 处理CSS文本
  process(cssText, id) {
    // 匹配选择器的正则表达式
    const selectorRegex = /([^{}]+){([^{}]+)}/g;
    
    return cssText.replace(selectorRegex, (match, selector, rules) => {
      // 处理选择器
      const processedSelector = this.processSelector(selector.trim(), id);
      return \`\${processedSelector} { \${rules} }\`;
    });
  }
  
  // 处理选择器
  processSelector(selector, id) {
    // 分割选择器
    return selector.split(',').map(part => {
      part = part.trim();
      
      // 跳过@规则
      if (part.startsWith('@')) {
        return part;
      }
      
      // 跳过带>>>的选择器（深度选择器）
      if (part.includes('>>>')) {
        return part.replace(/>>>/g, '');
      }
      
      // 添加属性选择器
      return \`\${part}[\${id}]\`;
    }).join(', ');
  }
  
  // 应用样式并更新DOM
  apply(cssText, container) {
    const id = this.generateId();
    const processedCSS = this.process(cssText, id);
    
    // 创建style元素
    const styleElement = document.createElement('style');
    styleElement.textContent = processedCSS;
    styleElement.setAttribute('id', \`style-\${id}\`);
    document.head.appendChild(styleElement);
    
    // 为容器添加属性
    if (container) {
      container.setAttribute(id, '');
    }
    
    return {
      styleElement,
      id
    };
  }
}

// 使用示例
const vueScopedCSS = new VueScopedCSS();

// 原始CSS
const vueCSS = \`
  .button {
    background-color: #42b983;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
  }
  
  .card >>> .title {
    font-size: 18px;
    font-weight: bold;
  }
\`;

// 应用样式
const appContainer = document.getElementById('micro-app-2');
const { styleElement, id } = vueScopedCSS.apply(vueCSS, appContainer);

console.log(\`Applied scoped CSS with ID: \${id}\`);
\`\`\`

### 2. Shadow DOM

Shadow DOM是一种浏览器原生提供的样式隔离技术，它创建了一个封装的DOM树，其中的样式不会影响到外部DOM。

#### 基本Shadow DOM实现

\`\`\`javascript
// Shadow DOM微前端容器
class ShadowDOMContainer {
  constructor(options = {}) {
    this.options = {
      mode: 'open', // 'open' 或 'closed'
      delegatesFocus: true,
      ...options
    };
  }
  
  // 创建Shadow DOM容器
  createContainer(hostElement) {
    // 创建Shadow DOM
    const shadowRoot = hostElement.attachShadow({
      mode: this.options.mode,
      delegatesFocus: this.options.delegatesFocus
    });
    
    // 添加基础样式
    this.addBaseStyles(shadowRoot);
    
    // 创建容器
    const container = document.createElement('div');
    container.className = 'micro-app-container';
    shadowRoot.appendChild(container);
    
    return {
      shadowRoot,
      container
    };
  }
  
  // 添加基础样式
  addBaseStyles(shadowRoot) {
    const baseStyles = \`
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      
      * {
        box-sizing: border-box;
      }
      
      body, html {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
    \`;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = baseStyles;
    shadowRoot.appendChild(styleElement);
  }
  
  // 加载应用
  async loadApp(container, appConfig) {
    try {
      // 加载HTML
      if (appConfig.url) {
        const response = await fetch(appConfig.url);
        const html = await response.text();
        
        // 创建临时容器解析HTML
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = html;
        
        // 提取样式
        const styles = tempContainer.querySelectorAll('style');
        styles.forEach(style => {
          container.appendChild(style.cloneNode(true));
        });
        
        // 提取链接样式
        const links = tempContainer.querySelectorAll('link[rel="stylesheet"]');
        for (const link of links) {
          const styleElement = document.createElement('link');
          styleElement.rel = 'stylesheet';
          styleElement.href = link.href;
          container.appendChild(styleElement);
        }
        
        // 提取内容
        const content = tempContainer.querySelector('body') || tempContainer;
        while (content.firstChild) {
          container.appendChild(content.firstChild);
        }
      }
      
      // 执行脚本
      if (appConfig.scripts) {
        for (const scriptUrl of appConfig.scripts) {
          await this.loadScript(container, scriptUrl);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to load app:', error);
      return false;
    }
  }
  
  // 加载脚本
  async loadScript(container, scriptUrl) {
    return new Promise((resolve, reject) => {
      const scriptElement = document.createElement('script');
      scriptElement.src = scriptUrl;
      
      scriptElement.onload = () => {
        resolve();
      };
      
      scriptElement.onerror = () => {
        reject(new Error(\`Failed to load script: \${scriptUrl}\`));
      };
      
      container.appendChild(scriptElement);
    });
  }
}

// 使用示例
const shadowContainer = new ShadowDOMContainer();

// 创建微前端容器
const hostElement = document.getElementById('micro-app-host');
const { shadowRoot, container } = shadowContainer.createContainer(hostElement);

// 加载应用
shadowContainer.loadApp(container, {
  url: '/micro-app-1/index.html',
  scripts: ['/micro-app-1/app.js']
});
\`\`\`

### 3. CSS Modules

CSS Modules是一种通过为CSS类名生成唯一标识符来实现样式隔离的技术。

#### 基本CSS Modules实现

\`\`\`javascript
// CSS Modules实现
class CSSModules {
  constructor(options = {}) {
    this.options = {
      generateScopedName: this.defaultGenerateScopedName,
      ...options
    };
    this.classMap = new Map();
  }
  
  // 默认的类名生成函数
  defaultGenerateScopedName(name, filename, css) {
    const file = filename.replace(/\\.[^/.]+$/, '').replace(/.*[\\/\\\\]/, '');
    const hash = this.createHash(css);
    return \`\${file}_\${name}_\${hash}\`;
  }
  
  // 创建简单哈希
  createHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36).substring(0, 5);
  }
  
  // 处理CSS
  process(cssText, filename) {
    // 匹配CSS类名的正则表达式
    const classRegex = /\\.([a-zA-Z][\\w-]*)/g;
    
    // 处理CSS文本
    const processedCSS = cssText.replace(classRegex, (match, className) => {
      // 生成唯一类名
      const scopedName = this.options.generateScopedName(
        className,
        filename,
        cssText
      );
      
      // 保存映射关系
      this.classMap.set(className, scopedName);
      
      // 替换类名
      return \`.\${scopedName}\`;
    });
    
    return {
      css: processedCSS,
      classMap: Object.fromEntries(this.classMap)
    };
  }
  
  // 应用样式
  apply(cssText, filename, container) {
    const { css, classMap } = this.process(cssText, filename);
    
    // 创建style元素
    const styleElement = document.createElement('style');
    styleElement.textContent = css;
    styleElement.setAttribute('data-css-modules', filename);
    
    if (container) {
      container.appendChild(styleElement);
    } else {
      document.head.appendChild(styleElement);
    }
    
    return {
      styleElement,
      classMap
    };
  }
  
  // 获取类名映射
  getClassMap() {
    return Object.fromEntries(this.classMap);
  }
  
  // 清除类名映射
  clearClassMap() {
    this.classMap.clear();
  }
}

// 使用示例
const cssModules = new CSSModules();

// 原始CSS
const originalCSS = \`
  .button {
    background-color: blue;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
  }
  
  .card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .button:hover {
    background-color: darkblue;
  }
\`;

// 处理CSS
const { css, classMap } = cssModules.process(originalCSS, 'Button.css');
console.log('Processed CSS:', css);
console.log('Class Map:', classMap);

// 应用样式
const appContainer = document.getElementById('micro-app-1');
const { styleElement, classMap: appliedClassMap } = cssModules.apply(
  originalCSS,
  'Button.css',
  appContainer
);

// 使用处理后的类名
const button = document.createElement('button');
button.className = appliedClassMap.button;
button.textContent = 'Click me';
appContainer.appendChild(button);
\`\`\`

## 沙箱机制

### 1. 快照沙箱

快照沙箱通过在应用加载前后记录全局状态，在应用卸载时恢复全局状态来实现隔离。

#### 基本快照沙箱实现

\`\`\`javascript
// 快照沙箱实现
class SnapshotSandbox {
  constructor(name) {
    this.name = name;
    this.windowSnapshot = {};
    this.modifyPropsMap = {};
    this.active = false;
  }
  
  // 激活沙箱
  active() {
    // 记录当前状态
    this.windowSnapshot = {};
    for (const prop in window) {
      this.windowSnapshot[prop] = window[prop];
    }
    
    // 恢复上次修改的状态
    Object.keys(this.modifyPropsMap).forEach(p => {
      window[p] = this.modifyPropsMap[p];
    });
    
    this.active = true;
  }
  
  // 非激活沙箱
  inactive() {
    // 记录当前修改的状态
    this.modifyPropsMap = {};
    for (const prop in window) {
      if (window[prop] !== this.windowSnapshot[prop]) {
        this.modifyPropsMap[prop] = window[prop];
        window[prop] = this.windowSnapshot[prop];
      }
    }
    
    this.active = false;
  }
  
  // 检查沙箱是否激活
  isActive() {
    return this.active;
  }
}

// 使用示例
const sandbox = new SnapshotSandbox('micro-app-1');

// 激活沙箱
sandbox.active();

// 在沙箱中运行代码
window.globalVar = 'This is a micro app variable';
window.modifiedArray = [1, 2, 3];

console.log('In sandbox:', window.globalVar); // 输出: This is a micro app variable

// 非激活沙箱
sandbox.inactive();

// 检查全局变量是否被恢复
console.log('After sandbox:', window.globalVar); // 输出: undefined

// 再次激活沙箱
sandbox.active();

// 检查全局变量是否被恢复
console.log('Reactivated sandbox:', window.globalVar); // 输出: This is a micro app variable
\`\`\`

### 2. 代理沙箱

代理沙箱使用ES6 Proxy API来拦截对全局对象的访问和修改，实现更精细的隔离控制。

#### 基本代理沙箱实现

\`\`\`javascript
// 代理沙箱实现
class ProxySandbox {
  constructor(name) {
    this.name = name;
    this.sandboxRunning = false;
    this.globalVariableMap = new Map();
    this.injectedProps = new Set();
    this.proxyWindow = null;
  }
  
  // 激活沙箱
  active() {
    if (!this.sandboxRunning) {
      this.sandboxRunning = true;
    }
  }
  
  // 非激活沙箱
  inactive() {
    if (this.sandboxRunning) {
      this.sandboxRunning = false;
    }
  }
  
  // 创建代理对象
  createProxyWindow() {
    const self = this;
    
    const fakeWindow = Object.create(null);
    
    this.proxyWindow = new Proxy(fakeWindow, {
      set(target, prop, value) {
        if (self.sandboxRunning) {
          // 沙箱运行时，将修改记录到沙箱中
          self.globalVariableMap.set(prop, value);
          return true;
        }
        
        // 沙箱未运行时，直接修改真实window
        window[prop] = value;
        return true;
      },
      
      get(target, prop) {
        // 优先从沙箱中获取
        if (self.globalVariableMap.has(prop)) {
          return self.globalVariableMap.get(prop);
        }
        
        // 从真实window中获取
        const value = window[prop];
        
        // 处理特殊属性
        if (typeof value === 'function' && self.shouldWrapFunction(prop)) {
          return value.bind(window);
        }
        
        return value;
      },
      
      has(target, prop) {
        return prop in self.globalVariableMap || prop in window;
      },
      
      deleteProperty(target, prop) {
        if (self.sandboxRunning) {
          if (self.globalVariableMap.has(prop)) {
            self.globalVariableMap.delete(prop);
            return true;
          }
          return false;
        }
        
        delete window[prop];
        return true;
      }
    });
    
    return this.proxyWindow;
  }
  
  // 判断是否应该包装函数
  shouldWrapFunction(prop) {
    // 包装window对象上的函数，确保this指向正确
    return [
      'addEventListener',
      'removeEventListener',
      'dispatchEvent',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'requestAnimationFrame',
      'cancelAnimationFrame'
    ].includes(prop);
  }
  
  // 注入属性
  injectProp(prop, value) {
    this.injectedProps.add(prop);
    this.globalVariableMap.set(prop, value);
  }
  
  // 获取沙箱中的值
  getSandboxValue(prop) {
    return this.globalVariableMap.get(prop);
  }
  
  // 检查沙箱是否激活
  isActive() {
    return this.sandboxRunning;
  }
}

// 使用示例
const proxySandbox = new ProxySandbox('micro-app-1');

// 创建代理window
const proxyWindow = proxySandbox.createProxyWindow();

// 激活沙箱
proxySandbox.active();

// 在沙箱中运行代码
proxyWindow.globalVar = 'This is a micro app variable';
proxyWindow.array = [1, 2, 3];

console.log('In sandbox:', proxyWindow.globalVar); // 输出: This is a micro app variable
console.log('Real window:', window.globalVar); // 输出: undefined

// 非激活沙箱
proxySandbox.inactive();

// 检查全局变量是否被恢复
console.log('After sandbox:', proxyWindow.globalVar); // 输出: This is a micro app variable
console.log('Real window:', window.globalVar); // 输出: undefined

// 再次激活沙箱
proxySandbox.active();

// 检查全局变量是否被恢复
console.log('Reactivated sandbox:', proxyWindow.globalVar); // 输出: This is a micro app variable
\`\`\`

## 实际应用案例

### 微前端框架中的样式隔离与沙箱实现

下面是一个完整的微前端框架实现，集成了样式隔离和沙箱机制：

\`\`\`javascript
// 微前端框架
class MicroFrontendFramework {
  constructor(options = {}) {
    this.options = {
      defaultSandboxType: 'proxy', // 'snapshot' 或 'proxy'
      defaultStyleIsolation: 'scoped', // 'scoped', 'shadow-dom' 或 'css-modules'
      ...options
    };
    
    this.apps = new Map();
    this.activeApp = null;
    this.globalEventBus = new EventBus();
    this.globalState = new StateManager();
  }
  
  // 注册应用
  registerApp(name, config) {
    this.apps.set(name, {
      name,
      ...config,
      sandbox: null,
      container: null,
      styleIsolation: config.styleIsolation || this.options.defaultStyleIsolation,
      sandboxType: config.sandboxType || this.options.defaultSandboxType
    });
  }
  
  // 加载应用
  async loadApp(name, container) {
    const app = this.apps.get(name);
    if (!app) {
      throw new Error(\`App \${name} not found\`);
    }
    
    try {
      // 创建沙箱
      app.sandbox = this.createSandbox(app.sandboxType, name);
      
      // 创建样式隔离
      app.styleManager = this.createStyleManager(app.styleIsolation, name);
      
      // 激活沙箱
      app.sandbox.active();
      
      // 加载应用资源
      await this.loadAppResources(app, container);
      
      // 执行应用代码
      await this.executeAppCode(app);
      
      app.container = container;
      this.activeApp = app;
      
      return true;
    } catch (error) {
      console.error(\`Failed to load app \${name}:\`, error);
      return false;
    }
  }
  
  // 卸载应用
  async unloadApp(name) {
    const app = this.apps.get(name);
    if (!app || !app.sandbox) {
      return false;
    }
    
    try {
      // 清理样式
      if (app.styleManager) {
        app.styleManager.cleanup();
      }
      
      // 非激活沙箱
      app.sandbox.inactive();
      
      // 清空容器
      if (app.container) {
        app.container.innerHTML = '';
      }
      
      app.sandbox = null;
      app.container = null;
      
      if (this.activeApp === app) {
        this.activeApp = null;
      }
      
      return true;
    } catch (error) {
      console.error(\`Failed to unload app \${name}:\`, error);
      return false;
    }
  }
  
  // 创建沙箱
  createSandbox(type, name) {
    switch (type) {
      case 'snapshot':
        return new SnapshotSandbox(name);
      case 'proxy':
        return new ProxySandbox(name);
      default:
        return new ProxySandbox(name);
    }
  }
  
  // 创建样式管理器
  createStyleManager(type, name) {
    switch (type) {
      case 'scoped':
        return new ScopedCSSManager(name);
      case 'shadow-dom':
        return new ShadowDOMManager(name);
      case 'css-modules':
        return new CSSModulesManager(name);
      default:
        return new ScopedCSSManager(name);
    }
  }
  
  // 加载应用资源
  async loadAppResources(app, container) {
    // 加载HTML
    if (app.url) {
      const response = await fetch(app.url);
      const html = await response.text();
      
      // 处理样式
      app.styleManager.processHTML(html, container);
      
      // 提取脚本
      app.scripts = this.extractScripts(html);
    }
  }
  
  // 执行应用代码
  async executeAppCode(app) {
    if (app.scripts) {
      for (const script of app.scripts) {
        await this.executeScript(script, app.sandbox.createProxyWindow());
      }
    }
  }
  
  // 提取脚本
  extractScripts(html) {
    const scriptRegex = /<script[^>]*>([\\s\\S]*?)<\\/script>/gi;
    const scripts = [];
    let match;
    
    while ((match = scriptRegex.exec(html)) !== null) {
      const scriptContent = match[1].trim();
      if (scriptContent) {
        scripts.push(scriptContent);
      }
    }
    
    return scripts;
  }
  
  // 执行脚本
  async executeScript(script, sandboxWindow) {
    try {
      // 创建函数并执行
      const executeScript = new Function('window', 'document', 'location', script);
      executeScript(sandboxWindow, sandboxWindow.document, sandboxWindow.location);
    } catch (error) {
      console.error('Failed to execute script:', error);
    }
  }
}

// 事件总线
class EventBus {
  constructor() {
    this.events = new Map();
  }
  
  // 订阅事件
  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    
    this.events.get(eventName).push(callback);
    
    // 返回取消订阅函数
    return () => {
      const callbacks = this.events.get(eventName);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }
  
  // 发布事件
  emit(eventName, data) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(\`Error in event callback for \${eventName}:\`, error);
        }
      });
    }
  }
  
  // 取消订阅
  off(eventName, callback) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  // 清除所有事件
  clear() {
    this.events.clear();
  }
}

// 状态管理器
class StateManager {
  constructor() {
    this.state = {};
    this.listeners = new Map();
  }
  
  // 获取状态
  getState(key) {
    if (key) {
      return this.state[key];
    }
    return { ...this.state };
  }
  
  // 设置状态
  setState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    // 通知监听器
    this.notifyListeners(key, value, oldValue);
  }
  
  // 更新状态
  updateState(key, updater) {
    const oldValue = this.state[key];
    const newValue = typeof updater === 'function' ? updater(oldValue) : updater;
    this.state[key] = newValue;
    
    // 通知监听器
    this.notifyListeners(key, newValue, oldValue);
  }
  
  // 订阅状态变化
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    this.listeners.get(key).push(callback);
    
    // 返回取消订阅函数
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }
  
  // 通知监听器
  notifyListeners(key, newValue, oldValue) {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(\`Error in state listener for \${key}:\`, error);
        }
      });
    }
  }
  
  // 清除所有状态和监听器
  clear() {
    this.state = {};
    this.listeners.clear();
  }
}

// 使用示例
const framework = new MicroFrontendFramework({
  defaultSandboxType: 'proxy',
  defaultStyleIsolation: 'scoped'
});

// 注册应用
framework.registerApp('app1', {
  url: '/apps/app1/index.html',
  sandboxType: 'proxy',
  styleIsolation: 'scoped'
});

framework.registerApp('app2', {
  url: '/apps/app2/index.html',
  sandboxType: 'snapshot',
  styleIsolation: 'shadow-dom'
});

// 加载应用
const app1Container = document.getElementById('app1-container');
framework.loadApp('app1', app1Container);

// 切换应用
const app2Container = document.getElementById('app2-container');
framework.unloadApp('app1');
framework.loadApp('app2', app2Container);
\`\`\`

## 最佳实践

### 1. 样式隔离最佳实践

1. **选择合适的隔离策略**：
   - 对于简单应用，使用CSS Scoped
   - 对于需要完全隔离的应用，使用Shadow DOM
   - 对于需要动态样式和组合的应用，使用CSS Modules

2. **全局样式处理**：
   - 定义全局样式变量，供所有微应用使用
   - 避免在微应用中定义全局样式
   - 使用CSS变量实现主题切换

3. **样式冲突预防**：
   - 为每个微应用使用唯一的命名空间
   - 避免使用过于通用的类名
   - 使用BEM等命名规范

### 2. 沙箱机制最佳实践

1. **选择合适的沙箱类型**：
   - 对于兼容性要求高的场景，使用快照沙箱
   - 对于需要精细控制的场景，使用代理沙箱

2. **全局变量管理**：
   - 避免在微应用中直接修改全局变量
   - 使用状态管理器共享数据
   - 通过事件总线进行通信

3. **资源清理**：
   - 在应用卸载时清理所有事件监听器
   - 清除所有定时器
   - 释放所有资源引用

### 3. 性能优化

1. **样式加载优化**：
   - 按需加载样式
   - 使用CSS压缩
   - 避免重复加载相同样式

2. **沙箱性能优化**：
   - 减少全局变量的使用
   - 优化代理拦截逻辑
   - 使用缓存机制

3. **内存管理**：
   - 及时清理不再使用的资源
   - 避免内存泄漏
   - 监控内存使用情况

## 总结

微前端中的样式隔离和沙箱机制是确保应用间独立性和安全性的关键技术。本文详细介绍了CSS Scoped、Shadow DOM、CSS Modules等样式隔离技术，以及快照沙箱和代理沙箱的实现原理。通过合理选择和组合这些技术，可以构建稳定、安全、高性能的微前端系统。

在实际应用中，需要根据具体场景选择合适的技术方案，并遵循最佳实践，以确保微前端架构的成功实施。随着微前端技术的不断发展，样式隔离和沙箱机制也将不断演进，为开发者提供更强大、更灵活的工具。`;export{n as default};
//# sourceMappingURL=29-TiPhU2ZQ.js.map
