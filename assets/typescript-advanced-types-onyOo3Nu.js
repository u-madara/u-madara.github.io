const n=`---
title: "TypeScript 高级类型技巧"
excerpt: "TypeScript 提供了许多高级类型技巧，可以帮助我们编写更加类型安全、可维护的代码。本文将介绍一些常用的高级类型技巧，包括条件类型、映射类型、模板字面量类型等。"
date: "2023-11-15"
author: {
  name: "李四",
  picture: "/assets/blog/authors/lisi.jpg"
}
coverImage: "/assets/blog/typescript-advanced-types.jpg"
ogImage: { url: "/assets/blog/typescript-advanced-types.jpg" }
tags: ["TypeScript", "JavaScript", "前端开发"]
category: "前端开发"
---

# TypeScript 高级类型技巧

TypeScript 作为 JavaScript 的超集，提供了强大的类型系统，可以帮助我们在开发过程中捕获错误、提高代码质量。本文将介绍一些 TypeScript 的高级类型技巧，帮助你编写更加类型安全、可维护的代码。

## 条件类型 (Conditional Types)

条件类型允许我们根据类型关系来选择类型，类似于 JavaScript 中的条件表达式。

### 基本语法

\`\`\`typescript
T extends U ? X : Y
\`\`\`

如果类型 \`T\` 可以赋值给类型 \`U\`，则结果类型为 \`X\`，否则为 \`Y\`。

### 示例

\`\`\`typescript
// 根据类型选择返回类型
type IsString<T> = T extends string ? true : false;

type Test1 = IsString<string>; // true
type Test2 = IsString<number>; // false

// 更复杂的示例
type NonNullable<T> = T extends null | undefined ? never : T;

type Test3 = NonNullable<string | null>; // string
type Test4 = NonNullable<number | undefined>; // number
\`\`\`

## 映射类型 (Mapped Types)

映射类型允许我们根据旧类型创建新类型，可以遍历类型的属性并应用转换。

### 基本语法

\`\`\`typescript
{ [K in keyof T]: U }
\`\`\`

### 示例

\`\`\`typescript
// 将所有属性设为可选
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// 将所有属性设为必需
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// 选择特定属性
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// 排除特定属性
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// 示例使用
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
}

type PartialUser = Partial<User>; // 所有属性可选
type UserWithoutEmail = Omit<User, 'email'>; // 排除email属性
\`\`\`

## 模板字面量类型 (Template Literal Types)

TypeScript 4.1 引入了模板字面量类型，允许我们操作字符串类型。

### 示例

\`\`\`typescript
// 基本模板字面量类型
type Greeting = \`Hello, \${string}!\`;

const greeting1: Greeting = "Hello, World!"; // 正确
// const greeting2: Greeting = "Hi, World!"; // 错误

// 结合映射类型
type EventHandlers<T> = {
  [K in keyof T as \`on\${Capitalize<string & K>}\`]: (event: T[K]) => void;
};

interface Events {
  click: MouseEvent;
  load: Event;
  focus: FocusEvent;
}

type Handlers = EventHandlers<Events>;
/*
type Handlers = {
  onClick: (event: MouseEvent) => void;
  onLoad: (event: Event) => void;
  onFocus: (event: FocusEvent) => void;
}
*/
\`\`\`

## 递归类型 (Recursive Types)

递归类型允许类型引用自身，这对于定义树形结构等数据非常有用。

### 示例

\`\`\`typescript
// 定义树节点类型
interface TreeNode<T> {
  value: T;
  left?: TreeNode<T>;
  right?: TreeNode<T>;
}

// 使用示例
const tree: TreeNode<number> = {
  value: 1,
  left: {
    value: 2,
    left: { value: 4 },
    right: { value: 5 }
  },
  right: {
    value: 3,
    left: { value: 6 },
    right: { value: 7 }
  }
};
\`\`\`

## 工具类型 (Utility Types)

TypeScript 提供了许多内置的工具类型，可以帮助我们操作和转换类型。

### 常用工具类型

\`\`\`typescript
// Record<K, T> - 创建具有指定键和值类型的对象类型
type UserRoles = Record<string, boolean>;

// Exclude<T, U> - 从类型T中排除可以赋值给U的类型
type Primitive = Exclude<string | number | boolean, string>;

// Extract<T, U> - 从类型T中提取可以赋值给U的类型
type StringOrNumber = Extract<string | number | boolean, string | number>;

// ReturnType<T> - 获取函数类型T的返回类型
type FuncReturn = ReturnType<() => string>; // string

// Parameters<T> - 获取函数类型T的参数类型
type FuncParams = Parameters<(x: number, y: string) => void>; // [number, string]
\`\`\`

## 类型守卫 (Type Guards)

类型守卫是一种运行时检查，允许我们在特定作用域内缩小类型范围。

### 示例

\`\`\`typescript
// typeof 类型守卫
function processValue(value: string | number) {
  if (typeof value === 'string') {
    // 在这里，TypeScript知道value是string类型
    return value.toUpperCase();
  }
  // 在这里，TypeScript知道value是number类型
  return value.toFixed(2);
}

// instanceof 类型守卫
class Cat {
  meow() { console.log('Meow!'); }
}

class Dog {
  bark() { console.log('Woof!'); }
}

function makeSound(animal: Cat | Dog) {
  if (animal instanceof Cat) {
    animal.meow(); // TypeScript知道animal是Cat
  } else {
    animal.bark(); // TypeScript知道animal是Dog
  }
}

// 自定义类型守卫
interface Fish {
  swim(): void;
}

interface Bird {
  fly(): void;
}

function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

function move(pet: Fish | Bird) {
  if (isFish(pet)) {
    pet.swim(); // TypeScript知道pet是Fish
  } else {
    pet.fly(); // TypeScript知道pet是Bird
  }
}
\`\`\`

## 总结

TypeScript 的高级类型技巧可以帮助我们编写更加类型安全、可维护的代码。通过使用条件类型、映射类型、模板字面量类型等高级特性，我们可以创建更加灵活和强大的类型系统。

在实际项目中，合理使用这些高级类型技巧可以：

1. 提高代码的类型安全性
2. 减少运行时错误
3. 改善代码的可维护性
4. 提供更好的开发体验和IDE支持

希望本文介绍的这些高级类型技巧对你在 TypeScript 开发中有所帮助！`;export{n as default};
//# sourceMappingURL=typescript-advanced-types-onyOo3Nu.js.map
