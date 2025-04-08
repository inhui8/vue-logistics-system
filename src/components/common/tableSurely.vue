<template>
    <div class="groupable-table-container">
      <a-table
        :columns="dynamicColumns"
        :data-source="tableData"
        :row-key="rowKey"
        :row-class-name="getRowClassName"
        :default-expand-all-rows="defaultExpandAll"
        :row-selection="showSelection ? rowSelectionConfig : undefined"
        :pagination="showPagination ? paginationConfig : false"
        :custom-row="customRow"
        v-bind="$attrs"
      >
        <template #bodyCell="{ column, record, text }">
          <template v-if="column.key === '__groupColumn'">
            <div v-if="record.isGroup" class="group-name" :class="`group-level-${record.groupLevel || 1}`">
              <span class="group-title">{{ record.groupName }}</span>
              <span class="group-count" v-if="record.count">({{ record.count }})</span>
            </div>
          </template>
           <template v-else>
            {{ text }}
          </template>
        </template>
  
         </a-table>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  import { defineProps, defineEmits } from 'vue';
  // Remove unused imports/variables
  // import trainsData from '@/assets/json/deliveryTrainsData.json';
  // import trainsColumns from '@/assets/json/deliveryTrainsColumns.json';
  // Optional: If using icons like CaretRightOutlined
  // import { CaretRightOutlined } from '@ant-design/icons-vue';
  
  // --- Props ---
  const props = defineProps({
    // Table data (potentially pre-grouped)
    data: {
      type: Array,
      required: true
    },
    // Row unique key field
    rowKey: {
      type: String,
      default: 'id'
    },
    // Grouping fields (used externally to prepare `data`, not directly by this table)
    groupFields: {
      type: Array,
      default: () => []
    },
    // Columns definition (Required for a-table)
    // Parent should pass column definitions array now
    columns: {
        type: Array,
        required: true
    },
    // Show selection column
    showSelection: {
      type: Boolean,
      default: true
    },
    // Show dedicated group column
    showGroupColumn: {
      type: Boolean,
      default: true
    },
    // Group column title
    groupColumnLabel: {
      type: String,
      default: '分组'
    },
    // Group column width
    groupColumnWidth: {
      type: [String, Number],
      default: 180
    },
    // Group column fixed position
    groupColumnFixed: {
      type: [String, Boolean], // 'left', 'right', false
      default: 'left'
    },
    // Default expand all
    defaultExpandAll: {
      type: Boolean,
      default: true
    },
    // Show pagination
    showPagination: {
      type: Boolean,
      default: true
    },
    // Current page (use v-model:currentPage externally)
    currentPage: {
      type: Number,
      default: 1
    },
    // Page size (use v-model:pageSize externally)
    pageSize: {
      type: Number,
      default: 20
    },
    // Available page sizes
    pageSizes: {
      type: Array,
      default: () => [10, 20, 50, 100]
    },
    // Total items
    total: {
      type: Number,
      default: 0
    }
  });
  
  // --- Emits ---
  const emit = defineEmits([
    'selection-change',
    // Note: 'cell-click' is replaced by 'row-click' due to a-table API differences
    'row-click',
    'update:currentPage', // For v-model:currentPage
    'update:pageSize',    // For v-model:pageSize
    'size-change',        // Kept for compatibility if needed, but update:pageSize is preferred
    'current-change',     // Kept for compatibility if needed, but update:currentPage is preferred
    // Include other emits from original if needed, though their trigger points might change
    'cell-dbl-click',
    'cell-edit-confirm',
    'tag-close'
  ]);
  
  // --- Internal State ---
  const selectedRowKeys = ref([]);
  
  // --- Computed Properties ---
  
  // Table data (assuming grouping logic is applied *before* passing data to this component)
  const tableData = computed(() => props.data);
  
  // Dynamically add group and selection columns based on props
  const dynamicColumns = computed(() => {
      let cols = [];
  
      // Add dedicated group column if enabled
      if (props.showGroupColumn) {
          cols.push({
              title: props.groupColumnLabel,
              key: '__groupColumn', // Unique key for internal identification
              width: props.groupColumnWidth,
              fixed: props.groupColumnFixed || undefined, // Use undefined if false
              // Custom rendering is handled in the #bodyCell template slot
          });
      }
  
      // Add columns passed via props
      // We need to map the slot information if parent uses slots for column rendering
      const parentColumns = props.columns.map(col => {
          // Basic mapping, might need enhancement based on how slots are used in parent
          // If parent passes render functions directly in column definitions, it's simpler.
          // If parent uses named slots like <template #colSlotName="{ record }">, more complex mapping is needed here.
          const newCol = { ...col };
           // If parent defines scoped slots for columns, try to map them
           // ATable expects `customRender` function in the column definition
           // This part is complex and depends heavily on how the parent component defines columns and slots
           // Example: if parent used <template #header-myCol> & <template #cell-myCol="{record}">
           // We'd need to detect these slots and create render functions using h()
           // For simplicity now, we assume parent passes columns array with `customRender` already defined if needed
          return newCol;
      });
  
      cols = cols.concat(parentColumns);
  
      return cols;
  });
  
  
  // Row selection configuration
  const rowSelectionConfig = computed(() => ({
    selectedRowKeys: selectedRowKeys.value,
    onChange: (keys, selectedRows) => {
      selectedRowKeys.value = keys;
      // Filter out group rows from the selection reported
      const actualSelection = selectedRows.filter(row => !row.isGroup);
      emit('selection-change', actualSelection); // Emit actual data rows
    },
    getCheckboxProps: (record) => ({
      // Disable checkbox for rows marked as group rows
      disabled: record.isGroup,
      // Add any other custom checkbox props if needed
    }),
    // type: 'checkbox', // Default is checkbox
  }));
  
  // Pagination configuration
  const paginationConfig = computed(() => ({
    current: props.currentPage,
    pageSize: props.pageSize,
    total: props.total,
    pageSizeOptions: props.pageSizes.map(String), // Antd expects string array
    showSizeChanger: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    // onChange handles both page and size changes in Ant Design pagination
    onChange: (page, size) => {
        // Check if page size changed
        if (size !== props.pageSize) {
            emit('update:pageSize', size);
            emit('size-change', size); // Emit for compatibility
            // Often, changing page size also resets page to 1
            if (props.currentPage !== 1) {
              emit('update:currentPage', 1);
              emit('current-change', 1); // Emit for compatibility
            }
        }
        // Check if current page changed
        if (page !== props.currentPage) {
           emit('update:currentPage', page);
           emit('current-change', page); // Emit for compatibility
        }
    },
   // Note: Antd v4+ uses onChange. onShowSizeChange is less common now but included for safety.
   // If using older antd versions, you might need this:
   // onShowSizeChange: (current, size) => {
   //     emit('update:pageSize', size);
   //     emit('size-change', size);
   //     // Request page 1 when size changes, common behavior
   //     emit('update:currentPage', 1);
   //     emit('current-change', 1);
   // }
  }));
  
  // --- Methods ---
  
  // Get row class name
  const getRowClassName = (record) => {
    let classNames = [];
    if (record.isGroup) {
      classNames.push('group-row');
      classNames.push(`group-level-${record.groupLevel || 1}`);
    } else if (record.parentGroupKey) {
      classNames.push('data-item');
      classNames.push(`data-parent-group-${record.parentGroupKey}`);
    }
    return classNames.join(' ');
  };
  
  // Custom row props (for handling row clicks)
  const customRow = (record) => {
    return {
      onClick: (event) => {
        emit('row-click', record, event);
      },
      onDblclick: (event) => {
        emit('cell-dbl-click', record, event)
      }
    };
  };
  
  // --- Watchers ---
  
  // Watch for external changes to selection if needed (e.g., parent clearing selection)
  // This requires the parent to manage the selected keys via a prop if two-way binding isn't used.
  
  // Watch for prop changes to update pagination (if not using v-model)
  // watch(() => props.currentPage, (newVal) => {
  //   // Update internal state if necessary, though computed prop should handle it
  // });
  // watch(() => props.pageSize, (newVal) => {
  //   // Update internal state if necessary
  // });
  
  </script>
  
  <style scoped>
  /* :deep() targets elements inside child components */
  .groupable-table-container {
    width: 100%;
    height: 100%;
    display: flex; /* Use flexbox for layout */
    flex-direction: column; /* Stack table and potential pagination */
  }
  
  /* Make table take available space */
  :deep(.ant-table-wrapper) {
      flex-grow: 1; /* Allow table to grow */
      overflow: auto; /* Add scroll if needed */
  }
  
  
  .group-name {
    display: flex;
    align-items: center;
    font-weight: bold;
  }
  
  /* Adjust colors and font sizes as needed */
  .group-level-1 .group-title {
    color: #1890ff; /* Ant Design Blue */
    font-size: 14px;
  }
  .group-level-2 .group-title {
    color: #52c41a; /* Ant Design Green */
    font-size: 13px;
  }
  .group-level-3 .group-title {
    color: #faad14; /* Ant Design Yellow/Orange */
    font-size: 13px;
  }
  
  .group-title {
    margin-right: 8px; /* Increased spacing */
  }
  
  .group-count {
    color: rgba(0, 0, 0, 0.45); /* Ant Design Gray */
    font-size: 12px;
    font-weight: normal; /* Group count usually not bold */
  }
  
  /* Styling for data rows within groups (optional) */
  .data-item {
    background-color: #fafafa;
  }
  
  /* 分页容器样式 */
  .pagination-container {
    margin-top: 15px;
    display: flex;
    justify-content: flex-end;
  }
  
  /* 组行样式 */
  :deep(.ant-table-row.group-row) {
    font-weight: bold;
  }
  
  /* 不同级别组行的背景色 */
  :deep(.ant-table-row.group-level-1) {
    background-color: #e6f7ff;
  }
  
  :deep(.ant-table-row.group-level-2) {
    background-color: #f6ffed;
  }
  
  :deep(.ant-table-row.group-level-3) {
    background-color: #fff7e6;
  }
  /* :deep() targets elements inside child components */
.groupable-table-container {
  width: 100%;
  height: 100%;
  display: flex; /* Use flexbox for layout */
  flex-direction: column; /* Stack table and pagination */
}

/* Make table take available space */
:deep(.surely-table-wrapper), /* Adjust class for Surely */
:deep(.ant-table-wrapper) { /* Keep Ant class for compatibility if needed */
    flex-grow: 1; /* Allow table to grow */
    min-height: 0; /* Important for flex-grow in some contexts */
    display: flex;
    flex-direction: column;
}
:deep(.surely-table),
:deep(.ant-table) {
    flex-grow: 1;
    min-height: 0;
}
 :deep(.surely-table-container), /* Adjust for Surely */
 :deep(.ant-spin-nested-loading) { /* Often wraps the table */
     height: 100%;
     display: flex;
     flex-direction: column;
 }
 :deep(.surely-table-body),
 :deep(.ant-table-container) {
     flex-grow: 1;
     overflow: auto; /* Ensure body scrolls */
 }


.group-name {
  display: flex;
  align-items: center;
  font-weight: bold;
}

/* Adjust colors and font sizes as needed */
.group-level-1 .group-title {
  color: #1890ff; /* Ant Design Blue */
  font-size: 14px;
}
.group-level-2 .group-title {
  color: #52c41a; /* Ant Design Green */
  font-size: 13px;
}
.group-level-3 .group-title {
  color: #faad14; /* Ant Design Yellow/Orange */
  font-size: 13px;
}

.group-title {
  margin-right: 8px; /* Increased spacing */
}

.group-count {
  color: rgba(0, 0, 0, 0.45); /* Ant Design Gray */
  font-size: 12px;
  font-weight: normal; /* Group count usually not bold */
}

/* Styling for data rows within groups (optional) */
/* Targeting might need adjustment based on Surely's output */
:deep(.data-item) {
  /* background-color: #FAFAFA; */ /* Subtle background */
}

/* Row background colors based on group level */
/* Adjust selector for Surely Vue's row structure */
:deep(.ant-table-row.group-row.group-level-1),
:deep(.s-table-row.group-row.group-level-1) { /* Add Surely's class */
  background-color: #e6f7ff !important; /* Ant Design Blue Light */
  font-weight: bold;
}

:deep(.ant-table-row.group-row.group-level-2),
:deep(.s-table-row.group-row.group-level-2) {
  background-color: #f6ffed !important; /* Ant Design Green Light */
   font-weight: bold;
}

:deep(.ant-table-row.group-row.group-level-3),
:deep(.s-table-row.group-row.group-level-3) {
  background-color: #fffbe6 !important; /* Ant Design Yellow Light */
   font-weight: bold;
}

/* Style group rows to look distinct */
:deep(.group-row) {
  font-weight: bold;
}
:deep(.group-row td) {
   /* Ensure background covers the whole cell */
  background: inherit !important;
}


/* Adjust expanded cell padding if necessary */
:deep(.ant-table-expanded-row > .ant-table-cell),
:deep(.s-table-expanded-row > .s-table-cell) { /* Adjust for Surely */
  padding: 0 !important;
}

/* Pagination container styling (less needed with integrated pagination) */
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* Ensure selection column cells in group rows don't look interactive */
:deep(.group-row .ant-table-selection-column .ant-checkbox-wrapper),
:deep(.group-row .s-table-selection-column .s-checkbox-wrapper){ /* Adjust for Surely */
    /* visibility: hidden; */ /* Hide checkbox visually if needed, though disabled should suffice */
}
</style>