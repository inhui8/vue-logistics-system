<!-- eslint-disable -->
<template>
  <el-table-column :prop="prop" :label="label" :width="width">
    <template #default="scope">
      <span v-if="scope.row.isGroup && showSummary" class="group-summary">{{ getSummaryValue(scope.row) }}</span>
      <div v-else-if="!scope.row.isGroup && editable" class="editable-cell" @dblclick="handleCellDblClick(scope.row, prop)">
        <!-- 文本输入框 -->
        <el-input
          v-if="scope.row.editing === prop && type === 'text'"
          v-model="scope.row[prop]"
          size="small"
          @blur="handleCellEditConfirm(scope.row, prop)"
          @keyup.enter="handleCellEditConfirm(scope.row, prop)"
          v-focus
        />
        
        <!-- 长文本输入框 -->
        <el-input
          v-else-if="scope.row.editing === prop && type === 'textarea'"
          v-model="scope.row[prop]"
          type="textarea"
          size="small"
          @blur="handleCellEditConfirm(scope.row, prop)"
          v-focus
        />
        
        <!-- 日期选择器 -->
        <el-date-picker
          v-else-if="scope.row.editing === prop && type === 'datetime'"
          v-model="scope.row[prop]"
          type="datetime"
          size="small"
          @blur="handleCellEditConfirm(scope.row, prop)"
          v-focus
        />
        
        <!-- 单选下拉框 -->
        <el-select
          v-else-if="scope.row.editing === prop && type === 'select'"
          v-model="scope.row[prop]"
          size="small"
          @blur="handleCellEditConfirm(scope.row, prop)"
          v-focus
        >
          <el-option
            v-for="option in options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        
        <!-- 多选标签 -->
        <el-select
          v-else-if="scope.row.editing === prop && type === 'tags'"
          v-model="scope.row[prop]"
          multiple
          filterable
          allow-create
          default-first-option
          collapse-tags
          size="small"
          @blur="handleCellEditConfirm(scope.row, prop)"
          v-focus
        >
          <el-option
            v-for="option in options"
            :key="typeof option === 'object' ? option.value : option"
            :label="typeof option === 'object' ? option.label : option"
            :value="typeof option === 'object' ? option.value : option"
          />
        </el-select>
        
        <!-- 非编辑状态下的标签显示 -->
        <div v-else-if="type === 'tags'" class="tags-wrapper" @click="handleCellClick(scope.row, prop)">
          <template v-if="Array.isArray(scope.row[prop]) && scope.row[prop].length > 0">
            <el-tag
              v-for="tag in scope.row[prop]"
              :key="tag"
              :type="getTagType ? getTagType(tag) : ''"
              size="small"
              closable
              @close.stop="handleTagClose(scope.row, prop, tag)"
            >
              {{ getTagText ? getTagText(tag) : tag }}
            </el-tag>
          </template>
          <template v-else-if="typeof scope.row[prop] === 'string' && scope.row[prop]">
            <el-tag
              :type="getTagType ? getTagType(scope.row[prop]) : ''"
              size="small"
              closable
              @close.stop="handleTagClose(scope.row, prop, scope.row[prop])"
            >
              {{ getTagText ? getTagText(scope.row[prop]) : scope.row[prop] }}
            </el-tag>
          </template>
          <el-tag v-else size="small" type="info">未设置</el-tag>
        </div>
        
        <!-- 非编辑状态下的长文本显示 -->
        <div v-else-if="type === 'textarea'" @click="handleCellClick(scope.row, prop)" class="cell-content">
          {{ scope.row[prop] || placeholder || '暂无内容' }}
        </div>
        
        <!-- 非编辑状态下的普通文本显示 -->
        <span v-else @click="handleCellClick(scope.row, prop)">{{ scope.row[prop] }}</span>
      </div>
      <!-- 非可编辑行的显示 -->
      <span v-else>{{ scope.row[prop] }}</span>
    </template>
  </el-table-column>
</template>

<script>
export default {
  name: 'EditableTableColumn',
  props: {
    prop: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    width: {
      type: [String, Number],
      default: 'auto'
    },
    type: {
      type: String,
      default: 'text',
      validator: (value) => {
        return ['text', 'textarea', 'datetime', 'select', 'tags'].includes(value)
      }
    },
    editable: {
      type: Boolean,
      default: true
    },
    options: {
      type: Array,
      default: () => []
    },
    placeholder: {
      type: String,
      default: ''
    },
    showSummary: {
      type: Boolean,
      default: false
    },
    summaryProperty: {
      type: String,
      default: ''
    },
    getTagType: {
      type: Function,
      default: null
    },
    getTagText: {
      type: Function,
      default: null
    }
  },
  emits: ['cell-click', 'cell-dbl-click', 'cell-edit-confirm', 'tag-close'],
  setup(props, { emit }) {
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

    // 获取分组摘要值
    const getSummaryValue = (row) => {
      if (props.summaryProperty && row[props.summaryProperty]) {
        return row[props.summaryProperty];
      }
      
      if (typeof row[props.prop] === 'number') {
        return row[props.prop].toFixed(2);
      }
      
      return row[props.prop];
    }

    return {
      handleCellClick,
      handleCellDblClick,
      handleCellEditConfirm,
      handleTagClose,
      getSummaryValue
    }
  }
}
</script>

<style scoped>
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

.group-summary {
  color: #409EFF;
  font-weight: bold;
}
</style> 