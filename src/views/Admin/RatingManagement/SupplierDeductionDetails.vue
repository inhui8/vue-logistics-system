<template>
  <div class="deduction-details-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>供应商扣分详情记录</span>
          <!-- 可以添加刷新按钮等 -->
        </div>
      </template>

      <!-- 筛选区域 -->
      <el-form :inline="true" :model="filterForm" size="small" class="filter-form">
        <el-form-item label="供应商名称">
          <el-input v-model="filterForm.supplierName" placeholder="输入供应商名称" clearable />
        </el-form-item>
        <el-form-item label="扣分类型">
          <el-select v-model="filterForm.deductionType" placeholder="选择类型" clearable>
             <el-option label="迟到提货" value="late_pickup"></el-option>
             <el-option label="迟到派送" value="late_delivery"></el-option>
             <el-option label="货损" value="damage"></el-option>
             <el-option label="投诉" value="complaint"></el-option>
             <el-option label="证照过期" value="cert_expired"></el-option>
             <!-- 其他类型 -->
          </el-select>
        </el-form-item>
         <el-form-item label="状态">
           <el-select v-model="filterForm.status" placeholder="选择状态" clearable style="width: 100px;">
             <el-option label="已扣分" :value="false"></el-option>
             <el-option label="已豁免" :value="true"></el-option>
           </el-select>
         </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery" :loading="loading">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格区域 -->
      <el-table :data="deductionList" style="width: 100%" border v-loading="loading">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="supplierName" label="供应商名称" width="200" show-overflow-tooltip/>
        <el-table-column prop="supplierTypeLabel" label="供应商类型" width="100" align="center"/>
        <el-table-column prop="deductionType" label="扣分类型/规则" width="180" show-overflow-tooltip/>
        <el-table-column prop="pointsDeducted" label="扣分分值" width="90" align="center">
           <template #default="scope">
             <span style="color: red; font-weight: bold;">-{{ scope.row.pointsDeducted }}</span>
           </template>
        </el-table-column>
        <el-table-column prop="deductionRecordNo" label="扣分单号" width="180" show-overflow-tooltip/>
        <el-table-column label="关联规则详情" min-width="300">
           <template #default="scope">
             <div class="rule-context">
                <p v-for="(value, key) in scope.row.ruleContext.triggeringData" :key="key">
                   <strong>{{ key }}:</strong> {{ value }}
                </p>
             </div>
           </template>
        </el-table-column>
         <el-table-column prop="timestamp" label="记录时间" width="160" align="center"/>
         <el-table-column prop="statusLabel" label="状态" width="80" align="center">
             <template #default="scope">
               <el-tag :type="scope.row.isExempt ? 'info' : 'danger'" size="small">
                 {{ scope.row.isExempt ? '已豁免' : '已扣分' }}
               </el-tag>
             </template>
         </el-table-column>
         <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="scope">
                <el-popconfirm
                    v-if="!scope.row.isExempt"
                    title="确定要豁免这条扣分记录吗？"
                    confirm-button-text="确定"
                    cancel-button-text="取消"
                    @confirm="exemptDeduction(scope.row.id)"
                >
                    <template #reference>
                        <el-button
                           type="warning"
                           size="small"
                           :loading="scope.row.exemptLoading"
                         >
                           豁免扣分
                         </el-button>
                    </template>
                </el-popconfirm>
                 <span v-else>豁免人: {{ scope.row.exemptionOperator || 'N/A' }}</span>
            </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
          small
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalRecords"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="queryParams.pageSize"
          :current-page="queryParams.pageNum"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

// --- state ---
const loading = ref(false);
const totalRecords = ref(0);
const deductionList = ref([]); // 表格数据

// 筛选表单
const filterForm = reactive({
  supplierName: '',
  deductionType: '',
  status: null, // null表示所有, false表示已扣分, true表示已豁免
  dateRange: [],
});

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  supplierName: '',
  deductionType: '',
  isExempt: null, // 对应 filterForm.status
  beginTime: '',
  endTime: '',
});

// --- Mappings (Moved from computed as it's static) ---
// 映射供应商类型标签
const supplierTypeMap = {
    pickup: '提框',
    delivery: '派送',
    both: '综合'
};

// --- Lifecycle ---
onMounted(() => {
  loadDeductionData();
});

// --- Methods ---
// 加载数据
const loadDeductionData = async () => {
  loading.value = true;

  // 更新查询参数
  queryParams.supplierName = filterForm.supplierName;
  queryParams.deductionType = filterForm.deductionType;
  queryParams.isExempt = filterForm.status;
  queryParams.beginTime = filterForm.dateRange ? filterForm.dateRange[0] : '';
  queryParams.endTime = filterForm.dateRange ? filterForm.dateRange[1] : '';

  console.log("查询参数:", queryParams);
  // TODO: [API] 调用 API 获取扣分详情列表
  await new Promise(resolve => setTimeout(resolve, 500)); // 模拟 API 延迟

  // 模拟 API 返回数据
  const mockData = generateMockDeductions(queryParams);
  deductionList.value = mockData.list.map(item => ({ ...item, exemptLoading: false })); // 添加加载状态控制
  totalRecords.value = mockData.total;

  loading.value = false;
};

// 处理查询
const handleQuery = () => {
  queryParams.pageNum = 1; // 重置到第一页
  loadDeductionData();
};

// 重置查询
const resetQuery = () => {
  filterForm.supplierName = '';
  filterForm.deductionType = '';
  filterForm.status = null;
  filterForm.dateRange = [];
  queryParams.pageNum = 1;
  // 可以选择是否立即重新查询
  // loadDeductionData();
};

// 处理分页大小变化
const handleSizeChange = (newSize) => {
  queryParams.pageSize = newSize;
  loadDeductionData();
};

// 处理当前页变化
const handleCurrentChange = (newPage) => {
  queryParams.pageNum = newPage;
  loadDeductionData();
};

// 豁免扣分操作
const exemptDeduction = async (recordId) => {
  const record = deductionList.value.find(item => item.id === recordId);
  if (!record) return;

  record.exemptLoading = true;
  console.log("豁免扣分 ID:", recordId, "操作员: [当前登录用户]"); // 应记录实际操作员
  // TODO: [API] 调用 API 执行豁免操作
  try {
    await new Promise(resolve => setTimeout(resolve, 500)); // 模拟 API 延迟
    // 模拟成功
    record.isExempt = true;
    record.statusLabel = '已豁免';
    record.exemptionOperator = '当前用户'; // 模拟操作员
    ElMessage.success('扣分豁免成功');
  } catch (error) {
    console.error("豁免操作失败:", error);
    ElMessage.error('豁免操作失败');
  } finally {
    record.exemptLoading = false;
  }
};

// --- Mock Data Generation ---
const mockSuppliers = [
  { id: 'supplier_1', name: '测试供应商A - 专做提框服务', type: 'pickup' },
  { id: 'supplier_2', name: '测试供应商B - FBA派送专家', type: 'delivery' },
  { id: 'supplier_3', name: '测试供应商C - 全能型选手', type: 'both' },
];
const mockDeductionTypes = [
    { value: 'late_pickup', label: '迟到提货', points: 5, context: { ruleName: '准时提货率 - 扣分档位 1', triggeringData: { '计划提货时间': '2024-04-10 10:00', '实际提货时间': '2024-04-10 11:30' } } },
    { value: 'late_delivery', label: '迟到派送', points: 8, context: { ruleName: '准时送达率 - 扣分档位 2', triggeringData: { '计划送达时间': '2024-04-11 15:00', '实际送达时间': '2024-04-12 09:00' } } },
    { value: 'damage', label: '货损', points: 15, context: { ruleName: '货损率 - 扣分档位 1', triggeringData: { '货损金额': '850元', '货损类型': '包装破损' } } },
    { value: 'complaint', label: '客户投诉', points: 10, context: { ruleName: '客户投诉次数 - 扣分档位 1', triggeringData: { '投诉级别': '严重', '投诉内容': '司机态度恶劣' } } },
    { value: 'cert_expired', label: '证照过期', points: 20, context: { ruleName: '证照过期次数 - 扣分', triggeringData: { '证照类型': '驾驶证', '过期日期': '2024-03-15' } } },
];

let recordCounter = 1;

const generateMockDeductions = (params) => {
    const allRecords = [];
    const baseDate = new Date();

    for (let i = 0; i < 50; i++) {
        const supplier = mockSuppliers[i % mockSuppliers.length];
        const deductionInfo = mockDeductionTypes[i % mockDeductionTypes.length];
        const recordDate = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000 * Math.random()); // 随机过去几天
        const isExempt = Math.random() < 0.2; // 20% 概率已豁免

        allRecords.push({
            id: `deduct_${recordCounter++}`,
            supplierId: supplier.id,
            supplierName: supplier.name,
            supplierType: supplier.type,
            supplierTypeLabel: supplierTypeMap[supplier.type] || '未知',
            deductionType: deductionInfo.label,
            pointsDeducted: deductionInfo.points,
            deductionRecordNo: `DED-${recordDate.toISOString().slice(0, 10).replace(/-/g, '')}-${String(recordCounter).padStart(3, '0')}`,
            ruleContext: deductionInfo.context,
            timestamp: recordDate.toISOString().slice(0, 19).replace('T', ' '),
            operator: ['系统自动', '张三', '李四'][i % 3],
            isExempt: isExempt,
            exemptionOperator: isExempt ? ['王五', '赵六'][i % 2] : null,
            exemptionTimestamp: isExempt ? new Date(recordDate.getTime() + 86400000 * Math.random()).toISOString().slice(0, 19).replace('T', ' ') : null,
            statusLabel: isExempt ? '已豁免' : '已扣分',
        });
    }

    // Filter based on params
    const filtered = allRecords.filter(r => {
        if (params.supplierName && !r.supplierName.includes(params.supplierName)) return false;
        // TODO: Filter by deductionType (need mapping from filter value to label or a better approach)
        // if (params.deductionType && r.deductionType !== params.deductionType) return false;
        if (params.isExempt !== null && r.isExempt !== params.isExempt) return false;
        if (params.beginTime && r.timestamp < params.beginTime) return false;
        if (params.endTime && r.timestamp > params.endTime + ' 23:59:59') return false; // Include end date
        return true;
    });

    // Paginate
    const start = (params.pageNum - 1) * params.pageSize;
    const end = start + params.pageSize;
    const paginatedList = filtered.slice(start, end);

    return {
        list: paginatedList,
        total: filtered.length,
    };
};

</script>

<style scoped>
.deduction-details-container {
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
.filter-form .el-form-item {
    margin-bottom: 10px; /* 减少筛选表单项间距 */
}
.rule-context p {
    margin: 2px 0;
    font-size: 0.9em;
    color: #606266;
}
.rule-context strong {
    color: #303133;
    margin-right: 5px;
}

/* 可以给豁免操作的文字加点样式 */
.el-table span[style*="color: grey"] {
    font-size: 0.9em;
    color: #909399;
}
</style> 