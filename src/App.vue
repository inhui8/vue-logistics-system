/* eslint-disable */
<template>
  <div id="app">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="logo-container">
        <img src="" alt="Logo" class="logo-img" v-if="false">
        <h1 class="logo-text">物流管理系统</h1>
      </div>
      <div class="header-right">
        <MessageNotification />
        <el-dropdown trigger="click">
          <span class="user-info">
            <img src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="user-avatar">
            <span class="username">管理员</span>
            <i class="el-icon-arrow-down"></i>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item icon="el-icon-user">个人中心</el-dropdown-item>
              <el-dropdown-item icon="el-icon-setting">系统设置</el-dropdown-item>
              <el-dropdown-item divided icon="el-icon-switch-button">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="main-container">
      <!-- 侧边栏导航 -->
      <div class="sidebar" :class="{ collapsed: isCollapsed }">
        <!-- 扁平化侧边导航 -->
        <div class="custom-menu">
          <!-- 首页 -->
          <div class="menu-item" :class="{ active: activeMenu === '/' }" @click="navigateTo('/')">
            <i class="el-icon-s-home menu-icon"></i>
            <span class="menu-title">首页</span>
          </div>
          
          <!-- 海外操作 -->
          <div class="menu-item" :class="{ active: activeMenu.startsWith('/overseas') || activeMenu.startsWith('/fbx') || activeMenu.startsWith('/dockyard') || activeMenu === '/newfbx' || activeMenu === '/lastmile/appointment' }" @click="toggleSubmenu('overseas')">
            <i class="el-icon-ship menu-icon"></i>
            <span class="menu-title">海外操作</span>
            <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('overseas')}"></i>
          </div>
          
          <!-- 海外操作子菜单 -->
          <div class="submenu" v-show="expandedMenus.includes('overseas')">

            <div class="submenu-item" @click="navigateTo('/dockyard')">
              <span class="submenu-title">码头停车图</span>
            </div>
            <div class="submenu-item" @click="navigateTo('/newfbx')">
              <span class="submenu-title">FBX管理</span>
            </div>
            <div class="submenu-item" @click="navigateTo('/lastmile/appointment')">
              <span class="submenu-title">货量统筹</span>
            </div>
          </div>
          
          <!-- 尾程仓管 -->
          <div class="menu-item highlight" :class="{ active: activeMenu.startsWith('/tms') || activeMenu === '/dispatch/outgoing-batch' || activeMenu === '/appointment/list' || activeMenu === '/supplier/appointment-management' }" @click="toggleSubmenu('lastmile')">
            <i class="el-icon-office-building menu-icon"></i>
            <span class="menu-title">尾程仓管</span>
            <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('lastmile')}"></i>
          </div>
          
          <!-- 尾程仓管的子菜单 -->
          <div class="submenu" v-show="expandedMenus.includes('lastmile')">
            <!-- FBX管理 和 货量统筹 已被移走 -->
            <div class="submenu-item" @click="navigateTo('/dispatch/outgoing-batch')">
              <span class="submenu-title">出库批次</span>
            </div>
            <!-- 派送车次 已移至 调度管理 -->
            <!-- 提货预约 已移至 调度管理 -->
            <!-- 新增：预约列表 -->
            <div class="submenu-item" @click="navigateTo('/appointment/list')">
              <span class="submenu-title">预约出库</span>
            </div>
            <!-- 新增：预约管理 -->
            <div class="submenu-item"  @click="navigateTo('/supplier/appointment-management')">
              <span class="submenu-title">平台预约管理</span>
            </div>
          </div>
           
          <!-- 基础资料 -->
          <div class="menu-item" :class="{ active: activeMenu.startsWith('/admin/quote-management/amazon-warehouse') }" @click="toggleSubmenu('supplier-appointment')">
            <i class="el-icon-date menu-icon"></i>
            <span class="menu-title">基础资料</span>
            <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('supplier-appointment')}"></i>
          </div>
          
          <!-- 基础资料子菜单 -->
          <div class="submenu" v-show="expandedMenus.includes('supplier-appointment')">
            <div class="submenu-item" @click="navigateTo('/admin/quote-management/amazon-warehouse')">
              <span class="submenu-title">平台地址</span>
            </div>
          </div>
                   <!-- 车辆派送 -->
          <div class="menu-item" :class="{ active: activeMenu.startsWith('/inventory') || activeMenu === '/dispatch/delivery-trains' || activeMenu.startsWith('/load-appointment') }" @click="toggleSubmenu('inventory')">
            <i class="el-icon-box menu-icon"></i>
            <span class="menu-title">车辆派送</span>
            <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('inventory')}"></i>
          </div>
          <!-- 车辆派送子菜单 -->
          <div class="submenu" v-show="expandedMenus.includes('inventory')">
            <!-- 出库批次 已被移走 -->
            <!-- 新增：派送车次 -->
            <div class="submenu-item" @click="navigateTo('/dispatch/delivery-trains')">
               <span class="submenu-title">派送车次</span>
            </div>
            <!-- 新增：司机登记 -->
            <div class="submenu-item" @click="navigateTo('/tms/driver-check-in')">
              <span class="submenu-title">司机登记</span>
            </div>
            <!-- 新增：提货预约 (父菜单 - 移除图标以对齐) -->
            <div class="submenu-item" data-has-children="true" @click="toggleSubmenu('load-appointment')">
              <!-- <i class="el-icon-calendar menu-icon" style="margin-right: 5px; font-size: 16px;"></i> -->
              <span class="submenu-title">提货预约</span>
              <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('load-appointment')}"></i>
            </div>
            <!-- 新增：提货预约子菜单 (Level 2) -->
            <div class="submenu submenu-level-2" v-show="expandedMenus.includes('load-appointment')">
              <div class="submenu-item" :class="{ active: activeMenu === '/load-appointment/manage' }" @click="navigateTo('/load-appointment/manage')">
                <span class="submenu-title">预约日历</span>
              </div>
              <div class="submenu-item" :class="{ active: activeMenu === '/load-appointment/settings' }" @click="navigateTo('/load-appointment/settings')">
                <span class="submenu-title">预约设置</span>
              </div>
            </div>
          </div>
          <!-- 手机APP端 -->
          <div class="menu-item" :class="{ active: activeMenu.startsWith('/supplier/mobile-app') }" @click="toggleSubmenu('supplier-mobile-app')">
            <i class="el-icon-mobile-phone menu-icon"></i>
            <span class="menu-title">手机APP端</span>
            <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('supplier-mobile-app')}"></i>
          </div>
          <!-- 手机APP端子菜单 -->
          <div class="submenu" v-show="expandedMenus.includes('supplier-mobile-app')">
            <div class="submenu-item" :class="{ active: activeMenu === '/supplier/mobile-app/driver-dispatch' }" @click="navigateTo('/supplier/mobile-app/driver-dispatch')">
              <span class="submenu-title">车辆派送</span>
            </div>
            <div class="submenu-item" :class="{ active: activeMenu === '/supplier/mobile-app/stocking' }" @click="navigateTo('/supplier/mobile-app/stocking')">
              <span class="submenu-title">备货</span>
            </div>
            <div class="submenu-item" :class="{ active: activeMenu === '/supplier/mobile-app/outbound' }" @click="navigateTo('/supplier/mobile-app/outbound')">
              <span class="submenu-title">出库</span>
            </div>
            <!-- 可在此处添加更多手机App子菜单项 -->
          </div>

          </div>
          <!-- 工单管理 -->
          <div class="menu-item" :class="{ active: activeMenu.startsWith('/work-order') }" @click="toggleSubmenu('work-order')">
            <i class="el-icon-document menu-icon"></i>
            <span class="menu-title">工单管理</span>
            <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('work-order')}"></i>
          </div>

          <!-- 工单管理子菜单 -->
          <div class="submenu" v-show="expandedMenus.includes('work-order')">
            <div class="submenu-item" :class="{ active: activeMenu === '/work-order/command' }" @click="navigateTo('/work-order/command')">
              <span class="submenu-title">指令工单</span>
            </div>
            <div class="submenu-item" :class="{ active: activeMenu === '/work-order/exception' }" @click="navigateTo('/work-order/exception')">
              <span class="submenu-title">异常工单</span>
            </div>
            <div class="submenu-item" :class="{ active: activeMenu === '/work-order/alert' }" @click="navigateTo('/work-order/alert')">
              <span class="submenu-title">订单预警</span>
            </div>
            <div class="submenu-item" :class="{ active: activeMenu === '/work-order/value-added' }" @click="navigateTo('/work-order/value-added')">
              <span class="submenu-title">增值服务</span>
            </div>
            <div class="submenu-item" :class="{ active: activeMenu === '/work-order/analysis' }" @click="navigateTo('/work-order/analysis')">
              <span class="submenu-title">工单分析</span>
            </div>
          </div>

          <!-- 消息中心 -->
          <div class="menu-item" :class="{ active: activeMenu.startsWith('/messages') }" @click="toggleSubmenu('messages')">
            <i class="el-icon-message menu-icon"></i>
            <span class="menu-title">消息中心</span>
            <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('messages')}"></i>
          </div>

          <!-- 消息中心子菜单 -->
          <div class="submenu" v-show="expandedMenus.includes('messages')">
            <!-- 新增：站内信管理 (父菜单 - 需要箭头) -->
            <div class="submenu-item" data-has-children="true" @click="toggleSubmenu('internal-message')">
              <i class="el-icon-chat-dot-round menu-icon" style="margin-right: 5px; font-size: 16px;"></i>
              <span class="submenu-title">站内信管理</span>
              <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('internal-message')}"></i>
            </div>
            <!-- 新增：站内信管理子菜单 (Level 2) -->
            <div class="submenu submenu-level-2" v-show="expandedMenus.includes('internal-message')">
              <!-- 移动过来的 消息列表 -->
              <div class="submenu-item" :class="{ active: activeMenu === '/messages/list' }" @click="navigateTo('/messages/list')">
                <span class="submenu-title">消息列表</span>
              </div>
              <!-- 移动过来的 消息管理配置 -->
              <div class="submenu-item" :class="{ active: activeMenu === '/messages/manage' }" @click="navigateTo('/messages/manage')">
                <span class="submenu-title">消息管理配置</span>
              </div>
            </div>

            <!-- 新增：邮件管理 (父菜单 - 需要箭头) -->
            <div class="submenu-item" data-has-children="true" @click.stop="toggleSubmenu('email-management')">
              <i class="el-icon-message menu-icon" style="margin-right: 5px; font-size: 16px;"></i>
              <span class="submenu-title">邮件管理</span>
              <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('email-management')}"></i>
            </div>
            <!-- 新增：邮件管理子菜单 -->
            <div class="submenu submenu-level-2" v-show="expandedMenus.includes('email-management')">
              <div class="submenu-item" :class="{ active: activeMenu === '/messages/email-management/accounts' }" @click="navigateTo('/messages/email-management/accounts')">
                <span class="submenu-title">邮箱账号</span>
              </div>
              <div class="submenu-item" :class="{ active: activeMenu === '/messages/email-management/templates' }" @click="navigateTo('/messages/email-management/templates')">
                <span class="submenu-title">邮件模板</span>
              </div>
              <div class="submenu-item" :class="{ active: activeMenu === '/messages/email-management/logs' }" @click="navigateTo('/messages/email-management/logs')">
                <span class="submenu-title">邮件记录</span>
              </div>
            </div>
          </div>
          <!-- 供应商门户 -->
          <div class="menu-item" :class="{ active: activeMenu.startsWith('/supplier') }" @click="toggleSubmenu('supplier')">
            <i class="el-icon-s-shop menu-icon"></i>
            <span class="menu-title">供应商门户</span>
            <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('supplier')}"></i>
          </div>
          
          <!-- 供应商门户子菜单 -->
          <div class="submenu" v-show="expandedMenus.includes('supplier')">
            <!-- 订单管理 (父菜单 - 需要箭头) -->
            <div class="submenu-item" data-has-children="true" @click="toggleSubmenu('supplier-order')">
              <span class="submenu-title">订单管理</span>
              <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('supplier-order')}"></i>
            </div>
            <!-- 订单管理子菜单 -->
            <div class="submenu submenu-level-2" v-show="expandedMenus.includes('supplier-order')">
              <div class="submenu-item" @click="navigateTo('/supplier/order/seas-order')">
                <span class="submenu-title">海柜订单</span>
              </div>
              <div class="submenu-item" @click="navigateTo('/supplier/order/delivery-order')">
                <span class="submenu-title">派送订单</span>
              </div>
            </div>

            <!-- 报价管理 (父菜单 - 需要箭头) -->
            <div class="submenu-item" data-has-children="true" @click="toggleSubmenu('supplier-quote')">
              <span class="submenu-title">报价管理</span>
              <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('supplier-quote')}"></i>
            </div>
            <!-- 报价管理子菜单 -->
            <div class="submenu submenu-level-2" v-show="expandedMenus.includes('supplier-quote')">
              <div class="submenu-item" :class="{ active: activeMenu === '/admin/quote-management/fixed-quote' }" @click="navigateTo('/admin/quote-management/fixed-quote')">
                <span class="submenu-title">固定报价</span>
              </div>
              <div class="submenu-item" :class="{ active: activeMenu === '/admin/quote-management/inquiry' }" @click="navigateTo('/admin/quote-management/inquiry')">
                <span class="submenu-title">单次询价</span>
              </div>
              <div class="submenu-item" :class="{ active: activeMenu === '/admin/quote-management/bidding' }" @click="navigateTo('/admin/quote-management/bidding')">
                <span class="submenu-title">竞价管理</span>
              </div>
              <div class="submenu-item" :class="{ active: activeMenu === '/admin/quote-management/comparison-history' }" @click="navigateTo('/admin/quote-management/comparison-history')">
                <span class="submenu-title">对比与历史</span>
              </div>

            </div>

            <!-- 评分管理 (父菜单 - 需要箭头) -->
            <div class="submenu-item" data-has-children="true" @click="toggleSubmenu('supplier-rating')">
              <span class="submenu-title">评分管理</span>
              <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('supplier-rating')}"></i>
            </div>
            <!-- 评分管理子菜单 -->
            <div class="submenu submenu-level-2" v-show="expandedMenus.includes('supplier-rating')">
              <div class="submenu-item" :class="{ active: activeMenu === '/admin/rating-management/dashboard' }" @click="navigateTo('/admin/rating-management/dashboard')">
                <span class="submenu-title">评分看板</span>
              </div>
              <div class="submenu-item" :class="{ active: activeMenu === '/admin/rating-management/field-rule-config' }" @click="navigateTo('/admin/rating-management/field-rule-config')">
                <span class="submenu-title">字段规则配置</span>
              </div>
              <div class="submenu-item" :class="{ active: activeMenu === '/admin/rating-management/metric-rule-config' }" @click="navigateTo('/admin/rating-management/metric-rule-config')">
                <span class="submenu-title">指标规则配置</span>
              </div>
              <div class="submenu-item" :class="{ active: activeMenu === '/admin/rating-management/indicator-config' }" @click="navigateTo('/admin/rating-management/indicator-config')">
                <span class="submenu-title">指标配置</span>
              </div>
              <div class="submenu-item" :class="{ active: activeMenu === '/admin/rating-management/rules-config' }" @click="navigateTo('/admin/rating-management/rules-config')">
                <span class="submenu-title">规则配置</span>
              </div>
              <div class="submenu-item" :class="{ active: activeMenu === '/admin/rating-management/supplier-deduction-details' }" @click="navigateTo('/admin/rating-management/supplier-deduction-details')">
                <span class="submenu-title">扣分详情</span>
              </div>
            </div>



          <!-- 后台管理 -->
          <div class="menu-item" :class="{ active: activeMenu.startsWith('/admin') }" @click="toggleSubmenu('admin')">
            <i class="el-icon-setting menu-icon"></i>
            <span class="menu-title">后台管理</span>
            <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('admin')}"></i>
          </div>

          <!-- 后台管理子菜单 -->
          <div class="submenu" v-show="expandedMenus.includes('admin')">
            <div class="submenu-item" :class="{ active: activeMenu === '/admin/supplier-management' }" @click="navigateTo('/admin/supplier-management')">
              <span class="submenu-title">供应商管理</span>
            </div>
            <div class="submenu-item" :class="{ active: activeMenu === '/admin/role-management' }" @click="navigateTo('/admin/role-management')">
              <span class="submenu-title">角色管理</span>
            </div>
            <div class="submenu-item" :class="{ active: activeMenu === '/admin/operation-log' }" @click="navigateTo('/admin/operation-log')">
              <span class="submenu-title">操作日志</span>
            </div>
            <div class="submenu-item" :class="{ active: activeMenu === '/admin/vehicle-management' }" @click="navigateTo('/admin/vehicle-management')">
              <span class="submenu-title">车辆档案</span>
            </div>
            <div class="submenu-item" :class="{ active: activeMenu === '/admin/driver-management' }" @click="navigateTo('/admin/driver-management')">
              <span class="submenu-title">驾驶员管理</span>
            </div>
            <div class="submenu-item" :class="{ active: activeMenu === '/admin/gps-tracking' }" @click="navigateTo('/admin/gps-tracking')">
              <span class="submenu-title">GPS 实时监控</span>
            </div>
            <div class="submenu-item" :class="{ active: activeMenu === '/admin/alert-management' }" @click="navigateTo('/admin/alert-management')">
              <span class="submenu-title">异常预警</span>
            </div>

            <div class="submenu-item" :class="{ active: activeMenu === '/table-demo' }" @click="navigateTo('/table-demo')">
              <span class="submenu-title">表格示例</span>
            </div>

            

            <!-- 合同管理 (父菜单 - 需要箭头) -->
            <div class="menu-item" :class="{ active: activeMenu.startsWith('/admin/contract-management') }" @click="toggleSubmenu('admin-contract')">
              <i class="el-icon-document menu-icon"></i>
              <span class="menu-title">合同管理</span>
              <!-- 确保顶级菜单内的父菜单也有箭头 -->
              <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('admin-contract')}"></i> 
            </div>
            
            <!-- 合同管理子菜单 -->
            <div class="submenu" v-show="expandedMenus.includes('admin-contract')">
              <div class="submenu-item" :class="{ active: activeMenu === '/admin/contract-management/list' }" @click="navigateTo('/admin/contract-management/list')">
                <span class="submenu-title">合同列表</span>
              </div>
               <div class="submenu-item" :class="{ active: activeMenu === '/admin/contract-management/templates' }" @click="navigateTo('/admin/contract-management/templates')">
                <span class="submenu-title">合同模板</span>
              </div>
            </div>

            <!-- 标签管理 (父菜单 - 需要箭头) -->
            <div class="menu-item" :class="{ active: activeMenu.startsWith('/admin/tag-management') || activeMenu.startsWith('/admin/tags') || activeMenu.startsWith('/admin/tag-groups') }" @click="toggleSubmenu('admin-tag')">
              <i class="el-icon-price-tag menu-icon"></i>
              <span class="menu-title">标签管理</span>
              <!-- 确保顶级菜单内的父菜单也有箭头 -->
              <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('admin-tag')}"></i> 
            </div>
            
            <!-- 标签管理子菜单 -->
            <div class="submenu" v-show="expandedMenus.includes('admin-tag')">
              <div class="submenu-item" :class="{ active: activeMenu === '/admin/tags' }" @click="navigateTo('/admin/tags')">
                <span class="submenu-title">标签管理</span>
              </div>
              <div class="submenu-item" :class="{ active: activeMenu === '/admin/tag-groups' }" @click="navigateTo('/admin/tag-groups')">
                <span class="submenu-title">标签分组</span>
              </div>
              <div class="submenu-item" :class="{ active: activeMenu === '/admin/tag-management-new/list' }" @click="navigateTo('/admin/tag-management-new/list')">
                <span class="submenu-title">标签管理新</span>
              </div>
            </div>


          </div>
          <!-- 测试 (新父菜单) -->
          <div class="menu-item" :class="{ active: activeMenu.startsWith('/test') }" @click="toggleSubmenu('test')">
            <i class="el-icon-setting menu-icon"></i>
            <span class="menu-title">测试</span>
            <i class="menu-arrow menu-arrow-icon" :class="{'is-open': expandedMenus.includes('test')}"></i>
          </div>
          
          <!-- 测试子菜单 -->
          <div class="submenu" v-show="expandedMenus.includes('test')">
            <div class="submenu-item" @click="navigateTo('/newfbx-visactor')">
              <span class="submenu-title">FBX管理(Visactor)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 主内容区 -->
      <div class="main-content">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.meta && $route.meta.parentTitle">{{ $route.meta.parentTitle }}</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.meta && $route.meta.title">{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="content-wrapper">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MessageNotification from '@/components/MessageNotification.vue'

export default {
  name: 'App',
  components: {
    MessageNotification
  },
  data() {
    return {
      isCollapsed: false,
      activeMenu: '/',
      // 1. 默认收起所有菜单
      expandedMenus: []
    }
  },
  methods: {
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed
    },
    // 2. 简化 toggleSubmenu，只处理当前点击的菜单项
    toggleSubmenu(menuKey) {
      const index = this.expandedMenus.indexOf(menuKey)
      if (index === -1) {
        this.expandedMenus.push(menuKey)
      } else {
        this.expandedMenus.splice(index, 1)
      }
    },
    navigateTo(path) {
      this.activeMenu = path
      // 导航时不改变展开状态，让 updateExpandedMenus 处理
      this.$router.push(path)
    },
    // 路由变化时更新展开菜单
    updateExpandedMenus(path) {
      this.expandedMenus = this.getMenuParents(path, true);
      console.log("Updated expanded menus for path", path, ":", this.expandedMenus);
    },
    // 获取菜单项的所有父级key
    getMenuParents(keyOrPath, isPath = false) {
      const parents = [];
      const menuHierarchy = this.getMenuHierarchy(); // 获取层级关系
      let currentKey = isPath ? this.findMenuKeyByPath(keyOrPath) : keyOrPath;

      if (!currentKey) return parents;

      let parentKey = menuHierarchy[currentKey];
      while (parentKey) {
        if (!parents.includes(parentKey)) { // 避免重复添加
           parents.unshift(parentKey); // 父级添加到数组前面
        }
        parentKey = menuHierarchy[parentKey];
      }
       
      // 如果 keyOrPath 本身就是一个父菜单 (在 hierarchy 的 key 中存在), 也需要包含它自己
      if (Object.prototype.hasOwnProperty.call(menuHierarchy, currentKey)) { 
           if (!parents.includes(currentKey)) {
               parents.push(currentKey);
           }
       }
      return [...new Set(parents)]; // 最终去重确保安全
    },
     // 根据路径查找菜单key (需要根据实际路由配置完善)
     findMenuKeyByPath(path) {
       const pathMap = { // 路由路径 -> 对应菜单项的 key (通常是子菜单key)
         // 海外操作
         '/dockyard': 'overseas', '/newfbx': 'overseas', '/lastmile/appointment': 'overseas',
         // 尾程仓管
         '/dispatch/outgoing-batch': 'lastmile', '/appointment/list': 'lastmile', '/supplier/appointment-management': 'lastmile',
         // 基础资料
         '/admin/quote-management/amazon-warehouse': 'supplier-appointment',
         // 车辆派送
         '/dispatch/delivery-trains': 'inventory', '/tms/driver-check-in': 'inventory',
         '/load-appointment/manage': 'load-appointment', '/load-appointment/settings': 'load-appointment',
         // 手机APP端
         '/supplier/mobile-app/driver-dispatch': 'supplier-mobile-app', '/supplier/mobile-app/stocking': 'supplier-mobile-app', '/supplier/mobile-app/outbound': 'supplier-mobile-app',
         // 工单管理
         '/work-order/command': 'work-order', '/work-order/exception': 'work-order', '/work-order/alert': 'work-order', '/work-order/value-added': 'work-order', '/work-order/analysis': 'work-order',
         // 消息中心
         '/messages/list': 'internal-message', '/messages/manage': 'internal-message',
         '/messages/email-management/accounts': 'email-management', '/messages/email-management/templates': 'email-management', '/messages/email-management/logs': 'email-management',
         // 供应商门户
         '/supplier/order/seas-order': 'supplier-order', '/supplier/order/delivery-order': 'supplier-order',
         '/admin/quote-management/fixed-quote': 'supplier-quote', '/admin/quote-management/inquiry': 'supplier-quote', '/admin/quote-management/bidding': 'supplier-quote', '/admin/quote-management/comparison-history': 'supplier-quote',
         '/admin/rating-management/dashboard': 'supplier-rating', '/admin/rating-management/field-rule-config': 'supplier-rating', '/admin/rating-management/metric-rule-config': 'supplier-rating', '/admin/rating-management/indicator-config': 'supplier-rating', '/admin/rating-management/rules-config': 'supplier-rating', '/admin/rating-management/supplier-deduction-details': 'supplier-rating',
         // 后台管理
         '/admin/supplier-management': 'admin', '/admin/role-management': 'admin', '/admin/operation-log': 'admin', '/admin/vehicle-management': 'admin', '/admin/driver-management': 'admin', '/admin/gps-tracking': 'admin', '/admin/alert-management': 'admin', '/table-demo': 'admin',
         '/admin/contract-management/list': 'admin-contract', '/admin/contract-management/templates': 'admin-contract',
         '/admin/tags': 'admin-tag', '/admin/tag-groups': 'admin-tag', '/admin/tag-management-new/list': 'admin-tag',
         // 测试
         '/newfbx-visactor': 'test'
       };

       // 1. 精确匹配
       if (pathMap[path]) return pathMap[path];

       // 2. 前缀匹配 (查找最长匹配的前缀)
       let bestMatchKey = null;
       let longestPrefix = 0;
       for (const prefix in pathMap) {
         if (path.startsWith(prefix) && prefix.length > longestPrefix) {
           longestPrefix = prefix.length;
           bestMatchKey = pathMap[prefix];
         }
       }
       if (bestMatchKey) return bestMatchKey;
       
       // 3. 特殊处理父菜单自身的路径 (如果路由配置允许)
       const hierarchy = this.getMenuHierarchy();
       for (const key in hierarchy) {
           // 假设父菜单的路径是 /parent-key 或类似形式
           if (path === `/${key}`) { // 需要根据实际路由调整
               return key;
           }
           // 更复杂的父路径匹配逻辑...
       }

       return null; // 未找到
     },
     // 定义菜单层级关系 { 子Key: 父Key, ... } null表示顶级
     getMenuHierarchy() {
       return {
         // 一级 (父为null)
         'overseas': null,
         'lastmile': null,
         'supplier-appointment': null, // 基础资料
         'inventory': null, // 车辆派送
         'supplier-mobile-app': null,
         'work-order': null,
         'messages': null,
         'supplier': null,
         'admin': null,
         'test': null,
         // 二级
         'load-appointment': 'inventory', // 提货预约 父: 车辆派送
         'internal-message': 'messages', // 站内信管理 父: 消息中心
         'email-management': 'messages', // 邮件管理 父: 消息中心
         'supplier-order': 'supplier', // 订单管理 父: 供应商门户
         'supplier-quote': 'supplier', // 报价管理 父: 供应商门户
         'supplier-rating': 'supplier', // 评分管理 父: 供应商门户
         'admin-contract': 'admin', // 合同管理 父: 后台管理
         'admin-tag': 'admin', // 标签管理 父: 后台管理
         // 三级 (如果需要)
         // 'child-of-load-appointment': 'load-appointment', 
       };
     }
  },
  created() {
    this.activeMenu = this.$route.path
    // 初始化时根据当前路由展开父菜单
    this.updateExpandedMenus(this.$route.path);
  },
  watch: {
    // 监听路由变化，更新激活菜单和展开状态
    $route(to) {
      this.activeMenu = to.path;
      this.updateExpandedMenus(to.path);
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
}

/* 顶部导航样式 */
.header {
  height: 64px;
  background-color: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 10;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-img {
  height: 32px;
  margin-right: 10px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #001529;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
}

.username {
  font-size: 14px;
  color: #5a5a5a;
  margin-right: 4px;
}

/* 确保消息通知组件正确显示 */
.header-right .message-notification {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

/* 主容器样式 */
.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar {
  width: 220px;
  background-color: #f5f5f5;
  transition: width 0.3s;
  position: relative;
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.08);
  z-index: 9;
  overflow-y: auto;
}

.sidebar.collapsed {
  width: 64px;
}

/* 自定义菜单样式 */
.custom-menu {
  padding: 8px 0;
}

.menu-item {
  height: 50px;
  line-height: 50px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.menu-item:hover {
  background-color: #e6e6e6;
}

.menu-item.active {
  background-color: #e6f7ff;
}

.menu-item.highlight {
  color: #ff6600;
}

.menu-icon {
  font-size: 18px;
  margin-right: 10px;
}

.menu-title {
  flex: 1;
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-item.highlight .menu-title {
  color: #ff6600;
}

.menu-arrow {
  font-size: 12px;
  transition: transform 0.3s;
}

.menu-arrow.is-open {
  transform: rotate(180deg);
}

.has-children {
  position: relative;
}

.submenu {
  background-color: #e9e9e9;
  overflow: hidden;
  transition: all 0.3s ease;
}

.submenu-item {
  height: 40px;
  line-height: 40px;
  padding: 0 20px 0 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.submenu-item:hover {
  background-color: #d9d9d9;
}

.submenu-item.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

.submenu-title {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.submenu-arrow {
  font-size: 12px;
  transition: transform 0.3s;
}

.submenu-arrow.is-open {
  transform: rotate(180deg);
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f0f2f5;
}

.breadcrumb {
  height: 40px;
  padding: 0 20px;
  background-color: #fff;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.content-wrapper {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.submenu-level-2 {
  background-color: #f5f5f5;
}

.submenu-level-2 .submenu-item {
  padding-left: 60px;
}

.submenu-level-2 .submenu-title {
  font-size: 13px;
  color: #666;
}

/* 确保所有层级的父菜单项都有箭头 */
.submenu-item > .menu-arrow {
  font-size: 12px;
  transition: transform 0.3s;
  margin-left: auto; /* 将箭头推到右侧 */
  padding-left: 5px; /* 箭头和文字间距 */
}

.submenu-item > .menu-arrow.is-open {
  transform: rotate(180deg);
}

/* 给包含子菜单的 submenu-item 添加 data-has-children 属性和指针样式 */
.submenu-item[data-has-children="true"] {
  cursor: pointer; 
}

/* 如果父菜单项本身就是 menu-item (例如后台管理下的合同管理)，也应用箭头样式 */
/* .menu-item > .menu-arrow { ... } */ /* 这部分样式由下面的 .menu-arrow-icon 统一处理 */

/* 新增：使用 CSS border 创建箭头 */
.menu-arrow-icon {
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: auto; /* 保持在右侧 */
  vertical-align: middle;
  border-top: 5px solid #666; /* 箭头颜色和大小 */
  border-right: 5px solid transparent;
  border-left: 5px solid transparent;
  transition: transform 0.3s ease-in-out;
  transform-origin: center; /* 确保围绕中心旋转 */
}

/* .menu-item 和 .submenu-item 内的箭头通用样式 */
.menu-item .menu-arrow-icon,
.submenu-item .menu-arrow-icon {
   margin-left: auto; 
   padding-left: 5px; 
}


/* 展开状态：箭头向上旋转 */
.menu-arrow-icon.is-open {
  transform: rotate(-180deg);
}

/* 移除旧的旋转逻辑 (如果还存在) */
/* 
.menu-item > .menu-arrow.is-open,
.submenu-item > .menu-arrow.is-open {
  transform: rotate(180deg); 
} 
*/

</style> 