<!-- 基于VxeTable实现的可分组表格组件 -->
<!-- eslint-disable -->
<template>
  <div class="groupable-table-vxe">
    <!-- 表格部分 -->
    <vxe-table
      ref="xTable"
      :data="processedData"
      :row-config="{
        keyField: rowKey,
        isHover: true,
        isCurrent: true
      }"
      :tree-config="treeConfig"
      :checkbox-config="checkboxConfig"
      :loading="loading"
      :height="height"
      border
      stripe
      highlight-hover-row
      @checkbox-change="handleCheckboxChange"
      @checkbox-all="handleCheckboxAll"
      @cell-click="handleCellClick"
      @cell-dblclick="handleCellDblclick"
      @sort-change="handleSortChange">
      
      <!-- 选择列 -->
      <vxe-column v-if="showSelection" type="checkbox" width="50" align="center"></vxe-column>
      
      <!-- 分组列 -->
      <vxe-column 
        v-if="showGroupColumn && hasGrouping" 
        :title="groupColumnLabel" 
        width="250"
        tree-node>
        <template #default="{ row }">
          <!-- 仅在分组行显示内容 -->
          <template v-if="row.isGroup">
            <div class="group-name" :class="`group-level-${row.groupLevel}`">
              <span class="group-title">{{ row.groupName }}</span>
              <span class="group-count">({{ row.count || 0 }})</span>
            </div>
          </template>
        </template>
      </vxe-column>
      
      <!-- 动态列 -->
      <template v-for="(column, index) in visibleColumns" :key="index">
        <vxe-column
          :field="column.prop"
          :title="column.label"
          :width="column.width"
          :sortable="column.sortable"
          :fixed="column.fixed"
          :edit-render="column.editable ? { name: 'input' } : null">
          <template #default="{ row }">
            <!-- 加载状态列 -->
            <template v-if="column.prop === 'loadingStatus' && !row.isGroup">
              <div class="status-tag" :class="`status-${getStatusType(row.loadingStatus)}`">
                {{ row.loadingStatus || '' }}
              </div>
            </template>
            
            <!-- 操作列 -->
            <template v-else-if="column.prop === 'operation' && !row.isGroup">
              <div class="operation-buttons">
                <button class="operation-btn" @click="handleDetail(row.id)">详情</button>
                <button class="operation-btn more-btn" @click="handleMoreOperations(row.id)">
                  更多<i class="el-icon-arrow-down"></i>
                </button>
              </div>
            </template>
            
            <!-- 预约状态列 -->
            <template v-else-if="column.prop === 'appointmentStatus' && !row.isGroup">
              <div class="status-tag" :class="`status-${getAppointmentStatusType(row.appointmentStatus)}`">
                {{ row.appointmentStatus || '未设置' }}
              </div>
            </template>
            
            <!-- 标签列 -->
            <template v-else-if="column.prop === 'tags' && !row.isGroup">
              <template v-if="row.tags">
                <template v-if="typeof row.tags === 'string'">
                  <span 
                    v-for="tag in getValidTags(row.tags)" 
                    :key="tag"
                    class="tag-item"
                    :class="`tag-${getTagType(tag)}`"
                  >
                    {{ tag }}
                  </span>
                </template>
                <template v-else>
                  <span class="tag-item" :class="`tag-${getTagType(row.tags)}`">{{ row.tags }}</span>
                </template>
              </template>
              <template v-else>
                <span>未设置</span>
              </template>
            </template>
            
            <!-- 其他列 -->
            <template v-else>
              {{ row[column.prop] }}
            </template>
          </template>
        </vxe-column>
      </template>
    </vxe-table>
    
    <!-- 分页部分 -->
    <div v-if="showPagination" class="pagination-container">
      <vxe-pager
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        :sizes="pageSizes"
        @page-change="handlePageChange">
      </vxe-pager>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'

export default defineComponent({
  name: 'GroupableTableVxe',
  props: {
    // 表格数据
    data: {
      type: Array,
      required: true,
      default: () => []
    },
    // 列配置
    columns: {
      type: Array,
      required: true,
      default: () => []
    },
    // 行唯一标识字段
    rowKey: {
      type: String,
      default: 'id'
    },
    // 分组字段
    groupFields: {
      type: Array,
      default: () => []
    },
    // 是否显示选择列
    showSelection: {
      type: Boolean,
      default: false
    },
    // 是否显示分组列
    showGroupColumn: {
      type: Boolean,
      default: false
    },
    // 分组列标签
    groupColumnLabel: {
      type: String,
      default: '分组'
    },
    // 是否默认展开所有
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
    // 每页大小
    pageSize: {
      type: Number,
      default: 20
    },
    // 页码选项
    pageSizes: {
      type: Array,
      default: () => [10, 20, 50, 100]
    },
    // 总记录数
    total: {
      type: Number,
      default: 0
    },
    // 加载状态
    loading: {
      type: Boolean,
      default: false
    },
    // 表格高度
    height: {
      type: [String, Number],
      default: 'auto'
    }
  },
  emits: [
    'selection-change',
    'size-change',
    'current-change',
    'cell-click',
    'cell-dblclick',
    'row-click',
    'row-dblclick',
    'sort-change'
  ],
  setup(props, { emit }) {
    const xTable = ref(null);
    const selectedRowKeys = ref([]);
    
    // ===== 计算属性 =====
    // 获取分组字段
    const groupField = computed(() => {
      return props.groupFields && props.groupFields.length > 0 ? props.groupFields[0] : '';
    });
    
    // 是否启用分组
    const hasGrouping = computed(() => !!groupField.value);
    
    // 处理树形表格配置
    const treeConfig = computed(() => {
      if (!hasGrouping.value) return { enabled: false };
      return {
        enabled: true,
        children: 'children',
        expandAll: props.defaultExpandAll,
        indent: 20,
        line: true,
        iconOpen: 'vxe-icon-caret-down',
        iconClose: 'vxe-icon-caret-right',
        iconLoaded: ''
      };
    });
    
    // 处理复选框配置
    const checkboxConfig = computed(() => {
      if (!props.showSelection) return { enabled: false };
      return {
        enabled: true,
        strict: false,
        highlight: true,
        range: false
      };
    });
    
    // 可见列
    const visibleColumns = computed(() => {
      return props.columns.filter(col => col.visible !== false);
    });
    
    // 处理后的数据
    const processedData = computed(() => {
      if (!hasGrouping.value) return props.data;
      
      // 确保有数据才进行分组处理
      if (!props.data || props.data.length === 0) return [];
      
      try {
        return processGroupData(props.data, groupField.value);
      } catch (error) {
        console.error('分组数据处理错误:', error);
        return props.data;
      }
    });
    
    // ===== 核心方法 =====
    // 处理分组数据
    const processGroupData = (data, field) => {
      if (!field) return data;
      
      const groups = {};
      const result = [];
      
      // 按指定字段分组
      data.forEach(item => {
        // 深拷贝避免修改原始数据
        const newItem = { ...item };
        
        // 更精确地判断分组值，只有undefined和null才使用"未分组"
        const fieldValue = item[field];
        const groupValue = fieldValue === undefined || fieldValue === null ? '未分组' : String(fieldValue);
        
        if (!groups[groupValue]) {
          groups[groupValue] = {
            id: `group-${field}-${groupValue}`,
            groupName: groupValue,
            isGroup: true,
            groupLevel: 1,
            count: 0,
            children: []
          };
          result.push(groups[groupValue]);
        }
        
        groups[groupValue].children.push(newItem);
        groups[groupValue].count++;
      });
      
      return result;
    };
    
    // 获取有效的标签（解决v-if与v-for混用问题）
    const getValidTags = (tagsString) => {
      if (!tagsString) return [];
      return tagsString.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
    };
    
    // ===== 事件处理 =====
    // 处理选择变更
    const handleCheckboxChange = ({ records }) => {
      selectedRowKeys.value = records.map(record => record[props.rowKey]);
      emit('selection-change', records);
    };
    
    // 处理全选/取消全选
    const handleCheckboxAll = ({ records }) => {
      selectedRowKeys.value = records.map(record => record[props.rowKey]);
      emit('selection-change', records);
    };
    
    // 处理单元格点击
    const handleCellClick = ({ row, column, $event }) => {
      if (!row || !column) return;
      
      emit('cell-click', {
        record: row,
        column: column.property,
        event: $event
      });
      
      emit('row-click', row, $event);
    };
    
    // 处理单元格双击
    const handleCellDblclick = ({ row, column, $event }) => {
      if (!row || !column) return;
      
      emit('cell-dblclick', {
        record: row,
        column: column.property,
        event: $event
      });
      
      emit('row-dblclick', row, $event);
    };
    
    // 处理排序变更
    const handleSortChange = ({ property, order }) => {
      emit('sort-change', {
        prop: property,
        order: order || null
      });
    };
    
    // 处理页码变更
    const handlePageChange = ({ currentPage, pageSize }) => {
      emit('current-change', currentPage);
      emit('size-change', pageSize);
    };
    
    // 详情按钮处理
    const handleDetail = (id) => {
      window.handleDetail?.(id);
    };
    
    // 更多操作按钮处理
    const handleMoreOperations = (id) => {
      window.handleMoreOperations?.(id);
    };
    
    // ===== 表格操作方法 =====
    // 切换所有行的选择状态
    const toggleAllSelection = () => {
      xTable.value?.toggleAllCheckboxRow();
    };
    
    // 清空所有选择
    const clearSelection = () => {
      xTable.value?.clearCheckboxRow();
    };
    
    // 选择特定行
    const toggleRowSelection = (row, selected) => {
      if (!xTable.value) return;
      
      if (selected) {
        xTable.value.setCheckboxRow(row, true);
      } else {
        xTable.value.setCheckboxRow(row, false);
      }
    };
    
    // 获取状态类型
    const getStatusType = (status) => {
      if (!status) return 'default';
      if (status === '待处理') return 'warning';
      if (status === '处理中') return 'primary';
      if (status === '已完成') return 'success';
      if (status === '已取消') return 'danger';
      return 'default';
    };
    
    // 获取预约状态类型
    const getAppointmentStatusType = (status) => {
      if (!status) return 'default';
      if (status === '未预约') return 'warning';
      if (status === '已预约') return 'success';
      if (status === '已取消') return 'danger';
      return 'default';
    };
    
    // 获取标签类型
    const getTagType = (tag) => {
      if (!tag) return 'default';
      // 确保tag是字符串类型
      const tagStr = String(tag);
      const tagLower = tagStr.toLowerCase();
      if (tagLower.includes('urgent') || tagLower.includes('紧急')) return 'danger';
      if (tagLower.includes('delay') || tagLower.includes('延迟')) return 'warning';
      if (tagLower.includes('completed') || tagLower.includes('完成')) return 'success';
      return 'primary';
    };
    
    // 返回组件方法和属性
    return {
      xTable,
      selectedRowKeys,
      groupField,
      hasGrouping,
      treeConfig,
      checkboxConfig,
      processedData,
      visibleColumns,
      getValidTags,
      toggleAllSelection,
      clearSelection,
      toggleRowSelection,
      handleCheckboxChange,
      handleCheckboxAll,
      handleCellClick,
      handleCellDblclick,
      handleSortChange,
      handlePageChange,
      handleDetail,
      handleMoreOperations,
      getStatusType,
      getAppointmentStatusType,
      getTagType
    };
  }
});
</script>

<style lang="scss" scoped>
.groupable-table-vxe {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .vxe-table {
    flex: 1;
    min-height: 400px;
    border: 1px solid #ebeef5;
    
    ::v-deep(.vxe-tree--indent-line) {
      border-color: #dcdfe6;
    }
    
    ::v-deep(.vxe-tree-cell) {
      padding-left: 0 !important;
    }
    
    ::v-deep(.vxe-tree--node) {
      &.is--active {
        color: #409eff;
      }
    }
    
    ::v-deep(.vxe-body--row) {
      &.row--group {
        background-color: #f5f7fa;
      }
    }
  }
  
  .pagination-container {
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;
  }
  
  // 分组样式
  .group-name {
    display: flex;
    align-items: center;
    font-weight: bold;
    padding: 4px 0;
  }
  
  .group-title {
    margin-right: 8px;
  }
  
  .group-count {
    color: #909399;
    font-size: 12px;
    font-weight: normal;
  }
  
  // 分组级别样式
  .group-level-1 .group-title {
    color: #409EFF;
    font-size: 14px;
  }
  
  .group-level-2 .group-title {
    color: #67C23A;
    font-size: 13px;
  }
  
  .group-level-3 .group-title {
    color: #E6A23C;
    font-size: 13px;
  }
  
  // 状态标签样式
  .status-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    border: 1px solid transparent;
  }
  
  .status-warning {
    background-color: #fdf6ec;
    color: #e6a23c;
    border-color: #faecd8;
  }
  
  .status-primary {
    background-color: #ecf5ff;
    color: #409eff;
    border-color: #d9ecff;
  }
  
  .status-success {
    background-color: #f0f9eb;
    color: #67c23a;
    border-color: #e1f3d8;
  }
  
  .status-danger {
    background-color: #fef0f0;
    color: #f56c6c;
    border-color: #fde2e2;
  }
  
  .status-default {
    background-color: #f4f4f5;
    color: #909399;
    border-color: #e9e9eb;
  }
  
  // 标签样式
  .tag-item {
    display: inline-block;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 12px;
    margin-right: 4px;
    margin-bottom: 2px;
  }
  
  .tag-primary {
    background-color: #ecf5ff;
    color: #409eff;
  }
  
  .tag-success {
    background-color: #f0f9eb;
    color: #67c23a;
  }
  
  .tag-warning {
    background-color: #fdf6ec;
    color: #e6a23c;
  }
  
  .tag-danger {
    background-color: #fef0f0;
    color: #f56c6c;
  }
  
  .tag-default {
    background-color: #f4f4f5;
    color: #909399;
  }
  
  // 操作按钮样式
  .operation-buttons {
    display: flex;
    gap: 4px;
  }
  
  .operation-btn {
    padding: 2px 6px;
    font-size: 12px;
    border-radius: 3px;
    border: 1px solid #dcdfe6;
    background-color: #ffffff;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background-color: #f5f7fa;
      border-color: #c6e2ff;
      color: #409eff;
    }
  }
  
  .more-btn {
    display: flex;
    align-items: center;
    
    i {
      margin-left: 3px;
      font-size: 10px;
    }
  }
}
</style> 