<!-- 基于VxeTable实现的可分组表格组件 -->
<!-- eslint-disable -->
<template>
  <div class="groupable-table-vxe">
    <!-- 表格部分 -->
    <vxe-table
      ref="xTable"
      :data="sortedData"
      :row-config="{
        keyField: rowKey,
        isHover: true,
        isCurrent: true
      }"
      :tree-config="treeConfig"
      :checkbox-config="checkboxConfig"
      :filter-config="{
        remote: false,
        showIcon: true,
        iconNone: 'vxe-icon-funnel',
        iconMatch: 'vxe-icon-funnel'
      }"
      :edit-config="{
        trigger: 'click',
        mode: 'cell'
      }"
      :mouse-config="{
        selected: false
      }"
      border
      stripe
      resizable
      show-header-overflow
      show-overflow
      :loading="loading"
      :height="height"
      @checkbox-change="handleCheckboxChange"
      @checkbox-all="handleCheckboxAll"
      @cell-click="handleCellClick"
      @cell-dblclick="handleCellDblclick"
      @sort-change="handleSortChange"
      @filter-change="handleFilterChange"
      @edit-closed="handleEditClosed">
      
      <!-- 选择列 -->
      <vxe-column v-if="showSelection" type="checkbox" width="50" align="center" fixed="left"></vxe-column>
      
      <!-- 分组列 (移到前面) -->
      <vxe-column 
        v-if="showGroupColumn && groupFields && groupFields.length > 0"
        width="220"
        align="left"
        :field="groupFields[0]"
        title="分组"
        tree-node
      >
        <template #header>
          <div class="flex items-center">
            <span class="mr-2">分组</span>
            <el-button 
              type="primary" 
              size="small" 
              plain 
              icon="el-icon-delete" 
              @click="clearGrouping"
              title="清空分组"
            >清空</el-button>
          </div>
        </template>
        <template #default="{ row }">
          <template v-if="row.isGroup">
            <span class="group-title" :style="{ 'margin-left': (row.groupLevel * 8) + 'px' }" :class="`group-level-${row.groupLevel}`">
              <strong>{{ row.groupField || '分组' }}:</strong> 
              {{ row.groupValue || '未分类' }}
              <span class="group-count">({{ row._childCount || row.children.length }})</span>
            </span>
          </template>
          <template v-else>
            <span class="leaf-node">{{ getLeafDisplayValue(row) }}</span>
          </template>
        </template>
      </vxe-column>
      
      <!-- 子表格展开列 (移到后面) -->
      <vxe-column v-if="enableSubTable" type="expand" width="60" align="center">
        <template #content="{ row }">
          <div v-if="row.subTableData && row.subTableData.length > 0" class="subtable-container">
            <h4>子表格数据</h4>
            <vxe-table
              :data="row.subTableData"
              :row-config="{ keyField: 'id', isHover: true }"
              border
              stripe
              size="small"
            >
              <vxe-column
                v-for="(column, index) in childColumns"
                :key="index"
                :field="column.prop"
                :title="column.label"
                :width="column.width"
              ></vxe-column>
            </vxe-table>
          </div>
          <div v-else class="no-subtable-data">
            <span>无子表格数据</span>
          </div>
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
          :filters="column.filterable ? getColumnFilters(column.prop) : null"
          :filter-multiple="column.filterable"
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
        :layouts="['PrevJump', 'PrevPage', 'JumpNumber', 'NextPage', 'NextJump', 'Sizes', 'Total']" 
        @page-change="handlePageChange">
      </vxe-pager>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, nextTick, reactive, watch } from 'vue'

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
    },
    // 是否显示未分类项
    showUnclassified: {
      type: Boolean,
      default: false
    },
    // 子表格列配置
    childColumns: {
      type: Array,
      default: () => []
    },
    // 是否启用子表格
    enableSubTable: {
      type: Boolean,
      default: false
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
    'clear-grouping',
    'group-cleared',
    'filter-change',
    'cell-value-change'
  ],
  setup(props, { emit }) {
    const xTable = ref(null);
    const selectedRowKeys = ref([]);
    
    // ===== 内部排序状态 =====
    const internalSortConfig = reactive({
      property: null,
      order: null
    });
    
    // ===== 内部筛选状态 =====
    const internalFilterConfig = reactive({
      filters: {}
    });
    
    // ===== 筛选选项缓存 =====
    const columnFilterOptions = reactive({});
    
    // ===== 计算属性 =====
    // 获取分组字段列表
    const groupFields = computed(() => {
      return props.groupFields && props.groupFields.length > 0 ? props.groupFields : [];
    });
    
    // 是否启用分组
    const hasGrouping = computed(() => groupFields.value.length > 0);
    
    // 处理树形表格配置
    const treeConfig = computed(() => {
      if (!hasGrouping.value) return { enabled: false };
      return {
        enabled: true,
        children: 'children',
        expandAll: props.defaultExpandAll,
        indent: 16,
        line: false,
        iconOpen: 'vxe-icon-caret-down',
        iconClose: 'vxe-icon-caret-right',
        iconRemoveInLeaf: true // 在没有子节点的行不显示展开图标
      };
    });
    
    // 处理复选框配置
    const checkboxConfig = computed(() => {
      if (!props.showSelection) return { enabled: false };
      return {
        enabled: true,
        strict: false,
        highlight: true,
        range: true // 启用范围选择
      };
    });
    
    // 可见列
    const visibleColumns = computed(() => {
      return props.columns.filter(col => col.visible !== false);
    });
    
    // 处理后的数据
    const processedData = computed(() => {
      // 1. 定义一个函数判断行是否有有效内容（排除 id, rowKey, children）
      const hasValidRowContent = (item) => {
        for (const key in item) {
          if (key !== 'id' && 
              key !== props.rowKey && 
              key !== 'children' && 
              item[key] !== undefined && 
              item[key] !== null && 
              item[key] !== '') {
            return true;
          }
        }
        return false;
      };
      
      // 2. 初始过滤：如果不需要显示未分类，则过滤掉所有无效行
      let initialData = props.data;
      if (!props.showUnclassified) {
        initialData = props.data.filter(hasValidRowContent);
      }
      
      // 3. 如果没有分组，直接调用 processGroupData 处理（它会恢复 subTableData）
      if (!hasGrouping.value) {
        return processGroupData(initialData, []); // 传入空 fields 触发恢复逻辑
      }
      
      // 4. 如果有分组，准备分组数据
      const dataForGrouping = initialData.filter(hasValidRowContent); // 确保只传递有效行给分组
      
      // 过滤掉分组字段为空的行 (如果 showUnclassified 为 false)
      const finalDataForGrouping = !props.showUnclassified ? 
        dataForGrouping.filter(item => {
          const hasGroupValue = groupFields.value.every(field => 
            item[field] !== undefined && 
            item[field] !== null && 
            item[field] !== ''
          );
          return hasGroupValue;
        }) : 
        dataForGrouping;

      // 5. 调用分组处理函数，获取最终的分组结构 (已包含 subTableData)
      return processGroupData(finalDataForGrouping, groupFields.value);
    });

    // ===== 自定义树排序逻辑 =====
    const sortTreeData = (treeData, sortConfig) => {
      if (!sortConfig || !sortConfig.property || !sortConfig.order) {
        return treeData; // 没有有效排序配置，返回原树
      }

      const { property, order } = sortConfig;
      const groupColumnField = groupFields.value.length > 0 ? groupFields.value[0] : null;

      // 比较函数
      const compareValues = (a, b) => {
        let comparison = 0;
        if (a === undefined || a === null || a === '') return order === 'asc' ? 1 : -1;
        if (b === undefined || b === null || b === '') return order === 'asc' ? -1 : 1;
        
        if (typeof a === 'number' && typeof b === 'number') {
          comparison = a - b;
        } else {
          comparison = String(a).localeCompare(String(b));
        }
        return order === 'asc' ? comparison : -comparison;
      };

      // 递归排序函数
      const recursiveSort = (nodes) => {
        if (!nodes || nodes.length === 0) return nodes;

        // 1. 如果按分组列排序，只排当前层的分组节点
        if (property === groupColumnField && nodes.every(n => n.isGroup)) {
           return nodes.sort((a, b) => compareValues(a.groupValue, b.groupValue));
        }

        // 2. 对当前层的 children 进行排序 (递归)
        const sortedNodes = nodes.map(node => {
          if (node.isGroup && node.children && node.children.length > 0) {
            // 递归对其子节点排序
            node.children = recursiveSort(node.children);
          }
          return node;
        });
        
        // 3. 对当前层节点进行排序 (主要针对叶子节点或混合节点)
        return sortedNodes.sort((a, b) => {
          // 保持分组节点在前 (或在后，取决于偏好)
          if (a.isGroup && !b.isGroup) return -1;
          if (!a.isGroup && b.isGroup) return 1;
          
          // 如果都是分组节点，且不是按分组列排，保持原始相对顺序
          if (a.isGroup && b.isGroup && property !== groupColumnField) {
            return 0; 
          }
          
          // 如果都是叶子节点，或按分组列排分组节点
          const aValue = a.isGroup ? a.groupValue : a[property];
          const bValue = b.isGroup ? b.groupValue : b[property];
          
          return compareValues(aValue, bValue);
        });
      };

      return recursiveSort([...treeData]); // 使用副本进行排序
    };

    // ===== 最终排序后的数据 =====
    const sortedData = computed(() => {
      // VXE-Table 会先根据 :filters 自动筛选 processedData，
      // 然后我们再对筛选后的结果进行自定义排序
      // 注意：VXE Table 内部可能已经应用了筛选，但我们在这里访问不到那个中间状态
      //       所以我们直接对 processedData 进行排序。
      //       VXE Table 在渲染时会应用它自己的筛选和我们提供的排序。
      return sortTreeData(processedData.value, internalSortConfig);
    });

    // 优化：计算并缓存筛选选项
    const updateColumnFilters = (data) => {
      const newOptions = {};
      props.columns.forEach(column => {
        if (column.filterable && column.prop !== 'operation') {
          const uniqueValues = new Set();
          const collectValues = (rows) => {
            if (!rows || !Array.isArray(rows)) return;
            rows.forEach(row => {
              if (!row.isGroup && row[column.prop] !== undefined && row[column.prop] !== null) {
                uniqueValues.add(String(row[column.prop]));
              }
              if (row.children && row.children.length) {
                collectValues(row.children);
              }
            });
          };
          collectValues(data);
          newOptions[column.prop] = Array.from(uniqueValues).map(value => ({ label: value, value }));
        }
      });
      // 更新缓存
      Object.assign(columnFilterOptions, newOptions);
    };

    // 监听原始数据变化，更新筛选选项缓存
    watch(() => props.data, (newData) => {
      updateColumnFilters(newData);
    }, { immediate: true, deep: true });

    // 获取列筛选条件 (从缓存读取)
    const getColumnFilters = (field) => {
      return columnFilterOptions[field] || [];
    };

    // 清空分组 (需要重置内部排序状态)
    const clearGrouping = () => {
      internalSortConfig.property = null;
      internalSortConfig.order = null;
      const prevFields = [...groupFields.value];
      emit('update:groupFields', []);
      emit('clear-grouping', prevFields);
      nextTick(() => {
        emit('group-cleared');
      });
    };

    // ===== 核心方法 =====
    // 重构：处理多级分组数据 (创建分组行，原始行作为 children)
    const processGroupData = (data, fields) => {
      if (!fields || fields.length === 0 || !data || data.length === 0) {
        // 如果没有分组或没有数据，返回原始有效数据
        // 需要恢复 children 为 subTableData，因为 processedData 不再处理无分组情况
        return data.map(item => {
          const originalItem = props.data.find(orig => orig[props.rowKey] === item[props.rowKey]);
          if (originalItem && originalItem.children) {
            item.subTableData = originalItem.children;
          }
          delete item.children; // 清理可能存在的 children
          return item;
        });
      }

      const getFieldDisplayName = (field) => {
        const column = props.columns.find(col => col.prop === field);
        return column ? column.label : field;
      };

      let groupRowIdCounter = 1; // 用于生成唯一的分组行 ID

      const processLevel = (items, level = 0) => {
        const currentField = fields[level];
        const isLastLevel = level === fields.length - 1;
        const groups = new Map();
        const unclassifiedItems = [];

        items.forEach(item => {
          const value = item[currentField];
          if (value === undefined || value === null || value === '') {
            unclassifiedItems.push(item);
          } else {
            const groupKey = String(value);
            if (!groups.has(groupKey)) {
              groups.set(groupKey, []);
            }
            groups.get(groupKey).push(item);
          }
        });

        const levelResult = [];

        // 处理有明确分组值的项
        groups.forEach((groupItems, groupValue) => {
          const groupNode = {
            id: `group-${level}-${groupRowIdCounter++}`,
            isGroup: true,
            groupLevel: level + 1,
            groupField: getFieldDisplayName(currentField),
            groupValue: groupValue === 'undefined' || groupValue === 'null' ? '未分类' : groupValue,
            [currentField]: groupValue, // 保留原始值用于可能的排序
            _groupKey: groupValue,
            _expanded: true,
            children: []
          };

          if (isLastLevel) {
            // 最深层分组：children 是原始数据项 (需要恢复 subTableData)
            groupNode.children = groupItems.map(item => {
              const originalItem = props.data.find(orig => orig[props.rowKey] === item[props.rowKey]);
              if (originalItem && originalItem.children) {
                item.subTableData = originalItem.children;
              }
              delete item.children; // 清理可能存在的 children
              return item;
            });
            groupNode._childCount = groupNode.children.length;
          } else {
            // 非最深层：递归处理下一层
            groupNode.children = processLevel(groupItems, level + 1);
            // 计算子节点总数（包括嵌套的）
            groupNode._childCount = groupNode.children.reduce((count, child) => {
              return count + (child.isGroup ? child._childCount : 1);
            }, 0);
          }

          // 只有当分组确实包含子节点时才添加
          if (groupNode._childCount > 0) {
            levelResult.push(groupNode);
          }
        });

        // 处理未分类项
        if (props.showUnclassified && unclassifiedItems.length > 0) {
          const unclassifiedNode = {
            id: `group-${level}-unclassified-${groupRowIdCounter++}`,
            isGroup: true,
            groupLevel: level + 1,
            groupField: getFieldDisplayName(currentField),
            groupValue: '未分类',
            _groupKey: '__unclassified__',
            _expanded: true,
            children: []
          };

          if (isLastLevel) {
            // 最深层：children 是原始未分类数据项 (需要恢复 subTableData)
            unclassifiedNode.children = unclassifiedItems.map(item => {
              const originalItem = props.data.find(orig => orig[props.rowKey] === item[props.rowKey]);
              if (originalItem && originalItem.children) {
                item.subTableData = originalItem.children;
              }
              delete item.children; // 清理可能存在的 children
              return item;
            });
            unclassifiedNode._childCount = unclassifiedNode.children.length;
          } else {
            // 非最深层：递归处理下一层
            unclassifiedNode.children = processLevel(unclassifiedItems, level + 1);
            unclassifiedNode._childCount = unclassifiedNode.children.reduce((count, child) => {
              return count + (child.isGroup ? child._childCount : 1);
            }, 0);
          }

          if (unclassifiedNode._childCount > 0) {
            levelResult.push(unclassifiedNode);
          }
        }

        return levelResult;
      };

      return processLevel(data);
    };
    
    // 获取有效的标签（解决v-if与v-for混用问题）
    const getValidTags = (tagsString) => {
      if (!tagsString) return [];
      return tagsString.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
    };
    
    // 获取叶子节点的显示值
    const getLeafDisplayValue = (row) => {
      if (!groupFields.value || groupFields.value.length === 0) return '';
      
      // 使用合适的分组字段 - 使用lastField更合适
      const lastField = groupFields.value[groupFields.value.length - 1]; // 使用最后一个分组字段
      const value = row[lastField];
      
      // 如果未分类且设置为不显示，返回空字符串
      if ((value === undefined || value === null || value === '') && !props.showUnclassified) {
        return '';
      }
      
      return value === undefined || value === null || value === '' ? '未分类' : String(value);
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
    
    // 处理内部排序变更
    const handleSortChange = ({ property, order }) => {
      internalSortConfig.property = order ? property : null; // 如果 order 为空则清空排序
      internalSortConfig.order = order;
      // 注意：不再 emit('sort-change')
    };
    
    // 处理内部筛选变更 (更新内部状态并emit事件)
    const handleFilterChange = ({ column, property, values }) => {
      if (values && values.length) {
        internalFilterConfig.filters[property] = values;
      } else {
        delete internalFilterConfig.filters[property];
      }
      // 触发VXE Table的内部筛选更新 (通过重新计算 sortedData)
      // 不需要手动调用 applyFilters，因为VXE会根据 :filters 和选中的值自动处理
      
      emit('filter-change', {
        column,
        property,
        values,
        filters: { ...internalFilterConfig.filters }
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
    
    // 处理单元格编辑完成
    const handleEditClosed = ({ row, column }) => {
      if (!row || !column) return;
      
      // 从原始 props.data 中获取旧值，确保准确性
      const originalItem = props.data.find(item => item[props.rowKey] === row[props.rowKey]);
      const oldValue = originalItem ? originalItem[column.property] : undefined;
      
      // 直接从 row 对象获取编辑后的新值
      const newValue = row[column.property]; 
      
      // 只有当值实际改变时才更新和通知
      if (newValue !== oldValue) {
        console.log(`[GroupableTableVisactor] Edit closed. Field: ${column.property}, Old: ${oldValue}, New: ${newValue}`);
        
        // 通知父组件数据已更改，传递从 row 对象获取的新值
        emit('cell-value-change', {
          record: row, // 传递整个行记录
          column: column.property,
          value: newValue, // 使用从 row 读取的新值
          oldValue: oldValue
        });

        // 尝试强制刷新列和数据
        nextTick(() => {
          if (xTable.value) {
            const vxeColumn = xTable.value.getColumnByField(column.property);
            if (vxeColumn) {
              xTable.value.refreshColumn(vxeColumn);
            }
            // xTable.value.syncData(); 
          }
        });
      } else {
        console.log(`[GroupableTableVisactor] Edit closed. Field: ${column.property}. Value not changed.`);
      }
      
      // 无论值是否改变，都清除选择状态（以防万一）
      nextTick(() => {
        if (xTable.value) {
          xTable.value.clearSelected();
          xTable.value.clearCurrentRow();
          xTable.value.clearCurrentColumn();
        }
      });
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
    
    // 判断单元格是否可编辑（防止分组行和特殊列进行编辑）
    const allowEditingCell = ({ row, column }) => {
      if (!row || !column) return false;
      
      // 不允许编辑分组行
      if (row.isGroup) return false;
      
      // 检查列是否在可编辑列表中
      const colDef = props.columns.find(col => col.prop === column.property);
      return colDef && colDef.editable === true;
    };
    
    // 返回组件方法和属性
    return {
      xTable,
      selectedRowKeys,
      hasGrouping,
      treeConfig,
      checkboxConfig,
      sortedData,
      visibleColumns,
      getValidTags,
      getLeafDisplayValue,
      toggleAllSelection,
      clearSelection,
      toggleRowSelection,
      handleCheckboxChange,
      handleCheckboxAll,
      handleCellClick,
      handleCellDblclick,
      handleSortChange,
      handleFilterChange,
      handlePageChange,
      handleDetail,
      handleMoreOperations,
      getStatusType,
      getAppointmentStatusType,
      getTagType,
      clearGrouping,
      getColumnFilters,
      handleEditClosed,
      allowEditingCell
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
  }
  
  .pagination-container {
    margin-top: 10px;
      display: flex;
    justify-content: flex-end;
  }
  
  // 分组列头部样式
  .group-column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .clear-group-btn {
      padding: 2px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 12px;
      color: #909399;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        color: #F56C6C;
      }
    }
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
  
  // 叶子节点样式
  .leaf-node {
    color: #606266;
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

.group-level-1 {
  color: #409EFF;
  font-weight: bold;
}

.group-level-2 {
  color: #67C23A;
  font-weight: bold;
}

.group-level-3 {
  color: #E6A23C;
  font-weight: bold;
}

.group-count {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

.leaf-node {
  color: #606266;
}
</style> 