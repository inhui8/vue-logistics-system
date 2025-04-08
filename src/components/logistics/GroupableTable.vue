<!-- eslint-disable -->
<template>
  <div class="groupable-table-container">
    <el-table
      :data="tableData"
      :row-key="rowKey"
      :tree-props="{ children: 'children' }"
      :row-class-name="getRowClassName"
      :default-expand-all="defaultExpandAll"
      @selection-change="handleSelectionChange"
      @cell-click="handleCellClick"
      v-bind="$attrs"
    >
      <!-- 选择列 -->
      <el-table-column
        v-if="showSelection"
        type="selection"
        :selectable="(row) => !row.isGroup"
        width="55"
      />
      
      <!-- 分组列 -->
      <el-table-column
        v-if="showGroupColumn"
        :label="groupColumnLabel"
        :width="groupColumnWidth"
        :fixed="groupColumnFixed"
      >
        <template #default="scope">
          <div v-if="scope.row.isGroup" class="group-name" :class="`group-level-${scope.row.groupLevel || 1}`">
            <i class="el-icon-caret-right" v-if="scope.row.children && scope.row.children.length"></i>
            <span class="group-title">{{ scope.row.groupName }}</span>
            <span class="group-count" v-if="scope.row.count">({{ scope.row.count }})</span>
          </div>
        </template>
      </el-table-column>
      
      <!-- 插槽内容 - 表格列 -->
      <slot></slot>
    </el-table>
    
    <!-- 分页器 -->
    <div v-if="showPagination" class="pagination-container">
      <el-pagination
        :current-page="currentPage"
        :page-sizes="pageSizes"
        :page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'GroupableTable',
  props: {
    // 表格数据
    data: {
      type: Array,
      required: true
    },
    // 行数据的唯一标识字段
    rowKey: {
      type: String,
      default: 'id'
    },
    // 分组字段
    groupFields: {
      type: Array,
      default: () => []
    },
    // 是否展示选择列
    showSelection: {
      type: Boolean,
      default: true
    },
    // 是否展示分组列
    showGroupColumn: {
      type: Boolean,
      default: true
    },
    // 分组列标题
    groupColumnLabel: {
      type: String,
      default: '分组'
    },
    // 分组列宽度
    groupColumnWidth: {
      type: [String, Number],
      default: 180
    },
    // 分组列是否固定
    groupColumnFixed: {
      type: [String, Boolean],
      default: 'left'
    },
    // 默认是否展开所有
    defaultExpandAll: {
      type: Boolean,
      default: true
    },
    // 是否显示分页
    showPagination: {
      type: Boolean,
      default: true
    },
    // 当前页码
    currentPage: {
      type: Number,
      default: 1
    },
    // 每页数量
    pageSize: {
      type: Number,
      default: 20
    },
    // 可选的每页数量
    pageSizes: {
      type: Array,
      default: () => [10, 20, 50, 100]
    },
    // 总数据量
    total: {
      type: Number,
      default: 0
    }
  },
  emits: [
    'selection-change', 
    'cell-click', 
    'size-change', 
    'current-change',
    'cell-dbl-click',
    'cell-edit-confirm',
    'tag-close'
  ],
  setup(props, { emit }) {
    // 获取表格数据
    const tableData = computed(() => {
      // 如果没有分组字段，直接返回原始数据
      if (!props.groupFields || props.groupFields.length === 0) {
        return props.data;
      }
      
      // 有分组字段，返回分组后的数据
      return props.data;
    });
    
    // 获取行的类名
    const getRowClassName = ({ row }) => {
      let classNames = [];
      
      if (row.isGroup) {
        classNames.push('group-row');
        classNames.push(`group-level-${row.groupLevel || 1}`);
      } else if (row.parentGroupKey) {
        classNames.push('data-item');
        classNames.push(`data-parent-group-${row.parentGroupKey}`);
      }
      
      return classNames.join(' ');
    };
    
    // 处理选择变化
    const handleSelectionChange = (selection) => {
      emit('selection-change', selection);
    };
    
    // 处理单元格点击
    const handleCellClick = (row, column, cell, event) => {
      emit('cell-click', row, column, cell, event);
    };
    
    // 处理分页大小变化
    const handleSizeChange = (size) => {
      emit('size-change', size);
    };
    
    // 处理当前页变化
    const handleCurrentChange = (page) => {
      emit('current-change', page);
    };
    
    return {
      tableData,
      getRowClassName,
      handleSelectionChange,
      handleCellClick,
      handleSizeChange,
      handleCurrentChange
    };
  }
}
</script>

<style scoped>
.groupable-table-container {
  width: 100%;
  height: 100%;
}

.group-name {
  display: flex;
  align-items: center;
  font-weight: bold;
}

.group-level-1 {
  color: #409EFF;
  font-size: 14px;
}

.group-level-2 {
  color: #67C23A;
  font-size: 13px;
}

.group-level-3 {
  color: #E6A23C;
  font-size: 13px;
}

.group-title {
  margin-right: 5px;
}

.group-count {
  color: #909399;
  font-size: 12px;
}

.data-item {
  background-color: #FAFAFA;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table__row.group-row) {
  font-weight: bold;
}

:deep(.el-table__row.group-level-1) {
  background-color: #ECF5FF;
}

:deep(.el-table__row.group-level-2) {
  background-color: #F0F9EB;
}

:deep(.el-table__row.group-level-3) {
  background-color: #FDF6EC;
}

:deep(.el-table__expanded-cell) {
  padding: 0 !important;
}
</style> 