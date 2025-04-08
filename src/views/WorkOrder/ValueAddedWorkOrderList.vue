<template>
  <div class="work-order-list-container">
    <div class="page-header">
      <h2 class="page-title">增值服务工单</h2>
      <div class="page-actions">
        <el-button type="primary" @click="createWorkOrder">请求增值服务</el-button>
        <!-- 这里创建的工单类型应默认为 'value_added' -->
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card shadow="never" class="filter-card">
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索增值服务工单 (工单号、主题、订单号、服务项目...)"
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
          <!-- 类型筛选已移除，固定为 'value_added' -->
           <el-form-item label="服务项目">
                <el-input v-model="filters.serviceItem" placeholder="按服务项目筛选" clearable></el-input>
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

    <!-- 工单列表 -->
    <el-card shadow="never" class="list-card">
      <div class="table-operations" v-if="selectedRows.length > 0">
         <span class="selected-count">已选择 {{ selectedRows.length }} 项</span>
         <el-button size="small" @click="batchProcess">批量处理</el-button>
         <el-button size="small" @click="clearSelection">清除选择</el-button>
       </div>

      <el-table
        v-loading="loading"
        :data="workOrderList"
        @selection-change="handleSelectionChange"
        style="width: 100%">
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
        <el-table-column label="类型" prop="type" width="120">
          <template #default="scope">
            {{ getTypeText(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column label="服务项目" prop="serviceItem" width="150">
           <template #default="scope">
             {{ scope.row.serviceItem || '-' }}
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
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange">
        </el-pagination>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();

const users = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '客服团队' },
  { id: 7, name: '增值服务组' } // Added for example
]);

const loading = ref(false);
const searchQuery = ref('');

const filters = reactive({
  status: '',
  type: 'value_added', // 固定类型
  serviceItem: '', // 新增服务项目筛选
  priority: '',
  assignee: null,
  createdAtRange: [],
});

// 列表数据 (仅包含增值服务工单示例)
const workOrderList = ref([
   {
    id: 'WO202307250002',
    subject: '请求特殊配送服务',
    type: 'value_added',
    status: 'processing',
    priority: 'medium',
    serviceItem: '特殊配送', // 服务项目
    orderNo: 'ORD202307250124',
    creator: '李四',
    assignee: '增值服务组',
    createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
   {
    id: 'WO202307250009',
    subject: '订单礼品包装请求',
    type: 'value_added',
    status: 'pending',
    priority: 'low',
    serviceItem: '礼品包装',
    orderNo: 'ORD202307250128',
    creator: '张三',
    assignee: '', // 未指派
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
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
  filters.serviceItem = '';
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
  router.push({ path: '/work-order/create', query: { defaultType: 'value_added' } });
};

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
      type: filters.type, // 固定为 value_added
      status: filters.status,
      serviceItem: filters.serviceItem,
      priority: filters.priority,
      assigneeId: filters.assignee,
      createdAtStart: filters.createdAtRange ? filters.createdAtRange[0] : null,
      createdAtEnd: filters.createdAtRange ? filters.createdAtRange[1] : null,
    };
    console.log("Fetching Value Added Work Orders with params:", params);
    // const res = await api.getWorkOrders(params);
    // workOrderList.value = res.data.records;
    // pagination.total = res.data.total;

    // 模拟API请求延迟和过滤
    setTimeout(() => {
       let filteredData = [...workOrderList.value]; // Start with full mock data for demo

        // Apply filters (client-side simulation for demo)
       if (params.search) { /* ... search logic ... */ }
       if (params.status) { /* ... status filter ... */ }
       if (params.serviceItem) {
            filteredData = filteredData.filter(wo => wo.serviceItem && wo.serviceItem.toLowerCase().includes(params.serviceItem.toLowerCase()));
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
    console.error('Failed to fetch value added work orders:', error);
    ElMessage.error('获取增值服务工单列表失败');
    loading.value = false;
  }
};

onMounted(() => {
  fetchWorkOrders();
});

</script>

<style scoped>
/* 样式与其他列表页相同 */
.work-order-list-container { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { margin: 0; font-size: 22px; font-weight: bold; }
.filter-card { margin-bottom: 20px; }
.search-bar { margin-bottom: 15px; }
.search-input { width: 100%; max-width: 500px; }
.list-card { margin-bottom: 20px; }
.table-operations { margin-bottom: 16px; display: flex; align-items: center; }
.selected-count { margin-right: 16px; color: #606266; }
.subject-cell { display: flex; align-items: center; }
.subject-text { margin-right: 8px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style> 