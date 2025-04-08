/* eslint-disable */
<template>
  <div class="work-order-list-container">
    <div class="page-header">
      <h2 class="page-title">订单预警</h2>
      <div class="page-actions">
        <!-- 订单预警通常由系统自动触发，手动创建入口可能不需要或不同 -->
         <!-- <el-button type="primary" @click="createWorkOrder">创建预警工单</el-button> -->
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card shadow="never" class="filter-card">
      <div class="filter-container">
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="工单号">
            <el-input v-model="searchQuery" placeholder="请输入工单号" clearable>
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="按状态筛选" clearable>
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="待确认" value="pending_confirmation" />
              <el-option label="已解决" value="resolved" />
              <el-option label="已关闭" value="closed" />
            </el-select>
          </el-form-item>
          <el-form-item label="处理人">
            <el-select v-model="filters.assignee" placeholder="按处理人筛选" clearable filterable>
              <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="filters.createdAtRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 工单列表 -->
    <el-card shadow="never" class="list-card">
      <div class="table-operations" v-if="selectedRows.length > 0">
        <span class="selected-count">已选择 {{ selectedRows.length }} 项</span>
        <el-button size="small" @click="batchProcess">批量处理</el-button>
        <el-button size="small" @click="clearSelection">清除选择</el-button>
      </div>

      <div class="table-container">
        <groupable-table
          ref="mainTable"
          :data="displayData"
          row-key="id"
          :group-fields="groupField ? [groupField] : []"
          :show-selection="true"
          :show-group-column="!!groupField"
          :group-column-label="groupField ? getGroupColumnLabel(groupField) : '分组'"
          :default-expand-all="false"
          :show-pagination="true"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          @cell-click="handleCellClick"
          @cell-dblclick="handleCellDbClick"
          style="width: 100%"
        >
          <el-table-column 
            v-for="column in visibleColumns" 
            :key="column.prop" 
            :prop="column.prop" 
            :label="column.label" 
            :width="column.width"
            :sortable="column.sortable"
            :fixed="column.fixed"
          >
            <template #default="scope" v-if="column.prop === 'id'">
              <el-link type="primary" @click="viewWorkOrder(scope.row.id)">{{ scope.row.id }}</el-link>
            </template>
            <template #default="scope" v-else-if="column.prop === 'subject'">
              <div class="subject-cell">
                <span class="subject-text">{{ scope.row.subject }}</span>
                <el-tag v-if="isWorkOrderOverdue(scope.row)" type="danger" size="small" effect="light">超时</el-tag>
              </div>
            </template>
            <template #default="scope" v-else-if="column.prop === 'type'">
              {{ getTypeText(scope.row.type) }}
            </template>
            <template #default="scope" v-else-if="column.prop === 'status'">
              <el-tag :type="getStatusType(scope.row.status)" size="small">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
            <template #default="scope" v-else-if="column.prop === 'priority'">
              <el-tag :type="getPriorityType(scope.row.priority)" size="small">
                {{ getPriorityText(scope.row.priority) }}
              </el-tag>
            </template>
            <template #default="scope" v-else-if="column.prop === 'orderNo'">
              <el-link v-if="scope.row.orderNo" type="info" @click="viewOrder(scope.row.orderNo)">
                {{ scope.row.orderNo }}
              </el-link>
              <span v-else>-</span>
            </template>
            <template #default="scope" v-else-if="column.prop === 'createdAt'">
              {{ formatDateTime(scope.row.createdAt) }}
            </template>
            <template #default="scope" v-else-if="column.prop === 'expectedCompletionTime'">
              {{ formatDateTime(scope.row.expectedCompletionTime) }}
            </template>
            <template #default="scope" v-else-if="column.prop === 'operation'">
              <el-button link type="primary" @click="viewWorkOrder(scope.row.id)">查看</el-button>
              <el-button link type="primary" v-if="canProcess(scope.row)" @click="processWorkOrder(scope.row)">处理</el-button>
            </template>
          </el-table-column>
        </groupable-table>
      </div>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import FilterPanel from '@/components/logistics/FilterPanel.vue';
import GroupableTable from '@/components/logistics/GroupableTable.vue';
import { DArrowLeft } from '@element-plus/icons-vue';
import draggable from 'vuedraggable';

const router = useRouter();

const users = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '客服团队' },
  { id: 6, name: '运营专员' } // Added for example
]);

const loading = ref(false);
const searchQuery = ref('');

const filters = reactive({
  status: '',
  type: 'warning', // 固定类型
  warningSource: '', // 新增预警来源筛选
  isOverdue: null, // 新增是否超时筛选 (null: 全部, true: 超时, false: 未超时)
  priority: '',
  assignee: null,
  createdAtRange: [],
});

// 表格列配置
const tableColumns = ref([
  { prop: 'id', label: '工单号', width: '120', visible: true },
  { prop: 'subject', label: '主题', width: '200', visible: true },
  { prop: 'type', label: '类型', width: '120', visible: true },
  { prop: 'status', label: '状态', width: '100', visible: true },
  { prop: 'priority', label: '优先级', width: '100', visible: true },
  { prop: 'warningSource', label: '预警来源', width: '150', visible: true },
  { prop: 'orderNo', label: '订单号', width: '150', visible: true },
  { prop: 'creator', label: '创建人', width: '120', visible: true },
  { prop: 'assignee', label: '处理人', width: '120', visible: true },
  { prop: 'createdAt', label: '创建时间', width: '160', visible: true },
  { prop: 'expectedCompletionTime', label: '期望完成时间', width: '160', visible: true },
  { prop: 'operation', label: '操作', width: '150', fixed: 'right', visible: true }
]);

// 表格数据相关状态
const displayData = ref([]);
const totalItems = ref(0);

// 视图管理相关状态
const customViews = ref([]);
const viewForm = ref({
  name: '',
  columns: []
});
const saveViewDialogVisible = ref(false);

// 筛选相关状态
const filterPanelVisible = ref(false);
const activeFilters = ref([]);
const filterLogic = ref('and');
const groupField = ref('');

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const selectedRows = ref([]);

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

const getTypeText = (type) => {
  const typeMap = {
    'exception': '异常订单处理',
    'command': '指令执行',
    'warning': '订单预警响应'
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

// 判断工单是否超时
const isWorkOrderOverdue = (workOrder) => {
  // 仅对未完成的工单判断是否超时
  if (['resolved', 'closed'].includes(workOrder.status)) {
    return false;
  }
  if (!workOrder.expectedCompletionTime) {
    return false; // 没有期望完成时间，无法判断
  }
  return new Date() > new Date(workOrder.expectedCompletionTime);
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
  filters.warningSource = '';
  filters.isOverdue = null;
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
// const createWorkOrder = () => { ... } // 预警工单通常不需要手动创建按钮

const viewWorkOrder = (id) => {
  router.push(`/work-order/detail/${id}`);
};

const viewOrder = (orderNo) => {
  if (orderNo) {
    ElMessage.info(`跳转到订单 ${orderNo} 的详情页 (功能待实现)`);
    // router.push(`/order/detail/${orderNo}`);
  }
};

const processWorkOrder = (workOrder) => {
  // 与之前相同逻辑
  ElMessageBox.confirm(/* ... */).then(() => {
    /* ... */
    router.push(`/work-order/detail/${workOrder.id}`);
  }).catch(() => {});
};

const batchProcess = () => {
  // 与之前相同逻辑
  /* ... */
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
      status: filters.status,
      warningSource: filters.warningSource,
      isOverdue: filters.isOverdue,
      priority: filters.priority,
      assigneeId: filters.assignee,
      createdAtStart: filters.createdAtRange ? filters.createdAtRange[0] : null,
      createdAtEnd: filters.createdAtRange ? filters.createdAtRange[1] : null,
    };

    // 应用高级筛选
    if (activeFilters.value.length > 0) {
      let filteredData = [...workOrderList.value];
      
      if (filterLogic.value === 'and') {
        filteredData = filteredData.filter(item => {
          return activeFilters.value.every(filter => {
            const value = item[filter.field];
            if (!value) return false;
            
            switch (filter.operator) {
              case 'eq':
                return value === filter.value;
              case 'neq':
                return value !== filter.value;
              case 'contains':
                return value.toString().toLowerCase().includes(filter.value.toLowerCase());
              case 'notContains':
                return !value.toString().toLowerCase().includes(filter.value.toLowerCase());
              case 'startsWith':
                return value.toString().toLowerCase().startsWith(filter.value.toLowerCase());
              case 'endsWith':
                return value.toString().toLowerCase().endsWith(filter.value.toLowerCase());
              case 'gt':
                return value > filter.value;
              case 'gte':
                return value >= filter.value;
              case 'lt':
                return value < filter.value;
              case 'lte':
                return value <= filter.value;
              case 'in':
                return filter.value.includes(value);
              case 'notIn':
                return !filter.value.includes(value);
              default:
                return true;
            }
          });
        });
      } else {
        filteredData = filteredData.filter(item => {
          return activeFilters.value.some(filter => {
            const value = item[filter.field];
            if (!value) return false;
            
            switch (filter.operator) {
              case 'eq':
                return value === filter.value;
              case 'neq':
                return value !== filter.value;
              case 'contains':
                return value.toString().toLowerCase().includes(filter.value.toLowerCase());
              case 'notContains':
                return !value.toString().toLowerCase().includes(filter.value.toLowerCase());
              case 'startsWith':
                return value.toString().toLowerCase().startsWith(filter.value.toLowerCase());
              case 'endsWith':
                return value.toString().toLowerCase().endsWith(filter.value.toLowerCase());
              case 'gt':
                return value > filter.value;
              case 'gte':
                return value >= filter.value;
              case 'lt':
                return value < filter.value;
              case 'lte':
                return value <= filter.value;
              case 'in':
                return filter.value.includes(value);
              case 'notIn':
                return !filter.value.includes(value);
              default:
                return true;
            }
          });
        });
      }
      
      // 应用分组
      if (groupField.value) {
        displayData.value = groupData(filteredData, groupField.value);
      } else {
        displayData.value = filteredData;
      }
    } else {
      displayData.value = workOrderList.value;
    }
    
    totalItems.value = displayData.value.length;
    loading.value = false;
  } catch (error) {
    console.error('Failed to fetch alert work orders:', error);
    ElMessage.error('获取订单预警列表失败');
    loading.value = false;
  }
};

// 分组数据处理
const groupData = (data, field) => {
  const groups = {};
  
  data.forEach(item => {
    const value = item[field] || '未分类';
    if (!groups[value]) {
      groups[value] = [];
    }
    groups[value].push({...item});
  });
  
  const result = [];
  for (const [key, items] of Object.entries(groups)) {
    result.push({
      id: `group-${key}`,
      groupName: key,
      count: items.length,
      isGroup: true,
      groupLevel: 0,
      children: items
    });
  }
  
  return result;
};

onMounted(() => {
  loadSavedViews();
  fetchWorkOrders();
});

// 视图管理方法
const handleSaveView = () => {
  viewForm.value = {
    name: '',
    columns: tableColumns.value
      .filter(col => col.visible !== false)
      .map(col => col.prop)
  };
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
    filterLogic: filterLogic.value,
    groupField: groupField.value
  };
  
  customViews.value.push(newView);
  saveViewsToStorage();
  saveViewDialogVisible.value = false;
  ElMessage.success('视图保存成功');
};

const handleDeleteView = (viewId) => {
  ElMessageBox.confirm('确认删除该视图吗？', '删除视图', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = customViews.value.findIndex(v => v.id === viewId);
    if (index > -1) {
      customViews.value.splice(index, 1);
      saveViewsToStorage();
      ElMessage.success('视图删除成功');
    }
  });
};

const loadSavedViews = () => {
  const saved = localStorage.getItem('alertWorkOrderViews');
  if (saved) {
    try {
      customViews.value = JSON.parse(saved);
    } catch (error) {
      console.error('加载保存的视图失败:', error);
    }
  }
};

const saveViewsToStorage = () => {
  localStorage.setItem('alertWorkOrderViews', JSON.stringify(customViews.value));
};

const applyViewConfig = (viewId) => {
  const view = customViews.value.find(v => v.id === viewId);
  if (view) {
    // 应用字段配置
    if (view.columns) {
      tableColumns.value = tableColumns.value.map(col => {
        const viewCol = view.columns.find(c => c.prop === col.prop);
        return {
          ...col,
          visible: viewCol ? viewCol.visible : true
        };
      });
    }
    
    // 应用筛选配置
    if (view.filters) {
      activeFilters.value = [...view.filters];
      filterLogic.value = view.filterLogic || 'and';
    }
    
    // 应用分组配置
    if (view.groupField) {
      groupField.value = view.groupField;
    }
    
    // 重新加载数据
    fetchWorkOrders();
  }
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

// 获取分组列标签
const getGroupColumnLabel = (field) => {
  const column = tableColumns.value.find(col => col.prop === field);
  return column ? column.label : field;
};

// 处理单元格点击
const handleCellClick = (row, column, cell, event) => {
  if (column.property === 'id') {
    viewWorkOrder(row.id);
  }
};

// 处理单元格双击
const handleCellDbClick = (row, column, cell, event) => {
  if (column.property === 'id') {
    viewWorkOrder(row.id);
  }
};

</script>

<style scoped>
/* 样式与其他列表页相同 */
.work-order-list-container { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { margin: 0; font-size: 22px; font-weight: bold; }
.filter-card { margin-bottom: 20px; }
.filter-container { margin-bottom: 15px; }
.filter-form { display: flex; align-items: center; }
.search-input { width: 100%; max-width: 500px; }
.list-card { margin-bottom: 20px; }
.table-operations { margin-bottom: 16px; display: flex; align-items: center; }
.selected-count { margin-right: 16px; color: #606266; }
.subject-cell { display: flex; align-items: center; }
.subject-text { margin-right: 8px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style> 