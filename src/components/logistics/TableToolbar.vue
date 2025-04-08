<!-- eslint-disable -->
<template>
  <div class="table-toolbar">
    <div class="left-tools">
      <slot name="left"></slot>
      
      <!-- 批量操作下拉 -->
      <el-dropdown v-if="showBatchActions && selectedRows.length > 0" @command="handleBatchCommand">
        <el-button type="primary" size="small">
          批量操作 <i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="action in batchActions"
              :key="action.command"
              :command="action.command"
              :disabled="action.disabled"
            >
              <i v-if="action.icon" :class="action.icon"></i> {{ action.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      
      <span v-if="selectedRows.length > 0" class="selection-info">
        已选择 {{ selectedRows.length }} 项
        <el-button type="text" size="small" @click="handleClearSelection">清除</el-button>
      </span>
    </div>
    
    <div class="right-tools">
      <!-- 导出 -->
      <el-button
        v-if="showExport"
        type="primary"
        plain
        size="small"
        icon="el-icon-download"
        @click="handleExport"
      >
        导出
      </el-button>
      
      <!-- 字段配置 -->
      <el-popover
        v-if="showColumnSetting"
        placement="bottom"
        width="300"
        trigger="click"
        popper-class="column-setting-popover"
      >
        <template #reference>
          <el-button 
            type="primary" 
            plain 
            size="small" 
            icon="el-icon-setting"
          >
            字段配置
          </el-button>
        </template>
        
        <div class="column-setting">
          <div class="column-setting-header">
            <span>字段配置</span>
            <el-button type="text" size="small" @click="handleResetColumns">恢复默认</el-button>
          </div>
          
          <div class="column-setting-body">
            <el-checkbox-group v-model="visibleColumns">
              <draggable v-model="visibleColumns" handle=".column-drag-handle" @end="handleDragEnd" item-key="prop" ghost-class="ghost-column" animation="300">
                <template #item="{element}">
                  <div class="column-setting-item">
                    <i class="el-icon-rank column-drag-handle"></i>
                    <el-checkbox :label="element" :disabled="isColumnRequired(element)">
                      {{ getColumnLabel(element) }}
                    </el-checkbox>
                  </div>
                </template>
              </draggable>
            </el-checkbox-group>
          </div>
          
          <div class="column-setting-footer">
            <el-button type="primary" size="small" @click="handleApplyColumns">应用</el-button>
          </div>
        </div>
      </el-popover>
      
      <!-- 排序 -->
      <el-popover
        v-if="showSort"
        placement="bottom"
        width="300"
        trigger="click"
        popper-class="sort-setting-popover"
      >
        <template #reference>
          <el-button 
            type="primary" 
            plain 
            size="small" 
            icon="el-icon-sort"
            :class="{ 'is-active': sortFields.length > 0 }"
          >
            排序
          </el-button>
        </template>
        
        <div class="sort-setting">
          <div class="sort-setting-header">
            <span>排序设置</span>
            <el-button type="text" size="small" @click="handleResetSort">清除排序</el-button>
          </div>
          
          <div class="sort-setting-body">
            <el-form :model="sortForm" label-width="80px" size="small">
              <el-form-item label="排序字段">
                <el-select v-model="sortForm.field" placeholder="请选择" style="width: 100%">
                  <el-option
                    v-for="column in sortableColumns"
                    :key="column.prop"
                    :label="column.label"
                    :value="column.prop"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="排序方式">
                <el-radio-group v-model="sortForm.order">
                  <el-radio label="ascending">升序</el-radio>
                  <el-radio label="descending">降序</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleAddSort">添加排序</el-button>
              </el-form-item>
            </el-form>
            
            <div v-if="sortFields.length > 0" class="sort-list">
              <div class="sort-list-header">
                <span>当前排序</span>
              </div>
              
              <draggable v-model="sortFields" handle=".sort-drag-handle" @end="handleSortDragEnd">
                <div
                  v-for="(sort, index) in sortFields"
                  :key="index"
                  class="sort-item"
                >
                  <i class="el-icon-rank sort-drag-handle"></i>
                  <span class="sort-label">
                    {{ getSortLabel(sort.field) }}
                    <el-tag size="mini" type="info">{{ sort.order === 'ascending' ? '升序' : '降序' }}</el-tag>
                  </span>
                  <i class="el-icon-close sort-remove" @click="handleRemoveSort(index)"></i>
                </div>
              </draggable>
            </div>
          </div>
          
          <div class="sort-setting-footer">
            <el-button type="primary" size="small" @click="handleApplySort">应用</el-button>
          </div>
        </div>
      </el-popover>
      
      <!-- 分组 -->
      <el-popover
        v-if="showGroup"
        placement="bottom"
        width="300"
        trigger="click"
        popper-class="group-setting-popover"
      >
        <template #reference>
          <el-button 
            type="primary" 
            plain 
            size="small" 
            icon="el-icon-s-fold"
            :class="{ 'is-active': groupFields.length > 0 }"
          >
            分组
          </el-button>
        </template>
        
        <div class="group-setting">
          <div class="group-setting-header">
            <span>分组设置</span>
            <el-button type="text" size="small" @click="handleResetGroup">清除分组</el-button>
          </div>
          
          <div class="group-setting-body">
            <el-form :model="groupForm" label-width="80px" size="small">
              <el-form-item label="分组字段">
                <el-select v-model="groupForm.field" placeholder="请选择" style="width: 100%">
                  <el-option
                    v-for="column in groupableColumns"
                    :key="column.prop"
                    :label="column.label"
                    :value="column.prop"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleAddGroup">添加分组</el-button>
              </el-form-item>
            </el-form>
            
            <div v-if="groupFields.length > 0" class="group-list">
              <div class="group-list-header">
                <span>当前分组</span>
                <span class="group-max-tip">最多支持3级分组</span>
              </div>
              
              <draggable v-model="groupFields" handle=".group-drag-handle" @end="handleGroupDragEnd">
                <div
                  v-for="(group, index) in groupFields"
                  :key="index"
                  class="group-item"
                >
                  <i class="el-icon-rank group-drag-handle"></i>
                  <span class="group-label">
                    <el-tag size="mini" :type="getGroupLevelType(index)">{{ `${index + 1}级` }}</el-tag>
                    {{ getGroupLabel(group) }}
                  </span>
                  <i class="el-icon-close group-remove" @click="handleRemoveGroup(index)"></i>
                </div>
              </draggable>
            </div>
          </div>
          
          <div class="group-setting-footer">
            <el-button type="primary" size="small" @click="handleApplyGroup">应用</el-button>
          </div>
        </div>
      </el-popover>
      
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue';
import draggable from 'vuedraggable';

export default {
  name: 'TableToolbar',
  components: {
    draggable
  },
  props: {
    // 是否显示批量操作
    showBatchActions: {
      type: Boolean,
      default: true
    },
    // 批量操作列表
    batchActions: {
      type: Array,
      default: () => []
      /* 
      示例: [
        { label: '批量删除', command: 'batch-delete', icon: 'el-icon-delete' },
        { label: '批量导出', command: 'batch-export', icon: 'el-icon-download' }
      ]
      */
    },
    // 已选择的行
    selectedRows: {
      type: Array,
      default: () => []
    },
    // 是否显示导出
    showExport: {
      type: Boolean,
      default: true
    },
    // 是否显示字段配置
    showColumnSetting: {
      type: Boolean,
      default: true
    },
    // 是否显示排序
    showSort: {
      type: Boolean,
      default: true
    },
    // 是否显示分组
    showGroup: {
      type: Boolean,
      default: true
    },
    // 所有列配置
    columns: {
      type: Array,
      required: true
      /* 
      示例: [
        { label: '柜号', prop: 'containerNo', required: true, sortable: true, groupable: true },
        { label: '客服', prop: 'customerService', sortable: true, groupable: true }
      ]
      */
    },
    // 默认可见列
    defaultVisibleColumns: {
      type: Array,
      default: () => []
    },
    // 排序字段
    defaultSortFields: {
      type: Array,
      default: () => []
    },
    // 分组字段
    defaultGroupFields: {
      type: Array,
      default: () => []
    }
  },
  emits: [
    'batch-command', 
    'clear-selection', 
    'export', 
    'update:columns', 
    'sort-change',
    'group-change'
  ],
  setup(props, { emit }) {
    // 所有列
    const allColumns = computed(() => props.columns);
    
    // 可排序的列
    const sortableColumns = computed(() => {
      return props.columns.filter(column => column.sortable);
    });
    
    // 可分组的列
    const groupableColumns = computed(() => {
      return props.columns.filter(column => column.groupable);
    });
    
    // 可见列
    const visibleColumns = ref(
      props.defaultVisibleColumns && props.defaultVisibleColumns.length > 0
        ? [...props.defaultVisibleColumns]
        : props.columns.map(column => column.prop)
    );
    
    // 排序表单
    const sortForm = reactive({
      field: '',
      order: 'ascending'
    });
    
    // 排序字段
    const sortFields = ref([...props.defaultSortFields]);
    
    // 分组表单
    const groupForm = reactive({
      field: ''
    });
    
    // 分组字段
    const groupFields = ref([...props.defaultGroupFields]);
    
    // 处理批量操作命令
    const handleBatchCommand = (command) => {
      emit('batch-command', {
        command,
        rows: props.selectedRows
      });
    };
    
    // 处理清除选择
    const handleClearSelection = () => {
      emit('clear-selection');
    };
    
    // 处理导出
    const handleExport = () => {
      emit('export');
    };
    
    // 重置列配置
    const handleResetColumns = () => {
      visibleColumns.value = props.columns.map(column => column.prop);
    };
    
    // 列拖拽结束
    const handleDragEnd = () => {
      // 根据拖拽后的visibleColumns顺序重新排列columns
      const newColumns = [];
      
      // 先处理visibleColumns中的列，保持拖拽后的顺序
      for (const prop of visibleColumns.value) {
        const column = props.columns.find(col => col.prop === prop);
        if (column) {
          newColumns.push(column);
        }
      }
      
      // 再处理未显示的列，保持原来的顺序
      for (const column of props.columns) {
        if (!visibleColumns.value.includes(column.prop)) {
          newColumns.push(column);
        }
      }
      
      // 通知父组件列顺序已更新
      emit('update:columns', newColumns);
    };
    
    // 应用列配置
    const handleApplyColumns = () => {
      // 根据visibleColumns和columns生成新的列配置
      const newColumns = visibleColumns.value.map(prop => {
        return props.columns.find(column => column.prop === prop);
      }).filter(Boolean);
      
      emit('update:columns', newColumns);
    };
    
    // 重置排序
    const handleResetSort = () => {
      sortFields.value = [];
    };
    
    // 添加排序
    const handleAddSort = () => {
      if (!sortForm.field) {
        return;
      }
      
      // 检查是否已存在相同字段的排序
      const existIndex = sortFields.value.findIndex(item => item.field === sortForm.field);
      if (existIndex >= 0) {
        // 如果已存在，更新排序方式
        sortFields.value.splice(existIndex, 1, { ...sortForm });
      } else {
        // 不存在，添加新排序
        sortFields.value.push({ ...sortForm });
      }
      
      // 重置表单
      sortForm.field = '';
    };
    
    // 移除排序
    const handleRemoveSort = (index) => {
      sortFields.value.splice(index, 1);
    };
    
    // 排序拖拽结束
    const handleSortDragEnd = () => {
      // 拖拽结束后的处理
    };
    
    // 应用排序
    const handleApplySort = () => {
      emit('sort-change', sortFields.value);
    };
    
    // 获取排序字段标签
    const getSortLabel = (field) => {
      const column = props.columns.find(col => col.prop === field);
      return column ? column.label : field;
    };
    
    // 重置分组
    const handleResetGroup = () => {
      groupFields.value = [];
    };
    
    // 添加分组
    const handleAddGroup = () => {
      if (!groupForm.field) {
        return;
      }
      
      // 检查是否已存在相同字段的分组
      const existIndex = groupFields.value.findIndex(item => item === groupForm.field);
      if (existIndex >= 0) {
        return;
      }
      
      // 最多支持3级分组
      if (groupFields.value.length >= 3) {
        return;
      }
      
      // 添加新分组
      groupFields.value.push(groupForm.field);
      
      // 重置表单
      groupForm.field = '';
    };
    
    // 移除分组
    const handleRemoveGroup = (index) => {
      groupFields.value.splice(index, 1);
    };
    
    // 分组拖拽结束
    const handleGroupDragEnd = () => {
      // 拖拽结束后的处理
    };
    
    // 应用分组
    const handleApplyGroup = () => {
      emit('group-change', groupFields.value);
    };
    
    // 获取分组字段标签
    const getGroupLabel = (field) => {
      const column = props.columns.find(col => col.prop === field);
      return column ? column.label : field;
    };
    
    // 获取分组级别样式
    const getGroupLevelType = (index) => {
      const types = ['primary', 'success', 'warning'];
      return types[index] || 'info';
    };
    
    // 判断列是否必选
    const isColumnRequired = (prop) => {
      const column = props.columns.find(col => col.prop === prop);
      return column && column.required;
    };
    
    // 获取列的标签
    const getColumnLabel = (prop) => {
      const column = props.columns.find(col => col.prop === prop);
      return column ? column.label : prop;
    };
    
    return {
      allColumns,
      sortableColumns,
      groupableColumns,
      visibleColumns,
      sortForm,
      sortFields,
      groupForm,
      groupFields,
      handleBatchCommand,
      handleClearSelection,
      handleExport,
      handleResetColumns,
      handleDragEnd,
      handleApplyColumns,
      handleResetSort,
      handleAddSort,
      handleRemoveSort,
      handleSortDragEnd,
      handleApplySort,
      getSortLabel,
      handleResetGroup,
      handleAddGroup,
      handleRemoveGroup,
      handleGroupDragEnd,
      handleApplyGroup,
      getGroupLabel,
      getGroupLevelType,
      isColumnRequired,
      getColumnLabel
    };
  }
}
</script>

<style scoped>
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.left-tools, .right-tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.selection-info {
  margin-left: 10px;
  font-size: 14px;
  color: #606266;
}

.right-tools .el-button {
  margin-left: 10px;
}

.is-active {
  color: #409EFF;
  border-color: #409EFF;
}

/* 列设置样式 */
.column-setting-header,
.sort-setting-header,
.group-setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 10px;
}

.column-setting-body,
.sort-setting-body,
.group-setting-body {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.column-setting-footer,
.sort-setting-footer,
.group-setting-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.column-setting-item,
.sort-item,
.group-item {
  display: flex;
  align-items: center;
  padding: 5px 0;
}

.column-drag-handle,
.sort-drag-handle,
.group-drag-handle {
  cursor: move;
  margin-right: 5px;
  color: #999;
}

.sort-label,
.group-label {
  flex: 1;
  display: flex;
  align-items: center;
}

.sort-label .el-tag,
.group-label .el-tag {
  margin-right: 5px;
}

.sort-remove,
.group-remove {
  cursor: pointer;
  color: #909399;
}

.sort-remove:hover,
.group-remove:hover {
  color: #F56C6C;
}

.sort-list,
.group-list {
  margin-top: 15px;
  border-top: 1px dashed #ebeef5;
  padding-top: 10px;
}

.sort-list-header,
.group-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  color: #606266;
  font-size: 14px;
}

.group-max-tip {
  color: #909399;
  font-size: 12px;
}

.column-setting-item {
  display: flex;
  align-items: center;
  padding: 8px 5px;
  border-radius: 4px;
  transition: background-color 0.3s;
  margin-bottom: 2px;
}

.column-setting-item:hover {
  background-color: #f5f7fa;
}

.column-drag-handle {
  cursor: move;
  margin-right: 8px;
  color: #909399;
  font-size: 16px;
}

.ghost-column {
  opacity: 0.5;
  background: #c8ebfb;
  border: 1px dashed #409EFF;
}
</style> 