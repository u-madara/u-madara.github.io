const n=`---
title: "前端代码规范与质量保证（一）- 代码规范与ESLint"
excerpt: "深入探讨前端代码规范和ESLint配置，包括命名规范、代码格式规范、代码组织规范、ESLint配置与使用，帮助团队建立高效的代码规范体系"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-12-05"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---

# 前端代码规范与质量保证（一）- 代码规范与ESLint

## 代码规范概述

### 为什么需要代码规范

代码规范是团队协作的基础，它的重要性体现在：

1. **提高代码可读性**：统一的风格使代码更易理解
2. **降低维护成本**：减少因风格不一致导致的理解偏差
3. **提升团队效率**：减少不必要的代码风格讨论
4. **减少错误率**：规范可以避免常见的编程错误
5. **便于代码审查**：统一的规范使审查更高效

### 代码规范的核心原则

1. **一致性**：整个项目保持统一的风格
2. **简洁性**：代码应该简洁明了，避免过度复杂
3. **可读性**：代码应该像文章一样易读
4. **可维护性**：代码应该易于修改和扩展
5. **可预测性**：代码行为应该符合预期

## JavaScript代码规范

### 命名规范

#### 变量和函数命名

\`\`\`javascript
// ✅ 好的命名 - 使用驼峰命名法，语义明确
const userName = 'john_doe';
const isLoggedIn = true;
const getUserInfo = () => {};

// ❌ 不好的命名 - 缩写不明确，语义模糊
const un = 'john_doe';
const flag = true;
const getData = () => {};

// 常量使用大写字母和下划线
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;

// 类名使用帕斯卡命名法
class UserService {
  constructor() {}
}

// 私有属性和方法使用下划线前缀
class UserService {
  constructor() {
    this._apiClient = new ApiClient();
  }
  
  _validateUser(user) {
    // 私有方法
  }
}
\`\`\`

#### 文件命名

\`\`\`javascript
// ✅ 好的文件命名
user-service.js
userController.js
api-client.js
constants.js

// ❌ 不好的文件命名
us.js
uc.js
client.js
const.js
\`\`\`

### 代码格式规范

#### 缩进和空格

\`\`\`javascript
// ✅ 使用2个空格缩进
function fetchData(url) {
  if (!url) {
    throw new Error('URL is required');
  }
  
  return fetch(url)
    .then(response => response.json())
    .catch(error => {
      console.error('Fetch error:', error);
      throw error;
    });
}

// ✅ 对象和数组的多行格式
const user = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  roles: [
    'admin',
    'editor'
  ]
};

// ✅ 函数参数多行格式
function updateUser(
  userId,
  userData,
  options = {}
) {
  // 函数实现
}
\`\`\`

#### 分号和逗号

\`\`\`javascript
// ✅ 使用分号
const name = 'John';
const age = 30;

// ✅ 对象和数组的最后一项不加逗号（根据团队规范）
const user = {
  name: 'John',
  age: 30
};

// 或者（推荐）最后一项也加逗号，便于git diff
const user = {
  name: 'John',
  age: 30,
};
\`\`\`

### 代码组织规范

#### 导入导出顺序

\`\`\`javascript
// 1. Node.js内置模块
import path from 'path';
import fs from 'fs';

// 2. 第三方库
import React from 'react';
import axios from 'axios';
import _ from 'lodash';

// 3. 项目内部模块（按路径层级排序）
import { API_BASE_URL } from '@/config/constants';
import { UserService } from '@/services/user-service';
import { UserCard } from '@/components/UserCard';
import './UserList.css'; // 样式文件最后导入
\`\`\`

#### 函数组织

\`\`\`javascript
class UserService {
  constructor(apiClient) {
    this._apiClient = apiClient;
  }
  
  // 公共方法
  async getUserById(id) {
    this._validateId(id);
    const user = await this._fetchUser(id);
    return this._formatUser(user);
  }
  
  async createUser(userData) {
    this._validateUserData(userData);
    return this._apiClient.post('/users', userData);
  }
  
  async updateUser(id, userData) {
    this._validateId(id);
    this._validateUserData(userData);
    return this._apiClient.put(\`/users/\${id}\`, userData);
  }
  
  async deleteUser(id) {
    this._validateId(id);
    return this._apiClient.delete(\`/users/\${id}\`);
  }
  
  // 私有方法
  _validateId(id) {
    if (!id || typeof id !== 'number' || id <= 0) {
      throw new Error('Invalid user ID');
    }
  }
  
  _validateUserData(userData) {
    if (!userData || typeof userData !== 'object') {
      throw new Error('Invalid user data');
    }
    
    if (!userData.name || typeof userData.name !== 'string') {
      throw new Error('User name is required and must be a string');
    }
  }
  
  async _fetchUser(id) {
    try {
      const response = await this._apiClient.get(\`/users/\${id}\`);
      return response.data;
    } catch (error) {
      throw new Error(\`Failed to fetch user: \${error.message}\`);
    }
  }
  
  _formatUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: new Date(user.created_at)
    };
  }
}
\`\`\`

## ESLint配置与使用

### ESLint简介

ESLint是一个JavaScript代码检查工具，用于识别和报告代码中的模式，并强制执行代码风格规范。

### ESLint配置

#### 基础配置

\`\`\`javascript
// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended', // TypeScript支持
    'plugin:vue/vue3-essential', // Vue支持
    'plugin:react/recommended', // React支持
    'plugin:react-hooks/recommended', // React Hooks支持
    'prettier' // 与Prettier集成
  ],
  parser: '@typescript-eslint/parser', // TypeScript解析器
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    '@typescript-eslint',
    'vue',
    'react',
    'react-hooks'
  ],
  rules: {
    // 自定义规则
    'no-console': 'warn', // 警告console使用
    'no-debugger': 'error', // 禁止debugger
    'no-unused-vars': 'warn', // 警告未使用的变量
    'prefer-const': 'error', // 强制使用const
    'no-var': 'error', // 禁止使用var
    'object-shorthand': 'error', // 强制使用对象方法简写
    'prefer-template': 'error', // 强制使用模板字符串
    'template-curly-spacing': 'error', // 模板字符串中的空格
    'arrow-spacing': 'error', // 箭头函数空格
    'comma-dangle': ['error', 'always-multiline'], // 多行时尾随逗号
    'quotes': ['error', 'single', { avoidEscape: true }], // 单引号
    'semi': ['error', 'always'], // 强制分号
    'indent': ['error', 2, { SwitchCase: 1 }], // 缩进2空格
    'max-len': ['error', { code: 100, ignoreUrls: true }], // 行长度限制
    'no-trailing-spaces': 'error', // 禁止尾随空格
    'eol-last': 'error', // 文件末尾换行
    
    // React特定规则
    'react/prop-types': 'off', // 关闭PropTypes检查（使用TypeScript）
    'react/react-in-jsx-scope': 'off', // React 17+不需要导入React
    'react/jsx-uses-react': 'off', // React 17+不需要导入React
    
    // Vue特定规则
    'vue/multi-word-component-names': 'off', // 允许单词组件名
    'vue/no-unused-vars': 'error', // Vue模板中未使用的变量
    'vue/no-unused-components': 'error' // Vue模板中未使用的组件
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        'indent': 'off' // Vue文件由vue/html-indent处理
      }
    }
  ],
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly'
  }
};
\`\`\`

#### 忽略配置

\`\`\`javascript
// .eslintignore
node_modules/
dist/
build/
coverage/
*.min.js
public/
\`\`\`

### 自定义ESLint规则

\`\`\`javascript
// eslint-rules/no-direct-state-mutation.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: '禁止直接修改state',
      category: 'Best Practices',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      noDirectMutation: '禁止直接修改state，请使用mutation或action'
    }
  },
  
  create(context) {
    return {
      AssignmentExpression(node) {
        const { left, right } = node;
        
        // 检查是否是this.state或this.$state的直接赋值
        if (
          left.type === 'MemberExpression' &&
          left.object.type === 'ThisExpression' &&
          (left.property.name === 'state' || left.property.name === '$state')
        ) {
          context.report({
            node,
            messageId: 'noDirectMutation'
          });
        }
      }
    };
  }
};

// .eslintrc.js中使用自定义规则
module.exports = {
  // ...其他配置
  rules: {
    // ...其他规则
    'no-direct-state-mutation': 'error'
  }
};
\`\`\`

## 总结

代码规范是团队协作的基础，通过制定明确的规范和使用ESLint等工具，可以：

1. **提高代码质量**：统一的规范使代码更易读、更易维护
2. **减少错误**：ESLint可以自动检测常见的编程错误
3. **提升效率**：减少不必要的代码风格讨论
4. **自动化检查**：通过工具自动检查代码是否符合规范

在下一篇文章中，我们将继续探讨Prettier配置与使用、Git Hooks与代码质量保证等内容，进一步完善代码质量保证体系。`;export{n as default};
//# sourceMappingURL=33-1-Bil_SmKi.js.map
