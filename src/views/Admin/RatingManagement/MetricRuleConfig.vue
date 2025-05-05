<template>
  <div class="metric-rule-config-container">
    <el-row :gutter="20">
      <!-- 配置表单区域 -->
      <el-col :span="10">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ isEditing ? '编辑指标规则' : '创建新指标规则' }}</span>
              <el-button v-if="isEditing" type="text" @click="cancelEdit">取消编辑</el-button>
            </div>
          </template>
          <el-form :model="metricForm" ref="metricFormRef" :rules="formRules" label-position="top">
            <el-form-item label="指标规则名称" prop="name">
              <el-input v-model="metricForm.name" placeholder="例如：准时提货率评分"></el-input>
            </el-form-item>

            <el-form-item label="所属维度" prop="dimensionId">
               <el-select v-model="metricForm.dimensionId" placeholder="选择归属的评分维度" style="width: 100%;">
                 <el-option
                   v-for="dim in availableDimensions"
                   :key="dim.id"
                   :label="`${dim.name} (${dim.weight}%)`"
                   :value="dim.id">
                 </el-option>
               </el-select>
            </el-form-item>

            <el-form-item label="计算周期" prop="calculationPeriod">
              <el-select v-model="metricForm.calculationPeriod" placeholder="选择计算周期" style="width: 100%;">
                <el-option label="月度" value="monthly"></el-option>
                <el-option label="季度" value="quarterly"></el-option>
                <!-- <el-option label="年度" value="yearly"></el-option> -->
              </el-select>
            </el-form-item>

            <el-form-item label="基础数据表" prop="baseDataTable">
              <el-select v-model="metricForm.baseDataTable" placeholder="选择计算依据的主要数据表" style="width: 100%;">
                <el-option v-for="table in dataTables" :key="table.value" :label="table.label" :value="table.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="关联字段规则" prop="associatedFieldRuleIds">
               <!-- TODO: 替换为更合适的组件，如多选下拉或穿梭框 -->
               <el-alert type="info" :closable="false">
                 请选择计算此指标时需要评估的所有字段规则。
                 (UI 待实现，当前请手动记录或在描述中注明)
               </el-alert>
               <el-select
                  v-model="metricForm.associatedFieldRuleIds"
                  multiple
                  filterable
                  placeholder="选择关联的字段规则 (多选)"
                  style="width: 100%; margin-top: 10px;"
                  disabled
                 >
                 <!-- 选项需要加载 FieldRuleConfig 中配置的规则 -->
               </el-select>
            </el-form-item>

            <el-form-item label="得分计算方法" prop="calculationMethod">
              <el-select v-model="metricForm.calculationMethod" placeholder="选择得分计算方式" style="width: 100%;">
                <el-option label="成功率 (1 - 失败率)" value="SUCCESS_RATE"></el-option>
                <el-option label="扣分累加制 (满分 - 总扣分)" value="DEDUCTION_SUBTRACT"></el-option>
                <el-option label="仅统计总扣分值" value="DEDUCTION_SUM"></el-option>
                <el-option label="自定义分数映射 (待明确)" value="CUSTOM_FORMULA_A" disabled></el-option>
                <!-- 可以添加更多计算模型 -->
              </el-select>
            </el-form-item>

             <el-form-item label="满分值" prop="maxScore">
               <el-input-number v-model="metricForm.maxScore" :min="0" :step="10" controls-position="right" style="width: 100%;"></el-input-number>
             </el-form-item>

            <el-form-item label="描述 (可选)">
               <el-input type="textarea" v-model="metricForm.description" placeholder="简要说明指标规则的计算逻辑和用途"></el-input>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="submitForm" :loading="saving">{{ isEditing ? '更新指标规则' : '创建指标规则' }}</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 已配置规则列表 -->
      <el-col :span="14">
         <el-card>
           <template #header>
             <div class="card-header">
               <span>已配置的指标/维度规则</span>
             </div>
           </template>
            <el-table :data="configuredMetricRules" style="width: 100%" border height="500px" v-loading="loadingRules">
                <el-table-column prop="name" label="规则名称" width="180" show-overflow-tooltip/>
                <el-table-column label="所属维度" width="150">
                    <template #default="scope">
                        {{ getDimensionName(scope.row.dimensionId) }}
                    </template>
                </el-table-column>
                <el-table-column prop="calculationPeriod" label="计算周期" width="100">
                    <template #default="scope">
                        {{ periodMap[scope.row.calculationPeriod] || scope.row.calculationPeriod }}
                    </template>
                </el-table-column>
                 <el-table-column prop="calculationMethod" label="计算方法" width="200">
                     <template #default="scope">
                        {{ calculationMethodMap[scope.row.calculationMethod] || scope.row.calculationMethod }}
                    </template>
                 </el-table-column>
                 <el-table-column prop="maxScore" label="满分值" width="80" align="center"/>
                <!-- <el-table-column prop="description" label="描述" show-overflow-tooltip/> -->
                <el-table-column label="操作" width="150" align="center" fixed="right">
                    <template #default="scope">
                        <el-button size="small" type="primary" @click="editMetricRule(scope.row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deleteMetricRule(scope.row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
         </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { v4 as uuidv4 } from 'uuid';

// --- refs ---
const metricFormRef = ref(null);

// --- state ---
const isEditing = ref(false);
const editingMetricRuleId = ref(null);
const saving = ref(false);
const loadingRules = ref(false);
const availableDimensions = ref([]); // 可选的维度列表
const dataTables = ref([]); // 可选的数据表
// const availableFieldRules = ref([]); // 可选的字段规则 (待加载)

// 指标规则表单模型
const initialMetricForm = () => ({
  id: null,
  name: '',
  description: '',
  dimensionId: null, // 所属维度 ID
  calculationPeriod: 'monthly', // 默认月度
  baseDataTable: null,
  associatedFieldRuleIds: [], // 关联的字段规则 ID 列表
  calculationMethod: 'SUCCESS_RATE', // 默认计算方法
  maxScore: 100, // 默认满分值
  // calculationParams: {} // (可选) 用于存储特定计算方法的参数
});
const metricForm = reactive(initialMetricForm());

// 表单验证规则
const formRules = reactive({
  name: [{ required: true, message: '请输入指标规则名称', trigger: 'blur' }],
  dimensionId: [{ required: true, message: '请选择所属维度', trigger: 'change' }],
  calculationPeriod: [{ required: true, message: '请选择计算周期', trigger: 'change' }],
  baseDataTable: [{ required: true, message: '请选择基础数据表', trigger: 'change' }],
  // associatedFieldRuleIds: [{ required: true, type: 'array', message: '请至少关联一个字段规则', trigger: 'change' }], // 待实现 UI 后启用
  calculationMethod: [{ required: true, message: '请选择得分计算方法', trigger: 'change' }],
  maxScore: [{ required: true, message: '请输入满分值', trigger: 'blur' }, {type: 'number', min: 0, message: '满分值不能小于0'}]
});

// 已配置的指标规则列表
const configuredMetricRules = ref([]);

// --- Mappings for display ---
const periodMap = { monthly: '月度', quarterly: '季度', yearly: '年度' };
const calculationMethodMap = {
    SUCCESS_RATE: '成功率 (1 - 失败率)',
    DEDUCTION_SUBTRACT: '扣分累加制 (满分 - 总扣分)',
    DEDUCTION_SUM: '仅统计总扣分值',
    CUSTOM_FORMULA_A: '自定义分数映射 (待明确)'
};

// --- Lifecycle ---
onMounted(async () => {
  await loadInitialData();
  await loadMetricRules();
});

// --- 模拟 API 调用 ---
const loadInitialData = async () => {
    // TODO: [API] 调用 API 获取维度列表 (从 RatingDimensionConfig 配置的结果)
    await new Promise(resolve => setTimeout(resolve, 100));
    availableDimensions.value = [
        { id: 'dim_1', name: '时效性', weight: 40 },
        { id: 'dim_2', name: '服务质量', weight: 30 },
        { id: 'dim_3', name: '成本控制', weight: 20 },
        { id: 'dim_4', name: '合规与配合度', weight: 10 },
    ];

    // TODO: [API] 调用 API 获取可用数据表列表 (同 FieldRuleConfig)
    await new Promise(resolve => setTimeout(resolve, 100));
    dataTables.value = [
        { value: 'order', label: '订单表 (order)' },
        { value: 'cargo_damage', label: '货损记录表 (cargo_damage)' },
        { value: 'complaint', label: '投诉记录表 (complaint)' },
    ];

    // TODO: [API] 调用 API 获取所有已定义的字段规则 (ID 和 Name 即可)
    // availableFieldRules.value = await api.getFieldRules();
};

const loadMetricRules = async () => {
  loadingRules.value = true;
  // TODO: [API] 调用 API 获取已配置的指标规则列表
  await new Promise(resolve => setTimeout(resolve, 500));
  configuredMetricRules.value = [
    {
      id: `metric_${uuidv4()}`,
      name: '准时提货率评分',
      description: '基于订单实际提货时间和计划时间的比较，计算准时率得分',
      dimensionId: 'dim_1',
      calculationPeriod: 'monthly',
      baseDataTable: 'order',
      associatedFieldRuleIds: ['rule_1'], // 假设 rule_1 是"实际提货晚点"
      calculationMethod: 'SUCCESS_RATE',
      maxScore: 100,
    },
     {
      id: `metric_${uuidv4()}`,
      name: '货损扣分统计',
      description: '累加与货损相关的字段规则扣分',
      dimensionId: 'dim_2',
      calculationPeriod: 'quarterly',
      baseDataTable: 'cargo_damage',
      associatedFieldRuleIds: ['rule_calc_or'], // 假设 rule_calc_or 是"高额货损或未赔付"
      calculationMethod: 'DEDUCTION_SUBTRACT',
      maxScore: 100,
    },
  ];
  loadingRules.value = false;
};

// --- Methods ---
// 获取维度名称用于显示
const getDimensionName = (dimensionId) => {
    const dim = availableDimensions.value.find(d => d.id === dimensionId);
    return dim ? dim.name : '未知维度';
};

// 重置表单
const resetForm = () => {
  // 使用 initialMetricForm 获取新的初始状态对象进行合并
  const initial = initialMetricForm();
  Object.assign(metricForm, initial); // 直接合并，不需要深拷贝，因为 initial 本身是新对象
  isEditing.value = false;
  editingMetricRuleId.value = null;
  nextTick(() => {
      metricFormRef.value?.clearValidate();
  });
};

// 取消编辑
const cancelEdit = () => {
    resetForm();
};

// 编辑规则
const editMetricRule = (rule) => {
    isEditing.value = true;
    editingMetricRuleId.value = rule.id;
    // 深拷贝加载数据
    Object.assign(metricForm, JSON.parse(JSON.stringify(rule)));
     nextTick(() => {
        metricFormRef.value?.clearValidate();
     });
};

// 删除规则
const deleteMetricRule = (ruleId) => {
    const ruleToDelete = configuredMetricRules.value.find(r => r.id === ruleId);
    ElMessageBox.confirm(`确定要删除指标规则 "${ruleToDelete?.name || ruleId}" 吗？`, '确认删除', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    }).then(async () => {
        // TODO: [API] 调用 API 删除指标规则
        console.log('删除指标规则 ID:', ruleId);
        loadingRules.value = true;
        await new Promise(resolve => setTimeout(resolve, 300));
        loadingRules.value = false;
        ElMessage.success('指标规则删除成功');
        loadMetricRules(); // 重新加载列表
         if (isEditing.value && editingMetricRuleId.value === ruleId) {
             resetForm();
         }
    }).catch(() => {});
};

// 提交表单 (创建或更新)
const submitForm = () => {
  metricFormRef.value?.validate(async (valid) => {
    if (valid) {
       // TODO: 可以在这里加入更复杂的验证，比如关联字段规则是否为空等
       // if (!metricForm.associatedFieldRuleIds || metricForm.associatedFieldRuleIds.length === 0) {
       //    ElMessage.error('请至少关联一个字段规则');
       //    return;
       // }

      saving.value = true;
      try {
        const payload = JSON.parse(JSON.stringify(metricForm));

        if (isEditing.value) {
          // TODO: [API] 调用 API 更新指标规则
          console.log('更新指标规则:', payload);
          await new Promise(resolve => setTimeout(resolve, 500));
          ElMessage.success('指标规则更新成功');
        } else {
          // TODO: [API] 调用 API 创建指标规则
          payload.id = `metric_${uuidv4()}`;
          console.log('创建指标规则:', payload);
          await new Promise(resolve => setTimeout(resolve, 500));
          ElMessage.success('指标规则创建成功');
        }
        resetForm();
        loadMetricRules();
      } catch (error) {
        console.error('保存指标规则失败:', error);
        ElMessage.error('保存指标规则失败，请稍后重试。');
      } finally {
        saving.value = false;
      }
    } else {
      ElMessage.error('表单验证失败，请检查输入项。');
      return false;
    }
  });
};

</script>

<style scoped>
.metric-rule-config-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.el-form {
    padding-right: 15px;
}
/* 给 Table 列加一点内边距 */
:deep(.el-table .cell) {
    padding-left: 10px;
    padding-right: 10px;
}
</style> 