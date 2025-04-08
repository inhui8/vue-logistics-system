<!-- eslint-disable -->
<template>
    <el-dialog
      v-model="dialogVisible"
      title="高级筛选"
      width="900px"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <div class="filter-panel">
        <div class="filter-list">
          <div v-for="(filter, index) in filters" :key="index" class="filter-item">
            <el-select v-model="filter.field" placeholder="选择筛选字段" class="filter-field">
              <el-option
                v-for="field in filterFields"
                :key="field.prop"
                :label="field.label"
                :value="field.prop"
              ></el-option>
            </el-select>
            
            <el-select v-model="filter.operator" placeholder="选择操作符" class="filter-operator">
              <el-option label="等于" value="eq"></el-option>
              <el-option label="不等于" value="neq"></el-option>
              <el-option label="包含" value="contains"></el-option>
              <el-option label="不包含" value="notContains"></el-option>
              <el-option label="开始于" value="startsWith"></el-option>
              <el-option label="结束于" value="endsWith"></el-option>
              <el-option label="大于" value="gt"></el-option>
              <el-option label="大于等于" value="gte"></el-option>
              <el-option label="小于" value="lt"></el-option>
              <el-option label="小于等于" value="lte"></el-option>
              <el-option label="在列表中" value="in"></el-option>
              <el-option label="不在列表中" value="notIn"></el-option>
            </el-select>
            
            <template v-if="getFieldType(filter.field) === 'date'">
              <el-date-picker 
                v-model="filter.value" 
                type="date" 
                placeholder="选择日期"
                class="filter-value"
              ></el-date-picker>
            </template>
            
            <template v-else-if="getFieldType(filter.field) === 'datetime'">
              <el-date-picker 
                v-model="filter.value" 
                type="datetime" 
                placeholder="选择日期时间"
                class="filter-value"
              ></el-date-picker>
            </template>
            
            <template v-else-if="getFieldType(filter.field) === 'select'">
              <el-select 
                v-model="filter.value" 
                placeholder="选择筛选值"
                class="filter-value"
              >
                <el-option
                  v-for="option in getFieldOptions(filter.field)"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                ></el-option>
              </el-select>
            </template>
            
            <template v-else>
              <el-input 
                v-model="filter.value" 
                placeholder="输入筛选值" 
                class="filter-value"
              ></el-input>
            </template>
            
            <el-button 
              type="danger" 
              size="small"
              @click="removeFilter(index)"
              class="filter-delete-btn"
            >删除</el-button>
          </div>
        </div>
        
        <div class="filter-buttons">
          <el-button 
            type="primary" 
            icon="el-icon-plus" 
            @click="addFilter"
          >添加筛选条件</el-button>
          
          <el-button 
            icon="el-icon-refresh" 
            @click="resetFilters"
          >重置筛选</el-button>
        </div>
        
        <div class="filter-logic">
          <el-radio-group v-model="filterLogic">
            <el-radio label="and">满足所有条件 (AND)</el-radio>
            <el-radio label="or">满足任一条件 (OR)</el-radio>
          </el-radio-group>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirm">应用筛选</el-button>
        </span>
      </template>
    </el-dialog>
  </template>
  
  <script>
  import { ref,  computed } from 'vue';
  
  export default {
    name: 'FilterPanel',
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      columns: {
        type: Array,
        default: () => []
      },
      existingFilters: {
        type: Array,
        default: () => []
      },
      existingLogic: {
        type: String,
        default: 'and'
      }
    },
    emits: ['update:visible', 'apply-filters', 'cancel'],
    setup(props, { emit }) {
      const dialogVisible = computed({
        get: () => props.visible,
        set: (val) => emit('update:visible', val)
      });
      
      // 筛选逻辑（AND/OR）
      const filterLogic = ref(props.existingLogic);
      
      // 准备筛选字段列表
      const filterFields = computed(() => {
        return props.columns.map(col => {
          return {
            label: col.label,
            prop: col.prop,
            type: col.filterType || 'text',
            options: col.filterOptions || []
          };
        });
      });
      
      // 筛选条件列表
      const filters = ref(
        props.existingFilters.length > 0 
          ? [...props.existingFilters] 
          : [{ field: '', operator: 'eq', value: '' }]
      );
      
      // 获取字段类型
      const getFieldType = (fieldName) => {
        const field = filterFields.value.find(f => f.prop === fieldName);
        return field ? field.type : 'text';
      };
      
      // 获取字段选项
      const getFieldOptions = (fieldName) => {
        const field = filterFields.value.find(f => f.prop === fieldName);
        return field ? field.options : [];
      };
      
      // 添加筛选条件
      const addFilter = () => {
        filters.value.push({ field: '', operator: 'eq', value: '' });
      };
      
      // 移除筛选条件
      const removeFilter = (index) => {
        filters.value.splice(index, 1);
        if (filters.value.length === 0) {
          addFilter(); // 至少保留一个筛选条件
        }
      };
      
      // 重置筛选条件
      const resetFilters = () => {
        filters.value = [{ field: '', operator: 'eq', value: '' }];
        filterLogic.value = 'and';
      };
      
      // 关闭弹窗
      const handleClose = () => {
        dialogVisible.value = false;
      };
      
      // 取消操作
      const handleCancel = () => {
        dialogVisible.value = false;
        emit('cancel');
      };
      
      // 确认操作，应用筛选
      const handleConfirm = () => {
        // 过滤掉未完成的筛选条件
        const validFilters = filters.value.filter(f => f.field && f.operator && f.value !== '');
        
        emit('apply-filters', {
          filters: validFilters,
          logic: filterLogic.value
        });
        
        dialogVisible.value = false;
      };
      
      return {
        dialogVisible,
        filterLogic,
        filterFields,
        filters,
        getFieldType,
        getFieldOptions,
        addFilter,
        removeFilter,
        resetFilters,
        handleClose,
        handleCancel,
        handleConfirm
      };
    }
  };
  </script>
  
  <style scoped>
  .filter-panel {
    padding: 20px;
  }
  
  .filter-list {
    margin-bottom: 20px;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .filter-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;
  }
  
  .filter-field {
    width: 200px;
  }
  
  .filter-operator {
    width: 150px;
  }
  
  .filter-value {
    width: 200px;
  }
  
  .filter-delete-btn {
    margin-left: 10px;
  }
  
  .filter-buttons {
    display: flex;
    margin-bottom: 20px;
  }
  
  .filter-buttons .el-button {
    margin-right: 10px;
  }
  
  .filter-logic {
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
  }
  
  :deep(.el-dialog__body) {
    padding-top: 10px;
    padding-bottom: 10px;
  }
  </style>