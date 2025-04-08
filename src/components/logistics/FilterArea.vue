<!-- eslint-disable -->
<template>
  <div class="filter-area">
    <!-- 快速筛选区域 -->
    <div class="quick-filter">
      <el-button 
        @click="showFilterModal"
        style="margin-left: 10px;"
      >
        高级筛选
        <i class="el-icon-arrow-down"></i>
      </el-button>
    </div>
    
    <!-- 筛选条件标签区域 -->
    <div v-if="filterTags.length > 0" class="filter-tags">
      <el-tag
        v-for="(tag, index) in filterTags"
        :key="index"
        closable
        @close="handleTagClose(tag)"
        size="small"
        type="info"
        style="margin-right: 5px; margin-bottom: 5px;"
      >
        {{ tag.label }}: {{ tag.value }}
      </el-tag>
      <el-button type="text" size="small" @click="clearAllFilters">清除所有</el-button>
    </div>
    
    <!-- 高级筛选弹窗 -->
    <el-dialog
      v-model="filterModalVisible"
      title="筛选设置"
      width="600px"
    >
      <div class="filter-list">
        <div v-for="(filter, index) in filters" :key="index" class="filter-item">
          <el-select v-model="filter.field" placeholder="选择字段">
            <el-option
              v-for="field in fieldOptions"
              :key="field.prop"
              :label="field.label"
              :value="field.prop"
            ></el-option>
          </el-select>
          <el-select v-model="filter.operator" placeholder="选择操作符">
            <el-option label="等于" value="eq"></el-option>
            <el-option label="不等于" value="neq"></el-option>
            <el-option label="包含" value="contains"></el-option>
            <el-option label="不包含" value="not_contains"></el-option>
            <el-option label="大于" value="gt"></el-option>
            <el-option label="小于" value="lt"></el-option>
          </el-select>
          
          <!-- 根据字段类型显示不同的输入控件 -->
          <template v-if="getFieldType(filter.field) === 'select'">
            <el-select v-model="filter.value" placeholder="选择值">
              <el-option
                v-for="option in getFieldOptions(filter.field)"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              ></el-option>
            </el-select>
          </template>
          <template v-else-if="getFieldType(filter.field) === 'date' || getFieldType(filter.field) === 'datetime'">
            <el-date-picker 
              v-model="filter.value"
              :type="getFieldType(filter.field)"
              placeholder="选择日期"
              style="width: 200px;"
            ></el-date-picker>
          </template>
          <template v-else-if="getFieldType(filter.field) === 'number'">
            <el-input-number v-model="filter.value" placeholder="输入值" style="width: 200px;"></el-input-number>
          </template>
          <template v-else>
            <el-input v-model="filter.value" placeholder="输入值" style="width: 200px;"></el-input>
          </template>
          
          <el-button type="danger" icon="el-icon-delete" size="small" @click="removeFilter(index)">删除</el-button>
        </div>
      </div>
      <el-button type="primary" icon="el-icon-plus" @click="addFilter">添加筛选条件</el-button>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="filterModalVisible = false">取消</el-button>
          <el-button type="primary" @click="applyFilters">应用筛选</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'FilterArea',
  props: {
    // 筛选字段配置
    filterFields: {
      type: Array,
      default: () => []
      /* 
      示例: [
        { label: '柜号', prop: 'containerNo', type: 'text' },
        { label: '客服', prop: 'customerService', type: 'select', options: [...] }
      ]
      */
    },
    // 状态选项
    statusOptions: {
      type: Array,
      default: () => []
    },
    // 是否显示日期范围筛选
    showDateRange: {
      type: Boolean,
      default: true
    },
    // 是否显示状态筛选
    showStatusFilter: {
      type: Boolean,
      default: true
    },
    // 日期字段名
    dateField: {
      type: String,
      default: 'createdAt'
    }
  },
  emits: ['search', 'reset', 'filter-change'],
  setup(props, { emit }) {
    // 关键词搜索
    const keyword = ref('');
    
    // 日期范围
    const dateRange = ref([]);
    
    // 选中的状态
    const selectedStatus = ref([]);
    
    // 筛选标签
    const filterTags = ref([]);
    
    // 高级筛选相关
    const filterModalVisible = ref(false);
    const filters = ref([]);
    
    // 构建字段选项
    const fieldOptions = computed(() => {
      return props.filterFields.map(field => ({
        label: field.label,
        prop: field.prop,
        type: field.type,
        options: field.options
      }));
    });
    
    // 获取字段类型
    const getFieldType = (fieldName) => {
      const field = props.filterFields.find(f => f.prop === fieldName);
      return field ? field.type : 'text';
    };
    
    // 获取字段选项
    const getFieldOptions = (fieldName) => {
      const field = props.filterFields.find(f => f.prop === fieldName);
      return field && field.options ? field.options : [];
    };
    
    // 日期选择器快捷选项
    const pickerOptions = {
      shortcuts: [
        {
          text: '最近一周',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
            picker.$emit('pick', [start, end]);
          }
        },
        {
          text: '最近一个月',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setMonth(start.getMonth() - 1);
            picker.$emit('pick', [start, end]);
          }
        },
        {
          text: '最近三个月',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setMonth(start.getMonth() - 3);
            picker.$emit('pick', [start, end]);
          }
        }
      ]
    };
    
    // 处理搜索
    const handleSearch = () => {
      const params = {
        keyword: keyword.value,
        dateRange: dateRange.value,
        status: selectedStatus.value,
        filters: filters.value
      };
      emit('search', params);
      
      // 更新筛选标签
      updateFilterTags();
    };
    
    // 处理清除
    const handleClear = () => {
      keyword.value = '';
      handleSearch();
    };
    
    // 处理日期范围变化
    const handleDateRangeChange = () => {
      handleSearch();
    };
    
    // 处理状态变化
    const handleStatusChange = () => {
      handleSearch();
    };
    
    // 显示筛选弹窗
    const showFilterModal = () => {
      filterModalVisible.value = true;
    };
    
    // 添加筛选条件
    const addFilter = () => {
      filters.value.push({
        field: '',
        operator: 'eq',
        value: ''
      });
    };
    
    // 移除筛选条件
    const removeFilter = (index) => {
      filters.value.splice(index, 1);
    };
    
    // 应用筛选
    const applyFilters = () => {
      // 过滤掉不完整的筛选条件
      filters.value = filters.value.filter(filter => 
        filter.field && filter.operator && (filter.value !== undefined && filter.value !== ''));
      
      filterModalVisible.value = false;
      handleSearch();
    };
    
    // 更新筛选标签
    const updateFilterTags = () => {
      filterTags.value = [];
      
      // 关键词标签
      if (keyword.value) {
        filterTags.value.push({
          type: 'keyword',
          label: '关键词',
          value: keyword.value
        });
      }
      
      // 日期范围标签
      if (dateRange.value && dateRange.value.length === 2) {
        const [start, end] = dateRange.value;
        filterTags.value.push({
          type: 'dateRange',
          label: '日期范围',
          value: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
        });
      }
      
      // 状态标签
      if (selectedStatus.value && selectedStatus.value.length > 0) {
        const statusLabels = selectedStatus.value.map(status => {
          const option = props.statusOptions.find(opt => opt.value === status);
          return option ? option.label : status;
        });
        
        filterTags.value.push({
          type: 'status',
          label: '状态',
          value: statusLabels.join(', ')
        });
      }
      
      // 高级筛选标签
      filters.value.forEach(filter => {
        if (filter.field && filter.operator && (filter.value !== undefined && filter.value !== '')) {
          const fieldOption = fieldOptions.value.find(opt => opt.prop === filter.field);
          const fieldLabel = fieldOption ? fieldOption.label : filter.field;
          
          let operatorLabel = '';
          switch (filter.operator) {
            case 'eq': operatorLabel = '等于'; break;
            case 'neq': operatorLabel = '不等于'; break;
            case 'contains': operatorLabel = '包含'; break;
            case 'not_contains': operatorLabel = '不包含'; break;
            case 'gt': operatorLabel = '大于'; break;
            case 'lt': operatorLabel = '小于'; break;
            default: operatorLabel = filter.operator;
          }
          
          let valueLabel = filter.value;
          if (getFieldType(filter.field) === 'select') {
            const options = getFieldOptions(filter.field);
            const option = options.find(opt => opt.value === filter.value);
            valueLabel = option ? option.label : filter.value;
          }
          
          filterTags.value.push({
            type: 'filter',
            field: filter.field,
            operator: filter.operator,
            label: `${fieldLabel} ${operatorLabel}`,
            value: valueLabel
          });
        }
      });
    };
    
    // 关闭标签
    const handleTagClose = (tag) => {
      if (tag.type === 'keyword') {
        keyword.value = '';
      } else if (tag.type === 'dateRange') {
        dateRange.value = [];
      } else if (tag.type === 'status') {
        selectedStatus.value = [];
      } else if (tag.type === 'filter') {
        // 移除对应的高级筛选条件
        const index = filters.value.findIndex(f => 
          f.field === tag.field && f.operator === tag.operator);
        if (index !== -1) {
          filters.value.splice(index, 1);
        }
      }
      
      handleSearch();
    };
    
    // 清除所有筛选
    const clearAllFilters = () => {
      keyword.value = '';
      dateRange.value = [];
      selectedStatus.value = [];
      filters.value = [];
      filterTags.value = [];
      
      emit('reset');
    };
    
    // 初始添加一个空的筛选条件
    if (filters.value.length === 0) {
      addFilter();
    }
    
    return {
      keyword,
      dateRange,
      selectedStatus,
      pickerOptions,
      filterTags,
      filterModalVisible,
      filters,
      fieldOptions,
      
      handleSearch,
      handleClear,
      handleDateRangeChange,
      handleStatusChange,
      showFilterModal,
      addFilter,
      removeFilter,
      applyFilters,
      handleTagClose,
      clearAllFilters,
      getFieldType,
      getFieldOptions
    };
  }
}
</script>

<style scoped>
.filter-area {
  margin-bottom: 20px;
}

.quick-filter {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.filter-tags {
  margin-top: 10px;
  margin-bottom: 15px;
}

.filter-list {
  margin-bottom: 20px;
}

.filter-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.filter-item .el-select {
  width: 180px;
}
</style> 