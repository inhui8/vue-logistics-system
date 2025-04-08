<!-- eslint-disable -->
<template>
  <div class="data-table-container">
    <!-- 表头区域 - 只在showTableHeader为true时显示 -->
    <div class="table-header" v-if="showTableHeader">
      <slot name="table-header"></slot>
    </div>

    <el-table
      ref="dataTable"
      :data="tableData"
      border
      stripe
      style="width: fit-content; min-width: 100%"
      :height="tableHeight"
      @selection-change="handleSelectionChange"
      row-key="id"
      :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
      :row-class-name="getRowClassName"
    >
      <el-table-column type="expand">
        <template #default="props">
          <div class="expanded-row">
            <!-- 如果是分组行，不显示展开内容 -->
            <template v-if="!props.row.isGroup">
              <slot name="expanded-content" :row="props.row"></slot>
            </template>
          </div>
        </template>
      </el-table-column>
      <el-table-column type="selection" width="55"></el-table-column>
      
      <!-- 分组信息列 - 只在hasGroupedData为true时显示 -->
      <el-table-column v-if="hasGroupedData" label="分组信息" width="200">
        <template #default="scope">
          <span v-if="scope.row.isGroup" class="group-name">
            <el-tag :type="getGroupTagType(scope.row.groupLevel)">
              {{ scope.row.groupName }} <span v-if="scope.row.count">({{ scope.row.count || 0 }})</span>
            </el-tag>
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      
      <!-- 动态渲染表格列 -->
      <slot></slot>
    </el-table>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'DataTable',
  props: {
    tableData: {
      type: Array,
      required: true
    },
    editableFields: {
      type: Object,
      required: true
    },
    tableHeight: {
      type: String,
      default: 'calc(100vh - 180px)'
    },
    // 是否显示表头操作区域
    showTableHeader: {
      type: Boolean,
      default: false
    }
  },
  emits: ['selection-change', 'cell-click', 'cell-dbl-click', 'cell-edit-confirm', 'tag-close'],
  setup(props, { emit }) {
    // 计算属性
    const hasGroupedData = computed(() => {
      return props.tableData.some(item => item.isGroup);
    });

    // 获取分组标签类型
    const getGroupTagType = (level) => {
      const types = ['', 'primary', 'success', 'warning'];
      return types[level] || 'info';
    };

    // 获取行的类名
    const getRowClassName = ({ row }) => {
      if (row.isGroup) {
        return row.groupClass || '';
      }
      if (row.dataParentGroupKey) {
        // 为子数据项添加样式
        return `data-row data-parent-group-key-${row.dataParentGroupKey.replace(/[^a-zA-Z0-9]/g, '-')}`;
      }
      return '';
    }

    // 表格选择
    const handleSelectionChange = (rows) => {
      emit('selection-change', rows);
    }

    // 处理单元格点击
    const handleCellClick = (row, field) => {
      emit('cell-click', row, field);
    }

    // 处理单元格双击
    const handleCellDblClick = (row, field) => {
      emit('cell-dbl-click', row, field);
    }

    // 处理单元格编辑确认
    const handleCellEditConfirm = (row, field) => {
      emit('cell-edit-confirm', row, field);
    }

    // 处理标签关闭
    const handleTagClose = (row, field, tag) => {
      emit('tag-close', row, field, tag);
    }

    // 订单状态处理
    const getStatusType = (status) => {
      const statusMap = {
        pending: 'info',
        appointed: 'success',
        phone: 'warning',
        email: 'warning',
        platform: 'warning',
        completed: 'success',
        cancelled: 'danger'
      }
      return statusMap[status] || 'info'
    }

    const getStatusText = (status) => {
      const statusMap = {
        pending: '未预约',
        appointed: '已预约',
        phone: '电话预约',
        email: '邮件预约',
        platform: '平台预约',
        completed: '已完成',
        cancelled: '已取消'
      }
      return statusMap[status] || status
    }

    return {
      hasGroupedData,
      getGroupTagType,
      getRowClassName,
      handleSelectionChange,
      handleCellClick,
      handleCellDblClick,
      handleCellEditConfirm,
      handleTagClose,
      getStatusType,
      getStatusText
    }
  }
}
</script>

<style scoped>
.data-table-container {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.expanded-row {
  padding: 20px;
}

.group-name {
  font-weight: bold;
}

.group-summary {
  color: #409EFF;
  font-weight: bold;
}

.level-1-group {
  background-color: #f0f9ff;
}

.level-2-group {
  background-color: #f4f4f5;
}

.level-3-group {
  background-color: #fafafa;
}

/* 添加数据项缩进样式 */
:deep(.data-parent-group-key-) td:first-child {
  padding-left: 30px;
}

.editable-cell {
  padding: 5px;
  cursor: pointer;
}

.editable-cell:hover {
  background-color: #f5f7fa;
}

.editable-cell span {
  display: block;
  min-height: 24px;
  line-height: 24px;
}

.editable-cell .el-input,
.editable-cell .el-select,
.editable-cell .el-date-picker {
  width: 100%;
}

.editable-cell .el-tag {
  margin: 2px;
}

.tags-wrapper {
  min-height: 30px;
  padding: 2px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  cursor: pointer;
}

.tags-wrapper:hover {
  background-color: #f5f7fa;
}

.cell-content {
  padding: 5px;
  min-height: 24px;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.cell-content:hover {
  background-color: #f5f7fa;
}
</style> 