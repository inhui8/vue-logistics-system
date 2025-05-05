# 联宇物流系统

这是一个使用Vue 3和Element Plus构建的物流管理系统，主要功能包括FBX预约管理、海柜停车图和批次跟进记录管理等。

## 功能特点

- 多维表格展示和管理物流数据
- 强大的筛选、排序和分组功能
- 字段配置，可自定义显示字段
- 分页功能
- 响应式设计
- 跟进记录管理和即时提醒功能

## 应用架构

系统采用模块化设计，整体分为以下主要功能模块：

### 导航结构
- **顶部导航栏**：包含系统标题、消息通知中心和用户信息
- **侧边菜单**：采用多级折叠式菜单，根据用户权限展示不同功能模块

### 主要功能模块
1. **海外操作**
   - 码头停车图
   - FBX管理
   - 货量统筹

2. **尾程仓管**
   - 出库批次管理
   - 预约出库
   - 平台预约管理

3. **车辆派送**
   - 派送车次
   - 司机登记
   - 提货预约（预约日历、预约设置）

4. **跟进记录系统**
   - 批次跟进记录
   - 新记录提醒
   - 跟进历史管理

5. **工单管理**
   - 指令工单
   - 异常工单
   - 订单预警
   - 增值服务
   - 工单分析

6. **消息中心**
   - 站内信管理
   - 邮件管理

7. **后台管理**
   - 供应商管理
   - 角色权限管理
   - 标签管理
   - 合同管理
   - 操作日志

## 技术栈

- Vue 3
- Vuex 4
- Vue Router 4
- Element Plus
- ES6+
- VXE Table
- Surely Table
- @visactor/vtable
- ECharts
- FullCalendar
- Dayjs

## 项目结构

```
vue-logistics-system/
│
├── public/                 # 静态资源
│   ├── index.html          # HTML模板
│   └── images/             # 图片资源
│
├── src/                    # 源代码
│   │
│   ├── assets/             # 静态资源
│   │   ├── data/           # 批次数据
│   │   └── json/           # 表格列配置和模拟数据
│   │       ├── childTableColumns.json
│   │       ├── containerPickupColumns.json
│   │       ├── deliveryTrainsColumns.json
│   │       └── ...
│   │
│   ├── components/         # 可复用组件
│   │   ├── common/         # 通用组件
│   │   │   └── tableSurely.vue   # Surely表格封装
│   │   │
│   │   ├── logistics/      # 物流相关组件
│   │   │   ├── DataTable.vue      # 数据表格组件
│   │   │   ├── FilterPanel.vue    # 筛选面板组件
│   │   │   ├── follow_up.vue      # 跟进记录组件
│   │   │   ├── GroupableTable.vue # 可分组表格组件
│   │   │   ├── GroupableTableVisactor.vue # Visactor表格
│   │   │   ├── GroupableTableVxe.vue      # VXE表格
│   │   │   ├── TableToolbar.vue    # 表格工具栏
│   │   │   ├── AddTrainDialog.vue  # 添加车次对话框
│   │   │   ├── TrainFileUploadDialog.vue # 文件上传对话框
│   │   │   ├── HistoryRecordDialog.vue   # 历史记录对话框
│   │   │   ├── GpsTrackDialog.vue        # GPS跟踪对话框
│   │   │   └── ...
│   │   │
│   │   ├── AppointmentModal.vue   # 预约模态框
│   │   ├── Breadcrumb.vue         # 面包屑导航
│   │   ├── MessageNotification.vue # 消息通知
│   │   └── WarehouseForm.vue      # 仓库表单
│   │
│   ├── layout/             # 布局组件
│   │   ├── BaseLayout.vue  # 基本布局
│   │   ├── EmptyLayout.vue # 空布局
│   │   ├── index.vue       # 主布局
│   │   └── SubRouteLayout.vue # 子路由布局
│   │
│   ├── router/             # 路由配置
│   │   └── index.js        # 路由定义
│   │
│   ├── store/              # Vuex状态管理
│   │   └── index.js        # 状态定义
│   │
│   ├── types/              # TypeScript类型定义
│   │   └── components.d.ts # 组件类型
│   │
│   ├── utils/              # 工具函数
│   │   ├── error-handler.js # 错误处理
│   │   ├── groupUtils.js    # 分组工具
│   │   ├── time.js          # 时间处理
│   │   └── validation.js    # 验证工具
│   │
│   ├── views/              # 页面视图
│   │   ├── Admin/          # 后台管理页面
│   │   │   ├── AlertManagement/    # 预警管理
│   │   │   ├── ContractManagement/ # 合同管理
│   │   │   ├── DriverManagement/   # 司机管理
│   │   │   ├── GpsTracking/        # GPS追踪
│   │   │   ├── OperationLog/       # 操作日志
│   │   │   ├── QuoteManagement/    # 报价管理
│   │   │   ├── RatingManagement/   # 评级管理
│   │   │   ├── RoleManagement/     # 角色管理
│   │   │   ├── SupplierManagement/ # 供应商管理
│   │   │   ├── TagManagement/      # 标签管理
│   │   │   └── VehicleManagement/  # 车辆管理
│   │   │
│   │   ├── Appointment/    # 预约管理
│   │   │   ├── AppointmentList.vue      # 预约列表
│   │   │   ├── AppointmentManagement.vue # 预约管理
│   │   │   ├── CreateOutbound.vue        # 创建出库
│   │   │   └── planManagement.vue        # 计划管理
│   │   │
│   │   ├── FBX/            # FBX相关视图
│   │   │   ├── FBX.vue               # FBX预约管理
│   │   │   ├── newFBX.vue            # 新版FBX
│   │   │   ├── newFBXVisactor.vue    # Visactor表格FBX
│   │   │   ├── CreateOutboundPC.vue  # PC创建出库
│   │   │   ├── ExpenseDetails.vue    # 费用明细
│   │   │   └── ExpenseDetails2.vue   # 费用明细(替代版)
│   │   │
│   │   ├── loadAppointment/ # 装货预约
│   │   │   ├── appointment.vue   # 预约管理
│   │   │   ├── apptHistory.vue   # 预约历史
│   │   │   └── apptSet.vue       # 预约设置
│   │   │
│   │   ├── MessageCenter/  # 消息中心
│   │   │   └── EmailManagement/ # 邮件管理
│   │   │       ├── EmailAccount.vue  # 邮箱账户
│   │   │       ├── EmailLog.vue      # 邮件日志
│   │   │       └── EmailTemplate.vue # 邮件模板
│   │   │
│   │   ├── SMS/            # 短信/供应商系统
│   │   │   ├── DeliveryOrders.vue      # 配送订单
│   │   │   ├── SuppilerSeasOrder.vue   # 供应商海运订单
│   │   │   ├── VehicleGpsTracking.vue  # 车辆GPS追踪
│   │   │   ├── VehicleProfile.vue      # 车辆信息
│   │   │   │
│   │   │   └── PhoneApp/   # 手机应用
│   │   │       ├── DriverDispatch.vue    # 司机派送
│   │   │       ├── OutboundConfirm.vue   # 出库确认
│   │   │       ├── Stocking.vue          # 入库
│   │   │       ├── StockingConfirm.vue   # 入库确认
│   │   │       └── StockingHistory.vue   # 入库历史
│   │   │
│   │   ├── TMS/            # 运输管理系统视图
│   │   │   ├── DeliveryTrains.vue       # 派送车次
│   │   │   ├── DriverCheckIn.vue        # 司机签到
│   │   │   ├── OutgoingBatch.vue        # 出库批次
│   │   │   ├── OutgoingBatchDetail.vue  # 批次详情
│   │   │   └── TrainDetail.vue          # 车次详情
│   │   │
│   │   ├── WorkOrder/      # 工单管理
│   │   │   ├── AlertWorkOrderList.vue       # 预警工单列表
│   │   │   ├── CommandWorkCreate.vue        # 指令工单创建
│   │   │   ├── CommandWorkDetail.vue        # 指令工单详情
│   │   │   ├── CommandWorkList.vue          # 指令工单列表
│   │   │   ├── CommandWorkOrderList.vue     # 指令工单订单列表
│   │   │   ├── ExceptionWorkOrderList.vue   # 异常工单列表
│   │   │   ├── ValueAddedWorkOrderList.vue  # 增值服务工单列表
│   │   │   ├── WorkOrderAnalysis.vue        # 工单分析
│   │   │   ├── WorkOrderCreate.vue          # 工单创建
│   │   │   ├── WorkOrderDetail.vue          # 工单详情
│   │   │   └── WorkOrderList.vue            # 工单列表
│   │   │
│   │   ├── tag/            # 标签管理
│   │   │   └── TagManagement.vue      # 标签管理
│   │   │
│   │   ├── Home.vue        # 首页
│   │   ├── Dockyard.vue    # 海柜停车图
│   │   ├── LogisticsExample.vue # 物流示例
│   │   ├── MessageDetail.vue    # 消息详情
│   │   ├── MessageList.vue      # 消息列表
│   │   ├── MessageManage.vue    # 消息管理
│   │   └── TableSurelyDemo.vue  # 表格示例
│   │
│   ├── App.vue             # 根组件
│   ├── index.css           # 全局样式
│   ├── env.d.ts            # 环境变量类型定义
│   └── main.js             # 入口文件
│
├── .gitignore              # Git忽略文件
└── package.json            # 项目依赖和脚本
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

### 出库批次管理

1. 出库批次列表支持多条件筛选和排序
2. 可以按批次状态、目的地等条件进行筛选
3. 支持批次详情查看和编辑
4. 整合跟进记录功能，可以直观显示新增跟进记录提醒
5. 提供批量操作和导出功能

### 跟进记录功能

1. 在批次列表中，新增的跟进记录会显示醒目的"新"标记提醒
2. 点击跟进记录可查看历史记录和添加新记录
3. 跟进记录支持按类型（常规、重要、紧急）和对象（内部、供应商、客户）进行筛选
4. 支持上传附件和添加回复功能
5. 未读的跟进记录会持续提醒，直到用户查看后自动标记为已读

### FBX预约管理

1. 在顶部标签页可以切换不同的数据视图
2. 使用筛选区域可以按ETA日期或柜号进行筛选
3. 全字段模糊搜索可以在所有字段中查找内容
4. 工具栏提供了筛选、排序、分组和字段配置功能
5. 表格支持展开行查看更多信息
6. 底部分页器可以调整每页显示条数和页码

### 海柜停车图

待开发...

文件查看地址：https://graceful-tulumba-a8a4e0.netlify.app/

## 开发者

Alex Sun
