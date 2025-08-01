# 界面风格设计指南

## 概述

本文档详细描述了股票交易应用的界面设计风格和视觉规范。应用采用专业的金融交易应用设计风格，注重数据清晰度和用户体验。

## 色彩系统

### 主色调
```css
/* 主色调 - 蓝色系 */
.primary-blue: #1890ff      /* 主要操作、激活状态、导航 */
.primary-hover: #40a9ff     /* 悬停状态 */
.primary-light: #e6f7ff     /* 浅色背景 */

/* 交易色彩 */
.buy-red: #ff4d4f          /* 买入按钮、上涨数值 */
.sell-green: #52c41a       /* 卖出按钮、下跌数值 */
.neutral-gray: #666        /* 中性文本、非活动元素 */

/* 状态色彩 */
.success: #52c41a          /* 成功状态 */
.warning: #faad14          /* 警告状态 */
.error: #ff4d4f            /* 错误状态 */
.info: #1890ff             /* 信息状态 */
```

### 背景色
```css
.page-background: #f5f5f5  /* 页面背景 */
.card-background: #ffffff   /* 卡片背景 */
.hover-background: #f0f0f0  /* 悬停背景 */
.mask-background: rgba(0, 0, 0, 0.6)  /* 遮罩背景 */
```

### 文本色
```css
.text-primary: #333333     /* 主要文本 */
.text-secondary: #666666   /* 次要文本 */
.text-muted: #999999       /* 弱化文本 */
.text-white: #ffffff       /* 白色文本 */
.text-link: #1890ff        /* 链接文本 */
```

### 边框色
```css
.border-base: #d9d9d9      /* 基础边框 */
.border-split: #f0f0f0     /* 分割线 */
.border-light: #e8e8e8     /* 浅色边框 */
```

## 字体系统

### 字号规范
```css
.font-size-xl: 24px         /* 大标题 - 应用名称、主标题 */
.font-size-lg: 18px         /* 中标题 - 页面标题、区块标题 */
.font-size-md: 16px         /* 小标题 - 组件标题、重要文本 */
.font-size-base: 14px       /* 正文 - 常规内容、标签 */
.font-size-sm: 12px         /* 小字 - 元数据、时间戳 */
.font-size-xs: 10px         /* 极小字 - 徽章、细节 */
```

### 字重规范
```css
.font-weight-bold: 600-700  /* 粗体 - 标题、重要数字 */
.font-weight-medium: 500    /* 中等 - 副标题、按钮文本 */
.font-weight-regular: 400   /* 常规 - 正文 */
.font-weight-normal: normal /* 默认 - 大部分内容 */
```

### 行高规范
```css
.line-height-tight: 1.2     /* 紧密 - 标题 */
.line-height-base: 1.5      /* 常规 - 正文 */
.line-height-loose: 1.8     /* 宽松 - 段落 */
```

## 间距系统

### 基础间距单位
```css
.spacing-xs: 4px           /* 极小间距 */
.spacing-sm: 8px           /* 小间距 */
.spacing-md: 12px          /* 中间距 */
.spacing-lg: 16px          /* 大间距 */
.spacing-xl: 24px          /* 特大间距 */
.spacing-xxl: 32px         /* 超大间距 */
```

### 组件间距
```css
/* 页面容器内边距 */
.page-padding: 16px

/* 卡片间距 */
.card-margin: 12px
.card-padding: 16px

/* 表单项间距 */
.form-item-gap: 16px
.form-label-gap: 8px

/* 按钮间距 */
.button-gap: 12px
```

## 圆角系统

```css
.radius-sm: 4px           /* 小圆角 - 徽章、小元素 */
.radius-md: 6px           /* 中圆角 - 按钮、输入框 */
.radius-lg: 8px           /* 大圆角 - 卡片、弹窗 */
.radius-xl: 12px          /* 特大圆角 - 特殊组件 */
.radius-round: 50%        /* 圆形 - 头像、圆形按钮 */
```

## 阴影系统

```css
.shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1)          /* 小阴影 */
.shadow-md: 0 4px 8px rgba(0, 0, 0, 0.15)         /* 中阴影 */
.shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.2)        /* 大阴影 */
.shadow-drawer: 0 4px 12px rgba(0, 0, 0, 0.25)   /* 抽屉阴影 */
```

## 组件设计规范

### 1. 卡片组件
```css
.card {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.card-content {
  /* 卡片内容样式 */
}
```

### 2. 按钮组件
```css
/* 主要按钮 */
.btn-primary {
  background-color: #1890ff;
  color: #ffffff;
  border-radius: 6px;
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  width: 100%;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #40a9ff;
}

.btn-primary:active {
  opacity: 0.8;
}

.btn-primary:disabled {
  background-color: #d9d9d9;
  color: #999;
  cursor: not-allowed;
}

/* 交易按钮 */
.btn-buy {
  background-color: #ff4d4f;  /* 红色买入 */
}

.btn-sell {
  background-color: #52c41a; /* 绿色卖出 */
}

/* 次要按钮 */
.btn-secondary {
  background-color: #ffffff;
  color: #1890ff;
  border: 1px solid #1890ff;
}

.btn-secondary:hover {
  background-color: #e6f7ff;
}
```

### 3. 输入框组件
```css
.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  background-color: #ffffff;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  outline: none;
}

.form-input::placeholder {
  color: #999;
}

.form-input.error {
  border-color: #ff4d4f;
}

.form-input.disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}
```

### 4. 标签页组件
```css
.tab-container {
  display: flex;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16px;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tab-item.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  font-weight: 500;
}

.tab-item:hover {
  color: #1890ff;
  background-color: #f5f5f5;
}
```

### 5. 列表组件
```css
.list-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.list-item:hover {
  background-color: #f5f5f5;
}

.list-item:active {
  background-color: #e8e8e8;
}

.list-item:last-child {
  border-bottom: none;
}

.list-content {
  flex: 1;
}

.list-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.list-subtitle {
  font-size: 12px;
  color: #666;
}

.list-action {
  margin-left: 16px;
}
```

## 页面布局规范

### 1. 标准页面结构
```css
.page-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 70px; /* 为底部导航留出空间 */
}

.page-header {
  background-color: #ffffff;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.page-content {
  padding: 16px;
}

.page-footer {
  background-color: #ffffff;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}
```

### 2. 导航栏
```css
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 16px;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.nav-back {
  font-size: 16px;
  color: #1890ff;
}
```

### 3. 底部导航栏
```css
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  z-index: 1000;
}

.tab-bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 10px;
  transition: color 0.2s ease;
}

.tab-bar-item.active {
  color: #1890ff;
}

.tab-bar-icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.tab-bar-text {
  font-size: 10px;
}
```

## 数据展示规范

### 1. 价格显示
```css
.price {
  font-size: 16px;
  font-weight: 600;
}

.price-up {
  color: #ff4d4f;  /* 红色表示上涨 */
}

.price-down {
  color: #52c41a; /* 绿色表示下跌 */
}

.price-flat {
  color: #666;   /* 灰色表示平盘 */
}

.price-change {
  font-size: 12px;
  margin-left: 8px;
}

.price-change.positive {
  color: #ff4d4f;
}

.price-change.negative {
  color: #52c41a;
}
```

### 2. 市场状态
```css
.market-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.open {
  background-color: #52c41a; /* 开市 - 绿色 */
}

.status-dot.close {
  background-color: #999;    /* 收市 - 灰色 */
}

.status-dot.pause {
  background-color: #faad14; /* 暂停 - 橙色 */
}
```

### 3. 数据表格
```css
.data-table {
  width: 100%;
  background-color: #ffffff;
}

.table-header {
  display: flex;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
  color: #666;
}

.table-row {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #f8f9fa;
}

.table-cell {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.table-cell.right {
  text-align: right;
}

.table-cell.center {
  text-align: center;
}
```

## 动画与交互

### 1. 过渡动画
```css
/* 标准过渡 */
.transition-all {
  transition: all 0.2s ease;
}

.transition-color {
  transition: color 0.2s ease, background-color 0.2s ease;
}

.transition-transform {
  transition: transform 0.2s ease;
}

/* 按压效果 */
.btn-press:active {
  opacity: 0.7;
  transform: scale(0.98);
}

/* 悬停效果 */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
```

### 2. 加载动画
```css
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 3. 反馈动画
```css
/* 错误抖动 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.error-shake {
  animation: shake 0.5s ease;
}

/* 淡入淡出 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.fade-in {
  animation: fadeIn 0.3s ease;
}

.fade-out {
  animation: fadeOut 0.3s ease;
}
```

## 登录页面设计规范

### 整体风格
- **背景色**: 使用 `#f5f5f5` 页面背景，而非渐变背景
- **卡片式布局**: 白色卡片容器，圆角 `8px`
- **简洁专业**: 去除花哨效果，注重功能性
- **统一配色**: 使用系统主色调 `#1890ff`

### 布局结构
```css
.login-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.login-card {
  background-color: #ffffff;
  border-radius: 8px;
  margin: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.login-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #666;
}
```

### 表单样式
```css
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
}

.form-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.form-error {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
}
```

## 响应式设计

### 断点规范
```css
/* 移动端优先 */
@media (min-width: 375px) { /* iPhone SE */ }
@media (min-width: 414px) { /* iPhone 13 */ }
@media (min-width: 768px) { /* iPad */ }
@media (min-width: 1024px) { /* iPad Pro */ }
```

### 触摸优化
```css
/* 最小触摸区域 */
.min-touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* 按钮间距 */
.button-spacing {
  margin: 8px;
}
```

## 可访问性

### 焦点管理
```css
/* 焦点样式 */
:focus {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}

:focus-visible {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}
```

### 高对比度
```css
/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .btn-primary {
    border: 2px solid #000;
  }
  
  .form-input {
    border: 2px solid #000;
  }
}
```

## 性能优化

### CSS优化
```css
/* 硬件加速 */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}

/* 避免重绘 */
.contain-paint {
  contain: paint;
}

/* 滚动优化 */
.scroll-smooth {
  scroll-behavior: smooth;
}
```

## 设计原则

### 1. 一致性
- 所有组件遵循统一的设计规范
- 保持颜色、字体、间距的一致性
- 统一的交互模式

### 2. 可读性
- 清晰的视觉层次
- 适当的对比度
- 合理的字体大小

### 3. 可用性
- 直观的交互方式
- 明确的反馈机制
- 容错处理

### 4. 专业性
- 符合金融应用的视觉特征
- 稳重可靠的色彩搭配
- 清晰的数据展示

### 5. 响应性
- 适配不同屏幕尺寸
- 流畅的动画效果
- 快速的交互反馈

## 实施建议

1. **组件库**: 基于这些规范建立统一的组件库
2. **设计工具**: 在Figma/Sketch中建立设计系统
3. **代码规范**: 在CSS/SCSS中实施这些规范
4. **审查流程**: 建立设计审查机制
5. **持续优化**: 根据用户反馈持续优化设计

这套设计规范确保了应用界面的一致性和专业性，为用户提供优质的交易体验。