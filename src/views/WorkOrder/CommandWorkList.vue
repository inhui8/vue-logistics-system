<template>
    <div class="work-order-list-container">
      <div class="page-header">
        <h2 class="page-title">{{ currentView.title }}</h2>
        <div class="page-actions">
          <el-button type="primary" @click="createWorkOrder">创建新工单</el-button>
        </div>
      </div>
  
      <!-- 搜索和筛选区域 -->
      <el-card shadow="never" class="filter-card">
        <div class="search-bar">
          <el-input
            v-model="searchQuery" 
            placeholder="搜索工单 (工单号、主题、订单号...)" 
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
            <el-form-item label="类型">
              <el-select v-model="filters.type" placeholder="按类型筛选" clearable>
                <el-option label="异常订单处理" value="exception"></el-option>
                <el-option label="指令执行" value="command"></el-option>
                <el-option label="订单预警响应" value="warning"></el-option>
                <el-option label="增值服务请求" value="value_added"></el-option>
                <el-option label="其他问题" value="other"></el-option>
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
      <div class="view-tabs">
        <el-tabs v-model="activeView" @tab-click="handleViewChange">
          <el-tab-pane v-for="view in views" :key="view.id" :label="view.title" :name="view.id"></el-tab-pane>
        </el-tabs>
      </div>
  
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
  import { ref, reactive, computed, onMounted, watch } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { Search } from '@element-plus/icons-vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  
  // 路由相关
  const router = useRouter();
  const route = useRoute();
  
  // 获取用户
  const users = ref([
    { id: 1, name: '张三' },
    { id: 2, name: '李四' },
    { id: 3, name: '客服团队' },
  ]);
  
  // 预定义视图
  const views = [
    { id: 'my-pending', title: '待我处理', filter: { assigneeId: 'currentUser', status: ['pending', 'processing'] } },
    { id: 'my-created', title: '我创建的', filter: { creatorId: 'currentUser' } },
    { id: 'all', title: '所有工单', filter: {} },
    { id: 'pending', title: '待处理工单', filter: { status: 'pending' } },
    { id: 'processing', title: '处理中工单', filter: { status: 'processing' } },
    { id: 'resolved', title: '已解决工单', filter: { status: 'resolved' } },
    { id: 'closed', title: '已关闭工单', filter: { status: 'closed' } },
    { id: 'exception', title: '异常订单工单', filter: { type: 'exception' } },
    { id: 'command', title: '指令工单', filter: { type: 'command' } },
    { id: 'warning', title: '预警工单', filter: { type: 'warning' } },
    { id: 'value-added', title: '增值服务工单', filter: { type: 'value_added' } },
  ];
  
  // 当前激活的视图
  const activeView = ref('my-pending');
  const currentView = computed(() => {
    return views.find(view => view.id === activeView.value) || views[0];
  });
  
  // 列表加载状态
  const loading = ref(false);
  
  // 搜索和筛选
  const searchQuery = ref('');
  const filters = reactive({
    status: '',
    type: '',
    priority: '',
    assignee: null,
    createdAtRange: [],
  });
  
  // 列表数据
  const workOrderList = ref([
    {
      id: 'WO202307250001',
      subject: '客户反馈订单延迟问题',
      type: 'exception',
      status: 'pending',
      priority: 'high',
      orderNo: 'ORD202307250123',
      creator: '张三',
      assignee: '李四',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    },
    {
      id: 'WO202307250002',
      subject: '请求特殊配送服务',
      type: 'value_added',
      status: 'processing',
      priority: 'medium',
      orderNo: 'ORD202307250124',
      creator: '李四',
      assignee: '张三',
      createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
    {
      id: 'WO202307250003',
      subject: '低库存预警处理',
      type: 'warning',
      status: 'resolved',
      priority: 'low',
      orderNo: '',
      creator: '系统',
      assignee: '仓库管理员',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
    {
      id: 'WO202307250004',
      subject: '紧急订单加急处理',
      type: 'command',
      status: 'pending',
      priority: 'urgent',
      orderNo: 'ORD202307250125',
      creator: '张三',
      assignee: '',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'WO202307250005',
      subject: '支付异常退款处理',
      type: 'exception',
      status: 'closed',
      priority: 'high',
      orderNo: 'ORD202307250126',
      creator: '李四',
      assignee: '财务',
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
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
  
  // 格式化函数
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
  
  // 事件处理函数
  const handleViewChange = (tab) => {
    // 切换视图时重置筛选条件
    Object.keys(filters).forEach(key => {
      if (key === 'createdAtRange') {
        filters[key] = [];
      } else {
        filters[key] = '';
      }
    });
    // 应用视图过滤器
    const viewFilter = views.find(v => v.id === tab.props.name)?.filter || {};
    if (viewFilter.status) {
      filters.status = viewFilter.status;
    }
    if (viewFilter.type) {
      filters.type = viewFilter.type;
    }
    // 加载数据
    fetchWorkOrders();
  };
  
  const handleSearch = () => {
    pagination.current = 1;
    fetchWorkOrders();
  };
  
  const resetFilters = () => {
    Object.keys(filters).forEach(key => {
      if (key === 'createdAtRange') {
        filters[key] = [];
      } else {
        filters[key] = '';
      }
    });
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
  
  // 操作函数
  const createWorkOrder = () => {
    router.push('/work-order/create');
  };
  
  const viewWorkOrder = (id) => {
    router.push(`/work-order/detail/${id}`);
  };
  
  const viewOrder = (orderNo) => {
    router.push(`/order/detail/${orderNo}`);
  };
  
  const processWorkOrder = (workOrder) => {
    ElMessageBox.confirm(`确认开始处理工单 "${workOrder.subject}"?`, '操作确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    }).then(() => {
      // 实际应用中这里应该调用API更新工单状态
      const index = workOrderList.value.findIndex(item => item.id === workOrder.id);
      if (index !== -1) {
        workOrderList.value[index].status = 'processing';
        workOrderList.value[index].updatedAt = new Date();
      }
      ElMessage.success('工单状态已更新为：处理中');
      // 如果需要跳转到工单处理页面
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
      // 实际应用中这里应该调用API批量更新工单状态
      canProcessIds.forEach(id => {
        const index = workOrderList.value.findIndex(item => item.id === id);
        if (index !== -1) {
          workOrderList.value[index].status = 'processing';
          workOrderList.value[index].updatedAt = new Date();
        }
      });
      ElMessage.success(`已开始处理 ${canProcessIds.length} 个工单`);
      clearSelection();
    }).catch(() => {});
  };
  
  // 获取工单列表数据
  const fetchWorkOrders = async () => {
    loading.value = true;
    try {
      // 实际应用中这里应该调用API获取工单列表
      // const params = {
      //   page: pagination.current,
      //   pageSize: pagination.pageSize,
      //   search: searchQuery.value,
      //   ...filters,
      //   createdAtStart: filters.createdAtRange[0],
      //   createdAtEnd: filters.createdAtRange[1],
      // };
      // const res = await api.getWorkOrders(params);
      // workOrderList.value = res.data.records;
      // pagination.total = res.data.total;
      
      // 模拟API请求延迟
      setTimeout(() => {
        // 这里用模拟数据，实际应用中应该使用API返回的数据
        pagination.total = workOrderList.value.length;
        loading.value = false;
      }, 500);
    } catch (error) {
      console.error('Failed to fetch work orders:', error);
      ElMessage.error('获取工单列表失败');
      loading.value = false;
    }
  };
  
  // 在组件挂载时获取工单列表
  onMounted(() => {
    // 从路由参数获取视图，如果有的话
    const viewFromRoute = route.query.view;
    if (viewFromRoute && views.some(v => v.id === viewFromRoute)) {
      activeView.value = viewFromRoute;
    }
    
    fetchWorkOrders();
  });
  
  // 监听视图变化
  watch(() => activeView.value, () => {
    // 更新路由参数但不刷新页面
    router.replace({ 
      query: { 
        ...route.query,
        view: activeView.value 
      } 
    });
  });
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
  
  .view-tabs {
    margin-bottom: 20px;
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
  </style> 