<template>
  <div class="rating-config-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>评分维度与指标配置</span>
           <el-button type="primary" @click="saveConfig" :loading="saving">保存配置</el-button>
        </div>
      </template>

      <el-form label-width="100px">
          <el-form-item label="评分周期">
             <el-radio-group v-model="config.periodType">
               <el-radio label="monthly">月度</el-radio>
               <el-radio label="quarterly">季度</el-radio>
               <el-radio label="yearly" disabled>年度 (待支持)</el-radio>
             </el-radio-group>
          </el-form-item>
      </el-form>

      <el-divider>评分维度与指标</el-divider>

      <div v-for="(dimension, dimIndex) in config.dimensions" :key="dimension.id" class="dimension-block">
          <div class="dimension-header">
              <el-input v-model="dimension.name" placeholder="维度名称" style="width: 200px; margin-right: 10px;"/>
              <el-input-number v-model="dimension.weight" :min="0" :max="100" :step="5" size="small" controls-position="right" style="width: 120px; margin-right: 20px;" /> %
              <el-button type="danger" :icon="Delete" circle size="small" @click="removeDimension(dimIndex)" />
          </div>
          
          <div class="indicators-list">
              <div v-for="(indicator, indIndex) in dimension.indicators" :key="indicator.id" class="indicator-item">
                  <el-input v-model="indicator.name" placeholder="指标名称" size="small" style="width: 250px; margin-right: 10px;"/>
                   <el-tooltip content="指标描述或计算方式 (可选)" placement="top">
                     <el-input v-model="indicator.description" placeholder="指标描述" size="small" style="width: 300px; margin-right: 10px;"/>
                   </el-tooltip>
                   <el-input-number v-model="indicator.weight" :min="0" :max="100" :step="1" size="small" controls-position="right" style="width: 100px; margin-right: 10px;" /> %
                   <el-button type="danger" :icon="Delete" plain circle size="small" @click="removeIndicator(dimIndex, indIndex)" />
              </div>
              <el-button type="primary" link :icon="Plus" @click="addIndicator(dimIndex)">添加指标</el-button>
          </div>
      </div>

       <el-button type="success" :icon="Plus" @click="addDimension" style="margin-top: 20px;">添加维度</el-button>

       <el-alert type="warning" show-icon :closable="false" style="margin-top: 20px;">
         <p>请确保所有维度的权重之和为 100%。当前总权重: <strong>{{ totalDimensionWeight }}%</strong></p>
         <p v-for="(dim, index) in config.dimensions" :key="'dim_alert_'+index">
           维度 "{{ dim.name || '未命名维度' }}" 下指标权重之和: <strong>{{ calculateIndicatorWeightSum(dim) }}%</strong> (应为 100%)
         </p>
       </el-alert>

    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';

// --- 模拟配置数据 ---
const config = reactive({
  periodType: 'quarterly', // 默认季度
  dimensions: []
});

const saving = ref(false);

// 加载模拟的初始配置
const loadMockConfig = () => {
    config.periodType = 'quarterly';
    config.dimensions = [
        {
            id: `dim_${Date.now()}_1`,
            name: '时效性',
            weight: 40,
            indicators: [
                { id: `ind_${Date.now()}_1_1`, name: '准时提货率', description: '按约定时间完成提货的比例', weight: 50 },
                { id: `ind_${Date.now()}_1_2`, name: '准时送达率', description: '按约定时间完成送达的比例', weight: 50 },
            ]
        },
        {
            id: `dim_${Date.now()}_2`,
            name: '服务质量',
            weight: 30,
            indicators: [
                { id: `ind_${Date.now()}_2_1`, name: '货损率', description: '运输过程中货物损坏的比例', weight: 40 },
                { id: `ind_${Date.now()}_2_2`, name: '客户投诉率', description: '因服务问题导致客户投诉的比例', weight: 30 },
                { id: `ind_${Date.now()}_2_3`, name: 'POD返回及时率', description: '签收单按时返回的比例', weight: 30 },
            ]
        },
         {
            id: `dim_${Date.now()}_3`,
            name: '成本控制',
            weight: 20,
            indicators: [
                { id: `ind_${Date.now()}_3_1`, name: '报价竞争力', description: '与其他供应商相比的价格优势', weight: 70 },
                { id: `ind_${Date.now()}_3_2`, name: '附加费用合理性', description: '额外费用的发生频率和合理性', weight: 30 },
            ]
        },
          {
            id: `dim_${Date.now()}_4`,
            name: '合规与配合度',
            weight: 10,
            indicators: [
                { id: `ind_${Date.now()}_4_1`, name: '证照齐全有效', description: '车辆、司机证照是否符合要求', weight: 50 },
                { id: `ind_${Date.now()}_4_2`, name: '系统操作规范性', description: '是否按要求使用供应商门户系统', weight: 50 },
            ]
        }
    ];
};

// --- 计算属性 ---
// 计算维度总权重
const totalDimensionWeight = computed(() => {
  return config.dimensions.reduce((sum, dim) => sum + (dim.weight || 0), 0);
});

// 计算单个维度下指标权重之和
const calculateIndicatorWeightSum = (dimension) => {
  return dimension.indicators.reduce((sum, ind) => sum + (ind.weight || 0), 0);
};

// --- 方法 ---
// 添加维度
const addDimension = () => {
  config.dimensions.push({
    id: `dim_${Date.now()}`,
    name: '新维度',
    weight: 0,
    indicators: []
  });
};

// 移除维度
const removeDimension = (index) => {
  ElMessageBox.confirm(`确定要删除维度 "${config.dimensions[index].name || '未命名维度'}" 吗?`, '确认删除', { type: 'warning' })
    .then(() => {
      config.dimensions.splice(index, 1);
    })
    .catch(() => {});
};

// 添加指标
const addIndicator = (dimIndex) => {
  config.dimensions[dimIndex].indicators.push({
    id: `ind_${Date.now()}`,
    name: '新指标',
    description: '',
    weight: 0
  });
};

// 移除指标
const removeIndicator = (dimIndex, indIndex) => {
   const dimension = config.dimensions[dimIndex];
   // const indicator = dimension.indicators[indIndex]; // 变量未使用，注释掉
   // 简单确认，不提示名称
    dimension.indicators.splice(indIndex, 1);
};

// 验证配置
const validateConfig = () => {
    if (totalDimensionWeight.value !== 100) {
        ElMessage.error('所有维度的权重之和必须为 100%');
        return false;
    }
    for (const dim of config.dimensions) {
        if (!dim.name) {
             ElMessage.error('存在未命名的维度');
             return false;
        }
        if (calculateIndicatorWeightSum(dim) !== 100) {
             ElMessage.error(`维度 "${dim.name}" 下的指标权重之和必须为 100%`);
            return false;
        }
        for (const ind of dim.indicators) {
             if (!ind.name) {
                 ElMessage.error(`维度 "${dim.name}" 下存在未命名的指标`);
                 return false;
             }
        }
    }
    return true;
};

// 保存配置 (模拟)
const saveConfig = () => {
  if (!validateConfig()) {
      return;
  }
  saving.value = true;
  console.log('保存评分配置:', JSON.parse(JSON.stringify(config)));
  // 模拟 API 调用
  setTimeout(() => {
    saving.value = false;
    ElMessage.success('评分配置已保存');
  }, 1000);
};

// --- 生命周期 ---
onMounted(() => {
  loadMockConfig(); // 加载初始模拟数据
});

</script>

<style scoped>
.rating-config-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dimension-block {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 20px;
    background-color: #fafafa;
}
.dimension-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e4e7ed;
}
.dimension-header .el-input {
    font-weight: bold;
}
.indicators-list {
    padding-left: 20px;
}
.indicator-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

/* 调整 Alert 样式 */
.el-alert {
    line-height: 1.6;
}
.el-alert p {
    margin: 5px 0;
}
</style> 