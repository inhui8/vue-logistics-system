# 联宇物流系统

这是一个使用Vue 3和Element Plus构建的物流管理系统，主要功能包括FBX预约管理和海柜停车图等。

## 功能特点

- 多维表格展示和管理物流数据
- 强大的筛选、排序和分组功能
- 字段配置，可自定义显示字段
- 分页功能
- 响应式设计

## 技术栈

- Vue 3
- Vuex 4
- Vue Router 4
- Element Plus
- ES6+

## 项目结构

```
vue-logistics-system/
├── public/                 # 静态资源
│   └── index.html          # HTML模板
├── src/                    # 源代码
│   ├── assets/             # 资源文件
│   ├── components/         # 组件
│   ├── views/              # 视图
│   │   ├── Home.vue        # 首页
│   │   ├── FBX.vue         # FBX预约管理
│   │   └── Dockyard.vue    # 海柜停车图
│   ├── router/             # 路由
│   ├── store/              # Vuex状态管理
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
└── package.json            # 项目依赖
```

## 安装和运行

### 前提条件

- Node.js (v14.0.0+)
- npm (v6.0.0+)

### 安装依赖

```bash
cd vue-logistics-system
npm install
```

### 开发环境运行

```bash
npm run serve
```

### 生产环境构建

```bash
npm run build
```

## 使用指南

### FBX预约管理

1. 在顶部标签页可以切换不同的数据视图
2. 使用筛选区域可以按ETA日期或柜号进行筛选
3. 全字段模糊搜索可以在所有字段中查找内容
4. 工具栏提供了筛选、排序、分组和字段配置功能
5. 表格支持展开行查看更多信息
6. 底部分页器可以调整每页显示条数和页码

### 海柜停车图

待开发...

## 开发者

联宇物流技术团队 