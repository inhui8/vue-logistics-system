/* eslint-disable @typescript-eslint/no-explicit-any */
<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" class="tag-group-form">
    <el-form-item label="分组名称" prop="groupName">
      <el-input v-model="formData.groupName" placeholder="请输入分组名称" />
    </el-form-item>

    <el-form-item label="描述" prop="description">
      <el-input v-model="formData.description" type="textarea" placeholder="请输入分组描述" />
    </el-form-item>

    <el-form-item label="标签规则" prop="rules" class="rules-container">
      <div class="rules-builder">
        <div v-for="(rule, ruleIndex) in formData.rules" :key="ruleIndex" class="rule-group">
          <!-- 规则组标题和操作 -->
          <div class="rule-group-header">
            <span class="rule-group-title">规则组 {{ ruleIndex + 1 }}</span>
            <div class="rule-group-actions">
              <el-button type="primary" link @click="addCondition(ruleIndex)">添加条件</el-button>
              <el-button type="danger" link @click="removeRuleGroup(ruleIndex)">删除组</el-button>
            </div>
          </div>

          <!-- 规则条件列表 -->
          <div class="rule-conditions">
            <div 
              v-for="(condition, condIndex) in rule.conditions" 
              :key="condIndex"
              class="rule-condition"
            >
              <!-- 标签选择 -->
              <el-select 
                v-model="condition.tagKey" 
                filterable 
                placeholder="选择标签"
                @change="handleTagChange(ruleIndex, condIndex)"
                class="condition-item"
              >
                <el-option-group
                  v-for="group in tagOptions"
                  :key="group.category"
                  :label="group.label"
                >
                  <el-option
                    v-for="tag in group.tags"
                    :key="tag.tagKey"
                    :label="tag.description"
                    :value="tag.tagKey"
                  />
                </el-option-group>
              </el-select>

              <!-- 操作符选择 -->
              <el-select 
                v-model="condition.operator" 
                placeholder="选择操作符"
                class="condition-item operator-select"
              >
                <el-option
                  v-for="op in getOperators(condition.tagKey)"
                  :key="op.value"
                  :label="op.label"
                  :value="op.value"
                />
              </el-select>

              <!-- 值输入/选择 -->
              <div class="value-input condition-item">
                <!-- 字符串类型 -->
                <el-input 
                  v-if="getTagType(condition.tagKey) === 'String'"
                  v-model="condition.value"
                  placeholder="输入值"
                />
                
                <!-- 数字类型 -->
                <el-input-number 
                  v-else-if="getTagType(condition.tagKey) === 'Number'"
                  v-model="condition.value"
                  :controls="false"
                  placeholder="输入数值"
                />
                
                <!-- 布尔类型 -->
                <el-select
                  v-else-if="getTagType(condition.tagKey) === 'Boolean'"
                  v-model="condition.value"
                  placeholder="选择值"
                >
                  <el-option label="是" :value="true" />
                  <el-option label="否" :value="false" />
                </el-select>
                
                <!-- 枚举类型 -->
                <el-select
                  v-else-if="getTagType(condition.tagKey) === 'Enum'"
                  v-model="condition.value"
                  placeholder="选择值"
                >
                  <el-option
                    v-for="opt in getEnumOptions(condition.tagKey)"
                    :key="opt.key"
                    :label="opt.value"
                    :value="opt.key"
                  />
                </el-select>
              </div>

              <!-- 删除条件按钮 -->
              <el-button 
                type="danger" 
                link 
                circle
                @click="removeCondition(ruleIndex, condIndex)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <!-- 条件组关系选择 -->
          <div class="rule-group-relation" v-if="rule.conditions.length > 1">
            <el-radio-group v-model="rule.relation">
              <el-radio label="AND">满足所有条件</el-radio>
              <el-radio label="OR">满足任一条件</el-radio>
            </el-radio-group>
          </div>
        </div>

        <!-- 添加规则组按钮 -->
        <div class="add-rule-group">
          <el-button type="primary" plain @click="addRuleGroup">
            <el-icon><Plus /></el-icon>添加规则组
          </el-button>
          <div class="form-tip">
            多个规则组之间为"或"关系，组内条件可选"与"或"或"关系
          </div>
        </div>
      </div>
    </el-form-item>
  </el-form>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Delete, Plus } from '@element-plus/icons-vue';

// 模拟可用的标签数据
const availableTags = [
  {
    tagKey: 'business.userType',
    description: '用户类型',
    category: 'Business',
    valueType: 'Enum',
    allowedValues: [
      { key: 'VIP', value: 'VIP会员' },
      { key: 'NORMAL', value: '普通用户' }
    ]
  },
  {
    tagKey: 'business.vipLevel',
    description: 'VIP等级',
    category: 'Business',
    valueType: 'Number'
  },
  {
    tagKey: 'warning.orderRisk',
    description: '订单风险等级',
    category: 'Warning',
    valueType: 'Enum',
    allowedValues: [
      { key: 'high', value: '高风险' },
      { key: 'medium', value: '中风险' },
      { key: 'low', value: '低风险' }
    ]
  },
  {
    tagKey: 'error.paymentCount',
    description: '支付失败次数',
    category: 'Anomaly',
    valueType: 'Number'
  }
];

// 操作符映射
const operatorMap = {
  String: [
    { label: '等于', value: '=' },
    { label: '不等于', value: '!=' },
    { label: '包含', value: 'contains' },
    { label: '不包含', value: 'not_contains' }
  ],
  Number: [
    { label: '等于', value: '=' },
    { label: '不等于', value: '!=' },
    { label: '大于', value: '>' },
    { label: '大于等于', value: '>=' },
    { label: '小于', value: '<' },
    { label: '小于等于', value: '<=' }
  ],
  Boolean: [
    { label: '等于', value: '=' },
    { label: '不等于', value: '!=' }
  ],
  Enum: [
    { label: '等于', value: '=' },
    { label: '不等于', value: '!=' },
    { label: '属于', value: 'in' },
    { label: '不属于', value: 'not_in' }
  ]
};

export default {
  name: 'TagGroupForm',
  components: {
    Delete,
    Plus
  },
  props: {
    initialData: {
      type: Object,
      default: null
    },
    mode: {
      type: String,
      default: 'add'
    }
  },
  emits: ['save-success'],
  setup(props, { emit }) {
    const formRef = ref(null);
    
    // 表单数据
    const formData = reactive({
      groupName: '',
      description: '',
      rules: [
        {
          conditions: [createEmptyCondition()],
          relation: 'AND'
        }
      ]
    });

    // 表单验证规则
    const formRules = {
      groupName: [
        { required: true, message: '请输入分组名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
      ],
      description: [
        { required: true, message: '请输入分组描述', trigger: 'blur' },
        { max: 200, message: '最多 200 个字符', trigger: 'blur' }
      ],
      rules: [
        {
          validator: validateRules,
          trigger: 'change'
        }
      ]
    };

    // 标签选项
    const tagOptions = computed(() => {
      const groups = {};
      availableTags.forEach(tag => {
        if (!groups[tag.category]) {
          groups[tag.category] = {
            category: tag.category,
            label: `${tag.category} 标签`,
            tags: []
          };
        }
        groups[tag.category].tags.push(tag);
      });
      return Object.values(groups);
    });

    // 创建空条件
    function createEmptyCondition() {
      return {
        tagKey: '',
        operator: '',
        value: null
      };
    }

    // 验证规则
    function validateRules(rule, value, callback) {
      if (!formData.rules.length) {
        callback(new Error('至少需要一个规则组'));
        return;
      }

      for (const group of formData.rules) {
        if (!group.conditions.length) {
          callback(new Error('规则组不能为空'));
          return;
        }

        for (const condition of group.conditions) {
          if (!condition.tagKey || !condition.operator || condition.value === null || condition.value === '') {
            callback(new Error('请完善所有规则条件'));
            return;
          }
        }
      }

      callback();
    }

    // 获取标签类型
    function getTagType(tagKey) {
      const tag = availableTags.find(t => t.tagKey === tagKey);
      return tag ? tag.valueType : null;
    }

    // 获取操作符选项
    function getOperators(tagKey) {
      const type = getTagType(tagKey);
      return type ? operatorMap[type] : [];
    }

    // 获取枚举选项
    function getEnumOptions(tagKey) {
      const tag = availableTags.find(t => t.tagKey === tagKey);
      return tag && tag.valueType === 'Enum' ? tag.allowedValues : [];
    }

    // 处理标签变化
    function handleTagChange(ruleIndex, condIndex) {
      const condition = formData.rules[ruleIndex].conditions[condIndex];
      condition.operator = '';
      condition.value = null;
    }

    // 添加规则组
    function addRuleGroup() {
      formData.rules.push({
        conditions: [createEmptyCondition()],
        relation: 'AND'
      });
    }

    // 删除规则组
    function removeRuleGroup(index) {
      if (formData.rules.length === 1) {
        ElMessage.warning('至少保留一个规则组');
        return;
      }
      formData.rules.splice(index, 1);
    }

    // 添加条件
    function addCondition(ruleIndex) {
      formData.rules[ruleIndex].conditions.push(createEmptyCondition());
    }

    // 删除条件
    function removeCondition(ruleIndex, condIndex) {
      const conditions = formData.rules[ruleIndex].conditions;
      if (conditions.length === 1) {
        ElMessage.warning('至少保留一个条件');
        return;
      }
      conditions.splice(condIndex, 1);
    }

    // 提交表单
    async function submitForm() {
      if (!formRef.value) return;

      try {
        await formRef.value.validate();
        
        // 生成规则摘要
        const rulesSummary = formData.rules.map(group => {
          return group.conditions.map(cond => {
            const tag = availableTags.find(t => t.tagKey === cond.tagKey);
            let valueDisplay = cond.value;
            if (tag?.valueType === 'Enum') {
              const enumOption = tag.allowedValues.find(v => v.key === cond.value);
              valueDisplay = enumOption?.value || cond.value;
            }
            return `${cond.tagKey} ${cond.operator} ${valueDisplay}`;
          }).join(group.relation === 'AND' ? ' 且 ' : ' 或 ');
        });

        // 构造保存的数据
        const saveData = {
          id: props.mode === 'edit' ? props.initialData.id : Date.now(),
          groupName: formData.groupName,
          description: formData.description,
          rules: formData.rules,
          rulesSummary,
          creator: 'CurrentUser',
          createdAt: props.mode === 'edit' ? props.initialData.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        emit('save-success', saveData);
      } catch (error) {
        console.error('Form validation failed:', error);
      }
    }

    // 重置表单
    function resetForm() {
      if (formRef.value) {
        formRef.value.resetFields();
      }
      formData.rules = [
        {
          conditions: [createEmptyCondition()],
          relation: 'AND'
        }
      ];
    }

    // 监听 initialData 变化
    watch(() => props.initialData, (newVal) => {
      if (newVal === undefined || newVal === null) {
        return;
      }
      
      try {
        const data = typeof newVal === 'string' ? JSON.parse(newVal) : newVal;
        setFormData(data);
      } catch (error) {
        console.error('Failed to parse initial data:', error);
        ElMessage.error('初始化数据格式错误');
      }
    }, { immediate: true });

    // 设置表单数据
    function setFormData(data) {
      if (!data) {
        formData.groupName = '';
        formData.description = '';
        formData.rules = [{ conditions: [createEmptyCondition()], relation: 'AND' }];
        return;
      }
      
      formData.groupName = data.groupName || '';
      formData.description = data.description || '';
      formData.rules = data.rules || [{ conditions: [createEmptyCondition()], relation: 'AND' }];
    }

    return {
      formRef,
      formData,
      formRules,
      tagOptions,
      getTagType,
      getOperators,
      getEnumOptions,
      handleTagChange,
      addRuleGroup,
      removeRuleGroup,
      addCondition,
      removeCondition,
      submitForm,
      resetForm
    };
  }
};
</script>

<style scoped>
.tag-group-form {
  padding: 20px;
}

.rules-container {
  margin-bottom: 20px;
}

.rules-builder {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 20px;
}

.rule-group {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
}

.rule-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.rule-group-title {
  font-weight: bold;
  color: #606266;
}

.rule-conditions {
  margin-bottom: 10px;
}

.rule-condition {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.condition-item {
  margin-right: 10px;
}

.condition-item:first-child {
  width: 200px;
}

.operator-select {
  width: 120px;
}

.value-input {
  width: 150px;
}

.rule-group-relation {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e4e7ed;
}

.add-rule-group {
  text-align: center;
  margin-top: 20px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
</style> 