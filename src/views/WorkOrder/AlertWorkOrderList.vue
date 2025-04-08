<template>
  <div class="work-order-list-container">
    <div class="page-header">
      <h2 class="page-title">订单预警</h2>
      <div class="page-actions">
        <el-button type="primary" @click="createWorkOrder">创建预警工单</el-button>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card shadow="never" class="filter-card">
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索预警工单 (工单号、主题、订单号...)"
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
          <el-form-item label="预警类型">
            <el-select v-model="filters.alertType" placeholder="按预警类型筛选" clearable>
              <el-option label="库存预警" value="inventory"></el-option>
              <el-option label="时效预警" value="delivery_time"></el-option>
              <el-option label="异常预警" value="exception"></el-option>
              <el-option label="其他预警" value="other"></el-option>
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
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column label="工单号" prop="id" width="150">
          <template #default="scope">
            <el-link type="primary" @click="viewWorkOrder(scope.row.id)">{{ scope.row.id }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="主题" prop="subject" min-width="200">
          <template #default="scope">
            <div class="subject-cell">
              <span class="subject-text">{{ scope.row.subject }}</span>
              <el-tag v-if="scope.row.priority === 'urgent'" type="danger" size="small" effect="dark">紧急</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="预警类型" prop="alertType" width="120">
          <template #default="scope">
            {{ getAlertTypeText(scope.row.alertType) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" size="small">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优先级" prop="priority" width="80">
          <template #default="scope">
            <el-tag :type="getPriorityType(scope.row.priority)" size="small">
              {{ getPriorityText(scope.row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关联订单" prop="orderNo" width="150">
          <template #default="scope">
            <el-link v-if="scope.row.orderNo" type="info" @click="viewOrder(scope.row.orderNo)">
              {{ scope.row.orderNo }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建人" prop="creator" width="100"></el-table-column>
        <el-table-column label="当前处理人" prop="assignee" width="100">
          <template #default="scope">
            {{ scope.row.assignee || '未指派' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createdAt" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" prop="updatedAt" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import FilterPanel from '@/components/logistics/FilterPanel.vue';
import GroupableTable from '@/components/logistics/GroupableTable.vue';
import { DArrowLeft } from '@element-plus/icons-vue';
import draggable from 'vuedraggable';

// 路由相关
const router = useRouter();

// 视图管理相关
const currentView = ref('all');
// TODO: 后续实现自定义视图功能
// const customViews = ref([]);
const saveViewDialogVisible = ref(false);
// TODO: 后续实现视图重命名功能
// const renameViewDialogVisible = ref(false);
// TODO: 后续实现右键菜单功能
// const contextMenuVisible = ref(false);
// const contextMenuX = ref(0);
// const contextMenuY = ref(0);
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

// 获取用户
const users = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '客服团队' },
  { id: 4, name: '仓库管理员'}
]);

// 列表加载状态
const loading = ref(false);

// 搜索和筛选
const searchQuery = ref('');
const filters = reactive({
  status: '',
  type: 'warning', // 固定为预警工单类型
  alertType: '', // 新增预警类型筛选
  priority: '',
  assignee: null,
  createdAtRange: [],
});

// 列表数据 (预警工单示例)
const workOrderList = ref([
  {
    id: 'WO202307250001',
    subject: '库存不足预警',
    type: 'warning',
    alertType: 'inventory',
    status: 'pending',
    priority: 'urgent',
    orderNo: 'ORD202307250001',
    creator: '系统',
    assignee: '仓库管理员',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: 'WO202307250002',
    subject: '配送超时预警',
    type: 'warning',
    alertType: 'delivery_time',
    status: 'processing',
    priority: 'high',
    orderNo: 'ORD202307250002',
    creator: '系统',
    assignee: '物流团队',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
]);

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 表格选择
const selectedRows = ref([]);

// 表格列配置
const tableColumns = ref([
  { prop: 'id', label: '工单号', width: 150, visible: true },
  { prop: 'subject', label: '主题', minWidth: 200, visible: true },
  { prop: 'alertType', label: '预警类型', width: 120, visible: true },
  { prop: 'status', label: '状态', width: 100, visible: true },
  { prop: 'priority', label: '优先级', width: 80, visible: true },
  { prop: 'orderNo', label: '关联订单', width: 150, visible: true },
  { prop: 'creator', label: '创建人', width: 100, visible: true },
  { prop: 'assignee', label: '当前处理人', width: 100, visible: true },
  { prop: 'createdAt', label: '创建时间', width: 180, visible: true },
  { prop: 'updatedAt', label: '更新时间', width: 180, visible: true }
]);

// 可分组字段
const groupableFields = ref([
  { prop: 'status', label: '状态' },
  { prop: 'alertType', label: '预警类型' },
  { prop: 'priority', label: '优先级' },
  { prop: 'creator', label: '创建人' },
  { prop: 'assignee', label: '处理人' }
]);

// 可排序字段
const sortableFields = ref([
  { prop: 'createdAt', label: '创建时间' },
  { prop: 'updatedAt', label: '更新时间' },
  { prop: 'priority', label: '优先级' },
  { prop: 'status', label: '状态' }
]);

// 获取分组列标签
const getGroupColumnLabel = (field) => {
  const fieldConfig = groupableFields.value.find(f => f.prop === field);
  return fieldConfig ? fieldConfig.label : field;
};

// --- 辅助函数 ---
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

const getAlertTypeText = (alertType) => {
  const typeMap = {
    'inventory': '库存预警',
    'delivery_time': '时效预警',
    'exception': '异常预警',
    'other': '其他预警'
  };
  return typeMap[alertType] || alertType;
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
  filters.alertType = '';
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
  router.push({ path: '/work-order/create', query: { defaultType: 'warning' } });
};

const viewWorkOrder = (id) => {
  router.push(`/work-order/detail/${id}`);
};

const viewOrder = (orderNo) => {
  router.push(`/order/detail/${orderNo}`);
};

const processWorkOrder = (workOrder) => {
  ElMessageBox.confirm(`确认开始处理预警工单 "${workOrder.subject}"?`, '操作确认', {
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
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择工单');
    return;
  }

  const canProcessIds = selectedRows.value
    .filter(row => canProcess(row))
    .map(row => row.id);

  if (canProcessIds.length === 0) {
    ElMessage.warning('所选工单中没有可处理的工单');
    return;
  }

  ElMessageBox.confirm(`确认批量处理 ${canProcessIds.length} 个工单?`, '操作确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
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
      type: filters.type,
      alertType: filters.alertType,
      status: filters.status,
      priority: filters.priority,
      assigneeId: filters.assignee,
      createdAtStart: filters.createdAtRange ? filters.createdAtRange[0] : null,
      createdAtEnd: filters.createdAtRange ? filters.createdAtRange[1] : null,
    };
    console.log("Fetching Alert Work Orders with params:", params);
    
    // 模拟API请求延迟和过滤
    setTimeout(() => {
      let filteredData = [...workOrderList.value];
      
      if (params.search) {
        const lowerSearch = params.search.toLowerCase();
        filteredData = filteredData.filter(wo => 
          wo.id.toLowerCase().includes(lowerSearch) || 
          wo.subject.toLowerCase().includes(lowerSearch) ||
          (wo.orderNo && wo.orderNo.toLowerCase().includes(lowerSearch))
        );
      }
      if (params.status) {
        filteredData = filteredData.filter(wo => wo.status === params.status);
      }
      if (params.alertType) {
        filteredData = filteredData.filter(wo => wo.alertType === params.alertType);
      }
      if (params.priority) {
        filteredData = filteredData.filter(wo => wo.priority === params.priority);
      }
      if (params.assigneeId) {
        const assigneeName = users.value.find(u => u.id === params.assigneeId)?.name;
        if(assigneeName) {
          filteredData = filteredData.filter(wo => wo.assignee === assigneeName);
        }
      }

      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      const paginatedData = filteredData.slice(start, end);

      workOrderList.value = paginatedData;
      pagination.total = filteredData.length;
      loading.value = false;
    }, 500);
  } catch (error) {
    console.error('Failed to fetch alert work orders:', error);
    ElMessage.error('获取预警工单列表失败');
    loading.value = false;
  }
};

// 在组件挂载时获取工单列表
onMounted(() => {
  fetchWorkOrders();
});

// 事件处理函数
const handleCellClick = (row, column) => {
  // 处理单元格点击事件
  console.log('Cell clicked:', row, column);
};

const handleCellDbClick = (row, column) => {
  // 处理单元格双击事件
  console.log('Cell double clicked:', row, column);
};

const handleSaveView = () => {
  saveViewDialogVisible.value = true;
};

const showGroupModal = () => {
  groupModalVisible.value = true;
};

const showSortModal = () => {
  sortModalVisible.value = true;
};

const showFilterPanel = () => {
  filterPanelVisible.value = true;
};

const showColumnSettings = () => {
  columnSettingsVisible.value = true;
  columnSettingsList.value = [...tableColumns.value];
};

const handleSelectAllColumns = (val) => {
  columnSettingsList.value.forEach(col => col.visible = val);
};

const resetColumnSettings = () => {
  columnSettingsList.value = tableColumns.value.map(col => ({
    ...col,
    visible: true
  }));
  allColumnsSelected.value = true;
};

const handleDragEnd = () => {
  // 处理拖拽结束事件
  console.log('Drag ended, new order:', columnSettingsList.value);
};

const applyColumnSettings = () => {
  tableColumns.value = [...columnSettingsList.value];
  columnSettingsVisible.value = false;
};

const saveView = () => {
  if (!viewForm.value.name) {
    ElMessage.warning('请输入视图名称');
    return;
  }
  // TODO: 实现保存视图的逻辑
  console.log('Saving view:', viewForm.value);
  saveViewDialogVisible.value = false;
};

const clearGroupSettings = () => {
  groupSettings.value = {
    level1: '',
    level2: '',
    level3: ''
  };
  groupField.value = '';
};

const applyGroupSettings = () => {
  // 应用第一个非空的分组设置
  groupField.value = groupSettings.value.level1 || groupSettings.value.level2 || groupSettings.value.level3;
  groupModalVisible.value = false;
};

const addSortField = () => {
  sortSettings.value.push({ field: '', direction: 'asc' });
};

const removeSortField = (index) => {
  sortSettings.value.splice(index, 1);
};

const clearSortSettings = () => {
  sortSettings.value = [{ field: '', direction: 'asc' }];
};

const applySortSettings = () => {
  // TODO: 实现排序逻辑
  console.log('Applying sort settings:', sortSettings.value);
  sortModalVisible.value = false;
};

const applyFilters = (filters, logic) => {
  activeFilters.value = filters;
  filterLogic.value = logic;
  filterPanelVisible.value = false;
  fetchWorkOrders();
};

const cancelFilters = () => {
  filterPanelVisible.value = false;
};
</script>

<style scoped>
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
  font-size: 24px;
  color: #303133;
}

.filter-card {
  margin-bottom: 20px;
}

.search-bar {
  margin-bottom: 20px;
}

.search-input {
  width: 400px;
}

.filter-section {
  margin-top: 20px;
}

.view-management {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-view-group {
  margin-right: 20px;
}

.list-card {
  margin-bottom: 20px;
}

.table-operations {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.selected-count {
  color: #606266;
  margin-right: 10px;
}

.subject-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
  z-index: 3000;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
}

.context-menu-item:hover {
  background-color: #f5f7fa;
}

.group-settings {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.group-level {
  display: flex;
  align-items: center;
  gap: 10px;
}

.group-level-label {
  width: 100px;
  color: #606266;
}

.sort-settings {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sort-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-actions {
  margin-top: 10px;
}

.column-settings {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.column-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-list {
  max-height: 400px;
  overflow-y: auto;
}

.column-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.drag-handle {
  cursor: move;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
