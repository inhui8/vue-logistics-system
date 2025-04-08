<template>
    <el-form ref="tagFormRef" :model="formData" :rules="formRules" label-width="120px" class="tag-form">
      <el-form-item label="标签 Key" prop="tagKey">
        <el-input
          v-model="formData.tagKey"
          placeholder="建议格式: category.domain.name (e.g., business.order.userId)"
          :disabled="mode === 'edit'"
        ></el-input>
        <div class="form-tip">唯一标识，创建后不可修改。建议使用小写字母、数字、点(.)。</div>
      </el-form-item>
  
      <el-form-item label="标签名称/描述" prop="description">
        <el-input v-model="formData.description" type="textarea" placeholder="描述标签含义和用途"></el-input>
      </el-form-item>
  
      <el-form-item label="标签分类" prop="category">
        <el-select v-model="formData.category" placeholder="选择标签分类">
          <el-option label="业务 (Business)" value="Business"></el-option>
          <el-option label="预警 (Warning)" value="Warning"></el-option>
          <el-option label="异常 (Anomaly)" value="Anomaly"></el-option>
        </el-select>
      </el-form-item>
  
      <el-form-item label="值类型" prop="valueType">
        <el-select v-model="formData.valueType" placeholder="选择值类型" @change="handleValueTypeChange">
          <el-option label="字符串 (String)" value="String"></el-option>
          <el-option label="数字 (Number)" value="Number"></el-option>
          <el-option label="布尔 (Boolean)" value="Boolean"></el-option>
          <el-option label="枚举 (Enum)" value="Enum"></el-option>
        </el-select>
      </el-form-item>
  
      <!-- 条件渲染：当值类型为 Enum 时显示 -->
      <el-form-item v-if="formData.valueType === 'Enum'" label="允许的枚举值" prop="allowedValues">
         <div v-for="(item, index) in formData.allowedValues" :key="index" class="enum-item">
           <el-input v-model="item.key" placeholder="枚举 Key (英文/数字)" style="width: 40%; margin-right: 10px;"></el-input>
           <el-input v-model="item.value" placeholder="枚举 Value (显示值)" style="width: 40%; margin-right: 10px;"></el-input>
           <el-button type="danger" :icon="Delete" circle @click="removeAllowedValue(index)" />
         </div>
         <el-button type="primary" plain @click="addAllowedValue">添加枚举值</el-button>
         <div class="form-tip">为枚举类型定义可选的 Key-Value 对。Key 建议使用英文或数字。</div>
      </el-form-item>
  
       <el-form-item label="负责人/团队" prop="owner">
        <el-input v-model="formData.owner" placeholder="选填，输入负责人或团队名称"></el-input>
      </el-form-item>
  
      <el-form-item label="备注" prop="notes">
        <el-input v-model="formData.notes" type="textarea" placeholder="选填，额外说明信息"></el-input>
      </el-form-item>
  
    </el-form>
  </template>
  
  <script>
  import { ref, reactive, watch, onMounted } from 'vue';
  import { ElMessage } from 'element-plus';
  import { Delete } from '@element-plus/icons-vue'; // 引入图标
  
  // 模拟异步校验 Tag Key 唯一性
  const checkTagKeyUnique = (rule, value, callback) => {
    console.log('Checking uniqueness for:', value);
    // 在实际应用中，这里应该发起 API 请求到后端校验
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 假设 business.order.userId 已存在
        if (value === 'business.order.userId' /* && 这里应该检查是否处于编辑模式且key未改变 */) {
           reject(new Error('标签 Key 已存在'));
        } else {
           resolve();
        }
      }, 300); // 模拟网络延迟
     }).then(() => callback()).catch(error => callback(error));
  };
  
  // 校验 Tag Key 格式
  const validateTagKeyFormat = (rule, value, callback) => {
    const pattern = /^[a-z0-9]+(\.[a-z0-9]+)*$/;
    if (!value) {
        return callback(new Error('标签 Key 不能为空'));
    }
    if (!pattern.test(value)) {
      return callback(new Error('格式不正确 (应为: category.domain.name, 仅小写字母/数字/点)'));
    }
    return callback();
  };
  
  // 校验枚举值不为空
  const validateAllowedValues = (rule, value, callback) => {
      if (!value || value.length === 0) {
          return callback(new Error('枚举类型必须至少定义一个允许值'));
      }
      for (const item of value) {
          if (!item.key || !item.value) {
              return callback(new Error('枚举的 Key 和 Value 不能为空'));
          }
          // 可以添加 Key 重复性校验等
      }
      callback();
  };
  
  
  export default {
    name: 'TagForm',
    props: {
      initialData: {
        type: Object,
        default: null
      },
      mode: {
        type: String, // 'add' or 'edit'
        default: 'add'
      }
    },
    emits: ['save-success'], // 定义组件可以发出的事件
    setup(props, { emit }) {
      const tagFormRef = ref(null);
      const formData = reactive({
        tagKey: '',
        description: '',
        category: 'Business', // 默认值
        valueType: 'String', // 默认值
        allowedValues: [], // 用于 Enum 类型
        owner: '',
        notes: '',
        // --- 内部状态，不提交 ---
        id: null,
        status: 'Active',
        createdAt: '',
        updatedAt: '',
        creator: 'CurrentUser' // 假设当前用户
      });
  
      const formRules = reactive({
        tagKey: [
          { required: true, validator: validateTagKeyFormat, trigger: 'blur' },
          // 编辑模式下 Key 不可编辑，因此唯一性校验只在添加模式下或 Key 改变时触发
          // { validator: checkTagKeyUnique, trigger: 'blur', isEdit: props.mode === 'edit' } // 传递模式信息给校验器
           { validator: (rule, value, callback) => {
               if (props.mode === 'add') { // 仅在添加模式校验唯一性
                  return checkTagKeyUnique(rule, value, callback);
               }
               callback(); // 编辑模式不校验（或后端校验）
             }, trigger: 'blur'
           }
        ],
        description: [
          { required: true, message: '请输入标签名称/描述', trigger: 'blur' }
        ],
        category: [
          { required: true, message: '请选择标签分类', trigger: 'change' }
        ],
        valueType: [
          { required: true, message: '请选择值类型', trigger: 'change' }
        ],
        allowedValues: [
           // 动态校验规则：只有当 valueType 为 Enum 时才需要校验
           { validator: (rule, value, callback) => {
               if (formData.valueType === 'Enum') {
                   return validateAllowedValues(rule, value, callback);
               }
               callback(); // 非 Enum 类型跳过校验
             }, trigger: 'change' // 在添加/删除或修改时触发
           }
        ]
      });
  
      // --- Methods ---
      const resetForm = () => {
        tagFormRef.value?.resetFields(); // 重置表单校验和部分字段
        // 手动重置未被 resetFields 覆盖的字段
        formData.tagKey = '';
        formData.description = '';
        formData.category = 'Business';
        formData.valueType = 'String';
        formData.allowedValues = [];
        formData.owner = '';
        formData.notes = '';
        formData.id = null;
        formData.status = 'Active';
      };
  
      const setForm = (data) => {
          if (!data) return;
          resetForm(); // 先重置
          formData.id = data.id;
          formData.tagKey = data.tagKey;
          formData.description = data.description;
          formData.category = data.category;
          formData.valueType = data.valueType;
          // 深拷贝数组和对象
          formData.allowedValues = data.allowedValues ? JSON.parse(JSON.stringify(data.allowedValues)) : [];
          formData.owner = data.owner || '';
          formData.notes = data.notes || '';
          formData.status = data.status;
          formData.createdAt = data.createdAt;
          formData.updatedAt = data.updatedAt;
          formData.creator = data.creator;
      };
  
      const addAllowedValue = () => {
        formData.allowedValues.push({ key: '', value: '' });
      };
  
      const removeAllowedValue = (index) => {
        formData.allowedValues.splice(index, 1);
      };
  
      const handleValueTypeChange = (newType) => {
          if (newType !== 'Enum') {
              formData.allowedValues = []; // 清空非 Enum 类型的允许值
          } else if (formData.allowedValues.length === 0) {
              addAllowedValue(); // Enum 类型默认加一个空的
          }
           // 清除可能存在的 allowedValues 校验错误信息
          tagFormRef.value?.clearValidate('allowedValues');
      };
  
      const getFormData = () => {
         // 返回用于提交的干净数据
         const dataToSubmit = {
           tagKey: formData.tagKey,
           description: formData.description,
           category: formData.category,
           valueType: formData.valueType,
           owner: formData.owner,
           notes: formData.notes,
         };
         if (formData.valueType === 'Enum') {
           dataToSubmit.allowedValues = formData.allowedValues.filter(item => item.key && item.value); // 过滤掉空的
         }
         if (props.mode === 'edit' && formData.id) {
           dataToSubmit.id = formData.id; // 编辑时带上 ID
         }
         // 添加或更新时，后端应处理创建者、状态、时间戳
         return dataToSubmit;
      };
  
      const validate = () => {
         return tagFormRef.value?.validate();
      };
  
      const submitForm = async () => {
        try {
          await validate();
          const dataToSave = getFormData();
          console.log('Form validation passed. Data to save:', dataToSave);
  
          // --- 模拟 API 调用 ---
          console.log(`Simulating API call to ${props.mode === 'add' ? 'create' : 'update'} tag...`);
          
          // 模拟API调用延迟
          await new Promise(resolve => setTimeout(resolve, 500));

          // 模拟服务器返回的数据
          const savedData = {
            ...dataToSave,
            id: props.mode === 'add' ? Date.now() : formData.id, // 新建时生成临时ID
            status: formData.status || 'Active',
            creator: formData.creator || 'CurrentUser',
            createdAt: formData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // 发出保存成功事件
          emit('save-success', savedData);
          ElMessage.success(`标签${props.mode === 'add' ? '创建' : '更新'}成功！`);
          
          if (props.mode === 'add') {
            resetForm(); // 新建成功后重置表单
          }
        } catch (error) {
          console.error('Form validation or submission failed:', error);
          ElMessage.error(error.message || `标签${props.mode === 'add' ? '创建' : '更新'}失败！`);
        }
      };
  
  
      // --- Watchers ---
      watch(() => props.initialData, (newVal) => {
        if (newVal) {
          setForm(newVal);
        }
      }, { immediate: true });
  
      // 组件挂载时，如果是 Enum 类型且无值，添加一个空行
      onMounted(() => {
          if (formData.valueType === 'Enum' && formData.allowedValues.length === 0) {
              addAllowedValue();
          }
      });
  
      // --- Expose methods to parent ---
      // (Vue 3 setup 中默认不会暴露，需要显式 expose 或使用 defineExpose)
      // 但父组件可以通过 ref.$refs.tagFormRef.method() 调用，无需 expose
  
      return {
        tagFormRef,
        formData,
        formRules,
        resetForm,
        submitForm,
        addAllowedValue,
        removeAllowedValue,
        handleValueTypeChange,
        getFormData, // 供父组件调用
        validate,    // 供父组件调用
        Delete // 图标
      };
    }
  };
  </script>
  
  <style scoped>
  .tag-form {
    padding: 20px;
  }
  
  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    line-height: 1.4;
  }
  
  .enum-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .enum-item:last-child {
    margin-bottom: 15px;
  }
  </style>