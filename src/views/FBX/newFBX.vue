<!-- eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars -->
<!-- eslint-disable -->
<template>
    <div class="delivery-trains-container">
      <!-- 顶部筛选区 -->
      <div class="filter-bar">
        <div class="filter-row">
          <!-- 仓库选择 -->
          <el-select v-model="warehouse" placeholder="美西二号仓" size="small" class="filter-item">
            <el-option label="美西二号仓" value="west2"></el-option>
            <el-option label="美西一号仓" value="west1"></el-option>
            <el-option label="新泽西一号仓" value="east1"></el-option>
            <el-option label="萨凡纳二号仓" value="east2"></el-option>
            <el-option label="达拉斯三号仓" value="east3"></el-option>
          </el-select>
          
          <!-- 创建日期 -->
          <el-select v-model="createDateType" placeholder="ETA" size="small" class="filter-item">
            <el-option label="ETA" value="eta"></el-option>
            <el-option label="提柜时间" value="issue"></el-option>
            <el-option label="抵仓时间" value="appointment"></el-option>
            <el-option label="预计拆柜时间" value="expectedUnloading"></el-option>
            <el-option label="拆柜完成时间" value="unloading"></el-option>
          </el-select>
          
          <!-- 日期范围选择 -->
          <div class="date-buttons">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              class="date-range-picker"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
            ></el-date-picker>
          </div>
          
          <!-- 批次号 -->
          <el-select v-model="searchType" placeholder="部分模糊搜索" size="small" class="filter-item">
            <el-option label="部分模糊搜索" value="trainNumber"></el-option>
            <el-option label="柜号" value="containerNo"></el-option>
            <el-option label="SO号" value="soNumber"></el-option>
            <el-option label="货件编号" value="shipmentNumber"></el-option>
            <el-option label="追踪编号" value="trackingNumber"></el-option>
          </el-select>
          
          <!-- 搜索框 -->
          <el-input 
            placeholder="MEMO/跟进记录/ref/zip_code等" 
            v-model="searchText" 
            size="small" 
            class="search-input"
            prefix-icon="el-icon-search"
          ></el-input>
          

          
          <!-- 操作按钮 -->
          <div class="action-buttons">
            <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
            <el-button size="small" type="warning" @click="handleBatchOperation('followUp')">批量跟进</el-button>
            <el-button size="small" type="warning" @click="handleBatchOperation('memo')">批量MEMO</el-button>
            <el-button size="small" type="warning" @click="handleBatchOperation('createPC')">创建PC</el-button>
            <el-button size="small">导出列表</el-button>
          </div>
        </div>
      </div>
  
      <!-- 状态筛选区域和视图控制 -->
      <div class="view-management">
        <span class="view-label"></span>
        <el-radio-group v-model="currentView" size="small" class="status-view-group">
          <el-radio-button value="all">全部(0)</el-radio-button>
          <el-radio-button value="pending">待处理(0)</el-radio-button>
          <el-radio-button value="processing">处理中(0)</el-radio-button>
          <el-radio-button value="completed">已完成(0)</el-radio-button>
          <el-radio-button value="cancelled">已取消(0)</el-radio-button>
          <!-- 动态添加自定义视图 -->
          <el-radio-button 
            v-for="view in customViews" 
            :key="view.id" 
            :label="view.id"
            @contextmenu.prevent="handleContextMenu($event, view)"
          >
            {{view.name}}
          </el-radio-button>
        </el-radio-group>
        
        <el-button type="text" size="small" @click="handleSaveView">新增视图</el-button>
        <el-button type="text" size="small" @click="showGroupModal">高级分组</el-button>
        <el-button type="text" size="small" @click="showSortModal">高级排序</el-button>
        <el-button type="text" size="small" @click="showFilterPanel">筛选</el-button>
        <el-button type="text" size="small" @click="showColumnSettings">字段配置</el-button>
      </div>
  
      <!-- 使用GroupableTable组件替换原有表格 -->
      <div class="table-container">
        <groupable-table
          ref="mainTable"
          :data="displayData"
          row-key="id"
          :group-fields="groupField ? [groupField] : []"
          :show-selection="true"
          :show-group-column="!!groupField"
          :group-column-label="groupField ? getGroupColumnLabel(groupField) : '分组'"
          :default-expand-all="false"
          :show-pagination="true"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          @cell-click="handleCellClick"
          @cell-dblclick="handleCellDbClick"
          style="width: 100%"
        >
          <!-- 扩展列 - 子表格 -->
          <el-table-column type="expand">
            <template #default="props">
              <div class="sub-table-container">
                <h4 class="sub-table-title">预约信息</h4>
                <el-table
                  :data="props.row.children || []"
                  border
                  size="small"
                  stripe
                  style="width: 100%"
                >
                  <el-table-column
                    v-for="column in childColumns"
                    :key="column.prop"
                    :prop="column.prop"
                    :label="column.label"
                    :width="column.width"
                    :sortable="column.sortable"
                  ></el-table-column>
                </el-table>
              </div>
            </template>
          </el-table-column>
          
          <!-- 分组信息列 -->
          <el-table-column v-if="hasGroupedData" label="分组信息" width="200">
            <template #default="scope">
              <span v-if="scope.row.isGroup" class="group-name">
                <el-tag :type="getGroupTagType(scope.row.groupLevel)">
                  {{ scope.row.groupName }} ({{ scope.row.count || 0 }})
                </el-tag>
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          
          <!-- 动态生成主表格列 -->
          <template v-for="column in tableColumns" :key="column.prop">
            <el-table-column
              v-if="column.visible !== false && column.prop === 'loadingStatus'"
              :prop="column.prop"
              :label="column.label"
              :width="column.width"
              :sortable="column.sortable"
            >
              <template #default="scope">
                <el-tag 
                  :type="getStatusTagType(scope.row.loadingStatus)" 
                  effect="plain"
                  size="small"
                >
                  {{ scope.row.loadingStatus }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column
              v-else-if="column.visible !== false && column.prop === 'operation'"
              :label="column.label"
              :width="column.width"
              fixed="right"
            >
              <template #default="scope">
                <el-button type="text" size="small" @click="handleDetail(scope.row)">详情</el-button>
                <el-dropdown size="small" @command="command => handleCommand(command, scope.row)">
                  <el-button type="text" size="small">
                    更多<i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="palletDetail">卡板明细</el-dropdown-item>
                      <el-dropdown-item command="copyAddress">复制地址信息</el-dropdown-item>
                      <el-dropdown-item command="followUp">跟进记录</el-dropdown-item>
                      <el-dropdown-item command="memo">MEMO</el-dropdown-item>
                      <el-dropdown-item command="markException">标记异常</el-dropdown-item>
                      <el-dropdown-item command="uploadPod">上传POD</el-dropdown-item>
                      <el-dropdown-item command="history">历史记录</el-dropdown-item>
                      <el-dropdown-item command="detail">详情</el-dropdown-item>
                      <el-dropdown-item command="expense">费用明细</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
            
            <el-table-column
              v-else-if="column.visible !== false"
              :prop="column.prop"
              :label="column.label"
              :width="column.width"
              :sortable="column.sortable"
            >
              <template #default="scope">
                <!-- 可编辑单元格 -->
                <div v-if="['address', 'city', 'state', 'zipCode', 'deliveryArea', 'appointmentNumber', 
                  'deliveryAppointmentTime', 'deliveryTime', 'deliveryCompany', 'deliveryDriver', 'driverPhone', 
                  'appointmentStatus', 'tags', 'followUpRecord', 'remarks', 'internalRemarks', 'quotationLianyu', 'shippingMark', 'platformQuotation'].includes(column.prop) && 
                  editingCell.rowIndex === scope.$index && 
                  editingCell.prop === column.prop" 
                  class="cell-editor">
                  
                  <el-select 
                    v-if="['appointmentStatus', 'tags'].includes(column.prop)"
                    v-model="editingCell.value" 
                    size="small"
                    @blur="saveEdit(scope.row, column.prop)"
                    @keyup.enter="saveEdit(scope.row, column.prop)"
                    style="width: 100%"
                  >
                    <el-option 
                      v-for="option in getOptionsForColumn(column.prop)" 
                      :key="option.value" 
                      :label="option.label" 
                      :value="option.value">
                    </el-option>
                  </el-select>
                  
                  <el-input 
                    v-else
                    v-model="editingCell.value"
                    size="small"
                    @blur="saveEdit(scope.row, column.prop)"
                    @keyup.enter="saveEdit(scope.row, column.prop)"
                    :type="['zipCode', 'boxCount', 'weight', 'volume', 'palletCount'].includes(column.prop) ? 'number' : 'text'"
                  ></el-input>
                </div>
                
                <!-- 普通单元格，带编辑标记 -->
                <div 
                  v-else-if="['address', 'city', 'state', 'zipCode', 'deliveryArea', 'appointmentNumber', 
                    'deliveryAppointmentTime', 'deliveryTime', 'deliveryCompany', 'deliveryDriver', 'driverPhone', 
                    'followUpRecord', 'remarks', 'internalRemarks', 'quotationLianyu', 'shippingMark', 'platformQuotation'].includes(column.prop)"
                  class="editable-cell"
                  @click="handleCellClick(scope.row, column, scope.$el)"
                >
                  {{ scope.row[column.prop] || '-' }}
                </div>
                
                <!-- 预约状态 -->
                <div 
                  v-else-if="column.prop === 'appointmentStatus'"
                  class="editable-cell tag-cell"
                  @click="handleCellClick(scope.row, column, scope.$el)"
                >
                  <el-tag 
                    v-if="scope.row.appointmentStatus" 
                    :type="getAppointmentStatusType(scope.row.appointmentStatus)" 
                    closable
                    @close="removeAppointmentStatus(scope.row)"
                    size="small">
                    {{ scope.row.appointmentStatus }}
                  </el-tag>
                  <span v-else>未设置</span>
                </div>
                
                <!-- 标签 -->
                <div 
                  v-else-if="column.prop === 'tags'"
                  class="editable-cell tag-cell"
                  @click="handleCellClick(scope.row, column, scope.$el)"
                >
                  <template v-if="scope.row.tags">
                    <el-tag
                      v-for="(tag, index) in (typeof scope.row.tags === 'string' ? scope.row.tags.split(',') : [scope.row.tags])"
                      :key="index"
                      :type="getTagType(tag)"
                      closable
                      @close="removeTag(scope.row, tag)"
                      size="small"
                      style="margin: 2px">
                      {{ tag }}
                    </el-tag>
                  </template>
                  <span v-else>未设置</span>
                </div>
                
                <!-- 非可编辑单元格 -->
                <span v-else>{{ scope.row[column.prop] }}</span>
              </template>
            </el-table-column>
          </template>
        </groupable-table>
      </div>
      
      <!-- 筛选面板 -->
      <filter-panel
        v-model:visible="filterPanelVisible"
        :columns="tableColumns"
        :existing-filters="activeFilters"
        :existing-logic="filterLogic"
        @apply-filters="applyFilters"
        @cancel="cancelFilters"
      />
  
      <!-- 保存视图对话框 -->
      <el-dialog
        title="保存视图"
        v-model="saveViewDialogVisible"
        width="500px"
      >
        <el-form :model="viewForm" label-width="100px">
          <el-form-item label="视图名称" required>
            <el-input v-model="viewForm.name" placeholder="请输入视图名称"></el-input>
          </el-form-item>
          <el-form-item label="显示字段">
            <el-checkbox-group v-model="viewForm.columns">
              <el-checkbox 
                v-for="col in tableColumns" 
                :key="col.prop" 
                :label="col.prop"
              >
                {{col.label}}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="saveViewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveView">确定</el-button>
        </template>
      </el-dialog>
  
      <!-- 视图操作下拉菜单 -->
      <el-dialog
        title="视图操作"
        v-model="viewOptionsDialogVisible"
        width="300px"
      >
        <div class="view-options-menu">
          <div class="view-option-item" @click="handleRenameView">
            <i class="el-icon-edit"></i>
            <span>重命名视图</span>
          </div>
          <div class="view-option-item" @click="handleCopyView">
            <i class="el-icon-document-copy"></i>
            <span>复制视图</span>
          </div>
          <div class="view-option-item" @click="handleDeleteView">
            <i class="el-icon-delete"></i>
            <span>删除视图</span>
          </div>
        </div>
      </el-dialog>
      
      <!-- 重命名视图对话框 -->
      <el-dialog
        title="重命名视图"
        v-model="renameViewDialogVisible"
        width="500px"
      >
        <el-form :model="renameForm" label-width="100px">
          <el-form-item label="视图名称" required>
            <el-input v-model="renameForm.name" placeholder="请输入视图名称"></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="renameViewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveRenameView">确定</el-button>
        </template>
      </el-dialog>
  
      <!-- 编辑对话框 -->
      <el-dialog
        title="编辑信息"
        v-model="editDialogVisible"
        width="500px"
      >
        <el-form :model="editingForm" label-width="120px">
          <el-form-item :label="editingColumn.label" v-if="editingColumn.prop">
            <el-select 
              v-if="['appointmentStatus', 'tags'].includes(editingColumn.prop)"
              v-model="editingForm.value" 
              style="width: 100%"
            >
              <el-option 
                v-for="option in getOptionsForColumn(editingColumn.prop)" 
                :key="option.value" 
                :label="option.label" 
                :value="option.value">
              </el-option>
            </el-select>
            <el-input 
              v-else
              v-model="editingForm.value"
              :type="['zipCode', 'boxCount', 'weight', 'volume', 'palletCount'].includes(editingColumn.prop) ? 'number' : 'text'"
            ></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveDialogEdit">确定</el-button>
        </template>
      </el-dialog>
  
      <!-- 右键菜单 -->
      <div 
        v-show="contextMenuVisible" 
        class="context-menu" 
        :style="{left: contextMenuX + 'px', top: contextMenuY + 'px'}"
      >
        <div class="context-menu-item" @click="handleCopyView">
          <span>复制视图</span>
        </div>
        <div class="context-menu-item" @click="handleRenameView">
          <span>重命名</span>
        </div>
        <div class="context-menu-item" @click="handleDeleteView">
          <span>删除</span>
        </div>
      </div>
  
      <!-- 分组设置弹窗 -->
      <el-dialog
        title="高级分组"
        v-model="groupModalVisible"
        width="500px"
      >
        <el-form label-width="100px">
          <el-form-item label="分组字段">
            <el-select v-model="tempGroupField" placeholder="请选择分组字段" style="width: 100%">
              <el-option label="不分组" :value="''"></el-option> <!-- 新增不分组选项 -->
              <el-option
                v-for="field in groupableFields"
                :key="field.prop"
                :label="field.label"
                :value="field.prop"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="cancelGrouping">取消</el-button>
          <el-button type="primary" @click="applyGrouping">确定</el-button>
        </template>
      </el-dialog>
  
      <!-- 排序设置弹窗 -->
      <el-dialog
        title="排序设置"
        v-model="sortModalVisible"
        width="500px"
      >
        <div class="sort-settings">
          <div v-for="(sort, index) in sortSettings" :key="index" class="sort-item">
            <el-select v-model="sort.field" placeholder="选择字段" style="width: 200px;" clearable>
              <el-option 
                v-for="field in sortableFields" 
                :key="field.prop" 
                :label="field.label" 
                :value="field.prop"
              ></el-option>
            </el-select>
            <el-select v-model="sort.direction" placeholder="排序方向" style="width: 120px;">
              <el-option label="升序" value="asc"></el-option>
              <el-option label="降序" value="desc"></el-option>
            </el-select>
            <el-button 
              type="danger" 
              size="small"
              @click="removeSortField(index)"
            >删除</el-button>
          </div>
          <div class="sort-actions">
            <el-button type="primary" plain @click="addSortField">添加排序字段</el-button>
          </div>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="sortModalVisible = false">取消</el-button>
            <el-button type="danger" @click="clearSortSettings">清除排序</el-button>
            <el-button type="primary" @click="applySortSettings">应用</el-button>
          </span>
        </template>
      </el-dialog>
  
      <!-- 字段配置对话框 -->
      <el-dialog
        title="字段配置"
        v-model="columnSettingsVisible"
        width="600px"
      >
        <div class="column-settings">
          <div class="column-settings-header">
            <el-checkbox
              v-model="allColumnsSelected"
              @change="handleSelectAllColumns"
            >全选</el-checkbox>
            <el-button type="primary" size="small" @click="resetColumnSettings">重置</el-button>
          </div>
          <div class="column-list">
            <draggable
              v-model="columnSettingsList"
              item-key="prop"
              handle=".drag-handle"
              @end="handleDragEnd"
            >
              <template #item="{ element }">
                <div class="column-item">
                  <el-icon class="drag-handle"><d-arrow-left /></el-icon>
                  <el-checkbox v-model="element.visible">{{ element.label }}</el-checkbox>
                </div>
              </template>
            </draggable>
          </div>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="columnSettingsVisible = false">取消</el-button>
            <el-button type="primary" @click="applyColumnSettings">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 批量操作对话框 -->
      <el-dialog
        v-model="batchDialogVisible"
        title="批量操作"
        width="500px"
      >
        <div v-if="batchOperation === 'followUp'">
          <el-form :model="batchForm" label-width="100px">
            <el-form-item label="跟进记录" required>
              <el-input type="textarea" v-model="batchForm.followUp" rows="4" placeholder="请输入跟进记录"></el-input>
            </el-form-item>
          </el-form>
        </div>
        
        <div v-if="batchOperation === 'memo'">
          <el-form :model="batchForm" label-width="100px">
            <el-form-item label="MEMO" required>
              <el-input type="textarea" v-model="batchForm.memo" rows="4" placeholder="请输入MEMO内容"></el-input>
            </el-form-item>
          </el-form>
        </div>
        
        <div v-if="batchOperation === 'createPC'">
          <el-form :model="batchForm" label-width="100px">
            <el-form-item label="PC类型" required>
              <el-radio-group v-model="batchForm.pcType">
                <el-radio label="delivery">出库PC</el-radio>
                <el-radio label="transfer">调拨PC</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="batchForm.pcType === 'transfer'" label="目标仓库" required>
              <el-select v-model="batchForm.targetWarehouse" placeholder="请选择目标仓库">
                <el-option label="美西一号仓" value="west1"></el-option>
                <el-option label="美西二号仓" value="west2"></el-option>
                <el-option label="美东仓" value="east"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="batchDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleBatchSubmit">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- Memo对话框 -->
      <el-dialog
        title="MEMO"
        v-model="memoDialogVisible"
        width="500px"
      >
        <el-form :model="memoForm" label-width="80px">
          <el-form-item label="备注">
            <el-input
              v-model="memoForm.memo"
              type="textarea"
              :rows="4"
              placeholder="请输入备注信息"
            ></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="memoDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveMemo">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 跟进记录对话框 -->
      <el-dialog
        title="跟进记录"
        v-model="followUpDialogVisible"
        width="600px"
      >
        <div class="follow-up-container">
          <!-- 历史记录列表 -->
          <div class="follow-up-history">
            <h4>历史记录</h4>
            <el-timeline>
              <el-timeline-item
                v-for="(record, index) in followUpHistory"
                :key="index"
                :timestamp="record.time"
                :type="record.type"
              >
                <div class="follow-up-item">
                  <div class="follow-up-content">{{ record.content }}</div>
                  <div class="follow-up-operator">操作人：{{ record.operator }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
          
          <!-- 添加新记录 -->
          <el-form :model="followUpForm" label-width="80px">
            <el-form-item label="跟进内容">
              <el-input
                v-model="followUpForm.content"
                type="textarea"
                :rows="4"
                placeholder="请输入跟进内容"
              ></el-input>
            </el-form-item>
            <el-form-item label="跟进类型">
              <el-select v-model="followUpForm.type" placeholder="请选择跟进类型" style="width: 100%">
                <el-option label="常规跟进" value="primary"></el-option>
                <el-option label="重要跟进" value="warning"></el-option>
                <el-option label="紧急跟进" value="danger"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="followUpDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveFollowUp">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 历史记录对话框 -->
      <el-dialog
        title="历史记录"
        v-model="historyDialogVisible"
        width="800px"
      >
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in historyRecords"
            :key="index"
            :timestamp="record.time"
            :type="record.type"
          >
            <div class="history-item">
              <div class="history-content">{{ record.content }}</div>
              <div class="history-operator">操作人：{{ record.operator }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-dialog>

      <!-- POD上传对话框 -->
      <upload-pod-dialog
        v-model:visible="podDialogVisible"
        @submit="handlePodSubmit"
      />

      <!-- 创建出库PC 对话框 -->
      <el-dialog
        v-model="createPCDialogVisible" 
        title="创建出库PC" 
        width="80%" 
        top="5vh" 
        destroy-on-close
      >
        <CreateOutboundPC v-if="createPCDialogVisible" /> 
        <!-- 可以在这里给 CreateOutboundPC 传递 props，例如选中的行: :selected-data="selectedRows" -->
        <!-- 
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="createPCDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSavePC">保存</el-button> 
          </span>
        </template>
        -->
      </el-dialog>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted, watch } from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import FilterPanel from '@/components/logistics/FilterPanel.vue';
  import GroupableTable from '@/components/logistics/GroupableTable.vue';
  import UploadPodDialog from '@/components/logistics/UploadPodDialog.vue';
  // 引入新创建的数据源
  import containerShipmentsColumns from '@/assets/json/containerShipmentsColumns.json';
  import containerItemsColumns from '@/assets/json/containerItemsColumns.json';
  import containerShipmentsData from '@/assets/json/containerShipmentsData.json';
  import { DArrowLeft } from '@element-plus/icons-vue';
  import draggable from 'vuedraggable';
  import { useRouter } from 'vue-router'; // Import useRouter
  import CreateOutboundPC from '@/views/FBX/CreateOutboundPC.vue'; // <-- 引入创建出库PC组件
  
  // 使用新的容器发货数据源 - 移入 setup
  // const defaultTableColumns = containerShipmentsColumns;
  // const defaultChildColumns = containerItemsColumns;
  // const defaultData = containerShipmentsData;
  
  export default {
    name: 'ContainerShipments', // 更改组件名称以反映其功能
    components: {
      FilterPanel,
      GroupableTable,
      draggable,
      DArrowLeft,
      UploadPodDialog,
      CreateOutboundPC // <-- 注册组件
    },
    setup() {
      // 使用新的容器发货数据源 (移入 setup)
      const defaultTableColumns = containerShipmentsColumns;
      const defaultChildColumns = containerItemsColumns;
      const defaultData = containerShipmentsData;
      
      // 基础数据
      const tableColumns = ref(defaultTableColumns);
      const childColumns = ref(defaultChildColumns);
      const tableData = ref(defaultData);
      const displayData = ref([]);
      const loading = ref(false);
      const visibleColumns = ref([...defaultTableColumns]);
      const selectedRows = ref([]);
      
      // 筛选相关
      const warehouse = ref('west2');
      const createDateType = ref('ETA');
      const dateRange = ref([]);
      const searchType = ref('trainNumber');
      const searchText = ref('');
      const sendOrder = ref('no');
      const currentStatus = ref('all'); // 保留用于向后兼容
      const filterPanelVisible = ref(false);
      const activeFilters = ref([]);
      const filterLogic = ref('and');
      
      // 分页相关
      const currentPage = ref(1);
      const pageSize = ref(20);
      const totalItems = ref(0);
      const total = computed(() => totalItems.value);
      
      // 视图相关
      const currentView = ref('all'); // 状态视图和自定义视图
      const selectedCustomView = ref(''); // 选中的自定义视图ID
      const customViews = ref([]);
      const saveViewDialogVisible = ref(false);
      const viewOptionsDialogVisible = ref(false);
      const renameViewDialogVisible = ref(false);
      const tempGroupField = ref(''); // 新增，用于临时存储分组设置
      const groupField = ref(''); // 保存当前生效的分组字段
      const viewForm = ref({
        name: '',
        columns: []
      });
      const currentEditingView = ref(null); // 当前正在编辑的视图
      const renameForm = ref({
        name: ''
      });
      
      // 分组相关
      const groupModalVisible = ref(false);
      const groupSettings = ref({
        level1: '',
        level2: '',
        level3: ''
      });
      const hasGroupedData = computed(() => {
        return displayData.value.some(item => item.isGroup);
      });
      
      // 获取分组标签类型
      const getGroupTagType = (level) => {
        const types = ['success', 'warning', 'info'];
        return types[level] || 'info';
      };
      
      // 预设视图的列配置
      const loadingVisibleColumns = computed(() => 
        tableColumns.value.filter(col => [
          'trainNumber', 'loadingType', 'loadingStatus', 'loadingStartTime', 
          'loadingEndTime', 'loader', 'dockNumber', 'actualPallets'
        ].includes(col.prop))
      );
      
      const dispatchVisibleColumns = computed(() => 
        tableColumns.value.filter(col => [
          'trainNumber', 'deliveryType', 'supplier', 'driverPhone', 
          'licensePlate', 'destination', 'deliveryCost'
        ].includes(col.prop))
      );
      
      const driverVisibleColumns = computed(() => 
        tableColumns.value.filter(col => [
          'trainNumber', 'driverLicense', 'licensePlate', 'driverPhone',
          'loadingStatus', 'loadingAppointmentTime'
        ].includes(col.prop))
      );
      
      // 可分组字段
      const groupableFields = computed(() => 
        tableColumns.value.filter(col => col.sortable && col.prop !== 'operation')
      );
      
      // 监听视图变化
      watch(currentView, (newView) => {
        // 处理预设状态视图和功能视图
        if (['all', 'pending', 'processing', 'completed', 'cancelled'].includes(newView)) {
          // 重置自定义视图选择
          selectedCustomView.value = '';
          // 重置字段配置
          tableColumns.value.forEach(col => col.visible = true);
          // 重置筛选配置
          activeFilters.value = [];
          filterLogic.value = 'and';
          // 重置分组配置
          groupField.value = ''; // 重置分组字段
          tempGroupField.value = ''; // 重置临时分组字段
          // 重置排序配置
          sortSettings.value = [{ field: '', direction: 'asc' }];
        } 
        // 处理内置功能视图
        else if (['loadingView', 'dispatchView', 'driverView'].includes(newView)) {
          // 重置自定义视图选择
          selectedCustomView.value = '';
          // 根据视图类型设置列配置
          if (newView === 'loadingView') {
            visibleColumns.value = loadingVisibleColumns.value;
          } else if (newView === 'dispatchView') {
            visibleColumns.value = dispatchVisibleColumns.value;
          } else if (newView === 'driverView') {
            visibleColumns.value = driverVisibleColumns.value;
          }
        }
        // 检查是否为自定义视图ID（与customViews中的ID匹配）
        else {
          // 检查是否为自定义视图
          const customView = customViews.value.find(v => v.id === newView);
          if (customView) {
            // 设置自定义视图下拉框的值
            selectedCustomView.value = newView;
            
            // 应用自定义视图的配置
            applyViewConfig(newView);
          }
        }
        
        // 应用筛选
        applyFiltersAndPagination();
      });
      
      // 监听自定义视图变化
      watch(selectedCustomView, (newView) => {
        // 当选择自定义视图时，更新当前视图状态
        if (newView) {
          currentView.value = newView;
        }
      });
      
      // 初始化
      onMounted(() => {
        visibleColumns.value = tableColumns.value;
        loadSavedViews();
        
        // 确保所有数据中的tags字段都是字符串格式
        tableData.value.forEach(item => {
          if (item.tags && Array.isArray(item.tags)) {
            item.tags = item.tags.join(',');
          }
        });
        
        // 添加10条新数据
        for (let i = 4; i <= 13; i++) {
          tableData.value.push({
            "id": i,
            "containerNumber": `CONT${i}00${i}${i}${i}`,
            "shippingNumber": `SH2024060${i}00${i}`,
            "customerService": i % 2 === 0 ? "李明" : "张华",
            "originalAddress": `${100 + i} Harbor St, Oakland, CA 9460${i}`,
            "address": `${200 + i} Ocean Ave`,
            "city": i % 3 === 0 ? "Sacramento" : (i % 3 === 1 ? "Oakland" : "Riverside"),
            "state": "CA",
            "zipCode": `9${i}${i}0${i}`,
            "deliveryArea": i % 2 === 0 ? "市区" : "郊区",
            "warehouseCode": `WH${i}00${i}`,
            "channel": i % 3 === 0 ? "空运" : "海运",
            "boxCount": 20 + i * 2,
            "weight": 1000 + i * 100,
            "volume": 30 + i * 1.5,
            "palletCount": 3 + i % 5,
            "location": `D-0${i}-${10 + i}`,
            "eta": `2024-06-${10 + i}`,
            "containerPickupTime": `2024-06-${11 + i} 08:00:00`,
            "arrivalTime": `2024-06-${11 + i} 10:30:00`,
            "expectedUnpackingTime": `2024-06-${11 + i} 13:00:00`,
            "unpackingCompletedTime": i % 3 === 0 ? null : `2024-06-${11 + i} 16:00:00`,
            "appointmentNumber": `APP00${130 + i}`,
            "deliveryAppointmentTime": i % 4 === 0 ? null : `2024-06-${13 + i} 09:00:00`,
            "deliveryTime": i % 5 === 0 ? null : `2024-06-${13 + i} 09:30:00`,
            "deliveryCompany": i % 3 === 0 ? "顺风物流" : (i % 3 === 1 ? "海洋物流" : "空中物流"),
            "deliveryDriver": i % 4 === 0 ? "" : `司机${i}`,
            "driverPhone": i % 4 === 0 ? "" : `138${i}${i}${i}${i}${i}${i}${i}${i}`,
            "pcNumber": `PC202406${i}00${i}`,
            "appointmentStatus": i % 4 === 0 ? "未预约" : (i % 4 === 1 ? "电话预约" : (i % 4 === 2 ? "平台预约" : "邮件预约")),
            "tags": i % 3 === 0 ? "优先" : (i % 3 === 1 ? "延期" : "加急,特殊处理"),
            "followUpRecord": i % 3 === 0 ? "待客户确认" : (i % 3 === 1 ? "已联系客户" : "客户已确认"),
            "remarks": `集装箱${i}的备注信息`,
            "internalRemarks": i % 2 === 0 ? "内部处理注意事项" : "",
            "quotationLianyu": 4000 + i * 200,
            "shippingMark": `SHIP-${1000 + i}`,
            "platformQuotation": 4200 + i * 200,
            "children": [
              {
                "id": i * 100 + 1,
                "itemCode": `I20240${i}${i}01`,
                "trackingNumber": `TRK000${i}${i}${i}01`,
                "productName": i % 2 === 0 ? "电子产品" : "家居用品",
                "quantity": 10 + i,
                "weight": 300 + i * 20,
                "volume": 10 + i * 0.8,
                "packageType": i % 3 === 0 ? "木箱" : (i % 3 === 1 ? "纸箱" : "塑料箱"),
                "receiverName": `收件人${i}`,
                "receiverPhone": `137${i}${i}${i}${i}${i}${i}${i}${i}`,
                "deliveryAddress": `${i % 3 === 0 ? "Sacramento" : (i % 3 === 1 ? "Oakland" : "Riverside")}市${i*10}号大厦`,
                "deliveryStatus": i % 4 === 0 ? "待派送" : (i % 4 === 1 ? "派送中" : (i % 4 === 2 ? "已派送" : "已签收")),
                "shippingMark": `SHIP-${1000 + i}-A`,
                "remarks": i % 2 === 0 ? "需要签收确认" : "送达后电话通知"
              }
            ]
          });
        }
        
        fetchData();
      });
      
      // 数据加载和处理
      const fetchData = () => {
        loading.value = true;
        try {
          // 使用JSON导入的数据
          totalItems.value = tableData.value.length;
          applyFiltersAndPagination();
          
          // 更新状态视图计数
          const pending = tableData.value.filter(item => item.appointmentStatus === "未预约").length;
          const processing = tableData.value.filter(item => item.appointmentStatus === "已预约" || item.appointmentStatus === "已确认").length;
          const completed = tableData.value.filter(item => item.appointmentStatus === "已完成").length;
          const cancelled = tableData.value.filter(item => item.appointmentStatus === "已取消").length;
          
          // 查找并更新状态视图按钮的文本
          const statusViews = document.querySelectorAll('.status-view-group .el-radio-button');
          if (statusViews.length >= 5) {
            statusViews[0].querySelector('.el-radio-button__inner').textContent = `全部(${tableData.value.length})`;
            statusViews[1].querySelector('.el-radio-button__inner').textContent = `待处理(${pending})`;
            statusViews[2].querySelector('.el-radio-button__inner').textContent = `处理中(${processing})`;
            statusViews[3].querySelector('.el-radio-button__inner').textContent = `已完成(${completed})`;
            statusViews[4].querySelector('.el-radio-button__inner').textContent = `已取消(${cancelled})`;
          }
        } catch (error) {
          console.error('加载数据失败:', error);
        } finally {
          loading.value = false;
        }
      };
      
      // 应用筛选和分页
      const applyFiltersAndPagination = () => {
        let filteredData = [...tableData.value];
        
        // 状态筛选 - 只有状态视图才应用状态筛选
        if (['pending', 'processing', 'completed', 'cancelled'].includes(currentView.value)) {
          const statusMap = {
            'pending': '待处理',
            'processing': '处理中',
            'completed': '已完成',
            'cancelled': '已取消'
          };
          
          const targetStatus = statusMap[currentView.value];
          if (targetStatus) {
            filteredData = filteredData.filter(item => item.loadingStatus === targetStatus);
          }
        }
        
        // 关键字搜索
        if (searchText.value) {
          filteredData = filteredData.filter(item => {
            const value = item[searchType.value];
            if (!value) return false;
            return value.toString().toLowerCase().includes(searchText.value.toLowerCase());
          });
        }
        
        // 日期范围筛选
        if (dateRange.value && dateRange.value.length === 2) {
          const fieldMap = {
            'create': 'createdAt',
            'issue': 'issueDate',
            'appointment': 'loadingAppointmentTime'
          };
          
          const dateField = fieldMap[createDateType.value];
          const [startDate, endDate] = dateRange.value;
          
          filteredData = filteredData.filter(item => {
            const itemDate = item[dateField];
            if (!itemDate) return false;
            
            const dateOnly = itemDate.split(' ')[0];
            return dateOnly >= startDate && dateOnly <= endDate;
          });
        }
        
        // 应用筛选面板的筛选条件
        if (activeFilters.value.length > 0) {
          filteredData = filteredData.filter(item => {
            const filterResults = activeFilters.value.map(filter => {
              const { field, operator, value } = filter;
              const itemValue = item[field];
              
              if (itemValue == null) {
                return false;
              }
              
              switch (operator) {
                case 'eq':
                  return itemValue == value;
                case 'neq':
                  return itemValue != value;
                case 'contains':
                  return itemValue.toString().toLowerCase().includes(value.toString().toLowerCase());
                case 'notContains':
                  return !itemValue.toString().toLowerCase().includes(value.toString().toLowerCase());
                case 'startsWith':
                  return itemValue.toString().toLowerCase().startsWith(value.toString().toLowerCase());
                case 'endsWith':
                  return itemValue.toString().toLowerCase().endsWith(value.toString().toLowerCase());
                case 'gt':
                  return Number(itemValue) > Number(value);
                case 'gte':
                  return Number(itemValue) >= Number(value);
                case 'lt':
                  return Number(itemValue) < Number(value);
                case 'lte':
                  return Number(itemValue) <= Number(value);
                default:
                  return true;
              }
            });
            
            return filterLogic.value === 'and'
              ? filterResults.every(r => r)
              : filterResults.some(r => r);
          });
        }
        
        // 分组处理
        if (groupField.value) {
          filteredData = groupData(filteredData, groupField.value);
        }
        
        // 计算总数
        totalItems.value = filteredData.length;
        
        // 分页处理
        const start = (currentPage.value - 1) * pageSize.value;
        const end = start + pageSize.value;
        displayData.value = filteredData.slice(start, end);
      };
      
      // 分组数据处理
      const groupData = (data, field) => {
        const groups = {};
        
        data.forEach(item => {
          // 更精确地判断分组值，只有undefined和null才使用"未分类"
          const fieldValue = item[field];
          const value = fieldValue === undefined || fieldValue === null ? '未分类' : String(fieldValue);
          
          if (!groups[value]) {
            groups[value] = [];
          }
          groups[value].push({...item});
        });
        
        const result = [];
        for (const [key, items] of Object.entries(groups)) {
          result.push({
            id: `group-${key}`,
            groupName: key,
            count: items.length,
            isGroup: true,
            groupLevel: 0,
            children: items
          });
        }
        
        return result;
      };
      
      // 处理表格选择
      const handleSelectionChange = (rows) => {
        selectedRows.value = rows;
      };
      
      // 获取状态标签的类型
      const getStatusTagType = (status) => {
        // 根据FBX的具体状态来定义
        const statusMap = {
          '待处理': 'info',
          '处理中': 'warning',
          '已完成': 'success',
          '已取消': 'danger',
          // 添加其他状态...
        };
        
        return statusMap[status] || 'info';
      };
      
      // 视图管理方法
      const handleSaveView = () => {
        viewForm.value = {
          name: '',
          columns: tableColumns.value
            .filter(col => col.visible !== false)
            .map(col => col.prop)
        };
        saveViewDialogVisible.value = true;
      };
      
      const saveView = () => {
        if (!viewForm.value.name.trim()) {
          ElMessage.warning('请输入视图名称');
          return;
        }
        
        const viewConfig = {
          id: Date.now().toString(),
          name: viewForm.value.name,
          columns: tableColumns.value.map(col => ({ 
            prop: col.prop, 
            visible: col.visible !== false 
          })),
          filters: activeFilters.value,
          filterLogic: filterLogic.value,
          groupSettings: groupSettings.value,
          sortSettings: sortSettings.value
        };
        
        customViews.value.push(viewConfig);
        selectedCustomView.value = viewConfig.id;
        saveViewDialogVisible.value = false;
        saveViewsToStorage();
        ElMessage.success('保存成功');
      };
      
      const handleDeleteView = () => {
        if (!currentEditingView.value) return;
        
        ElMessageBox.confirm('确定要删除该视图吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          const index = customViews.value.findIndex(v => v.id === currentEditingView.value.id);
        if (index !== -1) {
            customViews.value.splice(index, 1);
            if (currentView.value === currentEditingView.value.id) {
              currentView.value = 'all';
              selectedCustomView.value = '';
            }
            saveViewsToStorage();
            ElMessage.success('删除成功');
          }
          viewOptionsDialogVisible.value = false;
        }).catch(() => {
          viewOptionsDialogVisible.value = false;
        });
      };
      
      // 加载保存的视图函数
      const loadSavedViews = () => {
        // 将"deliveryTrainsViews"修改为"fbxViews"
        const saved = localStorage.getItem('fbxViews');
        if (saved) {
          try {
            customViews.value = JSON.parse(saved);
          } catch (error) {
            console.error('加载保存的视图失败:', error);
          }
        }
      };
      
      // 处理详情按钮点击
      const handleDetail = (row) => {
        console.log('查看详情', row);
        // 待实现
      };
      
      // 处理下拉菜单命令
      const handleCommand = (command, row) => {
        currentRow.value = row;
        let addressInfo = ''; // 添加变量声明
        switch (command) {
          case 'memo':
            memoDialogVisible.value = true;
            memoForm.value.memo = row.remarks || '';
            break;
          case 'followUp':
            followUpDialogVisible.value = true;
            // 加载跟进记录历史
            loadFollowUpHistory(row);
            break;
          case 'history':
            historyDialogVisible.value = true;
            // 加载历史记录
            loadHistoryRecords(row);
            break;
          case 'palletDetail':
            // 处理卡板明细
            ElMessage.info('查看卡板明细');
            break;
          case 'copyAddress':
            // 复制地址信息到剪贴板
            addressInfo = `${row.address || ''}, ${row.city || ''}, ${row.state || ''} ${row.zipCode || ''}`;
            navigator.clipboard.writeText(addressInfo)
              .then(() => {
                ElMessage.success('地址已复制到剪贴板');
              })
              .catch(err => {
                console.error('复制失败:', err);
                ElMessage.error('复制地址失败');
              });
            break;
          case 'markException':
            // 标记异常
            handleMarkException(row);
            break;
          case 'detail':
            // 查看详情
            handleDetail(row);
            break;
          case 'expense':
            // 查看费用明细 - 跳转到新页面
            // ElMessage.info('查看费用明细');
            router.push({ name: 'FBXExpenseDetails', params: { id: row.id } }); // 使用 router 跳转
            break;
          case 'uploadPod':
            handleUploadPod(row);
            break;
          default:
            break;
        }
      };
  
      // 显示筛选面板
      const showFilterPanel = () => {
        filterPanelVisible.value = true;
      };
  
      // 显示添加车次对话框
      const showAddTrainDialog = () => {
        // 待实现
        console.log('showAddTrainDialog');
      };
  
      // 处理表格展开/折叠
      const handleExpandChange = (row, expanded) => {
        console.log('展开/折叠行:', row.id, expanded ? '展开' : '折叠');
        // 不再维护expandRowKeys，让Element Plus自己管理展开状态
      };
  
      // 处理排序变化
      const handleSortChange = ({ prop, order }) => {
        if (!prop || !order) {
          // 恢复默认排序
          applyFiltersAndPagination();
          return;
        }
        
        // 克隆当前显示数据进行排序
        const sortedData = [...displayData.value];
        
        // 执行排序
        sortedData.sort((a, b) => {
          let aValue = a[prop];
          let bValue = b[prop];
          
          // 数字类型比较
          if (!isNaN(aValue) && !isNaN(bValue)) {
            aValue = Number(aValue);
            bValue = Number(bValue);
          }
          
          // 字符串类型比较
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            if (order === 'ascending') {
              return aValue.localeCompare(bValue);
            } else {
              return bValue.localeCompare(aValue);
            }
          }
          
          // 数字或其他类型比较
          if (order === 'ascending') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
        
        displayData.value = sortedData;
      };
  
      // 获取分组列的标签
      const getGroupColumnLabel = (prop) => {
        const column = tableColumns.value.find(col => col.prop === prop);
        return column ? column.label : '分组';
      };
      
      // 处理分页大小变化
      const handleSizeChange = (size) => {
        pageSize.value = size;
        fetchData();
      };
      
      // 处理当前页变化
      const handleCurrentChange = (page) => {
        currentPage.value = page;
        fetchData();
      };
  
      // 处理搜索
      const handleSearch = () => {
        currentPage.value = 1;
        applyFiltersAndPagination();
      };
  
      // 应用筛选条件
      const applyFilters = ({ filters, logic }) => {
        activeFilters.value = filters;
        filterLogic.value = logic;
        currentPage.value = 1;
        
        // 如果当前是自定义视图，更新配置
        if (selectedCustomView.value) {
          updateViewConfig(selectedCustomView.value);
        }
        
        applyFiltersAndPagination();
      };
  
      // 取消筛选
      const cancelFilters = () => {
        // 不做任何操作，仅关闭面板
      };
  
      // 视图操作方法
      const handleViewOptions = (view) => {
        currentEditingView.value = view;
        viewOptionsDialogVisible.value = true;
      };
      
      const handleRenameView = () => {
        if (!currentEditingView.value) return;
        
        renameForm.value.name = currentEditingView.value.name;
        viewOptionsDialogVisible.value = false;
        renameViewDialogVisible.value = true;
      };
      
      const saveRenameView = () => {
        if (!currentEditingView.value) return;
        if (!renameForm.value.name.trim()) {
          ElMessage.warning('请输入视图名称');
          return;
        }
        
        const index = customViews.value.findIndex(v => v.id === currentEditingView.value.id);
        if (index !== -1) {
          customViews.value[index].name = renameForm.value.name;
          saveViewsToStorage();
          ElMessage.success('重命名成功');
          renameViewDialogVisible.value = false;
        }
      };
      
      const handleCopyView = () => {
        if (!currentEditingView.value) return;
        
        const newView = {
          ...currentEditingView.value,
          id: Date.now().toString(),
          name: `${currentEditingView.value.name} 副本`
        };
        
        customViews.value.push(newView);
        saveViewsToStorage();
        ElMessage.success('复制成功');
        viewOptionsDialogVisible.value = false;
      };
  
      // 右键菜单
      const contextMenuVisible = ref(false);
      const contextMenuX = ref(0);
      const contextMenuY = ref(0);
  
      const handleContextMenu = (event, view) => {
        event.preventDefault();
        // 设置当前编辑的视图
        currentEditingView.value = view;
        contextMenuVisible.value = true;
        contextMenuX.value = event.clientX;
        contextMenuY.value = event.clientY;
        
        // 添加点击外部关闭菜单的事件监听
        setTimeout(() => {
          document.addEventListener('click', closeContextMenu);
        }, 0);
      };
      
      const closeContextMenu = () => {
        contextMenuVisible.value = false;
        document.removeEventListener('click', closeContextMenu);
      };
  
      // 编辑相关
      const editingCell = ref({
        rowIndex: -1,
        prop: '',
        value: ''
      });
      
      const editDialogVisible = ref(false);
      const editingRow = ref(null);
      const editingColumn = ref({});
      const editingForm = ref({
        value: ''
      });
      
      // 单击编辑
      const handleCellClick = (row, column, cell) => {
        const prop = column.property;
        // 只允许编辑特定字段
        if (['address', 'city', 'state', 'zipCode', 'deliveryArea', 'appointmentNumber', 
             'deliveryAppointmentTime', 'deliveryTime', 'deliveryCompany', 'deliveryDriver', 'driverPhone', 
             'appointmentStatus', 'tags', 'followUpRecord', 'remarks', 'internalRemarks', 'quotationLianyu', 'shippingMark', 'platformQuotation'].includes(prop)) {
          
          // 找到索引
          // 尝试从DOM中获取行索引
          const rowElement = cell ? cell.closest('tr') : null;
          const rowIndex = rowElement ? Array.from(rowElement.parentNode.children).indexOf(rowElement) : -1;
          
          console.log('单击编辑', row, prop, rowIndex);
          
          // 设置当前编辑的单元格
          editingCell.value = {
            rowIndex,
            prop,
            value: row[prop] || ''
          };
          
          // 在下一个事件循环中聚焦到编辑控件
          setTimeout(() => {
            const input = document.querySelector('.cell-editor input');
            if (input) {
              input.focus();
            }
          }, 50);
        }
      };
      
      // 双击弹窗编辑
      const handleCellDbClick = (row, column) => {
        const prop = column.property;
        // 只允许编辑特定字段
        if (['address', 'city', 'state', 'zipCode', 'deliveryArea', 'appointmentNumber', 
             'deliveryAppointmentTime', 'deliveryTime', 'deliveryCompany', 'deliveryDriver', 'driverPhone', 
             'appointmentStatus', 'tags', 'followUpRecord', 'remarks', 'internalRemarks', 'quotationLianyu', 'shippingMark', 'platformQuotation'].includes(prop)) {
          // 关闭行内编辑
          editingCell.value = {
            rowIndex: -1,
            prop: '',
            value: ''
          };
          
          // 设置弹窗编辑
          editingRow.value = row;
          editingColumn.value = tableColumns.value.find(col => col.prop === prop) || { prop: prop, label: prop };
          editingForm.value.value = row[prop] || '';
          editDialogVisible.value = true;
        }
      };
      
      // 保存单元格编辑
      const saveEdit = (row, prop) => {
        // 确保编辑的值与行中的属性对应
        if (editingCell.value.prop === prop) {
          row[prop] = editingCell.value.value;
          
          // 可以在这里添加数据提交到服务器的代码
          // axios.post('/api/update', { id: row.id, [prop]: editingCell.value.value })
          
          // 重置编辑状态
          setTimeout(() => {
            editingCell.value = {
              rowIndex: -1,
              prop: '',
              value: ''
            };
            
            ElMessage.success('保存成功');
          }, 200);
        }
      };
      
      // 保存弹窗编辑
      const saveDialogEdit = () => {
        if (editingRow.value && editingColumn.value.prop) {
          editingRow.value[editingColumn.value.prop] = editingForm.value.value;
          editDialogVisible.value = false;
          ElMessage.success('保存成功');
        }
      };
      
      // 获取下拉选项
      const getOptionsForColumn = (prop) => {
        // 从表格列定义中查找对应的列定义
        const columnDef = tableColumns.value.find(col => col.prop === prop);
        
        // 如果找到了列定义，并且有filterOptions
        if (columnDef && columnDef.filterOptions) {
          return columnDef.filterOptions;
        }
        
        // 如果没有在列定义中找到filterOptions，提供默认选项
        switch (prop) {
          case 'appointmentStatus':
            return [
              { value: '待确认', label: '待确认' },
              { value: '已确认', label: '已确认' },
              { value: '已完成', label: '已完成' },
              { value: '已取消', label: '已取消' },
              { value: '延期', label: '延期' }
            ];
          case 'tags':
            return [
              { value: '优先', label: '优先' },
              { value: '紧急', label: '紧急' },
              { value: '延期', label: '延期' },
              { value: '异常', label: '异常' },
              { value: '正常', label: '正常' }
            ];
          case 'loader':
            return [
              { value: '张三', label: '张三' },
              { value: '李四', label: '李四' },
              { value: '王五', label: '王五' },
              { value: '赵六', label: '赵六' },
              { value: '钱七', label: '钱七' }
            ];
          case 'dockNumber':
            return Array.from({ length: 10 }, (_, i) => {
              const num = i + 1;
              const value = `DOCK-${num < 10 ? '0' + num : num}`;
              return { value, label: value };
            });
          case 'supplier':
            return [
              { value: '广州物流', label: '广州物流' },
              { value: '深圳物流', label: '深圳物流' },
              { value: '东莞物流', label: '东莞物流' },
              { value: '佛山物流', label: '佛山物流' },
              { value: '中山物流', label: '中山物流' }
            ];
          case 'driverLicense':
          case 'licensePlate':
          case 'driverPhone':
            // 这些字段可能有很多选项，这里简化处理
            return tableData.value
              .map(item => ({ value: item[prop], label: item[prop] }))
              .filter((item, index, self) => 
                item.value && self.findIndex(t => t.value === item.value) === index
              );
          default:
            return [];
        }
      };
  
      // 显示分组设置弹窗
      const showGroupModal = () => {
        tempGroupField.value = groupField.value; // 打开时，将当前生效的分组字段赋给临时变量
        groupModalVisible.value = true;
      };
  
      // 应用分组设置
      const applyGroupSettings = () => {
        const groupFields = [];
        if (groupSettings.value.level1) groupFields.push(groupSettings.value.level1);
        if (groupSettings.value.level2) groupFields.push(groupSettings.value.level2);
        if (groupSettings.value.level3) groupFields.push(groupSettings.value.level3);
        
        // 清空单字段分组
        groupField.value = '';
        
        // 进行多级分组
        applyMultiLevelGroup(groupFields);
        
        // 如果当前是自定义视图，更新配置
        if (selectedCustomView.value) {
          updateViewConfig(selectedCustomView.value);
        }
        
        groupModalVisible.value = false;
        ElMessage.success('分组已应用');
      };
      
      // 应用多级分组
      const applyMultiLevelGroup = (groupFields, sortSettings = []) => {
        if (!groupFields || groupFields.length === 0) {
          applyFiltersAndPagination();
          return;
        }
        
        const getFieldLabel = (field) => {
          const column = tableColumns.value.find(col => col.prop === field);
          return column ? column.label : field;
        };
        
        let filteredData = [...tableData.value];
        
        // 应用初步筛选
        // 状态筛选 - 只有状态视图才应用状态筛选
        if (['pending', 'processing', 'completed', 'cancelled'].includes(currentView.value)) {
          const statusMap = {
            'pending': '待处理',
            'processing': '处理中',
            'completed': '已完成',
            'cancelled': '已取消'
          };
          
          const targetStatus = statusMap[currentView.value];
          if (targetStatus) {
            filteredData = filteredData.filter(item => item.loadingStatus === targetStatus);
          }
        }
        
        // 关键字搜索
        if (searchText.value) {
          filteredData = filteredData.filter(item => {
            const value = item[searchType.value];
            return value && value.toString().toLowerCase().includes(searchText.value.toLowerCase());
          });
        }
        
        // 日期范围筛选
        if (dateRange.value && dateRange.value.length === 2) {
          const fieldMap = {
            'create': 'createdAt',
            'issue': 'issueDate',
            'appointment': 'loadingAppointmentTime'
          };
          
          const dateField = fieldMap[createDateType.value];
          const [startDate, endDate] = dateRange.value;
          
          filteredData = filteredData.filter(item => {
            const itemDate = item[dateField];
            if (!itemDate) return false;
            
            const dateOnly = itemDate.split(' ')[0];
            return dateOnly >= startDate && dateOnly <= endDate;
          });
        }
        
        // 应用筛选面板的筛选条件
        if (activeFilters.value.length > 0) {
          filteredData = filteredData.filter(item => {
            const filterResults = activeFilters.value.map(filter => {
              const { field, operator, value } = filter;
              const itemValue = item[field];
              
              if (itemValue == null) {
                return false;
              }
              
              switch (operator) {
                case 'eq':
                  return itemValue == value;
                case 'neq':
                  return itemValue != value;
                case 'contains':
                  return itemValue.toString().toLowerCase().includes(value.toString().toLowerCase());
                case 'notContains':
                  return !itemValue.toString().toLowerCase().includes(value.toString().toLowerCase());
                case 'startsWith':
                  return itemValue.toString().toLowerCase().startsWith(value.toString().toLowerCase());
                case 'endsWith':
                  return itemValue.toString().toLowerCase().endsWith(value.toString().toLowerCase());
                case 'gt':
                  return Number(itemValue) > Number(value);
                case 'gte':
                  return Number(itemValue) >= Number(value);
                case 'lt':
                  return Number(itemValue) < Number(value);
                case 'lte':
                  return Number(itemValue) <= Number(value);
                default:
                  return true;
              }
            });
            
            return filterLogic.value === 'and'
              ? filterResults.every(r => r)
              : filterResults.some(r => r);
          });
        }
        
        // 对每个组内的数据进行排序的函数
        const sortItems = (items) => {
          if (!sortSettings || sortSettings.length === 0 || items.length <= 1) return items;
          
          return [...items].sort((a, b) => {
            for (const { field, direction } of sortSettings) {
              if (!field) continue;
              
              let aValue = a[field];
              let bValue = b[field];
              
              // 跳过未定义值的比较
              if (aValue === undefined || bValue === undefined) continue;
              
              // 处理数字类型
              if (!isNaN(aValue) && !isNaN(bValue)) {
                aValue = Number(aValue);
                bValue = Number(bValue);
              }
              
              // 相等则继续比较下一个字段
              if (aValue === bValue) continue;
              
              // 处理字符串类型
              if (typeof aValue === 'string' && typeof bValue === 'string') {
                if (direction === 'asc') {
                  return aValue.localeCompare(bValue);
                } else {
                  return bValue.localeCompare(aValue);
                }
              }
              
              // 处理数字或其他类型
              if (direction === 'asc') {
                return aValue > bValue ? 1 : -1;
              } else {
                return aValue < bValue ? 1 : -1;
              }
            }
            return 0;
          });
        };
        
        // 专门为 groupable-table 组件创建分组数据
        const buildGroupedData = () => {
          // 使用Map来存储每个分组级别的数据
          const result = [];
          
          // 第一步：按照分组字段对数据进行分组
          const groupsData = {};
          
          // 对第一级分组
          filteredData.forEach(item => {
            const field1 = groupFields[0];
            const value1 = item[field1] || '未分类';
            const key1 = `${field1}:${value1}`;
            
            if (!groupsData[key1]) {
              groupsData[key1] = {
                items: [],
                subgroups: {}
              };
            }
            
            if (groupFields.length === 1) {
              groupsData[key1].items.push(item);
            } else {
              // 处理第二级分组
              const field2 = groupFields[1];
              const value2 = item[field2] || '未分类';
              const key2 = `${field2}:${value2}`;
              
              if (!groupsData[key1].subgroups[key2]) {
                groupsData[key1].subgroups[key2] = {
                  items: [],
                  subgroups: {}
                };
              }
              
              if (groupFields.length === 2) {
                groupsData[key1].subgroups[key2].items.push(item);
              } else {
                // 处理第三级分组
                const field3 = groupFields[2];
                const value3 = item[field3] || '未分类';
                const key3 = `${field3}:${value3}`;
                
                if (!groupsData[key1].subgroups[key2].subgroups[key3]) {
                  groupsData[key1].subgroups[key2].subgroups[key3] = {
                    items: []
                  };
                }
                
                groupsData[key1].subgroups[key2].subgroups[key3].items.push(item);
              }
            }
          });
          
          // 第二步：将分组数据转换为扁平结构，并添加分组标识
          // 添加一级分组及其数据
          Object.entries(groupsData).forEach(([key1, group1]) => {
            const [field1, value1] = key1.split(':');
            const fieldLabel1 = getFieldLabel(field1);
            
            // 添加一级分组标签
            const groupRow1 = {
              id: `group-${field1}-${value1}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              groupName: `${fieldLabel1}: ${value1}`,
              isGroup: true,
              groupLevel: 0,
              count: groupFields.length === 1 ? group1.items.length : 
                     Object.values(group1.subgroups).reduce((sum, g) => sum + g.items.length, 0)
            };
            
            result.push(groupRow1);
            
            if (groupFields.length === 1) {
              // 添加一级分组下的数据项（已排序）
              const sortedItems = sortItems(group1.items);
              sortedItems.forEach(item => {
                result.push({
                  ...item,
                  parentGroupId: groupRow1.id
                });
              });
            } else {
              // 添加二级分组及其数据
              Object.entries(group1.subgroups).forEach(([key2, group2]) => {
                const [field2, value2] = key2.split(':');
                const fieldLabel2 = getFieldLabel(field2);
                
                // 添加二级分组标签
                const groupRow2 = {
                  id: `group-${field2}-${value2}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  groupName: `${fieldLabel2}: ${value2}`,
                  isGroup: true,
                  groupLevel: 1,
                  count: groupFields.length === 2 ? group2.items.length : 
                         Object.values(group2.subgroups).reduce((sum, g) => sum + g.items.length, 0),
                  parentGroupId: groupRow1.id
                };
                
                result.push(groupRow2);
                
                if (groupFields.length === 2) {
                  // 添加二级分组下的数据项（已排序）
                  const sortedItems = sortItems(group2.items);
                  sortedItems.forEach(item => {
                    result.push({
                      ...item,
                      parentGroupId: groupRow2.id
                    });
                  });
                } else {
                  // 添加三级分组及其数据
                  Object.entries(group2.subgroups).forEach(([key3, group3]) => {
                    const [field3, value3] = key3.split(':');
                    const fieldLabel3 = getFieldLabel(field3);
                    
                    // 添加三级分组标签
                    const groupRow3 = {
                      id: `group-${field3}-${value3}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      groupName: `${fieldLabel3}: ${value3}`,
                      isGroup: true,
                      groupLevel: 2,
                      count: group3.items.length,
                      parentGroupId: groupRow2.id
                    };
                    
                    result.push(groupRow3);
                    
                    // 添加三级分组下的数据项（已排序）
                    const sortedItems = sortItems(group3.items);
                    sortedItems.forEach(item => {
                      result.push({
                        ...item,
                        parentGroupId: groupRow3.id
                      });
                    });
                  });
                }
              });
            }
          });
          
          return result;
        };
        
        // 创建分组数据并设置到displayData
        displayData.value = buildGroupedData();
        totalItems.value = displayData.value.length;
        
        // 设置分组标志，让组件知道有分组数据
        hasGroupedData.value = true;
      };
      
      // eslint-disable-next-line no-unused-vars
      const getRowClassName = ({ row }) => {
        if (row.isGroup) {
          return `group-row ${row.groupClass || ''}`;
        }
        return '';
      };
  
      // 排序相关
      const sortModalVisible = ref(false);
      const sortSettings = ref([
        { field: '', direction: 'asc' }
      ]);
      const sortableFields = computed(() => 
        tableColumns.value.filter(col => col.sortable && col.prop !== 'operation')
      );
      
      // 显示排序设置弹窗
      const showSortModal = () => {
        sortModalVisible.value = true;
      };
      
      // 添加排序字段
      const addSortField = () => {
        sortSettings.value.push({ field: '', direction: 'asc' });
      };
      
      // 移除排序字段
      const removeSortField = (index) => {
        sortSettings.value.splice(index, 1);
        if (sortSettings.value.length === 0) {
          sortSettings.value.push({ field: '', direction: 'asc' });
        }
      };
      
      // 应用排序设置
      const applySortSettings = () => {
        // 验证所有字段都已选择
        if (sortSettings.value.some(sort => !sort.field)) {
          ElMessage.warning('请选择所有排序字段');
          return;
        }
        
        // 如果有分组，重新应用分组和排序
        if (groupSettings.value.level1 || groupSettings.value.level2 || groupSettings.value.level3) {
          const groupFields = [];
          if (groupSettings.value.level1) groupFields.push(groupSettings.value.level1);
          if (groupSettings.value.level2) groupFields.push(groupSettings.value.level2);
          if (groupSettings.value.level3) groupFields.push(groupSettings.value.level3);
          
          applyMultiLevelGroup(groupFields, sortSettings.value);
        } else {
          // 如果没有分组，直接对数据进行排序
          let sortedData = [...tableData.value];
          
          // 应用筛选
          if (activeFilters.value.length > 0) {
            sortedData = sortedData.filter(item => {
              const filterResults = activeFilters.value.map(filter => {
                const { field, operator, value } = filter;
                const itemValue = item[field];
                
                if (itemValue == null) {
                  return false;
                }
                
                switch (operator) {
                  case 'eq':
                    return itemValue == value;
                  case 'neq':
                    return itemValue != value;
                  case 'contains':
                    return itemValue.toString().toLowerCase().includes(value.toString().toLowerCase());
                  case 'notContains':
                    return !itemValue.toString().toLowerCase().includes(value.toString().toLowerCase());
                  case 'startsWith':
                    return itemValue.toString().toLowerCase().startsWith(value.toString().toLowerCase());
                  case 'endsWith':
                    return itemValue.toString().toLowerCase().endsWith(value.toString().toLowerCase());
                  case 'gt':
                    return Number(itemValue) > Number(value);
                  case 'gte':
                    return Number(itemValue) >= Number(value);
                  case 'lt':
                    return Number(itemValue) < Number(value);
                  case 'lte':
                    return Number(itemValue) <= Number(value);
                  default:
                    return true;
                }
              });
              
              return filterLogic.value === 'and'
                ? filterResults.every(r => r)
                : filterResults.some(r => r);
            });
          }
          
          // 应用排序
          sortedData.sort((a, b) => {
            for (const { field, direction } of sortSettings.value) {
              if (!field) continue;
              
              let aValue = a[field];
              let bValue = b[field];
              
              // 跳过未定义值的比较
              if (aValue === undefined || bValue === undefined) continue;
              
              // 处理数字类型
              if (!isNaN(aValue) && !isNaN(bValue)) {
                aValue = Number(aValue);
                bValue = Number(bValue);
              }
              
              // 相等则继续比较下一个字段
              if (aValue === bValue) continue;
              
              // 处理字符串类型
              if (typeof aValue === 'string' && typeof bValue === 'string') {
                if (direction === 'asc') {
                  return aValue.localeCompare(bValue);
                } else {
                  return bValue.localeCompare(aValue);
                }
              }
              
              // 处理数字或其他类型
              if (direction === 'asc') {
                return aValue > bValue ? 1 : -1;
              } else {
                return aValue < bValue ? 1 : -1;
              }
            }
            return 0;
          });
          
          // 设置分页数据
          displayData.value = sortedData;
          totalItems.value = sortedData.length;
          hasGroupedData.value = false;
        }
        
        sortModalVisible.value = false;
        
        // 如果当前是自定义视图，更新配置
        if (selectedCustomView.value) {
          updateViewConfig(selectedCustomView.value);
        }
        
        ElMessage.success('排序已应用');
      };
  
      // 清除分组设置
      const clearGroupSettings = () => {
        groupSettings.value = {
          level1: '',
          level2: '',
          level3: ''
        };
        groupField.value = '';
        
        // 如果当前是自定义视图，更新配置
        if (selectedCustomView.value) {
          updateViewConfig(selectedCustomView.value);
        }
        
        applyFiltersAndPagination();
        groupModalVisible.value = false;
        ElMessage.success('已清除分组设置');
      };
      
      // 清除排序设置
      const clearSortSettings = () => {
        sortSettings.value = [{ field: '', direction: 'asc' }];
        
        // 如果当前是自定义视图，更新配置
        if (selectedCustomView.value) {
          updateViewConfig(selectedCustomView.value);
        }
        
        applyFiltersAndPagination();
        sortModalVisible.value = false;
        ElMessage.success('已清除排序设置');
      };
  
      // 字段配置相关
      const columnSettingsVisible = ref(false);
      const columnSettingsList = ref([]);
      const allColumnsSelected = computed({
        get: () => columnSettingsList.value.every(col => col.visible),
        set: (val) => {
          columnSettingsList.value.forEach(col => col.visible = val);
        }
      });
  
      // 显示字段配置对话框
      const showColumnSettings = () => {
        columnSettingsList.value = tableColumns.value.map(col => ({
          ...col,
          visible: col.visible !== false
        }));
        columnSettingsVisible.value = true;
      };
  
      // 处理全选
      const handleSelectAllColumns = (val) => {
        columnSettingsList.value.forEach(col => col.visible = val);
      };
  
      // 重置字段配置
      const resetColumnSettings = () => {
        columnSettingsList.value = tableColumns.value.map(col => ({
          ...col,
          visible: true
        }));
      };
  
      // 处理拖拽结束
      const handleDragEnd = () => {
        // 拖拽结束后的处理（如果需要）
      };
  
      // 应用字段配置
      const applyColumnSettings = () => {
        // 更新表格列的可见性，但保持位置不变
        tableColumns.value = tableColumns.value.map(col => {
          const settingCol = columnSettingsList.value.find(setting => setting.prop === col.prop);
          return {
            ...col,
            visible: settingCol ? settingCol.visible : true
          };
        });
        
        // 如果当前是自定义视图，更新配置
        if (selectedCustomView.value) {
          updateViewConfig(selectedCustomView.value);
        }
        
        columnSettingsVisible.value = false;
        ElMessage.success('字段配置已更新');
      };
  
      // 保存视图到本地存储
      const saveViewsToStorage = () => {
        // 将"deliveryTrainsViews"修改为"fbxViews"
        localStorage.setItem('fbxViews', JSON.stringify(customViews.value));
      };
  
      // 更新视图配置
      const updateViewConfig = (viewId) => {
        const index = customViews.value.findIndex(v => v.id === viewId);
        if (index > -1) {
          // 更新配置
          customViews.value[index] = {
            ...customViews.value[index],
            columns: tableColumns.value.map(col => ({ 
              prop: col.prop, 
              visible: col.visible !== false 
            })),
            filters: activeFilters.value,
            filterLogic: filterLogic.value,
            groupSettings: groupSettings.value,
            sortSettings: sortSettings.value
          };
          
          // 保存到本地存储
          saveViewsToStorage();
        }
      };
  
      // 应用视图配置
      const applyViewConfig = (viewId) => {
        const view = customViews.value.find(v => v.id === viewId);
        if (view) {
          // 应用字段配置
          if (view.columns) {
            tableColumns.value = tableColumns.value.map(col => {
              const viewCol = view.columns.find(c => c.prop === col.prop);
              return {
                ...col,
                visible: viewCol ? viewCol.visible : true
              };
            });
          }
          
          // 应用筛选配置
          if (view.filters) {
            activeFilters.value = [...view.filters];
            filterLogic.value = view.filterLogic || 'and';
          }
          
          // 应用分组配置
          if (view.groupSettings) {
            groupSettings.value = {...view.groupSettings};
          }
          
          // 应用排序配置
          if (view.sortSettings) {
            sortSettings.value = [...view.sortSettings];
          }
          
          // 重新加载数据
          applyFiltersAndPagination();
        }
      };
  
      // 批量操作相关
      const batchOperation = ref('');
      const batchDialogVisible = ref(false);
      const createPCDialogVisible = ref(false); // <-- 新增 ref 控制创建PC弹窗
      const batchForm = ref({
        followUp: '',
        memo: '',
        pcType: 'delivery',
        targetWarehouse: ''
      });
      
      // 批量操作函数
      const handleBatchOperation = (operation) => {
        if (selectedRows.value.length === 0) {
          ElMessage.warning('请先选择要操作的数据');
          return;
        }
        
        batchOperation.value = operation;
        batchForm.value.followUp = '';
        batchForm.value.memo = '';
        batchForm.value.pcType = 'delivery';
        batchForm.value.targetWarehouse = '';
        batchDialogVisible.value = true;
      };
      
      // 批量操作提交
      const handleBatchSubmit = () => {
        // 根据不同的批量操作类型处理
        switch (batchOperation.value) {
          case 'followUp':
            if (!batchForm.value.followUp) {
              ElMessage.warning('请输入跟进记录');
              return;
            }
            // 处理批量添加跟进记录
            ElMessage.success(`已为${selectedRows.value.length}条记录添加跟进记录`);
            batchDialogVisible.value = false; // 关闭原批量操作弹窗
            break;
          case 'memo':
            if (!batchForm.value.memo) {
              ElMessage.warning('请输入MEMO');
              return;
            }
            // 处理批量添加MEMO
            ElMessage.success(`已为${selectedRows.value.length}条记录添加MEMO`);
            batchDialogVisible.value = false; // 关闭原批量操作弹窗
            break;
          case 'createPC':
            if (batchForm.value.pcType === 'transfer' && !batchForm.value.targetWarehouse) {
              ElMessage.warning('请选择目标仓库');
              return;
            }
            batchDialogVisible.value = false; // 先关闭原批量操作弹窗
            if (batchForm.value.pcType === 'delivery') {
              // 打开创建出库PC的弹窗
              createPCDialogVisible.value = true; // <-- 打开新弹窗
            } else {
              // 处理创建调拨PC的逻辑（如果需要）
              ElMessage.success(`已创建调拨PC，包含${selectedRows.value.length}条记录`);
            }
            break;
        }
        // batchDialogVisible.value = false; // 移动到各个 case 内部处理
      };
      
      const handleSaveEdit = (value) => {
        editingRow.value[editingColumn.value.prop] = value;
        editDialogVisible.value = false;
      };
      
      // 获取预约状态类型
      const getAppointmentStatusType = (status) => {
        switch (status) {
          case '电话预约':
            return 'warning';
          case '平台预约':
            return '';
          case '邮件预约':
            return 'info';
          case '未预约':
            return 'danger';
          default:
            return '';
        }
      };
      
      // 获取标签类型
      const getTagType = (tag) => {
        switch (tag.trim()) {
          case '加急':
            return 'danger';
          case '特殊处理':
            return 'warning';
          default:
            return '';
        }
      };
      
      // 移除预约状态
      const removeAppointmentStatus = (row) => {
        row.appointmentStatus = '';
        // 可以添加提交到后端的代码
        ElMessage.success('已移除预约状态');
      };
      
      // 移除标签
      const removeTag = (row, tagToRemove) => {
        if (row.tags) {
          if (typeof row.tags === 'string') {
            const tags = row.tags.split(',');
            const filteredTags = tags.filter(tag => tag.trim() !== tagToRemove.trim());
            row.tags = filteredTags.join(',');
          } else {
            // 如果tags不是字符串，可能是其他类型，直接清空
            row.tags = '';
          }
          // 可以添加提交到后端的代码
          ElMessage.success('已移除标签');
        }
      };
      
      // Memo相关
      const memoDialogVisible = ref(false);
      const memoForm = ref({
        memo: ''
      });

      // 跟进记录相关
      const followUpDialogVisible = ref(false);
      const followUpForm = ref({
        content: '',
        type: 'primary'
      });
      const followUpHistory = ref([]);

      // 历史记录相关
      const historyDialogVisible = ref(false);
      const historyRecords = ref([]);

      // 当前操作的数据
      const currentRow = ref(null);

      // 保存Memo
      const saveMemo = () => {
        if (!memoForm.value.memo.trim()) {
          ElMessage.warning('请输入备注内容');
          return;
        }
        
        if (currentRow.value) {
          currentRow.value.remarks = memoForm.value.memo;
          // 添加历史记录
          addHistoryRecord(currentRow.value, 'memo', '更新备注');
          ElMessage.success('保存成功');
        }
        
        memoDialogVisible.value = false;
      };

      // 加载跟进记录历史
      const loadFollowUpHistory = (row) => {
        // 这里应该从后端加载数据，这里使用模拟数据
        followUpHistory.value = [
          {
            time: '2024-03-20 10:00:00',
            content: `客户确认收货地址 - ${row.address || '未知地址'}`,
            operator: '张三',
            type: 'primary'
          },
          {
            time: '2024-03-20 14:30:00',
            content: `预约派送时间 - ${row.deliveryAppointmentTime || '未设置'}`,
            operator: '李四',
            type: 'warning'
          }
        ];
      };

      // 添加标记异常的处理方法
      const handleMarkException = (row) => {
        // 设置当前编辑的行
        currentRow.value = row;
        // 打开跟进记录对话框，并设置为异常类型
        followUpForm.value = {
          content: '',
          type: 'danger' // 设置为紧急类型
        };
        followUpDialogVisible.value = true;
      };

      // 修改保存跟进记录的方法
      const saveFollowUp = () => {
        if (!followUpForm.value.content.trim()) {
          ElMessage.warning('请输入跟进内容');
          return;
        }
        
        if (currentRow.value) {
          // 添加新的跟进记录
          followUpHistory.value.unshift({
            time: new Date().toLocaleString(),
            content: followUpForm.value.content,
            operator: '当前用户', // 这里应该使用实际的用户信息
            type: followUpForm.value.type
          });
          
          // 如果是异常标记，添加异常标签
          if (followUpForm.value.type === 'danger') {
            let tags = [];
            if (typeof currentRow.value.tags === 'string' && currentRow.value.tags) {
              tags = currentRow.value.tags.split(',').map(t => t.trim());
            } else if (Array.isArray(currentRow.value.tags)) {
              tags = [...currentRow.value.tags];
            }
            
            // 如果没有异常标签，则添加
            if (!tags.includes('异常')) {
              tags.push('异常');
              currentRow.value.tags = tags.join(',');
              
              // 更新本地数据
              const index = tableData.value.findIndex(item => item.id === currentRow.value.id);
              if (index !== -1) {
                tableData.value[index] = { ...currentRow.value };
              }
              
              // 更新显示数据
              const displayIndex = displayData.value.findIndex(item => item.id === currentRow.value.id);
              if (displayIndex !== -1) {
                displayData.value[displayIndex] = { ...currentRow.value };
              }
            }
          }
          
          // 添加历史记录
          addHistoryRecord(currentRow.value, 'followUp', '添加跟进记录');
          
          // 清空表单
          followUpForm.value.content = '';
          followUpForm.value.type = 'primary';
          
          ElMessage.success('保存成功');
        }
        
        followUpDialogVisible.value = false;
      };

      // 加载历史记录
      const loadHistoryRecords = (row) => {
        // 这里应该从后端加载数据，这里使用模拟数据
        historyRecords.value = [
          {
            time: '2024-03-20 10:00:00',
            content: `创建订单 - ${row.containerNumber || '未知集装箱号'}`,
            operator: '系统',
            type: 'primary'
          },
          {
            time: '2024-03-20 14:30:00',
            content: `更新备注信息 - ${row.remarks || '无备注'}`,
            operator: '张三',
            type: 'info'
          },
          {
            time: '2024-03-20 16:00:00',
            content: `添加跟进记录 - ${row.followUpRecord || '无跟进记录'}`,
            operator: '李四',
            type: 'warning'
          }
        ];
      };

      // 添加历史记录
      const addHistoryRecord = (row, type, content) => {
        historyRecords.value.unshift({
          time: new Date().toLocaleString(),
          content: content,
          operator: '当前用户', // 这里应该使用实际的用户信息
          type: type === 'memo' ? 'info' : type === 'followUp' ? 'warning' : 'primary'
        });
      };

      // POD上传相关
      const podDialogVisible = ref(false);

      // 处理POD上传
      const handleUploadPod = (row) => {
        currentRow.value = row;
        podDialogVisible.value = true;
      };

      // 处理POD提交
      const handlePodSubmit = async (formData) => {
        try {
          // 这里添加上传POD文件的API调用
          console.log('上传POD文件:', formData);
          ElMessage.success('POD上传成功');
          
          // 更新表格数据
          if (currentRow.value) {
            currentRow.value.podStatus = '已上传';
            currentRow.value.receiveTime = formData.get('receiveTime');
          }
        } catch (error) {
          console.error('上传POD失败:', error);
          ElMessage.error('上传POD失败，请重试');
        }
      };

      // 获取 router 实例
      const router = useRouter();

      // 筛选后的主表格列
      const visibleMainTableColumns = computed(() => {
        return tableColumns.value.filter(col => [
          'trainNumber', 'loadingType', 'loadingStatus', 'loadingStartTime', 
          'loadingEndTime', 'loader', 'dockNumber', 'actualPallets',
          'deliveryType', 'supplier', 'driverPhone', 'licensePlate',
          'destination', 'deliveryCost', 'driverLicense', 'driverPhone',
          'loadingStatus', 'loadingAppointmentTime', 'appointmentStatus',
          'tags', 'followUpRecord', 'remarks', 'internalRemarks',
          'quotationLianyu', 'shippingMark', 'platformQuotation'
        ].includes(col.prop));
      });

      return {
        // 基础数据
        tableColumns,
        childColumns,
        tableData,
        displayData,
        loading,
        visibleColumns,
        selectedRows,
        
        // 筛选相关
        warehouse,
        createDateType,
        dateRange,
        searchType,
        searchText,
        sendOrder,
        currentStatus,
        filterPanelVisible,
        activeFilters,
        filterLogic,
        
        // 分页相关
        currentPage,
        pageSize,
        totalItems,
        total,
        
        // 视图相关
        currentView,
        selectedCustomView,
        customViews,
        saveViewDialogVisible,
        viewOptionsDialogVisible,
        renameViewDialogVisible,
        tempGroupField,
        groupField,
        viewForm,
        currentEditingView,
        renameForm,
        groupableFields,
        
        // 分组相关
        groupModalVisible,
        groupSettings,
        hasGroupedData,
        getGroupTagType,
        showGroupModal,
        applyGroupSettings,
        
        // 方法
        handleSaveView,
        saveView,
        handleDeleteView,
        loadSavedViews,
        getStatusTagType,
        handleDetail,
        handleCommand,
        showFilterPanel,
        showAddTrainDialog,
        handleExpandChange,
        handleSelectionChange,
        handleSortChange,
        handleSizeChange,
        handleCurrentChange,
        handleSearch,
        applyFilters,
        cancelFilters,
        fetchData,
        applyFiltersAndPagination,
        groupData,
        handleViewOptions,
        handleRenameView,
        saveRenameView,
        handleCopyView,
        contextMenuVisible,
        contextMenuX,
        contextMenuY,
        handleContextMenu,
        closeContextMenu,
        
        // 编辑相关
        editingCell,
        editDialogVisible,
        editingRow,
        editingColumn,
        editingForm,
        handleCellClick,
        handleCellDbClick,
        saveEdit,
        saveDialogEdit,
        getOptionsForColumn,
        getGroupColumnLabel,
        
        // 排序相关
        sortModalVisible,
        sortSettings,
        sortableFields,
        showSortModal,
        addSortField,
        removeSortField,
        applySortSettings,
        
        // 清除分组设置
        clearGroupSettings,
        clearSortSettings,
        
        // 字段配置相关
        columnSettingsVisible,
        columnSettingsList,
        allColumnsSelected,
        showColumnSettings,
        handleSelectAllColumns,
        resetColumnSettings,
        handleDragEnd,
        applyColumnSettings,
        
        // 视图配置相关
        saveViewsToStorage,
        updateViewConfig,
        applyViewConfig,
        
        // 批量操作相关
        batchOperation,
        batchDialogVisible,
        batchForm,
        handleBatchOperation,
        handleBatchSubmit,
        handleSaveEdit,
        getAppointmentStatusType,
        getTagType,
        removeAppointmentStatus,
        removeTag,
        memoDialogVisible,
        memoForm,
        followUpDialogVisible,
        followUpForm,
        followUpHistory,
        historyDialogVisible,
        historyRecords,
        saveMemo,
        saveFollowUp,
        loadFollowUpHistory,
        loadHistoryRecords,
        podDialogVisible,
        handleUploadPod,
        handlePodSubmit,
        createPCDialogVisible, // <-- 暴露给模板

        // 新增
        visibleMainTableColumns // 暴露给模板
      };
    } // Ensure this is the correct closing brace for setup()
  };
  </script>
  
  <style scoped>
  .delivery-trains-container {
    padding: 15px;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .filter-bar {
    background-color: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 15px;
  }
  
  .filter-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  
  .filter-item {
    width: 150px;
  }
  
  .date-range-picker {
    width: 260px;
  }
  
  .search-input {
    width: 200px;
  }
  
  .send-order-filter {
    display: flex;
    align-items: center;
    margin-left: 10px;
  }
  
  .label-text {
    margin-right: 10px;
    font-size: 14px;
    color: #606266;
  }
  
  .action-buttons {
    margin-left: auto;
    display: flex;
    gap: 8px;
  }
  
  .view-management {
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .status-view-group {
    margin-right: 15px;
    flex-grow: 1;
    overflow-x: auto;
    white-space: nowrap;
  }
  
  .view-label {
    margin-right: 10px;
    font-size: 14px;
    color: #606266;
    white-space: nowrap;
  }
  
  .view-management .el-button {
    font-size: 14px;
    color: #606266;
  }
  
  .view-management .el-button:hover {
    color: #409EFF;
  }
  
  .ml-20 {
    margin-left: 20px;
  }
  
  .el-checkbox-group {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .group-select {
    width: 150px;
  }
  
  .table-container {
    flex: 1;
    position: relative;
    margin-bottom: 5px;
    overflow: visible;
    min-height: 450px;
  }
  
  .table-toolbar {
    display: none;
  }
  
  .left {
    display: none;
  }
  
  .sub-table-container {
    padding: 20px;
    background-color: #f9f9f9;
    width: 100%;
    overflow: visible; /* 保持可见性，不限制溢出 */
  }
  
  .sub-table-title {
    font-size: 16px;
    margin-bottom: 10px;
    color: #303133;
  }
  
  /* 添加子表格自适应样式 */
  :deep(.el-table__expanded-cell) {
    padding: 20px;
  }
  
  :deep(.el-table__expanded-cell .el-table) {
    height: auto !important; /* 子表格高度自适应内容 */
    max-height: none !important; /* 移除最大高度限制 */
  }
  
  .pagination-container {
    margin-top: 15px;
    display: flex;
    justify-content: center;
    padding-top: 15px;
    border-top: 1px solid #ebeef5;
    position: sticky;
    bottom: 0;
    background-color: white;
    z-index: 10;
  }
  
  /* 视图操作菜单样式 */
  .view-options-menu {
    display: flex;
    flex-direction: column;
  }
  
  .view-option-item {
    padding: 10px 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .view-option-item:hover {
    background-color: #f5f7fa;
  }
  
  .view-option-item i {
    font-size: 16px;
  }
  
  /* 修改Element UI表格组件的样式，使滚动条固定显示 */
  :deep(.el-table) {
    width: 100%;
    height: calc(100vh - 280px);
  }
  
  :deep(.el-table__body-wrapper) {
    overflow-x: auto !important;
    overflow-y: auto !important;
  }
  
  /* 设置滚动条样式 */
  :deep(.el-table__body-wrapper::-webkit-scrollbar) {
    height: 10px;
    width: 10px;
    display: block;
  }
  
  :deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
    background: #c0c4cc;
    border-radius: 5px;
  }
  
  :deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
    background: #f4f4f5;
    border-radius: 5px;
  }
  
  /* 可编辑单元格样式 */
  .editable-cell {
    cursor: pointer;
    position: relative;
    display: inline-block;
    width: 100%;
    padding: 2px 5px;
    box-sizing: border-box;
    border: 1px dashed transparent;
    transition: all 0.3s;
  }
  
  .editable-cell:hover {
    background-color: #f0f9ff;
    border: 1px dashed #409EFF;
    border-radius: 3px;
  }
  
  .editable-cell:hover::after {
    content: '';
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    width: 14px;
    height: 14px;
    background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZmlsbD0iIzYwOTlmZiIgZD0iTTg4NC45OTIsNjE5LjM5MiA2MTguOTkyLDg4NS4zOTJjLTM1LjM2LDM1LjM2LTkyLjY3MiwzNS4zNi0xMjgsMEwxNTIuOTkyLDU0Ny4zOTJjLTE3LjY4LTE3LjY4LTI0LjQ4LTQxLjQ3Mi0yMC40OC02NC4zMmwyOC0xNDcuMmMzLjk2OC0yMC45OTIsMjAuNDgtMzcuNDcyLDQxLjQ0LTQxLjQ0bDE0Ny4yLTI4YzIyLjg0OC00LDQ2LjY0LDIuODAsNjQuMzIsMjAuNDhsMzM4LDMzOEw4ODQuOTkyLDQ5MS40MTZ2MCBjMzUuMzYsMzUuMzI4LDM1LjM2LDkyLjY0LDAsMTI4djBMODg0Ljk5Miw2MTkuMzkyeiBNNTM0Ljk5Miw3MDkuMzkyIDE3OS4wMDgsNDE1LjM2bC05Mi42NzIsMTcuNiAtMTcuNiw5Mi42NzIgMjk0LjAwOCwzNTUuOTM2TDUzNC45OTIsNzA5LjM5MnoiLz48L3N2Zz4=') no-repeat;
    opacity: 0.8;
  }
  
  .cell-editor {
    width: 100%;
    padding: 0;
    margin: 0;
    background-color: #fff;
    border: 1px solid #409EFF;
    border-radius: 3px;
  }
  
  .context-menu {
    position: fixed;
    background: white;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 5px 0;
    z-index: 3000;
    min-width: 120px;
  }
  
  .context-menu-item {
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .context-menu-item:hover {
    background-color: #f5f7fa;
  }
  
  /* 分组样式 */
  .group-name {
    font-weight: bold;
    display: flex;
    align-items: center;
  }
  
  .level-1-group {
    background-color: #f0f9eb !important;
  }
  
  .level-2-group {
    background-color: #ecf5ff !important;
  }
  
  .level-3-group {
    background-color: #fef0f0 !important;
  }
  
  .group-settings {
    padding: 20px;
  }
  
  .group-level {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
  }
  
  .group-level-label {
    width: 90px;
    text-align: right;
    margin-right: 10px;
  }
  
  /* 排序设置样式 */
  .sort-settings {
    padding: 20px;
  }
  
  .sort-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .sort-actions {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
  
  /* 字段配置样式 */
  .column-settings {
    padding: 20px;
  }
  
  .column-settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid #EBEEF5;
  }
  
  .column-list {
    max-height: 400px;
    overflow-y: auto;
  }
  
  .column-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #EBEEF5;
    background: #fff;
  }
  
  .column-item:hover {
    background: #f5f7fa;
  }
  
  .drag-handle {
    cursor: move;
    margin-right: 10px;
    color: #909399;
  }
  
  .drag-handle:hover {
    color: #409EFF;
  }
  
  /* 自定义滚动条样式 */
  .column-list::-webkit-scrollbar {
    width: 6px;
  }
  
  .column-list::-webkit-scrollbar-thumb {
    background: #c0c4cc;
    border-radius: 3px;
  }
  
  .column-list::-webkit-scrollbar-track {
    background: #f4f4f5;
  }
  
  .filter-toolbar {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .filter-menu {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 5px;
  }
  
  .filter-tag {
    margin-right: 5px;
    margin-bottom: 5px;
  }
  
  .group-title {
    background-color: #f5f7fa;
    padding: 5px 10px;
    font-weight: bold;
  }
  
  .custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    padding-right: 8px;
  }
  
  .page-container {
    padding: 15px;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  
  .table-container {
    flex: 1;
    overflow: auto;
  }
  
  .editable-cell {
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
  }
  
  .editable-cell:hover {
    background-color: #f5f7fa;
  }
  
  .cell-editor {
    width: 100%;
  }
  
  .column-settings {
    display: flex;
    flex-direction: column;
    height: 400px;
  }
  
  .tab-card {
    box-shadow: none;
    border: 1px solid #EBEEF5;
    margin-bottom: 10px;
    flex: 1;
  }
  
  .draggable-list {
    height: 300px;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    padding: 5px;
  }
  
  .drag-item {
    padding: 8px;
    margin-bottom: 5px;
    background-color: #f9f9f9;
    border: 1px solid #e0e0e0;
    cursor: move;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .drag-item:hover {
    background-color: #f0f0f0;
  }
  
  .drag-item.dragging {
    background-color: #e6f7ff;
    border-color: #1890ff;
  }
  
  .sort-settings {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 0;
  }
  
  .sort-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  /* 标签单元格样式 */
  .tag-cell {
    padding: 6px !important;
  }
  
  .tag-cell .el-tag {
    margin: 2px;
  }
  
  .tag-cell .el-tag.el-tag--small {
    height: 22px;
    line-height: 20px;
  }
  
  .tag-cell .el-tag + .el-tag {
    margin-left: 4px;
  }

  /* 跟进记录样式 */
  .follow-up-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .follow-up-history {
    max-height: 300px;
    overflow-y: auto;
    padding: 10px;
    border: 1px solid #EBEEF5;
    border-radius: 4px;
  }

  .follow-up-history h4 {
    margin: 0 0 15px 0;
    color: #606266;
  }

  .follow-up-item {
    padding: 8px;
    background-color: #F5F7FA;
    border-radius: 4px;
  }

  .follow-up-content {
    margin-bottom: 5px;
    color: #303133;
  }

  .follow-up-operator {
    font-size: 12px;
    color: #909399;
  }

  /* 历史记录样式 */
  .history-item {
    padding: 8px;
    background-color: #F5F7FA;
    border-radius: 4px;
  }

  .history-content {
    margin-bottom: 5px;
    color: #303133;
  }

  .history-operator {
    font-size: 12px;
    color: #909399;
  }

  /* 对话框样式优化 */
  :deep(.el-dialog__body) {
    padding: 20px;
  }

  :deep(.el-timeline-item__node) {
    background-color: #409EFF;
  }

  :deep(.el-timeline-item__wrapper) {
    padding-left: 28px;
  }

  :deep(.el-timeline-item__timestamp) {
    font-size: 12px;
    color: #909399;
  }

  /* 添加表格样式 */
  :deep(.el-table) .cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :deep(.el-table) .el-table__header th {
    cursor: col-resize;
    user-select: none;
  }

  :deep(.el-table) .el-table__body td .cell:hover {
    overflow: visible;
    white-space: normal;
    position: relative;
    z-index: 1;
    background-color: #fff;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
    padding: 5px;
    border-radius: 4px;
  }

  /* 确保子表格也应用相同的样式 */
  :deep(.el-table__expanded-cell) .el-table .cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :deep(.el-table__expanded-cell) .el-table .el-table__header th {
    cursor: col-resize;
    user-select: none;
  }

  :deep(.el-table__expanded-cell) .el-table .el-table__body td .cell:hover {
    overflow: visible;
    white-space: normal;
    position: relative;
    z-index: 1;
    background-color: #fff;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
    padding: 5px;
    border-radius: 4px;
  }

  /* 可以为新弹窗添加一些样式调整 */
  :deep(.el-dialog__body) {
    padding: 10px 20px; /* 调整弹窗body内边距 */
  }
  </style> 