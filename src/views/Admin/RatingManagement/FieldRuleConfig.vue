<template>
  <div class="field-rule-config-container">
    <el-row :gutter="20">
      <!-- 规则创建/编辑区域 -->
      <el-col :span="10">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ isEditing ? '编辑字段规则' : '创建新字段规则' }}</span>
              <el-button v-if="isEditing" type="text" @click="cancelEdit">取消编辑</el-button>
            </div>
          </template>
          <el-form :model="ruleForm" ref="ruleFormRef" :rules="formRules" label-width="120px" label-position="top">
            <el-form-item label="规则名称" prop="name">
              <el-input v-model="ruleForm.name" placeholder="例如：提货晚点或金额超限"></el-input>
            </el-form-item>

            <el-form-item label="数据来源表" prop="sourceTable">
              <el-select v-model="ruleForm.sourceTable" placeholder="选择数据表" clearable @change="handleTableChange">
                 <el-option v-for="table in dataTables" :key="table.value" :label="table.label" :value="table.value" />
              </el-select>
            </el-form-item>

            <el-form-item label="规则逻辑" prop="logic.conditions">
               <div class="rule-logic-group">
                  <!-- 移除顶层连接符选择 -->

                 <!-- 条件列表 -->
                 <div v-for="(condition, index) in ruleForm.logic.conditions" :key="condition.id || index">
                    <!-- 条件间连接符选择 (显示在条件上方，从第二个条件开始) -->
                    <div v-if="index > 0" class="connector-selector">
                      <el-radio-group v-model="condition.connector" size="small">
                          <el-radio-button label="AND">AND</el-radio-button>
                          <el-radio-button label="OR">OR</el-radio-button>
                      </el-radio-group>
                    </div>

                    <div class="condition-item">
                      <el-row :gutter="10" align="middle">
                        <el-col :span="20">
                          <!-- 条件类型选择 -->
                          <el-select v-model="condition.type" placeholder="条件类型" size="small" style="margin-bottom: 5px; width: 150px;">
                            <el-option label="字段比较" value="comparison"></el-option>
                            <el-option label="计算比较" value="calculation"></el-option>
                          </el-select>

                          <!-- 字段比较构建器 -->
                          <div v-if="condition.type === 'comparison'" class="rule-logic-builder">
                             <el-select v-model="condition.leftOperand.field" placeholder="选择字段" size="small" clearable filterable :disabled="!ruleForm.sourceTable" style="width: 160px;">
                               <el-option v-for="field in getAllFields(ruleForm.sourceTable)" :key="field.value" :label="field.label" :value="field.value" />
                             </el-select>
                             <el-select v-model="condition.operator" placeholder="比较符" size="small" style="width: 100px;">
                               <el-option v-for="op in comparisonOperators" :key="op.value" :label="op.label" :value="op.value" />
                             </el-select>
                             <template v-if="!isUnaryOperator(condition.operator)">
                                <el-select v-model="condition.rightOperand.type" placeholder="类型" size="small" style="width: 70px;" @change="condition.rightOperand.value = null">
                                  <el-option label="字段" value="field" />
                                  <el-option label="常量" value="constant" />
                                </el-select>
                                <el-select v-if="condition.rightOperand.type === 'field'" v-model="condition.rightOperand.value" placeholder="选择字段" size="small" clearable filterable :disabled="!ruleForm.sourceTable" style="width: 160px;">
                                  <el-option v-for="field in getAllFields(ruleForm.sourceTable)" :key="field.value" :label="field.label" :value="field.value" />
                                </el-select>
                                <el-input v-else v-model="condition.rightOperand.value" placeholder="输入常量值" size="small" clearable style="width: 160px;" />
                             </template>
                          </div>

                          <!-- 计算比较构建器 -->
                           <div v-else-if="condition.type === 'calculation'" class="rule-logic-builder">
                             <el-select v-model="condition.fieldA" placeholder="字段A" size="small" clearable filterable :disabled="!ruleForm.sourceTable" style="width: 130px;">
                               <el-option v-for="field in getNumericOrDateFields(ruleForm.sourceTable)" :key="field.value" :label="field.label" :value="field.value" />
                             </el-select>
                             <el-select v-model="condition.calcOperator" placeholder="算术符" size="small" style="width: 60px;">
                                <el-option label="-" value="-"></el-option>
                             </el-select>
                             <el-select v-model="condition.fieldB" placeholder="字段B" size="small" clearable filterable :disabled="!ruleForm.sourceTable" style="width: 130px;">
                               <el-option v-for="field in getNumericOrDateFields(ruleForm.sourceTable)" :key="field.value" :label="field.label" :value="field.value" />
                             </el-select>
                              <el-select v-model="condition.comparisonOperator" placeholder="比较符" size="small" style="width: 80px;">
                                 <el-option v-for="op in numericComparisonOperators" :key="op.value" :label="op.label" :value="op.value" />
                              </el-select>
                              <el-input v-model="condition.constantValue" placeholder="常量值" size="small" clearable style="width: 100px;" />
                          </div>
                        </el-col>
                        <el-col :span="4" style="text-align: right;">
                            <el-button type="danger" :icon="Delete" circle plain size="small" @click="removeCondition(index)" :disabled="ruleForm.logic.conditions.length <= 1"></el-button>
                        </el-col>
                      </el-row>
                    </div>
                 </div>

                 <!-- 添加条件按钮 -->
                 <el-button type="primary" link :icon="Plus" @click="addCondition" style="margin-top: 10px;">添加条件</el-button>
               </div>
            </el-form-item>

            <!-- 新增：扣分分值 -->
            <el-form-item label="扣分分值" prop="deductionPoints">
              <el-input-number v-model="ruleForm.deductionPoints" :min="0" :step="1" controls-position="right" placeholder="规则触发时扣除的分数" style="width: 100%;"></el-input-number>
            </el-form-item>

            <el-form-item label="规则描述 (可选)">
               <el-input type="textarea" v-model="ruleForm.description" placeholder="简要说明规则的用途"></el-input>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="submitForm" :loading="saving">{{ isEditing ? '更新规则' : '创建规则' }}</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 规则列表区域 -->
      <el-col :span="14">
         <el-card>
           <template #header>
             <div class="card-header">
               <span>已配置的字段规则</span>
             </div>
           </template>
            <el-table :data="configuredRules" style="width: 100%" border height="500px" v-loading="loadingRules">
                <el-table-column prop="name" label="规则名称" width="180" show-overflow-tooltip/>
                <el-table-column label="规则逻辑" min-width="300">
                  <template #default="scope">
                     <div v-html="formatRuleLogic(scope.row.logic, scope.row.sourceTable)"></div>
                  </template>
                </el-table-column>
                <!-- 新增：扣分分值列 -->
                <el-table-column prop="deductionPoints" label="扣分分值" width="100" align="center">
                  <template #default="scope">
                    <span style="color: red; font-weight: bold;">-{{ scope.row.deductionPoints || 0 }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" show-overflow-tooltip/>
                <el-table-column label="操作" width="150" align="center">
                    <template #default="scope">
                        <el-button size="small" type="primary" @click="editRule(scope.row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deleteRule(scope.row.id)">删除</el-button>
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
import { Plus, Delete } from '@element-plus/icons-vue';
import { v4 as uuidv4 } from 'uuid';

// --- refs ---
const ruleFormRef = ref(null);

// --- state ---
const isEditing = ref(false);
const editingRuleId = ref(null);
const saving = ref(false);
const loadingRules = ref(false);

// 创建新的空条件
const createNewCondition = (type = 'comparison', connector = 'AND') => { // 添加默认 connector
    const baseCondition = { id: uuidv4(), type: type, connector: connector }; // 添加 connector 到基础对象
    if (type === 'comparison') {
        return {
            ...baseCondition,
            leftOperand: { field: null },
            operator: null,
            rightOperand: { type: 'constant', value: null },
        };
    } else if (type === 'calculation') {
        return {
            ...baseCondition,
            fieldA: null,
            calcOperator: '-',
            fieldB: null,
            comparisonOperator: null,
            constantValue: null,
        };
    }
    return baseCondition;
};

// 规则表单数据模型
const initialRuleForm = () => ({
  id: null,
  name: '',
  description: '',
  sourceTable: null,
  deductionPoints: 0, // 新增：默认扣 0 分
  logic: {
    // groupOperator: 'AND', // 移除 groupOperator
    conditions: [createNewCondition('comparison')] // 第一个条件的 connector 实际无作用，但保持结构一致
  }
});
const ruleForm = reactive(initialRuleForm());

// 表单验证规则
const formRules = reactive({
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  sourceTable: [{ required: true, message: '请选择数据来源表', trigger: 'change' }],
  deductionPoints: [
      { required: true, message: '请输入扣分分值', trigger: 'blur' },
      { type: 'number', message: '扣分分值必须为数字' },
      { validator: (rule, value, callback) => {
          if (value < 0) {
              callback(new Error('扣分分值不能为负数'));
          } else {
              callback();
          }
        }, trigger: 'blur' }
  ]
});

// 已配置的规则列表 (模拟)
const configuredRules = ref([]);

// --- 模拟数据 ---
const dataTables = ref([]);
const tableFields = ref({});

// 字段比较操作符
const comparisonOperators = ref([
  { value: '>=', label: '>=' }, { value: '<=', label: '<=' },
  { value: '>', label: '>' }, { value: '<', label: '<' },
  { value: '==', label: '==' }, { value: '!=', label: '!=' },
  { value: 'is_empty', label: '为空' }, { value: 'is_not_empty', label: '不为空' },
  { value: 'earlier_than', label: '早于' }, { value: 'later_than', label: '晚于' },
]);
// 数值比较操作符 (用于计算比较)
const numericComparisonOperators = ref([
   { value: '>=', label: '>=' }, { value: '<=', label: '<=' },
   { value: '>', label: '>' }, { value: '<', label: '<' },
   { value: '==', label: '==' }, { value: '!=', label: '!=' },
]);

const unaryOperators = ['is_empty', 'is_not_empty'];

// --- Lifecycle ---
onMounted(async () => {
  await loadTableAndFieldMetadata();
  await loadConfiguredRules();
});

// --- 模拟 API 调用 ---
const loadTableAndFieldMetadata = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    dataTables.value = [
        { value: 'order', label: '订单表 (order)' },
        { value: 'cargo_damage', label: '货损记录表 (cargo_damage)' },
    ];
    tableFields.value = {
        order: [
            { value: 'planned_pickup_time', label: '计划提货时间', type: 'datetime' },
            { value: 'actual_pickup_time', label: '实际提货时间', type: 'datetime' },
            { value: 'pickup_duration', label: '提货用时(小时)', type: 'number'},
            { value: 'order_amount', label: '订单金额', type: 'number' },
            { value: 'remarks', label: '备注', type: 'string'}
        ],
        cargo_damage: [
            { value: 'damage_amount', label: '货损金额', type: 'number' },
            { value: 'compensation_amount', label: '赔偿金额', type: 'number'},
            { value: 'is_compensated', label: '是否赔付', type: 'boolean'}
        ],
    };
};

const loadConfiguredRules = async () => {
  loadingRules.value = true;
  await new Promise(resolve => setTimeout(resolve, 500));
  configuredRules.value = [
    {
      id: 'rule_1', name: '实际提货晚点', description: '', sourceTable: 'order',
      deductionPoints: 5, // 添加扣分
      logic: {
          conditions: [
              { id: uuidv4(), type: 'comparison', connector: 'AND', leftOperand: { field: 'actual_pickup_time' }, operator: 'later_than', rightOperand: { type: 'field', value: 'planned_pickup_time' } }
          ]
      }
    },
    {
      id: 'rule_mixed', name: '提货晚点 且 (金额>5000 或 备注为空)', description: '', sourceTable: 'order',
      deductionPoints: 10, // 添加扣分
      logic: {
          conditions: [
              { id: uuidv4(), type: 'comparison', connector: 'AND', leftOperand: { field: 'actual_pickup_time' }, operator: 'later_than', rightOperand: { type: 'field', value: 'planned_pickup_time' } },
              { id: uuidv4(), type: 'comparison', connector: 'OR', leftOperand: { field: 'order_amount' }, operator: '>', rightOperand: { type: 'constant', value: '5000' } }, // 这个 AND 连接上面，下面的 OR 连接这个和下一个
              { id: uuidv4(), type: 'comparison', connector: 'AND', leftOperand: { field: 'remarks' }, operator: 'is_empty', rightOperand: { type: 'constant', value: null } } // 最后一个 connector 无效
          ]
      }
    },
    {
       id: 'rule_calc_or', name: '货损金额>1000 或 赔偿金额>500', description: '', sourceTable: 'cargo_damage',
       deductionPoints: 15, // 添加扣分
       logic: {
            conditions: [
                { id: uuidv4(), type: 'comparison', connector: 'OR', leftOperand: { field: 'damage_amount' }, operator: '>', rightOperand: { type: 'constant', value: '1000' } },
                { id: uuidv4(), type: 'comparison', connector: 'AND', leftOperand: { field: 'compensation_amount' }, operator: '>', rightOperand: { type: 'constant', value: '500' } }
            ]
       }
    },
  ];
  loadingRules.value = false;
};

// --- Methods ---
const getAllFields = (tableName) => {
    return tableName && tableFields.value[tableName] ? tableFields.value[tableName] : [];
};
const getNumericOrDateFields = (tableName) => {
     const fields = getAllFields(tableName);
     return fields.filter(f => ['number', 'datetime'].includes(f.type));
}
const getFieldLabel = (tableName, fieldValue) => {
    const fields = getAllFields(tableName);
    const field = fields.find(f => f.value === fieldValue);
    return field ? field.label : fieldValue;
}
const isUnaryOperator = (operator) => {
    return unaryOperators.includes(operator);
}

// 格式化单个条件逻辑
const formatSingleCondition = (condition, sourceTable) => {
    let formattedContent = '';
    if (!condition) return '(无效条件)';

    if (condition.type === 'comparison') {
        if (!condition.leftOperand || !condition.leftOperand.field || !condition.operator) return '(无效字段比较)';
        const leftFieldLabel = getFieldLabel(sourceTable, condition.leftOperand.field);
        const operatorLabel = comparisonOperators.value.find(op => op.value === condition.operator)?.label || condition.operator;
        formattedContent = `[${leftFieldLabel}] ${operatorLabel}`;
        if (!isUnaryOperator(condition.operator)) {
            if (condition.rightOperand) {
                 if (condition.rightOperand.type === 'field') {
                     const rightFieldLabel = getFieldLabel(sourceTable, condition.rightOperand.value);
                     formattedContent += ` [${rightFieldLabel || '未选字段'}]`;
                 } else if (condition.rightOperand.type === 'constant') {
                     formattedContent += ` "${condition.rightOperand.value || ''}"`;
                 }
            } else { formattedContent += ' [未配置]'; }
        }
    } else if (condition.type === 'calculation') {
         if (!condition.fieldA || !condition.calcOperator || !condition.fieldB || !condition.comparisonOperator) return '(无效计算比较)';
         const fieldALabel = getFieldLabel(sourceTable, condition.fieldA);
         const fieldBLabel = getFieldLabel(sourceTable, condition.fieldB);
         const comparisonOpLabel = numericComparisonOperators.value.find(op => op.value === condition.comparisonOperator)?.label || condition.comparisonOperator;
         formattedContent = `([${fieldALabel}] ${condition.calcOperator} [${fieldBLabel}]) ${comparisonOpLabel} "${condition.constantValue || ''}"`;
    } else {
        formattedContent = `未知条件类型: ${condition.type}`;
    }
    return `(${formattedContent})`;
};

// 格式化整个规则逻辑
const formatRuleLogic = (logic, sourceTable) => {
    if (!logic || !logic.conditions || logic.conditions.length === 0) return '未配置逻辑';

    let result = '';
    logic.conditions.forEach((cond, index) => {
        const formattedCond = formatSingleCondition(cond, sourceTable);
        if (index === 0) {
            result += formattedCond; // 第一个条件直接添加
        } else {
            // 从第二个条件开始，添加上一个条件的连接符
            const connector = logic.conditions[index - 1]?.connector || 'AND'; // 获取上一个条件的连接符，默认为 AND
            const operatorStr = connector === 'OR' ? ' <span style="color: orange; font-weight: bold;">OR</span> ' : ' <span style="color: blue; font-weight: bold;">AND</span> ';
            result += operatorStr + formattedCond;
        }
    });

    return result;
};

// 处理数据表选择变化
const handleTableChange = () => {
    ruleForm.logic.conditions.forEach(cond => {
        if (cond.type === 'comparison') {
            cond.leftOperand.field = null;
            if (cond.rightOperand.type === 'field') {
                cond.rightOperand.value = null;
            }
        } else if (cond.type === 'calculation') {
            cond.fieldA = null;
            cond.fieldB = null;
        }
    });
    ruleFormRef.value?.clearValidate();
};

// 添加条件
const addCondition = () => {
    // 新添加的条件，其 connector 决定了它和 *下一个* 条件的关系，默认为 AND
    ruleForm.logic.conditions.push(createNewCondition('comparison', 'AND'));
};

// 移除条件
const removeCondition = (index) => {
    if (ruleForm.logic.conditions.length > 1) {
        ruleForm.logic.conditions.splice(index, 1);
    }
};

// 重置表单
const resetForm = () => {
  const initial = initialRuleForm();
  Object.assign(ruleForm, JSON.parse(JSON.stringify(initial)));
  isEditing.value = false;
  editingRuleId.value = null;
  nextTick(() => {
      ruleFormRef.value?.clearValidate();
  });
};

// 取消编辑
const cancelEdit = () => {
    resetForm();
};

// 编辑规则
const editRule = (rule) => {
    isEditing.value = true;
    editingRuleId.value = rule.id;
    // 深拷贝，并确保 deductionPoints 被加载 (如果旧数据没有，initialRuleForm 会提供默认值)
    const initial = initialRuleForm();
    const ruleDataToLoad = { ...initial, ...JSON.parse(JSON.stringify(rule)) };
    Object.assign(ruleForm, ruleDataToLoad);
     if (ruleForm.logic && ruleForm.logic.conditions) {
         ruleForm.logic.conditions.forEach(cond => {
             if (!cond.id) cond.id = uuidv4();
             if (cond.connector === undefined) cond.connector = 'AND';
         });
     }
     nextTick(() => {
        ruleFormRef.value?.clearValidate();
     });
};

// 删除规则
const deleteRule = (ruleId) => {
    ElMessageBox.confirm('确定要删除这条规则吗？此操作不可撤销。', '确认删除', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    }).then(async () => {
        console.log('删除规则 ID:', ruleId);
        saving.value = true;
        await new Promise(resolve => setTimeout(resolve, 300));
        saving.value = false;
        ElMessage.success('规则删除成功');
        loadConfiguredRules();
         if (isEditing.value && editingRuleId.value === ruleId) {
             resetForm();
         }
    }).catch(() => {});
};

// 验证单个条件是否有效
const validateCondition = (condition, index) => {
    const prefix = `条件 #${index + 1}: `;
    if (!condition.type) {
         ElMessage.error(`${prefix}请选择条件类型`); return false;
    }
    if (condition.type === 'comparison') {
        if (!condition.leftOperand || !condition.leftOperand.field) { ElMessage.error(`${prefix}请选择左侧字段`); return false; }
        if (!condition.operator) { ElMessage.error(`${prefix}请选择比较符`); return false; }
        if (!isUnaryOperator(condition.operator)) {
            if (!condition.rightOperand || !condition.rightOperand.type) { ElMessage.error(`${prefix}请选择右侧操作数类型`); return false; }
            if (condition.rightOperand.value === null || condition.rightOperand.value === undefined || condition.rightOperand.value === '') {
                 const msg = condition.rightOperand.type === 'field' ? '请选择右侧字段' : '请输入右侧常量值';
                 ElMessage.error(`${prefix}${msg}`); return false;
             }
        }
    } else if (condition.type === 'calculation') {
        if (!condition.fieldA) { ElMessage.error(`${prefix}请选择计算字段A`); return false; }
        if (!condition.calcOperator) { ElMessage.error(`${prefix}请选择算术运算符`); return false; }
        if (!condition.fieldB) { ElMessage.error(`${prefix}请选择计算字段B`); return false; }
        if (!condition.comparisonOperator) { ElMessage.error(`${prefix}请选择比较运算符`); return false; }
        if (condition.constantValue === null || condition.constantValue === undefined || condition.constantValue === '') {
             ElMessage.error(`${prefix}请输入常量值`); return false;
        }
    } else {
        ElMessage.error(`${prefix}未知的条件类型`); return false;
    }

    // 验证连接符 (除最后一个条件外)
    if (index < ruleForm.logic.conditions.length - 1 && !condition.connector) {
        ElMessage.error(`${prefix}请为该条件选择一个连接到下一条件的运算符 (AND/OR)`);
        return false;
    }
    return true;
};

// 提交表单 (创建或更新)
const submitForm = () => {
  ruleFormRef.value?.validate(async (valid) => {
    if (valid) {
        if (!ruleForm.logic.conditions || ruleForm.logic.conditions.length === 0) {
            ElMessage.error('请至少配置一个规则条件');
            return;
        }
        let allConditionsValid = true;
        for (let i = 0; i < ruleForm.logic.conditions.length; i++) {
            if (!validateCondition(ruleForm.logic.conditions[i], i)) {
                allConditionsValid = false;
                break;
            }
        }
        if (!allConditionsValid) return;

      saving.value = true;
      try {
        const payload = JSON.parse(JSON.stringify(ruleForm));
        // 清理最后一个条件的无效 connector
        if (payload.logic && payload.logic.conditions && payload.logic.conditions.length > 0) {
             delete payload.logic.conditions[payload.logic.conditions.length - 1].connector;
        }

        if (isEditing.value) {
          console.log('更新规则:', payload);
          await new Promise(resolve => setTimeout(resolve, 500));
          ElMessage.success('规则更新成功');
        } else {
          payload.id = `rule_${uuidv4()}`;
          console.log('创建规则:', payload);
          await new Promise(resolve => setTimeout(resolve, 500));
          ElMessage.success('规则创建成功');
        }
        resetForm();
        loadConfiguredRules();
      } catch (error) {
        console.error('保存规则失败:', error);
        ElMessage.error('保存规则失败，请稍后重试。');
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
.field-rule-config-container {
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
.rule-logic-group {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 15px;
    background-color: #fdfdfd;
}
.connector-selector {
    text-align: center;
    margin: 10px 0;
}
.condition-item {
    border: 1px dashed #e4e7ed;
    padding: 10px;
    /* margin-bottom: 10px; */ /* 由 connector-selector 提供间距 */
    border-radius: 4px;
    background-color: #fff;
}
.condition-item .el-row {
    width: 100%;
}
.rule-logic-builder {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    background-color: #fafcff;
    margin-top: 5px;
}
.el-select {
    width: 100%;
}
.rule-logic-builder .el-select,
.rule-logic-builder .el-input {
     width: auto;
     min-width: 80px;
}
:deep(.el-table .cell) {
    text-align: left;
    line-height: 1.4;
    white-space: normal;
}
:deep(.el-table .cell > div) {
   white-space: normal;
}
</style> 