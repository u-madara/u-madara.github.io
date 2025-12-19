const n=`---
title: "前端代码规范与质量保证（二）- Prettier与代码质量保证"
excerpt: "深入探讨Prettier配置、Git Hooks、代码审查流程和自动化代码质量检查，帮助团队建立完整的代码质量保证体系"
coverImage: "/assets/blog/hello-world/cover.jpg"
date: "2025-12-06"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---

# 前端代码规范与质量保证（二）- Prettier与代码质量保证

## Prettier配置与使用

### Prettier简介

Prettier是一个代码格式化工具，它可以将代码按照统一的规则进行格式化，确保团队中所有成员的代码风格一致。

### Prettier配置

\`\`\`javascript
// .prettierrc.js
module.exports = {
  // 一行最多字符数
  printWidth: 100,
  // 使用2个空格缩进
  tabWidth: 2,
  // 不使用缩进符，而使用空格
  useTabs: false,
  // 行尾需要有分号
  semi: true,
  // 使用单引号
  singleQuote: true,
  // 对象的 key 仅在必要时用引号
  quoteProps: 'as-needed',
  // jsx 不使用单引号，而使用双引号
  jsxSingleQuote: false,
  // 末尾不需要逗号
  trailingComma: 'none',
  // 大括号内的首尾需要空格
  bracketSpacing: true,
  // jsx 标签的反尖括号需要换行
  jsxBracketSameLine: false,
  // 箭头函数，只有一个参数的时候，也需要括号
  arrowParens: 'always',
  // 每个文件格式化的范围是文件的全部内容
  rangeStart: 0,
  rangeEnd: Infinity,
  // 不需要写文件开头的 @prettier
  requirePragma: false,
  // 不需要自动在文件开头插入 @prettier
  insertPragma: false,
  // 使用默认的折行标准
  proseWrap: 'preserve',
  // 根据显示样式决定 html 要不要折行
  htmlWhitespaceSensitivity: 'css',
  // vue 文件中的 script 和 style 内不用缩进
  vueIndentScriptAndStyle: false,
  // 换行符使用 lf
  endOfLine: 'lf',
  // 格式化嵌入的内容
  embeddedLanguageFormatting: 'auto',
  // html, vue, jsx 中每个属性占一行
  singleAttributePerLine: false
};
\`\`\`

### Prettier忽略配置

\`\`\`javascript
// .prettierignore
node_modules/
dist/
build/
coverage/
*.min.js
*.min.css
public/
CHANGELOG.md
\`\`\`

### ESLint与Prettier集成

\`\`\`javascript
// 安装必要的包
// npm install --save-dev eslint-config-prettier eslint-plugin-prettier

// .eslintrc.js
module.exports = {
  extends: [
    // ...其他扩展
    'prettier' // 必须放在最后，覆盖之前的格式化规则
  ],
  plugins: [
    // ...其他插件
    'prettier'
  ],
  rules: {
    // ...其他规则
    'prettier/prettier': 'error' // 将Prettier格式化错误作为ESLint错误显示
  }
};
\`\`\`

### 使用Prettier

\`\`\`javascript
// package.json中添加脚本
{
  "scripts": {
    "format": "prettier --write \\"src/**/*.{js,jsx,ts,tsx,vue,css,scss,less,html,json}\\"",
    "format:check": "prettier --check \\"src/**/*.{js,jsx,ts,tsx,vue,css,scss,less,html,json}\\""
  }
}

// 运行格式化
npm run format

// 检查格式
npm run format:check
\`\`\`

## Git Hooks与代码质量保证

### Husky配置

Husky可以帮助我们在Git操作的各个阶段设置钩子，执行代码检查、格式化等操作。

\`\`\`javascript
// 安装Husky
// npm install --save-dev husky

// 初始化Husky
// npx husky install

// package.json中添加脚本
{
  "scripts": {
    "prepare": "husky install"
  }
}

// 添加pre-commit钩子
// npx husky add .husky/pre-commit "npm run lint && npm run format"
\`\`\`

### lint-staged配置

lint-staged可以让我们只对暂存区的文件进行检查和格式化，提高效率。

\`\`\`javascript
// 安装lint-staged
// npm install --save-dev lint-staged

// package.json中配置
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss,less}": [
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}

// 更新pre-commit钩子
// npx husky set .husky/pre-commit "npx lint-staged"
\`\`\`

### Commitlint配置

Commitlint可以帮助我们规范提交信息的格式。

\`\`\`javascript
// 安装Commitlint
// npm install --save-dev @commitlint/cli @commitlint/config-conventional

// 创建commitlint配置文件
// echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js

// 添加commit-msg钩子
// npx husky add .husky/commit-msg "npx --no-install commitlint --edit $1"

// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复bug
        'docs',     // 文档更新
        'style',    // 代码格式化
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试
        'chore',    // 构建过程或辅助工具的变动
        'revert',   // 回滚
        'build'     // 构建系统或外部依赖的变动
      ]
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']]
  }
};
\`\`\`

## 代码审查流程

### 代码审查的重要性

代码审查是保证代码质量的重要环节，它可以：

1. **发现潜在问题**：找出代码中的bug、性能问题和安全漏洞
2. **知识共享**：团队成员之间可以相互学习
3. **保持一致性**：确保代码风格和架构的一致性
4. **提高代码质量**：促使开发者写出更好的代码

### 代码审查清单

#### 功能性审查

- [ ] 代码是否实现了需求规格说明中的所有功能？
- [ ] 代码是否处理了所有边界情况？
- [ ] 错误处理是否完善？
- [ ] 是否有适当的日志记录？

#### 代码质量审查

- [ ] 代码是否遵循项目的编码规范？
- [ ] 变量和函数命名是否清晰明确？
- [ ] 代码是否简洁易懂？
- [ ] 是否有重复代码？
- [ ] 函数是否过于复杂？
- [ ] 是否有硬编码的值？

#### 性能审查

- [ ] 是否存在性能瓶颈？
- [ ] 是否有内存泄漏的风险？
- [ ] 数据库查询是否优化？
- [ ] 是否有不必要的计算？

#### 安全性审查

- [ ] 是否有安全漏洞？
- [ ] 用户输入是否经过验证？
- [ ] 敏感信息是否安全存储？
- [ ] 是否有适当的权限控制？

#### 测试审查

- [ ] 是否有足够的单元测试？
- [ ] 测试用例是否覆盖了主要场景？
- [ ] 测试是否易于理解和维护？
- [ ] 是否有集成测试和端到端测试？

### 代码审查工具

#### GitHub/GitLab集成

\`\`\`javascript
// 使用GitHub的Pull Request进行代码审查
// 1. 创建Pull Request
// 2. 添加审查者
// 3. 使用Review功能进行评论和建议
// 4. 使用Request Changes功能要求修改
// 5. 批准通过后合并代码
\`\`\`

#### 代码审查自动化

\`\`\`javascript
// 使用GitHub Actions进行自动化检查
// .github/workflows/code-review.yml
name: Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run ESLint
        run: npm run lint
        
      - name: Run tests
        run: npm test
        
      - name: Check code coverage
        run: npm run test:coverage
        
      - name: Run Prettier check
        run: npm run format:check
\`\`\`

## 自动化代码质量检查

### SonarQube集成

SonarQube是一个开源的代码质量管理平台，可以检测代码中的bug、漏洞和代码异味。

\`\`\`javascript
// 安装SonarQube Scanner
// npm install --save-dev sonarqube-scanner

// sonar-project.properties
sonar.projectKey=my-project
sonar.projectName=My Project
sonar.projectVersion=1.0

# 源代码路径
sonar.sources=src

# 测试代码路径
sonar.tests=tests

# 代码覆盖率报告路径
sonar.javascript.lcov.reportPaths=coverage/lcov.info

# 排除文件
sonar.exclusions=**/node_modules/**,**/dist/**,**/build/**

# 编码
sonar.sourceEncoding=UTF-8

# package.json中添加脚本
{
  "scripts": {
    "sonar": "sonar-scanner"
  }
}
\`\`\`

### CodeClimate集成

CodeClimate是另一个代码质量分析工具，可以与GitHub集成，提供持续的代码质量监控。

\`\`\`javascript
// 安装CodeClimate CLI
// npm install -g codeclimate

// .codeclimate.yml
version: "2"
plugins:
  eslint:
    enabled: true
    channel: "eslint-6"
    config:
      config: ".eslintrc.js"
  fixme:
    enabled: true
  duplication:
    enabled: true
    config:
      languages:
        - javascript
  nodesecurity:
    enabled: true

exclude_patterns:
  - "config/"
  - "dist/"
  - "node_modules/"
  - "**/*.min.js"
  - "**/*.spec.js"
  - "**/*.test.js"
\`\`\`

## 实际应用案例

### 大型团队代码规范实施

\`\`\`javascript
// 1. 制定代码规范文档
// 2. 配置ESLint和Prettier
// 3. 设置Git Hooks
// 4. 建立代码审查流程
// 5. 集成自动化代码质量检查

// 示例：完整的代码质量保证流程
// a. 开发者编写代码
// b. 本地ESLint检查
// c. 提交代码时自动格式化
// d. 提交信息格式检查
// e. 创建Pull Request
// f. 自动化代码质量检查
// g. 人工代码审查
// h. 合并代码
\`\`\`

### 代码质量监控

\`\`\`javascript
// 定期生成代码质量报告
const generateQualityReport = async () => {
  const eslintResults = await runESLint();
  const testResults = await runTests();
  const coverageResults = await getCoverage();
  const sonarResults = await getSonarQubeResults();
  
  const report = {
    date: new Date().toISOString(),
    eslint: {
      errors: eslintResults.errorCount,
      warnings: eslintResults.warningCount,
      fixableErrors: eslintResults.fixableErrorCount,
      fixableWarnings: eslintResults.fixableWarningCount
    },
    tests: {
      total: testResults.numTotalTests,
      passed: testResults.numPassedTests,
      failed: testResults.numFailedTests,
      pending: testResults.numPendingTests
    },
    coverage: {
      lines: coverageResults.total.lines,
      functions: coverageResults.total.functions,
      branches: coverageResults.total.branches,
      statements: coverageResults.total.statements
    },
    sonar: {
      bugs: sonarResults.bugs,
      vulnerabilities: sonarResults.vulnerabilities,
      codeSmells: sonarResults.codeSmells,
      technicalDebt: sonarResults.technicalDebt
    }
  };
  
  // 生成报告文件或发送到监控系统
  await saveReport(report);
  await sendToMonitoring(report);
};

// 定期执行
setInterval(generateQualityReport, 24 * 60 * 60 * 1000); // 每天执行一次
\`\`\`

## 总结

通过Prettier、Git Hooks、代码审查流程和自动化代码质量检查，我们可以建立一个完整的代码质量保证体系：

1. **自动化格式化**：使用Prettier确保代码风格一致
2. **自动化检查**：使用ESLint和lint-staged在提交前检查代码
3. **规范化提交**：使用Commitlint规范提交信息
4. **人工审查**：通过代码审查发现潜在问题
5. **持续监控**：使用SonarQube等工具持续监控代码质量

这些工具和流程的结合，可以大大提高代码质量，减少bug，提升团队协作效率。在实际项目中，应根据团队需求和项目特点，灵活配置和调整这些工具和流程。`;export{n as default};
//# sourceMappingURL=33-2-BPZsjAV4.js.map
