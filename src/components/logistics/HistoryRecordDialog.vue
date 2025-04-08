<!-- eslint-disable -->
<template>
  <el-dialog
    title="历史记录"
    v-model="dialogVisible"
    width="800px"
    :close-on-click-modal="false"
  >
    <div class="history-container">
      <!-- 筛选区域 -->
      <div class="filter-section">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="操作类型">
            <el-select v-model="filterForm.operationType" placeholder="请选择" clearable>
              <el-option label="新增" value="add"></el-option>
              <el-option label="修改" value="edit"></el-option>
              <el-option label="删除" value="delete"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="字段">
            <el-select v-model="filterForm.field" placeholder="请选择" clearable>
              <el-option
                v-for="field in fieldOptions"
                :key="field.value"
                :label="field.label"
                :value="field.value"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
            ></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleFilter">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 历史记录列表 -->
      <div class="history-list">
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in filteredHistory"
            :key="index"
            :timestamp="record.time"
            :type="getTimelineType(record.operationType)"
          >
            <div class="history-item">
              <div class="history-header">
                <span class="operation-type">{{ getOperationTypeText(record.operationType) }}</span>
                <span class="field-name">{{ getFieldLabel(record.field) }}</span>
              </div>
              <div class="history-content">
                <div class="old-value" v-if="record.oldValue">
                  <span class="label">原值：</span>
                  <span class="value">{{ record.oldValue }}</span>
                </div>
                <div class="new-value" v-if="record.newValue">
                  <span class="label">新值：</span>
                  <span class="value">{{ record.newValue }}</span>
                </div>
              </div>
              <div class="history-footer">
                <span class="operator">操作人：{{ record.operator }}</span>
                <span class="remark" v-if="record.remark">备注：{{ record.remark }}</span>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'HistoryRecordDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    trainData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:visible'],
  setup(props, { emit }) {
    const dialogVisible = computed({
      get: () => props.visible,
      set: (val) => emit('update:visible', val)
    });

    // 筛选表单
    const filterForm = ref({
      operationType: '',
      field: '',
      dateRange: []
    });

    // 字段选项
    const fieldOptions = [
      { label: '车次号', value: 'trainNumber' },
      { label: '装车类型', value: 'loadingType' },
      { label: '发货类型', value: 'deliveryType' },
      { label: '车牌号', value: 'carNumber' },
      { label: '装车人', value: 'loader' },
      { label: '码头号', value: 'dockNumber' },
      { label: '仓库备注', value: 'warehouseRemarks' },
      { label: '驾驶证号', value: 'driverLicense' },
      { label: '车牌号', value: 'licensePlate' },
      { label: '司机电话', value: 'driverPhone' },
      { label: '供应商', value: 'supplier' },
      { label: '实际托盘数', value: 'actualPallets' },
      { label: '托盘合并', value: 'palletsMerged' },
      { label: '配送费用', value: 'deliveryCost' },
      { label: '标签', value: 'tags' },
      { label: '备注', value: 'memo' }
    ];

    // 模拟历史记录数据
    const historyRecords = ref([
      {
        time: '2024-03-20 10:00:00',
        operationType: 'edit',
        field: 'loadingType',
        oldValue: '整车',
        newValue: '零担',
        operator: '张三',
        remark: '客户要求变更装车方式'
      },
      {
        time: '2024-03-20 09:30:00',
        operationType: 'add',
        field: 'tags',
        newValue: '异常',
        operator: '李四',
        remark: '车辆故障，需要延迟装车'
      },
      {
        time: '2024-03-20 09:00:00',
        operationType: 'edit',
        field: 'driverPhone',
        oldValue: '13800138000',
        newValue: '13800138001',
        operator: '王五',
        remark: '司机联系方式更新'
      }
    ]);

    // 过滤后的历史记录
    const filteredHistory = computed(() => {
      let filtered = [...historyRecords.value];

      // 按操作类型筛选
      if (filterForm.value.operationType) {
        filtered = filtered.filter(record => 
          record.operationType === filterForm.value.operationType
        );
      }

      // 按字段筛选
      if (filterForm.value.field) {
        filtered = filtered.filter(record => 
          record.field === filterForm.value.field
        );
      }

      // 按时间范围筛选
      if (filterForm.value.dateRange && filterForm.value.dateRange.length === 2) {
        const [startDate, endDate] = filterForm.value.dateRange;
        filtered = filtered.filter(record => {
          const recordDate = record.time.split(' ')[0];
          return recordDate >= startDate && recordDate <= endDate;
        });
      }

      return filtered;
    });

    // 获取时间线类型
    const getTimelineType = (operationType) => {
      const typeMap = {
        add: 'success',
        edit: 'warning',
        delete: 'danger'
      };
      return typeMap[operationType] || 'info';
    };

    // 获取操作类型文本
    const getOperationTypeText = (operationType) => {
      const textMap = {
        add: '新增',
        edit: '修改',
        delete: '删除'
      };
      return textMap[operationType] || operationType;
    };

    // 获取字段标签
    const getFieldLabel = (field) => {
      const fieldOption = fieldOptions.find(option => option.value === field);
      return fieldOption ? fieldOption.label : field;
    };

    // 处理筛选
    const handleFilter = () => {
      // 这里可以添加实际的筛选逻辑
    };

    // 重置筛选
    const resetFilter = () => {
      filterForm.value = {
        operationType: '',
        field: '',
        dateRange: []
      };
    };

    return {
      dialogVisible,
      filterForm,
      fieldOptions,
      filteredHistory,
      getTimelineType,
      getOperationTypeText,
      getFieldLabel,
      handleFilter,
      resetFilter
    };
  }
};
</script>

<style scoped>
.history-container {
  max-height: 600px;
  overflow-y: auto;
}

.filter-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.history-list {
  padding: 0 15px;
}

.history-item {
  background-color: #fff;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.history-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.operation-type {
  font-weight: bold;
  color: #303133;
}

.field-name {
  color: #606266;
  font-size: 14px;
}

.history-content {
  margin: 8px 0;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.old-value,
.new-value {
  margin: 4px 0;
  display: flex;
  align-items: center;
}

.label {
  color: #909399;
  margin-right: 8px;
  min-width: 60px;
}

.value {
  color: #303133;
}

.history-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}

.operator {
  margin-right: 15px;
}

/* 自定义滚动条样式 */
.history-container::-webkit-scrollbar {
  width: 6px;
}

.history-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.history-container::-webkit-scrollbar-track {
  background: #f4f4f5;
}
</style> 