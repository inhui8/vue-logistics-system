<template>
  <div class="work-order-list-container">
    <div class="page-header">
      <h2 class="page-title">异常工单</h2>
      <div class="page-actions">
        <el-button type="primary" @click="createWorkOrder">提交异常反馈</el-button>
         <!-- 这里创建的工单类型应默认为 'exception' -->
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card shadow="never" class="filter-card">
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索异常工单 (工单号、主题、订单号...)"
          class="search-input"
          @keyup.enter="handleSearch">
          <template #append>
            <el-button :icon="Search" @click="handleSearch"></el-button>
          </template>
        </el-input>
      </div>

      <div class="filter-section">
        <el-form :inline="true" :model="filters" size="small">
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="按状态筛选" clearable>
              <el-option label="待处理" value="pending"></el-option>
              <el-option label="处理中" value="processing"></el-option>
              <el-option label="待确认" value="pending_confirmation"></el-option>
              <el-option label="已解决" value="resolved"></el-option>
              <el-option label="已关闭" value="closed"></el-option>
            </el-select>
          </el-form-item>
           <!-- 类型筛选已移除，固定为 'exception' -->
           <el-form-item label="异常类型">
                <el-select v-model="filters.exceptionType" placeholder="按异常类型筛选" clearable>
                   <el-option label="缺货" value="out_of_stock"></el-option>
                   <el-option label="地址错误" value="address_error"></el-option>
                   <el-option label="支付问题" value="payment_issue"></el-option>
                   <el-option label="客户投诉" value="customer_complaint"></el-option>
                   <el-option label="系统错误" value="system_error"></el-option>
                   <!-- 可以添加更多类型 -->
               </el-select>
           </el-form-item>
          <el-form-item label="优先级">
            <el-select v-model="filters.priority" placeholder="按优先级筛选" clearable>
              <el-option label="紧急" value="urgent"></el-option>
              <el-option label="高" value="high"></el-option>
              <el-option label="中" value="medium"></el-option>
              <el-option label="低" value="low"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="处理人">
            <el-select v-model="filters.assignee" placeholder="按处理人筛选" clearable filterable>
              <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="filters.createdAtRange"
              type="daterange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              range-separator="至"
              value-format="YYYY-MM-DD">
            </el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 视图选择选项卡 -->
    <div class="view-management">
      <el-radio-group v-model="currentView" size="small" class="status-view-group">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="pending">待处理</el-radio-button>
        <el-radio-button value="processing">处理中</el-radio-button>
        <el-radio-button value="pending_confirmation">待确认</el-radio-button>
        <el-radio-button value="resolved">已解决</el-radio-button>
        <el-radio-button value="closed">已关闭</el-radio-button>
        <!-- 动态添加自定义视图 -->
        <el-radio-button 
          v-for="view in customViews" 
          :key="view.id" 
          :label="view.id"
          @contextmenu.prevent="handleContextMenu($event)"
        >
          {{view.name}}
        </el-radio-button>
      </el-radio-group>
      
      <el-button type="text" size="small" @click="handleSaveView">新增视图</el-button>
      <el-button type="text" size="small" @click="showGroupModal">高级分组</el-button>
      <el-button type="text" size="small" @click="showSortModal">高级排序</el-button>
      <el-button type="text" size="small" @click="showFilterPanel">筛选</el-button>
      <el-button type="text" size="small" @click="showColumnSettings">字段配置</el-button>
    </div>

    <!-- 工单列表 -->
    <el-card shadow="never" class="list-card">
       <div class="table-operations" v-if="selectedRows.length > 0">
         <span class="selected-count">已选择 {{ selectedRows.length }} 项</span>
         <el-button size="small" @click="batchProcess">批量处理</el-button>
         <el-button size="small" @click="clearSelection">清除选择</el-button>
       </div>

      <groupable-table
        ref="mainTable"
        :data="workOrderList"
        row-key="id"
        :group-fields="groupField ? [groupField] : []"
        :show-selection="true"
        :show-group-column="!!groupField"
        :group-column-label="groupField ? getGroupColumnLabel(groupField) : '分组'"
        :default-expand-all="false"
        :show-pagination="true"
        :current-page="pagination.current"
        :page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        @cell-click="handleCellClick"
        @cell-dblclick="handleCellDbClick"
        style="width: 100%"
      >
        <!-- 表格列配置 -->
        <el-table-column 
          v-for="col in visibleColumns" 
          :key="col.prop"
          :label="col.label"
          :prop="col.prop"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
        >
          <template #default="scope" v-if="col.prop === 'id'">
            <el-link type="primary" @click="viewWorkOrder(scope.row.id)">{{ scope.row.id }}</el-link>
          </template>
          <template #default="scope" v-else-if="col.prop === 'subject'">
            <div class="subject-cell">
              <span class="subject-text">{{ scope.row.subject }}</span>
              <el-tag v-if="scope.row.priority === 'urgent'" type="danger" size="small" effect="dark">紧急</el-tag>
            </div>
          </template>
          <template #default="scope" v-else-if="col.prop === 'type'">
            {{ getTypeText(scope.row.type) }}
          </template>
          <template #default="scope" v-else-if="col.prop === 'status'">
            <el-tag :type="getStatusType(scope.row.status)" size="small">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
          <template #default="scope" v-else-if="col.prop === 'priority'">
            <el-tag :type="getPriorityType(scope.row.priority)" size="small">
              {{ getPriorityText(scope.row.priority) }}
            </el-tag>
          </template>
          <template #default="scope" v-else-if="col.prop === 'orderNo'">
            <el-link v-if="scope.row.orderNo" type="info" @click="viewOrder(scope.row.orderNo)">
              {{ scope.row.orderNo }}
            </el-link>
            <span v-else>-</span>
          </template>
          <template #default="scope" v-else-if="col.prop === 'remarks'">
            {{ scope.row.remarks }}
          </template>
          <template #default="scope" v-else-if="col.prop === 'assignee'">
            {{ scope.row.assignee || '未指派' }}
          </template>
          <template #default="scope" v-else-if="col.prop === 'createdAt' || col.prop === 'updatedAt'">
            {{ formatDateTime(scope.row[col.prop]) }}
          </template>
          <template #default="scope" v-else-if="col.prop === 'operation'">
            <el-button link type="primary" @click="viewWorkOrder(scope.row.id)">查看</el-button>
            <el-button link type="primary" v-if="canProcess(scope.row)" @click="processWorkOrder(scope.row)">处理</el-button>
          </template>
        </el-table-column>
      </groupable-table>
    </el-card>

    <!-- 筛选面板 -->
    <filter-panel
      v-model:visible="filterPanelVisible"
      :columns="tableColumns"
      :existing-filters="activeFilters"
      :existing-logic="filterLogic"
      @apply-filters="applyFilters"
      @cancel="cancelFilters"
    />

    <!-- 保存视图对话框 -->
    <el-dialog
      title="保存视图"
      v-model="saveViewDialogVisible"
      width="500px"
    >
      <el-form :model="viewForm" label-width="100px">
        <el-form-item label="视图名称" required>
          <el-input v-model="viewForm.name" placeholder="请输入视图名称"></el-input>
        </el-form-item>
        <el-form-item label="显示字段">
          <el-checkbox-group v-model="viewForm.columns">
            <el-checkbox 
              v-for="col in tableColumns" 
              :key="col.prop" 
              :label="col.prop"
            >
              {{col.label}}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveViewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveView">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分组设置弹窗 -->
    <el-dialog
      title="分组设置"
      v-model="groupModalVisible"
      width="500px"
    >
      <div class="group-settings">
        <div class="group-level">
          <span class="group-level-label">一级分组：</span>
          <el-select v-model="groupSettings.level1" placeholder="选择字段" style="width: 280px;" clearable>
            <el-option v-for="field in groupableFields" :key="field.prop" :label="field.label" :value="field.prop"></el-option>
          </el-select>
        </div>
        <div class="group-level">
          <span class="group-level-label">二级分组：</span>
          <el-select v-model="groupSettings.level2" placeholder="选择字段" style="width: 280px;" clearable>
            <el-option v-for="field in groupableFields" :key="field.prop" :label="field.label" :value="field.prop"></el-option>
          </el-select>
        </div>
        <div class="group-level">
          <span class="group-level-label">三级分组：</span>
          <el-select v-model="groupSettings.level3" placeholder="选择字段" style="width: 280px;" clearable>
            <el-option v-for="field in groupableFields" :key="field.prop" :label="field.label" :value="field.prop"></el-option>
          </el-select>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="groupModalVisible = false">取消</el-button>
          <el-button type="danger" @click="clearGroupSettings">清除分组</el-button>
          <el-button type="primary" @click="applyGroupSettings">应用</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 排序设置弹窗 -->
    <el-dialog
      title="排序设置"
      v-model="sortModalVisible"
      width="500px"
    >
      <div class="sort-settings">
        <div v-for="(sort, index) in sortSettings" :key="index" class="sort-item">
          <el-select v-model="sort.field" placeholder="选择字段" style="width: 200px;" clearable>
            <el-option 
              v-for="field in sortableFields" 
              :key="field.prop" 
              :label="field.label" 
              :value="field.prop"
            ></el-option>
          </el-select>
          <el-select v-model="sort.direction" placeholder="排序方向" style="width: 120px;">
            <el-option label="升序" value="asc"></el-option>
            <el-option label="降序" value="desc"></el-option>
          </el-select>
          <el-button 
            type="danger" 
            size="small"
            @click="removeSortField(index)"
          >删除</el-button>
        </div>
        <div class="sort-actions">
          <el-button type="primary" plain @click="addSortField">添加排序字段</el-button>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="sortModalVisible = false">取消</el-button>
          <el-button type="danger" @click="clearSortSettings">清除排序</el-button>
          <el-button type="primary" @click="applySortSettings">应用</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 字段配置对话框 -->
    <el-dialog
      title="字段配置"
      v-model="columnSettingsVisible"
      width="600px"
    >
      <div class="column-settings">
        <div class="column-settings-header">
          <el-checkbox
            v-model="allColumnsSelected"
            @change="handleSelectAllColumns"
          >全选</el-checkbox>
          <el-button type="primary" size="small" @click="resetColumnSettings">重置</el-button>
        </div>
        <div class="column-list">
          <draggable
            v-model="columnSettingsList"
            item-key="prop"
            handle=".drag-handle"
            @end="handleDragEnd"
          >
            <template #item="{ element }">
              <div class="column-item">
                <el-icon class="drag-handle"><d-arrow-left /></el-icon>
                <el-checkbox v-model="element.visible">{{ element.label }}</el-checkbox>
              </div>
            </template>
          </draggable>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="columnSettingsVisible = false">取消</el-button>
          <el-button type="primary" @click="applyColumnSettings">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 右键菜单 -->
    <div 
      v-show="contextMenuVisible" 
      class="context-menu" 
      :style="{left: contextMenuX + 'px', top: contextMenuY + 'px'}"
    >
      <div class="context-menu-item" @click="handleCopyView">
        <span>复制视图</span>
      </div>
      <div class="context-menu-item" @click="handleRenameView">
        <span>重命名</span>
      </div>
      <div class="context-menu-item" @click="handleDeleteView">
        <span>删除</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Search, DArrowLeft } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import FilterPanel from '@/components/logistics/FilterPanel.vue';
import GroupableTable from '@/components/logistics/GroupableTable.vue';
import draggable from 'vuedraggable';

const router = useRouter();

const users = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '客服团队' },
  { id: 5, name: '财务' } // Added for example
]);

const loading = ref(false);
const searchQuery = ref('');

const filters = reactive({
  status: '',
  type: 'exception', // 固定类型
  exceptionType: '', // 新增异常类型筛选
  priority: '',
  assignee: null,
  createdAtRange: [],
});

// 列表数据 (仅包含异常工单示例)
const workOrderList = ref([
   {
    id: 'WO202307250001',
    subject: '客户反馈订单延迟问题',
    type: 'exception',
    status: 'pending',
    priority: 'high',
    exceptionType: '客户投诉', // 异常类型
    orderNo: 'ORD202307250123',
    creator: '张三',
    assignee: '李四',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    remarks: '客户要求尽快处理，已电话沟通。' // 新增备注字段
  },
  {
    id: 'WO202307250005',
    subject: '支付异常退款处理',
    type: 'exception',
    status: 'closed',
    priority: 'high',
    exceptionType: '支付问题', // 异常类型
    orderNo: 'ORD202307250126',
    creator: '李四',
    assignee: '财务',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    remarks: '退款已完成，请财务核对。' // 新增备注字段
  },
  {
    id: 'WO202307250007',
    subject: '入库单商品数量不符',
    type: 'exception',
    status: 'processing',
    priority: 'medium',
    exceptionType: '系统错误', // 假设是系统错误，或定义更具体的类型如"入库差异"
    orderNo: 'INB20230725005', // 关联入库单号
    creator: '仓库管理员',
    assignee: '客服团队',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    remarks: '差异数量：-2，需核实库存。' // 新增备注字段
  }
]);

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const selectedRows = ref([]);

// --- 辅助函数 --- (与之前相同)
const formatDateTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待处理',
    'processing': '处理中',
    'pending_confirmation': '待确认',
    'resolved': '已解决',
    'closed': '已关闭'
  };
  return statusMap[status] || status;
};

const getStatusType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'processing': 'primary',
    'pending_confirmation': 'info',
    'resolved': 'success',
    'closed': 'info'
  };
  return typeMap[status] || 'info';
};

const getTypeText = (type) => {
  const typeMap = {
    'exception': '异常订单处理',
    'command': '指令执行',
    'warning': '订单预警响应',
    'value_added': '增值服务请求',
    'other': '其他问题'
  };
  return typeMap[type] || type;
};

const getPriorityText = (priority) => {
  const priorityMap = {
    'urgent': '紧急',
    'high': '高',
    'medium': '中',
    'low': '低'
  };
  return priorityMap[priority] || priority;
};

const getPriorityType = (priority) => {
  const typeMap = {
    'urgent': 'danger',
    'high': 'warning',
    'medium': 'info',
    'low': 'success'
  };
  return typeMap[priority] || 'info';
};

// 判断是否可处理
const canProcess = (workOrder) => {
  return ['pending', 'processing'].includes(workOrder.status);
};

// --- 事件处理函数 ---
const handleSearch = () => {
  pagination.current = 1;
  fetchWorkOrders();
};

const resetFilters = () => {
  filters.status = '';
  filters.exceptionType = ''; // 重置异常类型
  filters.priority = '';
  filters.assignee = null;
  filters.createdAtRange = [];
  searchQuery.value = '';
  handleSearch();
};

const handleSelectionChange = (selection) => {
  selectedRows.value = selection;
};

const clearSelection = () => {
  selectedRows.value = [];
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  fetchWorkOrders();
};

const handleCurrentChange = (page) => {
  pagination.current = page;
  fetchWorkOrders();
};

// --- 操作函数 ---
const createWorkOrder = () => {
  router.push({ path: '/work-order/create', query: { defaultType: 'exception' } });
};

const viewWorkOrder = (id) => {
  router.push(`/work-order/detail/${id}`);
};

const viewOrder = (orderNo) => {
  // 根据 orderNo 的前缀或其他特征判断跳转到哪个订单详情页
  // 例如：if (orderNo.startsWith('ORD')) router.push(...); else if (orderNo.startsWith('INB')) router.push(...);
  console.log("Navigate to order detail for:", orderNo);
  // 假设有一个通用的订单详情页或根据类型跳转
  // router.push(`/order/detail/${orderNo}`);
  ElMessage.info(`跳转到订单 ${orderNo} 的详情页 (功能待实现)`);
};

const processWorkOrder = (workOrder) => {
  // 与 CommandWorkOrderList 相同逻辑
  ElMessageBox.confirm(`确认开始处理工单 "${workOrder.subject}"?`, '操作确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    const index = workOrderList.value.findIndex(item => item.id === workOrder.id);
    if (index !== -1) {
      workOrderList.value[index].status = 'processing';
      workOrderList.value[index].updatedAt = new Date();
    }
    ElMessage.success('工单状态已更新为：处理中');
    router.push(`/work-order/detail/${workOrder.id}`);
  }).catch(() => {});
};

const batchProcess = () => {
  // 与 CommandWorkOrderList 相同逻辑
   if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择工单');
    return;
  }
  const canProcessIds = selectedRows.value.filter(row => canProcess(row)).map(row => row.id);
  if (canProcessIds.length === 0) {
    ElMessage.warning('所选工单中没有可处理的工单');
    return;
  }
  ElMessageBox.confirm(`确认批量处理 ${canProcessIds.length} 个工单?`, '操作确认', { /* ... */ }).then(() => {
    canProcessIds.forEach(id => {
      const index = workOrderList.value.findIndex(item => item.id === id);
      if (index !== -1) {
        workOrderList.value[index].status = 'processing';
        workOrderList.value[index].updatedAt = new Date();
      }
    });
    ElMessage.success(`已开始处理 ${canProcessIds.length} 个工单`);
    clearSelection();
    fetchWorkOrders();
  }).catch(() => {});
};

// 获取工单列表数据
const fetchWorkOrders = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      search: searchQuery.value,
      type: filters.type, // 固定为 exception
      status: filters.status,
      exceptionType: filters.exceptionType, // 添加异常类型参数
      priority: filters.priority,
      assigneeId: filters.assignee,
      createdAtStart: filters.createdAtRange ? filters.createdAtRange[0] : null,
      createdAtEnd: filters.createdAtRange ? filters.createdAtRange[1] : null,
    };
    console.log("Fetching Exception Work Orders with params:", params);
    // const res = await api.getWorkOrders(params);
    // workOrderList.value = res.data.records;
    // pagination.total = res.data.total;

    // 模拟API请求延迟和过滤
    setTimeout(() => {
        let filteredData = [...workOrderList.value]; // Start with full mock data for demo

        // Apply filters (client-side simulation for demo)
        if (params.search) { /* ... search logic ... */ }
        if (params.status) { /* ... status filter ... */ }
        if (params.exceptionType) { // Filter by exception type
             filteredData = filteredData.filter(wo => wo.exceptionType === params.exceptionType);
        }
        if (params.priority) { /* ... priority filter ... */ }
        if (params.assigneeId) { /* ... assignee filter ... */ }
        // createdAtRange filter simulation
        // ...

        // Apply pagination (simulation)
        const start = (params.page - 1) * params.pageSize;
        const end = start + params.pageSize;
        const paginatedData = filteredData.slice(start, end);

        workOrderList.value = paginatedData;
        pagination.total = filteredData.length;
        loading.value = false;
    }, 500);
  } catch (error) {
    console.error('Failed to fetch exception work orders:', error);
    ElMessage.error('获取异常工单列表失败');
    loading.value = false;
  }
};

// 视图管理相关
const currentView = ref('all');
const customViews = ref([]);
const saveViewDialogVisible = ref(false);
const renameViewDialogVisible = ref(false);
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const viewForm = ref({
  name: '',
  columns: []
});

// 筛选相关
const filterPanelVisible = ref(false);
const activeFilters = ref([]);
const filterLogic = ref('and');

// 分组相关
const groupModalVisible = ref(false);
const groupSettings = ref({
  level1: '',
  level2: '',
  level3: ''
});
const groupField = ref('');

// 排序相关
const sortModalVisible = ref(false);
const sortSettings = ref([
  { field: '', direction: 'asc' }
]);

// 字段配置相关
const columnSettingsVisible = ref(false);
const columnSettingsList = ref([]);
const allColumnsSelected = ref(true);

// 表格列配置
const tableColumns = ref([
  { prop: 'id', label: '工单号', width: 150, visible: true },
  { prop: 'subject', label: '主题', minWidth: 200, visible: true },
  { prop: 'type', label: '类型', width: 120, visible: true },
  { prop: 'status', label: '状态', width: 100, visible: true },
  { prop: 'priority', label: '优先级', width: 80, visible: true },
  { prop: 'exceptionType', label: '异常类型', width: 120, visible: true },
  { prop: 'orderNo', label: '关联订单', width: 150, visible: true },
  { prop: 'remarks', label: '备注', minWidth: 150, visible: true },
  { prop: 'creator', label: '创建人', width: 100, visible: true },
  { prop: 'assignee', label: '当前处理人', width: 100, visible: true },
  { prop: 'createdAt', label: '创建时间', width: 180, visible: true },
  { prop: 'updatedAt', label: '更新时间', width: 180, visible: true },
  { prop: 'operation', label: '操作', width: 150, fixed: 'right', visible: true }
]);

// 可分组字段
const groupableFields = ref([
  { prop: 'status', label: '状态' },
  { prop: 'priority', label: '优先级' },
  { prop: 'exceptionType', label: '异常类型' },
  { prop: 'creator', label: '创建人' },
  { prop: 'assignee', label: '处理人' },
  // { prop: 'remarks', label: '备注' } // 备注通常不适合分组，如有需要可取消注释
]);

// 可排序字段
const sortableFields = ref([
  { prop: 'createdAt', label: '创建时间' },
  { prop: 'updatedAt', label: '更新时间' },
  { prop: 'priority', label: '优先级' },
  { prop: 'status', label: '状态' },
  // { prop: 'remarks', label: '备注' } // 备注通常不适合排序，如有需要可取消注释
]);

// 计算可见列
const visibleColumns = computed(() => {
  return tableColumns.value.filter(col => col.visible);
});

// 获取分组列标签
const getGroupColumnLabel = (field) => {
  const fieldConfig = groupableFields.value.find(f => f.prop === field);
  return fieldConfig ? fieldConfig.label : field;
};

// 视图管理方法
const handleSaveView = () => {
  saveViewDialogVisible.value = true;
};

const saveView = () => {
  if (!viewForm.value.name) {
    ElMessage.warning('请输入视图名称');
    return;
  }
  
  const newView = {
    id: Date.now().toString(),
    name: viewForm.value.name,
    columns: viewForm.value.columns,
    filters: activeFilters.value,
    groupSettings: groupSettings.value,
    sortSettings: sortSettings.value
  };
  
  customViews.value.push(newView);
  saveViewDialogVisible.value = false;
  ElMessage.success('视图保存成功');
};

const handleRenameView = () => {
  if (!currentView.value) return;
  renameViewDialogVisible.value = true;
};

const handleDeleteView = () => {
  if (!currentView.value) return;
  
  ElMessageBox.confirm('确认删除该视图？', '提示', {
    type: 'warning'
  }).then(() => {
    const index = customViews.value.findIndex(v => v.id === currentView.value);
    if (index !== -1) {
      customViews.value.splice(index, 1);
      currentView.value = 'all';
      ElMessage.success('视图删除成功');
    }
  });
};

// 筛选相关方法
const showFilterPanel = () => {
  filterPanelVisible.value = true;
};

const applyFilters = ({ filters, logic }) => {
  activeFilters.value = filters;
  filterLogic.value = logic;
  fetchWorkOrders();
};

const cancelFilters = () => {
  filterPanelVisible.value = false;
};

// 分组相关方法
const showGroupModal = () => {
  groupModalVisible.value = true;
};

const applyGroupSettings = () => {
  const { level1, level2, level3 } = groupSettings.value;
  const groupFields = [level1, level2, level3].filter(Boolean);
  groupField.value = groupFields[0] || '';
  fetchWorkOrders();
  groupModalVisible.value = false;
};

const clearGroupSettings = () => {
  groupSettings.value = {
    level1: '',
    level2: '',
    level3: ''
  };
  groupField.value = '';
  fetchWorkOrders();
};

// 排序相关方法
const showSortModal = () => {
  sortModalVisible.value = true;
};

const addSortField = () => {
  sortSettings.value.push({ field: '', direction: 'asc' });
};

const removeSortField = (index) => {
  sortSettings.value.splice(index, 1);
};

const applySortSettings = () => {
  fetchWorkOrders();
  sortModalVisible.value = false;
};

const clearSortSettings = () => {
  sortSettings.value = [{ field: '', direction: 'asc' }];
  fetchWorkOrders();
};

// 字段配置相关方法
const showColumnSettings = () => {
  columnSettingsVisible.value = true;
};

const handleSelectAllColumns = (val) => {
  columnSettingsList.value.forEach(col => {
    col.visible = val;
  });
};

const handleDragEnd = () => {
  // 处理拖拽结束后的逻辑
};

const applyColumnSettings = () => {
  tableColumns.value = columnSettingsList.value.map(col => ({
    ...col,
    visible: col.visible
  }));
  columnSettingsVisible.value = false;
  ElMessage.success('字段配置已更新');
};

const resetColumnSettings = () => {
  initColumnSettings();
  allColumnsSelected.value = true;
};

// 初始化字段配置列表
const initColumnSettings = () => {
  columnSettingsList.value = tableColumns.value.map(col => ({
    ...col,
    visible: true // 确保新加的列默认可见
  }));
};

// 处理右键菜单
const handleContextMenu = (event) => {
  event.preventDefault();
  contextMenuVisible.value = true;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
};

// 复制视图
const handleCopyView = () => {
  if (!currentView.value) return;
  
  const view = customViews.value.find(v => v.id === currentView.value);
  if (view) {
    const newView = {
      id: Date.now().toString(),
      name: `${view.name} (副本)`,
      columns: [...view.columns],
      filters: [...view.filters],
      groupSettings: { ...view.groupSettings },
      sortSettings: [...view.sortSettings]
    };
    
    customViews.value.push(newView);
    contextMenuVisible.value = false;
    ElMessage.success('视图复制成功');
  }
};

// 在组件挂载时初始化
onMounted(() => {
  initColumnSettings();
  fetchWorkOrders();
});

</script>

<style scoped>
/* 原有样式保持不变 */
.work-order-list-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: bold;
}

.filter-card {
  margin-bottom: 20px;
}

.search-bar {
  margin-bottom: 15px;
}

.search-input {
  width: 100%;
  max-width: 500px;
}

.list-card {
  margin-bottom: 20px;
}

.table-operations {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.selected-count {
  margin-right: 16px;
  color: #606266;
}

.subject-cell {
  display: flex;
  align-items: center;
}

.subject-text {
  margin-right: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 新增样式 */
.view-management {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-view-group {
  margin-right: 16px;
}

.group-settings {
  padding: 20px;
}

.group-level {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.group-level-label {
  width: 100px;
  text-align: right;
  margin-right: 16px;
}

.sort-settings {
  padding: 20px;
}

.sort-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.sort-actions {
  margin-top: 16px;
  text-align: center;
}

.column-settings {
  padding: 20px;
}

.column-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.column-list {
  max-height: 400px;
  overflow-y: auto;
}

.column-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #EBEEF5;
}

.column-item:last-child {
  border-bottom: none;
}

.drag-handle {
  cursor: move;
  margin-right: 8px;
  color: #909399;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  z-index: 3000;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  color: #606266;
}

.context-menu-item:hover {
  background-color: #F5F7FA;
  color: #409EFF;
}

/* 分组样式 */
.group-name {
  display: flex;
  align-items: center;
  font-weight: bold;
}

.group-level-1 {
  color: #409EFF;
  font-size: 14px;
}

.group-level-2 {
  color: #67C23A;
  font-size: 13px;
}

.group-level-3 {
  color: #E6A23C;
  font-size: 13px;
}

.group-title {
  margin-right: 5px;
}

.group-count {
  color: #909399;
  font-size: 12px;
}

.data-item {
  background-color: #FAFAFA;
}
</style> 