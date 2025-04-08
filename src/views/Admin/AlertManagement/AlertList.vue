<template>
  <div class="alert-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>异常预警列表</span>
        </div>
      </template>

      <!-- 筛选区域 -->
      <el-form :inline="true" :model="filterForm" class="filter-form">
         <el-form-item label="供应商">
            <el-select v-model="filterForm.supplierId" placeholder="选择供应商" clearable filterable>
               <el-option
                 v-for="supplier in mockSuppliers" 
                 :key="supplier.id"
                 :label="supplier.name"
                 :value="supplier.id"
               />
            </el-select>
         </el-form-item>
         <el-form-item label="车牌号">
           <el-input v-model="filterForm.plateNumber" placeholder="输入车牌号" clearable />
         </el-form-item>
        <el-form-item label="预警类型">
          <el-select v-model="filterForm.alertType" placeholder="选择预警类型" clearable>
             <el-option
                v-for="item in alertTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
          </el-select>
        </el-form-item>
         <el-form-item label="处理状态">
            <el-select v-model="filterForm.processStatus" placeholder="选择处理状态" clearable>
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已解决" value="resolved" />
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
            />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 预警列表 -->
      <el-table :data="filteredAlertList" style="width: 100%" border>
        <el-table-column prop="timestamp" label="预警时间" width="180" sortable />
        <el-table-column prop="plateNumber" label="车牌号" width="120" />
        <el-table-column prop="supplierName" label="所属供应商" width="200" show-overflow-tooltip />
        <el-table-column prop="alertType" label="预警类型" width="150">
            <template #default="scope">
               <el-tag :type="getAlertTypeTag(scope.row.alertType)" effect="plain">
                 {{ formatAlertType(scope.row.alertType) }}
               </el-tag>
            </template>
        </el-table-column>
        <el-table-column prop="details" label="预警详情" show-overflow-tooltip />
         <el-table-column prop="processStatus" label="处理状态" width="120">
            <template #default="scope">
               <el-tag :type="getProcessStatusTag(scope.row.processStatus)">
                 {{ formatProcessStatus(scope.row.processStatus) }}
               </el-tag>
            </template>
         </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
             <el-button text type="primary" size="small" @click="handleViewDetails(scope.row)">查看详情</el-button>
             <el-button text type="success" size="small" @click="markAsResolved(scope.row)" v-if="scope.row.processStatus !== 'resolved'">标记解决</el-button>
             <el-button text type="warning" size="small" @click="markAsProcessing(scope.row)" v-if="scope.row.processStatus === 'pending'">标记处理中</el-button>
          </template>
        </el-table-column>
      </el-table>

       <!-- 分页 -->
      <el-pagination
         style="margin-top: 20px; justify-content: flex-end;"
         background
         layout="total, sizes, prev, pager, next, jumper"
         :total="totalAlerts"
         :page-sizes="[10, 20, 50, 100]"
         :page-size="pagination.pageSize"
         :current-page="pagination.currentPage"
         @size-change="handleSizeChange"
         @current-change="handleCurrentChange"
       />

       <!-- 详情弹窗 (占位) -->
       <el-dialog v-model="detailDialogVisible" title="预警详情" width="60%">
         <p><strong>时间:</strong> {{ currentAlert?.timestamp }}</p>
         <p><strong>车辆:</strong> {{ currentAlert?.plateNumber }} ({{ currentAlert?.supplierName }})</p>
         <p><strong>类型:</strong> {{ formatAlertType(currentAlert?.alertType) }}</p>
         <p><strong>详情:</strong> {{ currentAlert?.details }}</p>
         <p><strong>处理状态:</strong> {{ formatProcessStatus(currentAlert?.processStatus) }}</p>
         <p><strong>处理备注 (待实现):</strong> <el-input type="textarea" disabled /></p>
         <template #footer>
           <el-button @click="detailDialogVisible = false">关闭</el-button>
         </template>
       </el-dialog>

    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// --- 模拟数据 ---
const mockSuppliers = ref([
  { id: 'supplier_1', name: '测试供应商A - 专做提框服务' },
  { id: 'supplier_2', name: '测试供应商B - FBA派送专家' },
  { id: 'supplier_3', name: '测试供应商C - 全能型选手' },
]);

// 假设的车辆列表 (只需要部分信息)
const mockVehicles = ref([
  { id: 'vehicle_1', plateNumber: 'CA12345', supplierId: 'supplier_1', supplierName: '测试供应商A - 专做提框服务' },
  { id: 'vehicle_2', plateNumber: 'NY98765', supplierId: 'supplier_2', supplierName: '测试供应商B - FBA派送专家' },
  { id: 'vehicle_3', plateNumber: 'TX54321', supplierId: 'supplier_3', supplierName: '测试供应商C - 全能型选手' },
   { id: 'vehicle_4', plateNumber: 'FL11223', supplierId: 'supplier_1', supplierName: '测试供应商A - 专做提框服务' },
   { id: 'vehicle_5', plateNumber: 'AZ55667', supplierId: 'supplier_2', supplierName: '测试供应商B - FBA派送专家' },
]);

const allAlerts = ref([]);

const generateMockAlerts = (count = 100) => {
  const alertTypes = ['speeding', 'route_deviation', 'geo_fencing', 'prolonged_stop', 'fatigue_driving', 'gps_signal_lost'];
  const processStatuses = ['pending', 'processing', 'resolved'];
  const mockData = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const vehicle = mockVehicles.value[Math.floor(Math.random() * mockVehicles.value.length)];
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    let details = '';
    switch (alertType) {
        case 'speeding': details = `速度达到 ${Math.floor(Math.random() * 40) + 80} km/h (阈值 80 km/h)`; break;
        case 'route_deviation': details = `偏离预定路线 1.5 km`; break;
        case 'geo_fencing': details = `进入未授权区域 (ID: Zone_${Math.floor(Math.random()*5)})`; break;
        case 'prolonged_stop': details = `在非预定点停留 ${Math.floor(Math.random() * 50) + 10} 分钟`; break;
        case 'fatigue_driving': details = `连续驾驶超过 4 小时`; break;
        case 'gps_signal_lost': details = `GPS 信号丢失超过 5 分钟`; break;
        default: details = '未知详情';
    }

    mockData.push({
      id: `alert_${now - i}`,
      timestamp: new Date(now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toLocaleString('sv-SE'), // 过去7天内
      vehicleId: vehicle.id,
      plateNumber: vehicle.plateNumber,
      supplierId: vehicle.supplierId,
      supplierName: vehicle.supplierName,
      alertType: alertType,
      details: details,
      processStatus: processStatuses[Math.floor(Math.random() * processStatuses.length)],
    });
  }
  // return mockData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // 按时间倒序 (Table 支持排序)
    return mockData;
};

// --- 选项数据 ---
const alertTypeOptions = [
  { value: 'speeding', label: '超速报警', tag: 'danger' },
  { value: 'route_deviation', label: '偏离路线报警', tag: 'warning' },
  { value: 'geo_fencing', label: '电子围栏报警', tag: 'warning' },
  { value: 'prolonged_stop', label: '超时停留报警', tag: 'warning' },
  { value: 'fatigue_driving', label: '疲劳驾驶预警', tag: 'danger' },
  { value: 'gps_signal_lost', label: 'GPS信号丢失报警', tag: 'info' },
];

const processStatusOptions = {
  pending: { label: '待处理', tag: 'danger' },
  processing: { label: '处理中', tag: 'warning' },
  resolved: { label: '已解决', tag: 'success' },
};

// --- 筛选与分页 ---
const filterForm = reactive({
  supplierId: '',
  plateNumber: '',
  alertType: '',
  processStatus: '',
  dateRange: [],
});

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
});

const totalAlerts = computed(() => filteredAlertsData.value.length);

// 过滤逻辑
const filteredAlertsData = computed(() => {
  return allAlerts.value.filter(alert => {
    const supplierMatch = filterForm.supplierId ? alert.supplierId === filterForm.supplierId : true;
    const plateMatch = filterForm.plateNumber ? alert.plateNumber.includes(filterForm.plateNumber) : true;
    const typeMatch = filterForm.alertType ? alert.alertType === filterForm.alertType : true;
    const statusMatch = filterForm.processStatus ? alert.processStatus === filterForm.processStatus : true;
    const dateMatch = filterForm.dateRange && filterForm.dateRange.length === 2
      ? (new Date(alert.timestamp) >= new Date(filterForm.dateRange[0]) && new Date(alert.timestamp) <= new Date(filterForm.dateRange[1]))
      : true;
    return supplierMatch && plateMatch && typeMatch && statusMatch && dateMatch;
  });
});

// 分页逻辑
const filteredAlertList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  // 模拟后端排序：这里简单在前端排序，实际应由后端处理
  // return filteredAlertsData.value.slice(start, end).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
   return filteredAlertsData.value.slice(start, end);
});

// --- 弹窗 ---
const detailDialogVisible = ref(false);
const currentAlert = ref(null);

// --- 方法 ---
// 格式化
const formatAlertType = (type) => alertTypeOptions.find(opt => opt.value === type)?.label || type;
const getAlertTypeTag = (type) => alertTypeOptions.find(opt => opt.value === type)?.tag || 'info';
const formatProcessStatus = (status) => processStatusOptions[status]?.label || status;
const getProcessStatusTag = (status) => processStatusOptions[status]?.tag || 'info';

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
};

// 分页
const handleSizeChange = (newSize) => {
  pagination.pageSize = newSize;
  pagination.currentPage = 1;
};
const handleCurrentChange = (newPage) => {
  pagination.currentPage = newPage;
};

// 查看详情
const handleViewDetails = (row) => {
  currentAlert.value = row;
  detailDialogVisible.value = true;
};

// 更新状态 (模拟)
const updateAlertStatus = (row, newStatus) => {
   const index = allAlerts.value.findIndex(alert => alert.id === row.id);
   if (index !== -1) {
     allAlerts.value[index].processStatus = newStatus;
     ElMessage.success(`已将 ${row.plateNumber} 的预警标记为 ${formatProcessStatus(newStatus)}`);
     // 如果当前在详情弹窗中查看的是这个预警，也更新状态
     if (currentAlert.value && currentAlert.value.id === row.id) {
       currentAlert.value.processStatus = newStatus;
     }
   } else {
     ElMessage.error('更新状态失败');
   }
};

const markAsResolved = (row) => {
   ElMessageBox.confirm(`确定将 ${row.plateNumber} 的 ${formatAlertType(row.alertType)} 预警标记为已解决吗?`, '确认', { type: 'success' })
     .then(() => {
       updateAlertStatus(row, 'resolved');
     })
     .catch(() => {}); // 取消时不做任何事
};

const markAsProcessing = (row) => {
    updateAlertStatus(row, 'processing');
};

// --- 生命周期 ---
onMounted(() => {
  allAlerts.value = generateMockAlerts();
});

</script>

<style scoped>
.alert-list-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-form .el-form-item {
  margin-bottom: 10px;
}
.el-table {
  margin-top: 15px;
}
.dialog-footer button:first-child {
  margin-right: 10px;
}
</style> 