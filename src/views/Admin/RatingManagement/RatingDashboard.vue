<template>
  <div class="rating-dashboard-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>供应商评分看板</span>
          <!-- 筛选区域 -->
           <el-form :inline="true" :model="filterForm" size="small" class="dashboard-filter">
              <el-form-item label="评分周期">
                <el-select v-model="filterForm.period" placeholder="选择周期" clearable style="width: 150px;">
                  <el-option v-for="p in mockPeriods" :key="p" :label="p" :value="p" />
                </el-select>
              </el-form-item>
              <el-form-item label="供应商类型">
                <el-select v-model="filterForm.supplierType" placeholder="选择类型" clearable style="width: 150px;">
                  <el-option label="提框" value="pickup" />
                  <el-option label="派送" value="delivery" />
                  <el-option label="综合" value="both" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleQuery">查询</el-button>
              </el-form-item>
           </el-form>
        </div>
      </template>

       <div v-loading="loading">
          <el-row :gutter="20">
            <!-- 供应商评分排名 -->
            <el-col :span="12">
              <h4>供应商评分排名 ({{ filterForm.period || '最新' }})</h4>
              <el-table :data="supplierRankings" style="width: 100%" height="400px" border size="small">
                  <el-table-column type="index" label="排名" width="60" align="center" />
                  <el-table-column prop="supplierName" label="供应商" show-overflow-tooltip />
                  <el-table-column prop="score" label="综合评分" width="100" sortable align="center">
                      <template #default="scope">
                        <span :style="getScoreStyle(scope.row.score)">{{ scope.row.score.toFixed(1) }}</span>
                      </template>
                  </el-table-column>
                   <el-table-column prop="typeLabel" label="类型" width="80" align="center"/>
                   <el-table-column label="操作" width="80" align="center">
                     <template #default="scope">
                         <el-button text type="primary" size="small" @click="viewSupplierDetails(scope.row)">详情</el-button>
                     </template>
                   </el-table-column>
              </el-table>
               <el-pagination
                   small
                   background
                   layout="prev, pager, next"
                   :total="totalRankings"
                   :page-size="rankingPagination.pageSize"
                   :current-page="rankingPagination.currentPage"
                   @current-change="handleRankingPageChange"
                   style="margin-top: 10px; justify-content: center;"
                 />
            </el-col>

            <!-- 评分趋势与对比 -->
            <el-col :span="12">
               <h4>评分趋势 / 对比分析 (模拟图表)</h4>
                <div class="chart-placeholder large-chart">
                    (此处集成图表库，展示整体评分趋势、按供应商类型对比、或选定供应商的维度得分雷达图等)
                     <br/><br/>
                     (当前筛选: {{ filterForm.period || '最新' }}, {{ filterForm.supplierType ? typeMap[filterForm.supplierType] : '所有类型' }})
                </div>
                 <h4>关键绩效仪表盘 (模拟)</h4>
                  <el-row :gutter="15" class="kpi-dashboard">
                    <el-col :span="8">
                        <div class="kpi-card good">
                           <div class="kpi-value">{{ kpiData.averageScore.toFixed(1) }}</div>
                           <div class="kpi-label">平均综合评分</div>
                        </div>
                    </el-col>
                     <el-col :span="8">
                        <div class="kpi-card" :class="kpiData.onTimeRate >= 95 ? 'good' : 'warning'">
                           <div class="kpi-value">{{ kpiData.onTimeRate.toFixed(1) }}%</div>
                           <div class="kpi-label">平均准时率</div>
                        </div>
                    </el-col>
                     <el-col :span="8">
                        <div class="kpi-card" :class="kpiData.damageRate <= 1 ? 'good' : 'bad'">
                           <div class="kpi-value">{{ kpiData.damageRate.toFixed(1) }}%</div>
                           <div class="kpi-label">平均货损率</div>
                        </div>
                    </el-col>
                  </el-row>
            </el-col>
          </el-row>
       </div>

    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

// --- 模拟数据 ---
const mockSuppliers = ref([
  { id: 'supplier_1', name: '测试供应商A - 专做提框服务', type: 'pickup' },
  { id: 'supplier_2', name: '测试供应商B - FBA派送专家', type: 'delivery' },
  { id: 'supplier_3', name: '测试供应商C - 全能型选手', type: 'both' },
  { id: 'supplier_4', name: '测试供应商D - 区域小霸王', type: 'delivery' },
   { id: 'supplier_5', name: '测试供应商E - 新晋合作方', type: 'pickup' },
]);

const mockPeriods = ref(['2024-Q1', '2023-Q4', '2023-Q3']); // 模拟可选周期

// 存储所有周期的评分数据 (模拟)
const allRatingData = ref({}); 

const typeMap = { pickup: '提框', delivery: '派送', both: '综合' };

const generateMockRatingDataForPeriod = (period) => {
  const data = mockSuppliers.value.map(supplier => {
      // 模拟分数波动
      let baseScore = 85;
      if (supplier.type === 'pickup') baseScore = 88;
      if (supplier.name.includes('新晋')) baseScore = 75;
      if (period === '2023-Q4') baseScore += Math.random() * 5 - 2;
      if (period === '2023-Q3') baseScore += Math.random() * 8 - 4;

      const score = Math.max(60, Math.min(99.9, baseScore + Math.random() * 15 - 7.5));
      const onTimeRate = Math.max(80, Math.min(99.9, score * 1.05 + Math.random() * 10 - 8));
      const damageRate = Math.max(0.1, Math.min(5, (100 - score) * 0.1 + Math.random() * 1 - 0.5));

      return {
          supplierId: supplier.id,
          supplierName: supplier.name,
          type: supplier.type,
          typeLabel: typeMap[supplier.type] || '未知',
          score: score,
          period: period,
          // 可以添加更多维度得分
          onTimeRate: onTimeRate,
          damageRate: damageRate,
      };
  });
  return data.sort((a, b) => b.score - a.score); // 按分数降序
};

// --- 筛选与查询 ---
const filterForm = reactive({
  period: mockPeriods.value[0], // 默认选最新周期
  supplierType: '',
});

const loading = ref(false);
const currentPeriodData = ref([]); // 当前查询周期的数据

const rankingPagination = reactive({
    currentPage: 1,
    pageSize: 10, 
});

const totalRankings = computed(() => filteredRankings.value.length);

// 根据筛选条件过滤当前周期数据
const filteredRankings = computed(() => {
    return currentPeriodData.value.filter(r => 
        !filterForm.supplierType || r.type === filterForm.supplierType
    );
});

// 前端分页排名数据
const supplierRankings = computed(() => {
  const start = (rankingPagination.currentPage - 1) * rankingPagination.pageSize;
  const end = start + rankingPagination.pageSize;
  return filteredRankings.value.slice(start, end);
});

// 计算 KPI (基于当前筛选结果)
const kpiData = computed(() => {
    const dataToCalc = filteredRankings.value; // 使用过滤后的数据计算KPI
    if (dataToCalc.length === 0) {
        return { averageScore: 0, onTimeRate: 0, damageRate: 0 };
    }
    const avgScore = dataToCalc.reduce((sum, r) => sum + r.score, 0) / dataToCalc.length;
    const avgOnTime = dataToCalc.reduce((sum, r) => sum + r.onTimeRate, 0) / dataToCalc.length;
    const avgDamage = dataToCalc.reduce((sum, r) => sum + r.damageRate, 0) / dataToCalc.length;
    return {
        averageScore: avgScore,
        onTimeRate: avgOnTime,
        damageRate: avgDamage
    };
});

const handleQuery = () => {
  loading.value = true;
  rankingPagination.currentPage = 1; // 重置分页
  console.log(`查询评分: 周期=${filterForm.period}, 类型=${filterForm.supplierType}`);
  // 模拟 API 请求
  setTimeout(() => {
     const periodKey = filterForm.period || mockPeriods.value[0]; // 如果没选，查最新的
     if (!allRatingData.value[periodKey]) {
         console.log(`为周期 ${periodKey} 生成模拟数据`);
         allRatingData.value[periodKey] = generateMockRatingDataForPeriod(periodKey);
     }
     currentPeriodData.value = allRatingData.value[periodKey];
     loading.value = false;
  }, 500);
};

const handleRankingPageChange = (page) => {
    rankingPagination.currentPage = page;
};

// --- 其他方法 ---
const getScoreStyle = (score) => {
    if (score >= 90) return { color: '#67C23A' }; // 优秀绿色
    if (score >= 80) return { color: '#409EFF' }; // 良好蓝色
    if (score >= 70) return { color: '#E6A23C' }; // 一般橙色
    return { color: '#F56C6C' }; // 较差红色
};

const viewSupplierDetails = (row) => {
    console.log('查看供应商评分详情:', row);
    ElMessage.info(`查看供应商 ${row.supplierName} 在 ${row.period} 的详细评分数据 (待实现)`);
    // 实际可以弹窗或跳转到供应商详情页的评分标签
};


// --- 生命周期 ---
onMounted(() => {
  // 首次加载默认查询最新周期
  handleQuery();
});

</script>

<style scoped>
.rating-dashboard-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dashboard-filter {
    margin-left: auto; /* 让筛选表单靠右 */
}
.dashboard-filter .el-form-item {
    margin-bottom: 0; /* 减少间距 */
}
h4 {
    margin-bottom: 15px;
    margin-top: 5px;
}
.chart-placeholder {
  height: 280px; /* 调整图表高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f8f9;
  color: #909399;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
}
.large-chart {
    height: 350px; /* 趋势图可以高一点 */
}

.kpi-dashboard {
    margin-top: 10px;
}
.kpi-card {
    border-radius: 4px;
    padding: 15px;
    text-align: center;
    color: #fff;
    background-color: #909399; /* 默认灰色 */
}
.kpi-card.good {
    background-color: #67C23A;
}
.kpi-card.warning {
    background-color: #E6A23C;
}
.kpi-card.bad {
     background-color: #F56C6C;
}
.kpi-value {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 5px;
}
.kpi-label {
    font-size: 13px;
}

</style> 