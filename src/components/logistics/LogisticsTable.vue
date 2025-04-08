<!-- eslint-disable -->
<template>
  <div class="logistics-table-container">
    <!-- 筛选区域 -->
    <filter-area
      :filter-fields="filterFields"
      :status-options="statusOptions"
      :show-date-range="true"
      :show-status-filter="true"
      :date-field="dateField"
      @search="handleSearch"
      @reset="handleReset"
    />
    
    <!-- 工具栏 -->
    <table-toolbar
      :show-batch-actions="true"
      :batch-actions="batchActions"
      :selected-rows="selectedRows"
      :show-export="true"
      :show-column-setting="true"
      :show-sort="true"
      :show-group="true"
      :columns="columns"
      :default-visible-columns="visibleColumns"
      :default-sort-fields="sortFields"
      :default-group-fields="groupFields"
      @batch-command="handleBatchCommand"
      @clear-selection="clearSelection"
      @export="handleExport"
      @update:columns="handleUpdateColumns"
      @sort-change="handleSortChange"
      @group-change="handleGroupChange"
    >
      <template #left>
        <el-button
          type="primary"
          icon="el-icon-plus"
          size="small"
          @click="handleAdd"
        >
          添加
        </el-button>
      </template>
      
      <template #right>
        <el-button
          icon="el-icon-refresh"
          size="small"
          @click="handleRefresh"
        >
          刷新
        </el-button>
      </template>
    </table-toolbar>
    
    <!-- 表格组件 -->
    <groupable-table
      :data="tableData"
      :row-key="rowKey"
      :group-fields="groupFields"
      :show-selection="true"
      :show-group-column="true"
      :group-column-label="groupColumnLabel"
      :group-column-width="180"
      :group-column-fixed="true"
      :default-expand-all="true"
      :show-pagination="true"
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="total"
      @selection-change="handleSelectionChange"
      @cell-click="handleCellClick"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      @cell-dbl-click="handleCellDblClick"
      @cell-edit-confirm="handleCellEditConfirm"
      @tag-close="handleTagClose"
      border
      stripe
      highlight-current-row
    >
      <!-- 动态生成表格列 -->
      <template v-for="column in renderColumns" :key="column.prop">
        <!-- 可编辑的文本列 -->
        <editable-table-column
          v-if="column.editable && column.type === 'text'"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          type="text"
          :editable="column.editable"
          :show-summary="column.showSummary"
          :summary-property="column.summaryProperty"
          @cell-click="handleCellClick"
          @cell-dbl-click="handleCellDblClick"
          @cell-edit-confirm="handleCellEditConfirm"
        />
        
        <!-- 可编辑的长文本列 -->
        <editable-table-column
          v-else-if="column.editable && column.type === 'textarea'"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          type="textarea"
          :editable="column.editable"
          :placeholder="column.placeholder"
          @cell-click="handleCellClick"
          @cell-dbl-click="handleCellDblClick"
          @cell-edit-confirm="handleCellEditConfirm"
        />
        
        <!-- 可编辑的日期列 -->
        <editable-table-column
          v-else-if="column.editable && column.type === 'datetime'"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          type="datetime"
          :editable="column.editable"
          @cell-click="handleCellClick"
          @cell-dbl-click="handleCellDblClick"
          @cell-edit-confirm="handleCellEditConfirm"
        />
        
        <!-- 可编辑的单选列 -->
        <editable-table-column
          v-else-if="column.editable && column.type === 'select'"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          type="select"
          :editable="column.editable"
          :options="column.options"
          @cell-click="handleCellClick"
          @cell-dbl-click="handleCellDblClick"
          @cell-edit-confirm="handleCellEditConfirm"
        />
        
        <!-- 可编辑的标签列 -->
        <editable-table-column
          v-else-if="column.editable && column.type === 'tags'"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          type="tags"
          :editable="column.editable"
          :options="column.options"
          :get-tag-type="column.getTagType"
          :get-tag-text="column.getTagText"
          @cell-click="handleCellClick"
          @cell-dbl-click="handleCellDblClick"
          @cell-edit-confirm="handleCellEditConfirm"
          @tag-close="handleTagClose"
        />
        
        <!-- 普通文本列 -->
        <el-table-column
          v-else
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :formatter="column.formatter"
        >
          <template v-if="column.slotName" #default="scope">
            <slot :name="column.slotName" :row="scope.row" :column="scope.column" :index="scope.$index"></slot>
          </template>
        </el-table-column>
      </template>
      
      <!-- 操作列 -->
      <operation-column
        v-if="showOperation"
        :label="operationColumnLabel"
        :width="operationColumnWidth"
        :button-text="operationButtonText"
        :actions="operationActions"
        :additional-buttons="operationAdditionalButtons"
        @command="handleOperationCommand"
        @button-click="handleOperationButtonClick"
      />
    </groupable-table>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import FilterArea from './FilterArea.vue';
import TableToolbar from './TableToolbar.vue';
import GroupableTable from './GroupableTable.vue';
import EditableTableColumn from './EditableTableColumn.vue';
import OperationColumn from './OperationColumn.vue';

export default {
  name: 'LogisticsTable',
  components: {
    FilterArea,
    TableToolbar,
    GroupableTable,
    EditableTableColumn,
    OperationColumn
  },
  props: {
    // 表格标识，用于区分不同的表格
    tableId: {
      type: String,
      default: 'logistics-table'
    },
    // 行数据的唯一标识字段
    rowKey: {
      type: String,
      default: 'id'
    },
    // 列配置
    columns: {
      type: Array,
      required: true
    },
    // 初始可见列
    initialVisibleColumns: {
      type: Array,
      default: () => []
    },
    // 筛选字段配置
    filterFields: {
      type: Array,
      default: () => []
    },
    // 状态选项
    statusOptions: {
      type: Array,
      default: () => []
    },
    // 日期字段
    dateField: {
      type: String,
      default: 'createdAt'
    },
    // 批量操作配置
    batchActions: {
      type: Array,
      default: () => []
    },
    // 分组列标签
    groupColumnLabel: {
      type: String,
      default: '分组'
    },
    // 是否显示操作列
    showOperation: {
      type: Boolean,
      default: true
    },
    // 操作列标签
    operationColumnLabel: {
      type: String,
      default: '操作'
    },
    // 操作列宽度
    operationColumnWidth: {
      type: [String, Number],
      default: 120
    },
    // 操作按钮文本
    operationButtonText: {
      type: String,
      default: '操作'
    },
    // 操作列下拉菜单
    operationActions: {
      type: Array,
      default: () => []
    },
    // 操作列额外按钮
    operationAdditionalButtons: {
      type: Array,
      default: () => []
    }
  },
  emits: [
    'search', 
    'reset', 
    'add', 
    'refresh', 
    'export', 
    'batch-command',
    'selection-change',
    'cell-click',
    'cell-dbl-click',
    'cell-edit-confirm',
    'tag-close',
    'size-change',
    'current-change',
    'operation-command',
    'operation-button-click'
  ],
  setup(props, { emit }) {
    const store = useStore();
    
    // 表格数据
    const tableData = ref([]);
    
    // 选中的行
    const selectedRows = ref([]);
    
    // 可见列
    const visibleColumns = ref(
      props.initialVisibleColumns && props.initialVisibleColumns.length > 0
        ? [...props.initialVisibleColumns]
        : props.columns.map(column => column.prop)
    );
    
    // 渲染的列
    const renderColumns = computed(() => {
      // 根据visibleColumns过滤并排序columns
      return props.columns.filter(column => visibleColumns.value.includes(column.prop))
        .sort((a, b) => {
          const indexA = visibleColumns.value.indexOf(a.prop);
          const indexB = visibleColumns.value.indexOf(b.prop);
          return indexA - indexB;
        });
    });
    
    // 排序字段
    const sortFields = ref([]);
    
    // 分组字段
    const groupFields = ref([]);
    
    // 分页相关
    const currentPage = ref(1);
    const pageSize = ref(20);
    const total = ref(0);
    
    // 查询参数
    const queryParams = reactive({
      keyword: '',
      status: [],
      dateRange: null,
      advanced: {},
      sort: [],
      page: currentPage.value,
      limit: pageSize.value
    });
    
    // 加载表格数据
    const loadTableData = async () => {
      try {
        // 从API或Vuex获取数据
        if (groupFields.value.length > 0) {
          // 有分组字段，获取分组后的数据
          const result = await store.dispatch('applyGroup', {
            data: store.state.tableData,
            groupFields: groupFields.value
          });
          tableData.value = result;
        } else {
          // 无分组字段，直接获取普通数据
          tableData.value = store.state.tableData || [];
        }
        
        // 设置总数
        total.value = store.state.totalCount || tableData.value.length;
      } catch (error) {
        console.error('加载表格数据失败', error);
      }
    };
    
    // 处理搜索
    const handleSearch = (params) => {
      Object.assign(queryParams, params);
      queryParams.page = 1; // 重置页码
      currentPage.value = 1;
      
      emit('search', queryParams);
      loadTableData();
    };
    
    // 处理重置
    const handleReset = () => {
      Object.keys(queryParams).forEach(key => {
        if (key !== 'page' && key !== 'limit') {
          queryParams[key] = Array.isArray(queryParams[key]) ? [] : '';
        }
      });
      
      emit('reset');
      loadTableData();
    };
    
    // 处理添加
    const handleAdd = () => {
      emit('add');
    };
    
    // 处理刷新
    const handleRefresh = () => {
      emit('refresh');
      loadTableData();
    };
    
    // 处理导出
    const handleExport = () => {
      emit('export', {
        data: selectedRows.value.length > 0 ? selectedRows.value : tableData.value,
        columns: renderColumns.value,
        filename: `${props.tableId}-export-${new Date().getTime()}.xlsx`
      });
    };
    
    // 处理批量操作
    const handleBatchCommand = (params) => {
      emit('batch-command', params);
    };
    
    // 处理选择变化
    const handleSelectionChange = (selection) => {
      selectedRows.value = selection;
      emit('selection-change', selection);
    };
    
    // 清除选择
    const clearSelection = () => {
      selectedRows.value = [];
    };
    
    // 处理列更新
    const handleUpdateColumns = (columns) => {
      // 更新可见列
      visibleColumns.value = columns.map(column => column.prop);
    };
    
    // 处理排序变化
    const handleSortChange = (fields) => {
      sortFields.value = fields;
      queryParams.sort = fields;
      
      emit('sort-change', fields);
      loadTableData();
    };
    
    // 处理分组变化
    const handleGroupChange = (fields) => {
      groupFields.value = fields;
      
      emit('group-change', fields);
      loadTableData();
    };
    
    // 处理单元格点击
    const handleCellClick = (row, column, cell, event) => {
      emit('cell-click', row, column, cell, event);
    };
    
    // 处理单元格双击
    const handleCellDblClick = (row, field) => {
      // 对非分组行启用编辑
      if (!row.isGroup) {
        row.editing = field;
      }
      
      emit('cell-dbl-click', row, field);
    };
    
    // 处理单元格编辑确认
    const handleCellEditConfirm = (row, field) => {
      row.editing = null;
      
      emit('cell-edit-confirm', row, field);
    };
    
    // 处理标签关闭
    const handleTagClose = (row, field, tag) => {
      // 移除标签
      if (Array.isArray(row[field])) {
        const index = row[field].indexOf(tag);
        if (index !== -1) {
          row[field].splice(index, 1);
        }
      } else {
        row[field] = '';
      }
      
      emit('tag-close', row, field, tag);
    };
    
    // 处理页码大小变化
    const handleSizeChange = (size) => {
      pageSize.value = size;
      queryParams.limit = size;
      
      emit('size-change', size);
      loadTableData();
    };
    
    // 处理当前页变化
    const handleCurrentChange = (page) => {
      currentPage.value = page;
      queryParams.page = page;
      
      emit('current-change', page);
      loadTableData();
    };
    
    // 处理操作命令
    const handleOperationCommand = (params) => {
      emit('operation-command', params);
    };
    
    // 处理操作按钮点击
    const handleOperationButtonClick = (params) => {
      emit('operation-button-click', params);
    };
    
    // 初始化
    onMounted(() => {
      loadTableData();
    });
    
    return {
      tableData,
      selectedRows,
      visibleColumns,
      renderColumns,
      sortFields,
      groupFields,
      currentPage,
      pageSize,
      total,
      handleSearch,
      handleReset,
      handleAdd,
      handleRefresh,
      handleExport,
      handleBatchCommand,
      handleSelectionChange,
      clearSelection,
      handleUpdateColumns,
      handleSortChange,
      handleGroupChange,
      handleCellClick,
      handleCellDblClick,
      handleCellEditConfirm,
      handleTagClose,
      handleSizeChange,
      handleCurrentChange,
      handleOperationCommand,
      handleOperationButtonClick
    };
  }
}
</script>

<style scoped>
.logistics-table-container {
  width: 100%;
  height: 100%;
}
</style> 