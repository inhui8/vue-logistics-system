<template>
  <div class="log-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
        </div>
      </template>

      <!-- 筛选区域 -->
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="操作人">
          <el-input v-model="filterForm.operator" placeholder="输入操作人名称" clearable />
        </el-form-item>
        <el-form-item label="操作模块">
          <el-select v-model="filterForm.module" placeholder="选择模块" clearable>
             <el-option label="供应商管理" value="supplier" />
             <el-option label="角色管理" value="role" />
             <el-option label="订单管理" value="order" />
             <el-option label="报价管理" value="quote" />
             <!-- 其他模块 -->
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
           <el-date-picker
              v-model="filterForm.dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss" 
            /> <!-- 定义格式 -->
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 日志列表 -->
      <el-table :data="filteredLogList" style="width: 100%" border>
        <el-table-column prop="timestamp" label="操作时间" width="180" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="module" label="操作模块" width="150">
            <template #default="scope">
              {{ formatModule(scope.row.module) }}
            </template>
        </el-table-column>
        <el-table-column prop="action" label="操作类型" width="120" />
        <el-table-column prop="details" label="操作详情" show-overflow-tooltip />
        <el-table-column prop="ipAddress" label="IP 地址" width="150" />
      </el-table>

       <!-- 分页 -->
      <el-pagination
         style="margin-top: 20px; justify-content: flex-end;"
         background
         layout="total, sizes, prev, pager, next, jumper"
         :total="totalLogs"
         :page-sizes="[10, 20, 50, 100]"
         :page-size="pagination.pageSize"
         :current-page="pagination.currentPage"
         @size-change="handleSizeChange"
         @current-change="handleCurrentChange"
       />

    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';

// --- 模拟数据 ---
const allLogs = ref([]); // 存储所有日志

const generateMockLogs = (count = 150) => {
  const modules = [
    { key: 'supplier', label: '供应商管理' },
    { key: 'role', label: '角色管理' },
    { key: 'order', label: '订单管理' },
    { key: 'quote', label: '报价管理' },
    { key: 'login', label: '登录/登出' },
  ];
  const actions = ['创建', '更新', '删除', '查看', '审批通过', '审批拒绝', '分配', '登录', '登出'];
  const operators = ['管理员A', '运营专员B', '调度员C', '系统管理员'];
  const mockData = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const timestamp = now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000); // 过去30天内
    const module = modules[Math.floor(Math.random() * modules.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    mockData.push({
      id: `log_${now - i}`,
      timestamp: new Date(timestamp).toLocaleString('sv-SE'), // YYYY-MM-DD HH:MM:SS
      operator: operator,
      module: module.key,
      action: action,
      details: `${action}了 ${module.label} 中的项目 ID: ${Math.floor(Math.random() * 1000)}`, // 简化的详情
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    });
  }
  return mockData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // 按时间倒序
};

// --- 筛选与分页 ---
const filterForm = reactive({
  operator: '',
  module: '',
  dateRange: [],
});

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
});

const totalLogs = computed(() => filteredLogsData.value.length);

// 先过滤数据
const filteredLogsData = computed(() => {
  return allLogs.value.filter(log => {
    const operatorMatch = filterForm.operator ? log.operator.includes(filterForm.operator) : true;
    const moduleMatch = filterForm.module ? log.module === filterForm.module : true;
    const dateMatch = filterForm.dateRange && filterForm.dateRange.length === 2
      ? (new Date(log.timestamp) >= new Date(filterForm.dateRange[0]) && new Date(log.timestamp) <= new Date(filterForm.dateRange[1]))
      : true;
    return operatorMatch && moduleMatch && dateMatch;
  });
});

// 再对过滤后的数据进行分页
const filteredLogList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredLogsData.value.slice(start, end);
});

// --- 方法 ---
const formatModule = (moduleKey) => {
    const modules = {
      supplier: '供应商管理',
      role: '角色管理',
      order: '订单管理',
      quote: '报价管理',
      login: '登录/登出'
    };
    return modules[moduleKey] || moduleKey;
};

const handleSearch = () => {
  pagination.currentPage = 1; // 搜索时回到第一页
  // 计算属性会自动更新列表
};

const handleSizeChange = (newSize) => {
  pagination.pageSize = newSize;
  pagination.currentPage = 1; // 切换条数时回到第一页
};

const handleCurrentChange = (newPage) => {
  pagination.currentPage = newPage;
};

// --- 生命周期钩子 ---
onMounted(() => {
  allLogs.value = generateMockLogs(); // 页面加载时生成模拟数据
});

</script>

<style scoped>
.log-list-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-form {
  margin-bottom: 15px;
}
.el-table {
  margin-top: 15px;
}
</style> 