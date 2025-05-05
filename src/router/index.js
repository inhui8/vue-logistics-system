import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import AppointmentManagement from '../views/Appointment/AppointmentManagement.vue'
import AppointmentList from '../views/Appointment/AppointmentList.vue'
import TableSurelyDemo from '../views/TableSurelyDemo.vue'
import TagList from '@/views/Admin/TagManagement/TagList.vue'
import TagGroupList from '@/views/Admin/TagManagement/TagGroupList.vue'
import ApptSet from '@/views/loadAppointment/apptSet.vue'
import LoadAppointment from '@/views/loadAppointment/appointment.vue'
import DriverCheckIn from '@/views/TMS/DriverCheckIn.vue'
import BaseLayout from '@/layout/BaseLayout.vue'
import { h } from 'vue'
import { RouterView } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '首页', icon: 'el-icon-s-home' }
  },
  {
    path: '/overseas',
    name: 'Overseas',
    component: () => import('../layout/BaseLayout.vue'),
    meta: { title: '海外操作', icon: 'el-icon-ship' }
  },
  {
    path: '/lastmile',
    name: 'LastMile',
    component: () => import('../layout/BaseLayout.vue'),
    meta: { title: '尾程仓管', icon: 'el-icon-office-building' },
    children: [
      {
        path: 'products',
        name: 'Products',
        component: Home,
        meta: { title: '商品管理', parentTitle: '尾程仓管' }
      },
      {
        path: 'appointment',
        name: 'Appointment',
        component: () => import('../views/Appointment/planManagement.vue'),
        meta: { title: '预约出库新', parentTitle: '尾程仓管' }
      },
      {
        path: 'dispatch',
        name: 'Dispatch',
        component: Home,
        meta: { title: '现场调度', parentTitle: '尾程仓管' }
      }
    ]
  },
  {
    path: '/appointment',
    name: 'AppointmentMain',
    component: () => import('../layout/BaseLayout.vue'),
    meta: { title: '预约出库', icon: 'el-icon-date' },
    children: [
      {
        path: 'list',
        name: 'AppointmentList',
        component: AppointmentList,
        meta: { title: '预约出库', parentTitle: '尾程仓管' }
      },
      {
        path: 'management',
        name: 'AppointmentManagement',
        component: AppointmentManagement,
        meta: { title: '预约管理', parentTitle: '预约出库' }
      }
    ]
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: () => import('../layout/BaseLayout.vue'),
    meta: { title: '库存管理', icon: 'el-icon-box' },
    children: [
    ]
  },
  {
    path: '/dockyard',
    name: 'DockyardView',
    component: () => import('../views/Dockyard.vue'),
    meta: { title: '码头停车图', icon: 'el-icon-location' }
  },
  {
    path: '/fbx',
    name: 'FBXView',
    component: () => import('../views/FBX/FBX.vue'),
    meta: { title: 'FBX预约信息', icon: 'el-icon-document' }
  },
  {
    path: '/newfbx',
    name: 'NewFBXView',
    component: () => import('../views/FBX/newFBX.vue'),
    meta: { title: 'FBX管理', icon: 'el-icon-tickets' }
  },
  {
    path: '/newfbx-visactor',
    name: 'NewFBXVisactorView',
    component: () => import('../views/FBX/newFBXVisactor.vue'),
    meta: { title: 'FBX管理(Visactor)', icon: 'el-icon-tickets' }
  },
  {
    path: '/fbx/expenses/:id',
    name: 'FBXExpenseDetails',
    component: () => import('@/views/FBX/ExpenseDetails2.vue'),
    meta: { title: '费用明细', parentTitle: 'FBX管理', icon: 'el-icon-money' },
    props: true
  },
  {
    path: '/tms',
    name: 'TMSView',
    component: () => import('../views/TMS/OutgoingBatch.vue'),
    meta: { title: 'TMS系统', icon: 'el-icon-truck' }
  },
  {
    path: '/container',
    name: 'ContainerView',
    component: () => import('../views/FBX/FBX.vue'),
    meta: { title: '海柜管理', icon: 'el-icon-suitcase' }
  },
  {
    path: '/dispatch/outgoing-batch',
    name: 'OutgoingBatchDirectView',
    component: () => import('../views/TMS/OutgoingBatch.vue'),
    meta: { title: '出库批次', parentTitle: '尾程仓管', icon: 'el-icon-box' }
  },
  {
    path: '/dispatch/delivery-trains',
    name: 'DeliveryTrainsView',
    component: () => import('../views/TMS/DeliveryTrains.vue'),
    meta: { title: '派送车次', parentTitle: '车辆派送', icon: 'el-icon-truck' }
  },
  {
    path: '/tms/delivery-train-detail/:id',
    name: 'DeliveryTrainDetailView',
    component: () => import('../views/TMS/TrainDetail.vue'),
    meta: { title: '车次详情', parentTitle: 'TMS系统', icon: 'el-icon-document' }
  },
  {
    path: '/tms/outgoing-batch-detail/:id',
    name: 'OutgoingBatchDetailView',
    component: () => import('../views/TMS/OutgoingBatchDetail.vue'),
    meta: { title: '出库批次详情', parentTitle: 'TMS系统', icon: 'el-icon-document' }
  },
  {
    path: '/tms/driver-check-in',
    name: 'DriverCheckIn',
    component: DriverCheckIn,
    meta: { title: '司机登记', parentTitle: '车辆派送', icon: 'el-icon-user' }
  },
  {
    path: '/logistics-example',
    name: 'LogisticsExampleView',
    component: () => import('../views/LogisticsExample.vue'),
    meta: { title: '物流组件示例', icon: 'el-icon-s-order' }
  },
  {
    path: '/supplier',
    name: 'Supplier',
    component: () => import('../layout/BaseLayout.vue'),
    meta: { title: '供应商门户', icon: 'el-icon-s-shop' },
    children: [
      {
        path: 'order',
        name: 'SupplierOrder',
        component: () => import('../layout/BaseLayout.vue'),
        meta: { title: '订单管理', parentTitle: '供应商门户' },
        children: [
          {
            path: 'seas-order',
            name: 'SupplierSeasOrder',
            component: () => import('../views/SMS/SuppilerSeasOrder.vue'),
            meta: { title: '海柜订单', parentTitle: '订单管理' }
          },
          {
            path: 'delivery-order',
            name: 'SupplierDeliveryOrder',
            component: () => import('../views/SMS/DeliveryOrders.vue'),
            meta: { title: '派送订单', parentTitle: '订单管理' }
          }
        ]
      },
      {
        path: 'appointment-management',
        name: 'SupplierAppointmentManagement',
        component: AppointmentManagement,
        meta: { title: '平台预约管理', parentTitle: '尾程仓管' }
      },
      {
        path: 'mobile-app',
        name: 'SupplierMobileApp',
        component: () => import('../layout/BaseLayout.vue'),
        meta: { title: '手机APP端', parentTitle: '供应商门户' },
        redirect: '/supplier/mobile-app/driver-dispatch',
        children: [
          {
            path: 'driver-dispatch',
            name: 'DriverDispatchApp',
            component: () => import('../views/SMS/PhoneApp/DriverDispatch.vue'),
            meta: { title: '车辆派送', parentTitle: '手机APP端' }
          },
          {
            path: 'stocking',
            name: 'Stocking',
            component: () => import('@/views/SMS/PhoneApp/Stocking.vue'),
            meta: { title: '备货', parentTitle: '手机APP端' }
          },
          {
            path: 'stocking-confirm/:trainId/:trainNumber',
            name: 'StockingConfirm',
            component: () => import('@/views/SMS/PhoneApp/StockingConfirm.vue'),
            meta: { title: '确认备货', parentTitle: '手机APP端' }
          },
          {
            path: 'stocking-history',
            name: 'StockingHistory',
            component: () => import('@/views/SMS/PhoneApp/StockingHistory.vue'),
            meta: { title: '备货历史', parentTitle: '手机APP端' }
          },
          {
            path: 'outbound',
            name: 'Outbound',
            component: () => import('@/views/SMS/PhoneApp/OutboundConfirm.vue'),
            meta: { title: '出库', parentTitle: '手机APP端' }
          }
        ]
      }
    ]
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('../layout/BaseLayout.vue'),
    meta: { title: '消息中心', icon: 'message' },
    redirect: '/messages/list',
    children: [
      {
        path: 'list',
        name: 'MessageList',
        component: () => import('@/views/MessageList.vue'),
        meta: { title: '消息列表', parentTitle: '消息中心' }
      },
      {
        path: 'detail',
        name: 'MessageDetail',
        component: () => import('@/views/MessageDetail.vue'),
        meta: { title: '消息详情', parentTitle: '消息中心' }
      },
      {
        path: 'manage',
        name: 'MessageManage',
        component: () => import('@/views/MessageManage.vue'),
        meta: { title: '消息管理配置', parentTitle: '消息中心' }
      },
      {
        path: 'email-management',
        name: 'EmailManagementParent',
        component: { render: () => h(RouterView) },
        meta: { title: '邮件管理', parentTitle: '消息中心' },
        children: [
          {
            path: 'accounts',
            name: 'EmailAccount',
            component: () => import('@/views/MessageCenter/EmailManagement/EmailAccount.vue'),
            meta: { title: '邮箱账号', parentTitle: '邮件管理' }
          },
          {
            path: 'templates',
            name: 'EmailTemplate',
            component: () => import('@/views/MessageCenter/EmailManagement/EmailTemplate.vue'),
            meta: { title: '邮件模板', parentTitle: '邮件管理' }
          },
          {
            path: 'logs',
            name: 'EmailLog',
            component: () => import('@/views/MessageCenter/EmailManagement/EmailLog.vue'),
            meta: { title: '邮件记录', parentTitle: '邮件管理' }
          }
        ]
      }
    ]
  },
  {
    path: '/load-appointment',
    name: 'LoadAppointmentMain',
    component: BaseLayout,
    redirect: '/load-appointment/manage',
    meta: { title: '提货预约', icon: 'el-icon-calendar' },
    children: [
      {
        path: 'manage',
        name: 'LoadAppointmentManage',
        component: LoadAppointment,
        meta: { title: '预约日历', parentTitle: '提货预约' }
      },
      {
        path: 'settings',
        name: 'LoadAppointmentSettings',
        component: ApptSet,
        meta: { title: '预约设置', parentTitle: '提货预约' }
      }
    ]
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../layout/BaseLayout.vue'),
    redirect: '/admin/supplier-management',
    meta: { title: '后台管理', icon: 'el-icon-setting' },
    children: [
      {
        path: 'supplier-management',
        name: 'AdminSupplierManagement',
        component: () => import('../views/Admin/SupplierManagement/SupplierList.vue'),
        meta: { title: '供应商管理', parentTitle: '后台管理' }
      },
      {
        path: 'role-management',
        name: 'AdminRoleManagement',
        component: () => import('../views/Admin/RoleManagement/RoleList.vue'),
        meta: { title: '角色管理', parentTitle: '后台管理' }
      },
      {
        path: 'operation-log',
        name: 'AdminOperationLog',
        component: () => import('../views/Admin/OperationLog/LogList.vue'),
        meta: { title: '操作日志', parentTitle: '后台管理' }
      },
      {
        path: 'vehicle-management',
        name: 'AdminVehicleManagement',
        component: () => import('../views/Admin/VehicleManagement/VehicleList.vue'),
        meta: { title: '车辆档案', parentTitle: '后台管理' }
      },
      {
        path: 'driver-management',
        name: 'AdminDriverManagement',
        component: () => import('../views/Admin/DriverManagement/DriverList.vue'),
        meta: { title: '驾驶员管理', parentTitle: '后台管理' }
      },
      {
        path: 'gps-tracking',
        name: 'AdminGpsTracking',
        component: () => import('../views/Admin/GpsTracking/MapMonitor.vue'),
        meta: { title: 'GPS 实时监控', parentTitle: '后台管理' }
      },
      {
        path: 'alert-management',
        name: 'AdminAlertManagement',
        component: () => import('../views/Admin/AlertManagement/AlertList.vue'),
        meta: { title: '异常预警', parentTitle: '后台管理' }
      },
      {
        path: 'tag-management',
        name: 'AdminTagManagement',
        component: () => import('../layout/BaseLayout.vue'),
        meta: { title: '标签管理', parentTitle: '后台管理' },
        children: [
          {
            path: 'list',
            name: 'TagList',
            component: () => import('../views/tag/TagManagement.vue'),
            meta: { title: '标签列表', parentTitle: '标签管理' }
          },
          {
            path: 'groups',
            name: 'TagGroupList',
            component: TagGroupList,
            meta: { title: '标签分组', parentTitle: '标签管理' }
          },
          {
            path: 'library',
            name: 'TagLibrary',
            component: () => import('../views/tag/TagManagement.vue'),
            meta: { title: '标签库', parentTitle: '标签管理' }
          },
          {
            path: 'rules',
            name: 'TagRules',
            component: () => import('../views/tag/TagManagement.vue'),
            meta: { title: '规则配置', parentTitle: '标签管理' }
          },
          {
            path: 'dashboard',
            name: 'TagDashboard',
            component: () => import('../views/tag/TagManagement.vue'),
            meta: { title: '数据看板', parentTitle: '标签管理' }
          }
        ]
      },
      {
        path: 'tag-management-new',
        name: 'AdminTagManagementNew',
        component: () => import('../layout/BaseLayout.vue'),
        meta: { title: '标签管理新', parentTitle: '后台管理' },
        children: [
          {
            path: 'list',
            name: 'TagListNew',
            component: () => import('../views/tag/TagManagement.vue'),
            meta: { title: '标签列表', parentTitle: '标签管理新' }
          }
        ]
      },
      {
        path: 'quote-management',
        name: 'QuoteManagement',
        meta: { title: '报价管理', icon: 'el-icon-document' },
        children: [
          {
            path: 'amazon-warehouse',
            name: 'AmazonWarehouseManagement',
            component: () => import('@/views/Admin/QuoteManagement/AmazonWarehouseManagement.vue'),
            meta: { title: '仓库管理' }
          },
          {
            path: 'fixed-quote',
            name: 'AdminFixedQuote',
            component: () => import('../views/Admin/QuoteManagement/FixedQuoteList.vue'),
            meta: { title: '固定报价', parentTitle: '报价管理' }
          },
          {
            path: 'inquiry',
            name: 'AdminInquiry',
            component: () => import('../views/Admin/QuoteManagement/InquiryList.vue'),
            meta: { title: '单次询价', parentTitle: '报价管理' }
          },
          {
            path: 'bidding',
            name: 'AdminBidding',
            component: () => import('../views/Admin/QuoteManagement/BiddingList.vue'),
            meta: { title: '竞价管理', parentTitle: '报价管理' }
          },
          {
            path: 'comparison-history',
            name: 'AdminQuoteComparisonHistory',
            component: () => import('../views/Admin/QuoteManagement/QuoteComparisonHistory.vue'),
            meta: { title: '对比与历史', parentTitle: '报价管理' }
          }
        ]
      },
      {
        path: 'tags',
        name: 'TagManagement',
        component: TagList,
        meta: { title: '标签管理', parentTitle: '后台管理' }
      },
      {
        path: 'tag-groups',
        name: 'TagGroupManagement',
        component: TagGroupList,
        meta: { title: '标签分组', parentTitle: '后台管理' }
      },
      {
        path: 'rating-management',
        name: 'AdminRatingManagement',
        component: () => import('../layout/SubRouteLayout.vue'),
        redirect: '/admin/rating-management/dashboard',
        meta: { title: '评分管理', parentTitle: '后台管理' },
        children: [
          {
            path: 'dashboard',
            name: 'AdminRatingDashboard',
            component: () => import('../views/Admin/RatingManagement/RatingDashboard.vue'),
            meta: { title: '评分看板', parentTitle: '评分管理' }
          },
          {
            path: 'field-rule-config',
            name: 'FieldRuleConfig',
            component: () => import('@/views/Admin/RatingManagement/FieldRuleConfig.vue'),
            meta: { title: '字段规则配置' }
          },
          {
            path: 'metric-rule-config',
            name: 'MetricRuleConfig',
            component: () => import('@/views/Admin/RatingManagement/MetricRuleConfig.vue'),
            meta: { title: '指标规则配置' }
          },
          {
            path: 'indicator-config',
            name: 'RatingIndicatorConfig',
            component: () => import('@/views/Admin/RatingManagement/RatingIndicatorConfig.vue'),
            meta: { title: '指标配置', parentTitle: '评分管理' }
          },
          {
            path: 'rules-config',
            name: 'RatingRulesConfig',
            component: () => import('@/views/Admin/RatingManagement/RatingRulesConfig.vue'),
            meta: { title: '规则配置', parentTitle: '评分管理' }
          },
          {
            path: 'supplier-deduction-details',
            name: 'SupplierDeductionDetails',
            component: () => import('@/views/Admin/RatingManagement/SupplierDeductionDetails.vue'),
            meta: { title: '扣分详情' }
          }
        ]
      },
      {
        path: 'contract-management',
        name: 'AdminContractManagement',
        component: () => import('../layout/SubRouteLayout.vue'),
        redirect: '/admin/contract-management/list',
        meta: { title: '合同管理', parentTitle: '后台管理' },
        children: [
          {
            path: 'list',
            name: 'AdminContractList',
            component: () => import('../views/Admin/ContractManagement/ContractList.vue'),
            meta: { title: '合同列表', parentTitle: '合同管理' }
          },
          {
            path: 'templates',
            name: 'AdminContractTemplates',
            component: () => import('../views/Admin/ContractManagement/ContractTemplateManagement.vue'),
            meta: { title: '合同模板', parentTitle: '合同管理' }
          }
        ]
      },
      {
        path: 'message-management',
        name: 'MessageManagement',
        component: () => import('../views/MessageManage.vue'),
        meta: { title: '消息管理', parentTitle: '后台管理' }
      }
    ]
  },
  {
    path: "/work-order",
    name: "WorkOrder",
    component: () => import('../layout/BaseLayout.vue'),
    redirect: "/work-order/list",
    meta: {
      title: "工单管理",
      icon: "el-icon-document",
    },
    children: [
      {
        path: "command",
        name: "CommandWorkOrderList",
        component: () => import("@/views/WorkOrder/CommandWorkOrderList.vue"),
        meta: {
          title: "指令工单",
        },
      },
      {
        path: "command/create",
        name: "CommandWorkCreate",
        component: () => import("@/views/WorkOrder/CommandWorkCreate.vue"),
        meta: {
          title: "创建指令工单",
          hidden: true,
          activeMenu: "/work-order/command",
        },
      },
      {
        path: "command/detail/:id",
        name: "CommandWorkDetail",
        component: () => import("@/views/WorkOrder/CommandWorkDetail.vue"),
        meta: {
          title: "指令工单详情",
          hidden: true,
        },
      },
      {
        path: "command/:id/process",
        name: "CommandWorkProcess",
        component: () => import("@/views/WorkOrder/CommandWorkDetail.vue"),
        meta: {
          title: "处理指令工单",
          hidden: true,
        },
      },
      {
        path: "exception",
        name: "ExceptionWorkOrderList",
        component: () => import("@/views/WorkOrder/ExceptionWorkOrderList.vue"),
        meta: {
          title: "异常工单",
        },
      },
      {
        path: "alert",
        name: "AlertWorkOrderList",
        component: () => import("@/views/WorkOrder/AlertWorkOrderList.vue"),
        meta: {
          title: "订单预警",
        },
      },
      {
        path: "value-added",
        name: "ValueAddedWorkOrderList",
        component: () => import("@/views/WorkOrder/ValueAddedWorkOrderList.vue"),
        meta: {
          title: "增值服务",
        },
      },
      {
        path: "create",
        name: "WorkOrderCreate",
        component: () => import("@/views/WorkOrder/WorkOrderCreate.vue"),
        meta: {
          title: "创建工单",
          hidden: true,
          activeMenu: "/work-order/exception",
        },
      },
      {
        path: "detail/:id",
        name: "WorkOrderDetail",
        component: () => import("@/views/WorkOrder/WorkOrderDetail.vue"),
        meta: {
          title: "工单详情",
          hidden: true,
        },
      },
      {
        path: ":id/process",
        name: "WorkOrderProcess",
        component: () => import("@/views/WorkOrder/WorkOrderDetail.vue"),
        meta: {
          title: "处理工单",
          hidden: true,
        },
      },
      {
        path: "analysis",
        name: "WorkOrderAnalysis",
        component: () => import("@/views/WorkOrder/WorkOrderAnalysis.vue"),
        meta: {
          title: "工单分析",
        },
      },
    ],
  },
  {
    path: '/tableDemo',
    name: 'tableDemo',
    component: TableSurelyDemo
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 物流管理系统` : '物流管理系统';
  
  // 检查是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 这里添加认证逻辑
    const isAuthenticated = true; // 临时写死，实际应该从 store 或其他地方获取
    
    if (!isAuthenticated) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router 