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
          
          <!-- 搜索类型 -->
          <el-select v-model="searchType" placeholder="搜索类型" size="small" class="filter-item">
            <el-option label="柜号" value="containerNo"></el-option>
          </el-select>
          
          <!-- 搜索框 -->
          <el-input 
            placeholder="请输入" 
            v-model="searchText" 
            size="small" 
            class="search-input"
            prefix-icon="el-icon-search"
          ></el-input>
          

          
          <!-- 操作按钮 -->
          <div class="action-buttons">
            <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
            <el-dropdown trigger="click" @command="handleBatchCommand">
              <el-button type="warning" size="small">
                批量操作<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="extractFees">批量提取费用</el-dropdown-item>
                  <el-dropdown-item command="memo">批量Memo</el-dropdown-item>
                  <el-dropdown-item command="followUp">批量跟进记录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button size="small">导出列表</el-button>
            <el-button size="small">导出</el-button>
          </div>
        </div>
      </div>
  
      <!-- 状态筛选区域和视图控制 -->
      <div class="view-management">
        <span class="view-label"></span>
        <el-radio-group v-model="currentView" size="small" class="status-view-group">
          <el-radio-button value="all">全部(21794)</el-radio-button>
          <el-radio-button value="waitRegister">已卸船(107)</el-radio-button>
          <el-radio-button value="registered">已可提(152)</el-radio-button>
          <el-radio-button value="loading">已做约(0)</el-radio-button>
          <el-radio-button value="loaded">已提柜(3)</el-radio-button>
          <el-radio-button value="shipped">已到仓(1585)</el-radio-button>
          <el-radio-button value="delivered">拆柜中(16351)</el-radio-button>
          <el-radio-button value="pod">已提空(3585)</el-radio-button>
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
          <!-- 扩展列 - 子表格
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
                  >
                    <template #default="scope" v-if="column.prop === 'operation'">
                      <el-button type="text" size="small" @click="handleDetail(scope.row)">详情</el-button>
                      <el-dropdown size="small" @command="command => handleChildCommand(command, scope.row)">
                        <el-button type="text" size="small">
                          更多<i class="el-icon-arrow-down el-icon--right"></i>
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item command="lastPod">上传POD</el-dropdown-item>
                            <el-dropdown-item command="deletePc">删除PC</el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </template>
          </el-table-column> -->
          
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
              v-if="column.visible !== false && column.prop === 'orderStatus'"
              :prop="column.prop"
              :label="column.label"
              :width="column.width"
              :sortable="column.sortable"
            >
              <template #default="scope">
                <el-tag 
                  :type="getStatusTagType(scope.row.orderStatus)" 
                  effect="plain"
                  size="small"
                >
                  {{ scope.row.orderStatus }}
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
                      <el-dropdown-item command="vehicleAssignment">车辆分配</el-dropdown-item>
                      <el-dropdown-item command="memo">Memo</el-dropdown-item>
                      <el-dropdown-item command="followUp">跟进记录</el-dropdown-item>
                      <el-dropdown-item command="history">历史记录</el-dropdown-item>
                      <el-dropdown-item command="podUpload">POD上传</el-dropdown-item>
                      <el-dropdown-item command="expenseDetail">费用明细</el-dropdown-item>
                      <el-dropdown-item command="expensePull">费用拉取</el-dropdown-item>
                      <el-dropdown-item command="gpsTrack">GPS轨迹</el-dropdown-item>
                      <el-dropdown-item command="markException">标记异常</el-dropdown-item>
                      <el-dropdown-item command="fileUploadWithTag">文件上传</el-dropdown-item>
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
                <div v-if="isEditableField(column.prop) && 
                             editingCell.rowIndex === scope.$index && 
                             editingCell.prop === column.prop" 
                     class="cell-editor">
                  
                  <el-date-picker
                    v-if="getEditControlType(column.prop) === 'datetime'"
                    v-model="editingCell.value"
                    type="datetime"
                    size="small"
                    @blur="saveEdit(scope.row, column.prop)"
                    @keyup.enter="saveEdit(scope.row, column.prop)"
                    style="width: 100%"
                  ></el-date-picker>
                  
                  <el-select 
                    v-else-if="getEditControlType(column.prop) === 'select'"
                    v-model="editingCell.value" 
                    size="small"
                    @blur="saveEdit(scope.row, column.prop)"
                    @keyup.enter="saveEdit(scope.row, column.prop)"
                    style="width: 100%"
                  >
                    <el-option 
                      v-for="option in getEditControlOptions(column.prop)" 
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
                  ></el-input>
                </div>
                
                <!-- 普通单元格，带编辑标记 -->
                <div 
                  v-else-if="isEditableField(column.prop)"
                  class="editable-cell"
                  @click="handleCellClick(scope.row, column, scope.$el)"
                >
                  {{ scope.row[column.prop] || '-' }}
                </div>
                
                <!-- 非可编辑单元格 -->
                <span v-else>{{ scope.row[column.prop] || '-' }}</span>
              </template>
            </el-table-column>
          </template>
          <!-- 标签列 -->
          <el-table-column prop="tags" label="标签" width="200">
            <template #default="scope">
              <div class="tag-cell">
                <template v-if="Array.isArray(scope.row.tags) && scope.row.tags.length">
                  <el-tag
                    v-for="tag in scope.row.tags"
                    :key="tag"
                    :type="getTagType(tag)"
                    closable
                    @close="handleTagClose(scope.row, 'tags', tag)"
                  >
                    {{ tag }}
                  </el-tag>
                </template>
                <template v-else-if="typeof scope.row.tags === 'string' && scope.row.tags">
                  <el-tag
                    v-for="tag in scope.row.tags.split(',')"
                    :key="tag"
                    :type="getTagType(tag)"
                    closable
                    @close="handleTagClose(scope.row, 'tags', tag)"
                  >
                    {{ tag.trim() }}
                  </el-tag>
                </template>
                <el-tag v-else type="info">未设置</el-tag>
              </div>
            </template>
          </el-table-column>
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
              v-if="['loadingType', 'deliveryType', 'loader', 'dockNumber', 'driverLicense', 'licensePlate', 'driverPhone', 'supplier'].includes(editingColumn.prop)"
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
              :type="['actualPallets', 'palletsMerged', 'deliveryCost'].includes(editingColumn.prop) ? 'number' : 'text'"
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
        title="分组设置"
        v-model="groupModalVisible"
        width="500px"
      >
        <div class="group-settings">
          <div class="group-level">
            <span class="group-level-label">一级分组：</span>
            <el-select v-model="groupSettings.level1" placeholder="选择字段" style="width: 280px;" clearable>
              <el-option v-for="field in groupableFields" :key="field.prop" :label="field.label" :value="field.prop"></el-option>
            </el-select>
          </div>
          <div class="group-level">
            <span class="group-level-label">二级分组：</span>
            <el-select v-model="groupSettings.level2" placeholder="选择字段" style="width: 280px;" clearable>
              <el-option v-for="field in groupableFields" :key="field.prop" :label="field.label" :value="field.prop"></el-option>
            </el-select>
          </div>
          <div class="group-level">
            <span class="group-level-label">三级分组：</span>
            <el-select v-model="groupSettings.level3" placeholder="选择字段" style="width: 280px;" clearable>
              <el-option v-for="field in groupableFields" :key="field.prop" :label="field.label" :value="field.prop"></el-option>
            </el-select>
          </div>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="groupModalVisible = false">取消</el-button>
            <el-button type="danger" @click="clearGroupSettings">清除分组</el-button>
            <el-button type="primary" @click="applyGroupSettings">应用</el-button>
          </span>
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
  
      <!-- 添加费用明细弹窗组件 -->
      <expense-detail-dialog
        v-model:visible="expenseDialogVisible"
        :train-data="currentTrainData"
        @expense-pushed="handleExpensePushed"
        @push-cancelled="handlePushCancelled"
      />
  
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
      <history-record-dialog
        v-model:visible="historyDialogVisible"
        :train-data="currentTrainData"
      />
  
      <!-- GPS轨迹对话框 -->
      <gps-track-dialog
        v-model:visible="gpsTrackDialogVisible"
        :train-data="currentGpsTrainData"
      />
  
      <!-- 车辆分配弹窗 -->
      <VehicleAssignmentDialog
        v-model="vehicleAssignmentVisible"
        @assign="handleVehicleAssign"
        @cancel-assign="handleVehicleCancelAssign"
      />
  
      <!-- POD上传弹窗 -->
      <UploadPodDialog
        v-model="podDialogVisible"
        :current-pod-row="currentPodRow"
        @submit="handlePodSubmit"
        @cancel="handlePodCancel"
      />
  
      <!-- 文件上传带标签弹窗 -->
      <FileUploadWithTagDialog
        v-model="fileUploadWithTagVisible"
        :current-row="currentFileRow"
        @submit="handleFileUploadWithTagSubmit"
        @cancel="handleFileUploadWithTagCancel"
      />
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted, watch} from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import FilterPanel from '@/components/logistics/FilterPanel.vue';
  import GroupableTable from '@/components/logistics/GroupableTable.vue';
  import ExpenseDetailDialog from '@/components/logistics/ExpenseDetailDialog.vue';
  import HistoryRecordDialog from '@/components/logistics/HistoryRecordDialog.vue';
  import GpsTrackDialog from '@/components/logistics/GpsTrackDialog.vue';
  import VehicleAssignmentDialog from '@/components/logistics/VehicleAssignmentDialog.vue'
  import UploadPodDialog from '@/components/logistics/UploadPodDialog.vue';
  import FileUploadWithTagDialog from '@/components/logistics/FileUploadWithTagDialog.vue';
  import deliveryTrainsColumns from '@/assets/json/containerPickupColumns.json';
  import childTableColumns from '@/assets/json/childTableColumns.json';
  import containerPickupData from '@/assets/json/containerPickupData.json';
  import { DArrowLeft } from '@element-plus/icons-vue';
  import draggable from 'vuedraggable';
  
  // 定义表格列
  const defaultTableColumns = deliveryTrainsColumns;
  
  // 定义子表格列
  const defaultChildColumns = childTableColumns;
  
  // 使用导入的JSON数据
  const defaultData = containerPickupData.items;
  
  export default {
    name: 'SuppilerSeasOrder',
    components: {
      FilterPanel,
      GroupableTable,
      ExpenseDetailDialog,
      HistoryRecordDialog,
      GpsTrackDialog,
      draggable,
      DArrowLeft,
      VehicleAssignmentDialog,
      UploadPodDialog,
      FileUploadWithTagDialog,
    },
    setup() {
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
      const createDateType = ref('卸船时间');
      const dateRange = ref([]);
      const searchType = ref('订单号');
      const searchText = ref('');
      const sendOrder = ref('no');
      const currentStatus = ref('all'); // 保留用于向后兼容
      const filterPanelVisible = ref(false);
      const activeFilters = ref([]);
      const filterLogic = ref('and');
      
      // 分页相关
      const currentPage = ref(1);
      const pageSize = ref(20);
      const totalItems = ref(containerPickupData.total);
      const total = computed(() => totalItems.value);
      
      // 视图相关
      const currentView = ref('all'); // 状态视图和自定义视图
      const selectedCustomView = ref(''); // 选中的自定义视图ID
      const customViews = ref([]);
      const saveViewDialogVisible = ref(false);
      const viewOptionsDialogVisible = ref(false);
      const renameViewDialogVisible = ref(false);
      const groupField = ref('');
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
        const types = ['', 'primary', 'success', 'warning'];
        return types[level] || '';
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
        if (['all', 'waitRegister', 'registered', 'loading', 'loaded', 'shipped', 'delivered', 'pod'].includes(newView)) {
          // 重置自定义视图选择
          selectedCustomView.value = '';
          // 重置字段配置
          tableColumns.value.forEach(col => col.visible = true);
          // 重置筛选配置
          activeFilters.value = [];
          filterLogic.value = 'and';
          // 重置分组配置
          groupSettings.value = { level1: '', level2: '', level3: '' };
          groupField.value = '';
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
        fetchData();
        

      });
      

      
      // 数据加载和处理
      const fetchData = () => {
        loading.value = true;
        try {
          // 使用JSON导入的数据
          tableData.value = containerPickupData.items;
          totalItems.value = containerPickupData.total;
          applyFiltersAndPagination();
        } catch (error) {
          console.error('加载数据失败:', error);
          ElMessage.error('加载数据失败');
        } finally {
          loading.value = false;
        }
      };
      
      // 应用筛选和分页
      const applyFiltersAndPagination = () => {
        let filteredData = [...tableData.value];
        
        // 状态筛选 - 只有状态视图才应用状态筛选
        if (['waitRegister', 'registered', 'loading', 'loaded', 'shipped', 'delivered', 'pod'].includes(currentView.value)) {
          const statusMap = {
            'waitRegister': '未装车',
            'registered': '已登记',
            'loading': '装车中',
            'loaded': '装车完成',
            'shipped': '已发货',
            'delivered': '已签收',
            'pod': '已签收POD'
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
          const value = item[field] || '未分类';
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
        const statusMap = {
          '未装车': 'info',
          '已登记': 'warning',
          '装车中': 'warning',
          '装车完成': 'success',
          '已发货': 'success',
          '已签收': 'success',
          '已签收POD': 'success',
          '退件': 'danger',
          '待审批': 'info',
          '应付未完成': 'info'
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
      
      const loadSavedViews = () => {
        const saved = localStorage.getItem('deliveryTrainsViews');
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
        switch (command) {
          case 'vehicleAssignment':
            openVehicleAssignment(row);
            break;
          case 'memo':
            handleMemo(row);
            break;
          case 'followUp':
            handleFollowUp(row);
            break;
          case 'history':
            handleHistory(row);
            break;
          case 'gpsTrack':
            handleGpsTrack(row);
            break;
          case 'fileUpload':
            handleFileUpload(row);
            break;
          case 'podUpload':
            handlePodUpload(row);
            break;
          case 'markException':
            handleMarkException(row);
            break;
          case 'fileUploadWithTag':
            handleFileUploadWithTag(row);
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
        if (isEditableField(prop)) {
          const rowElement = cell ? cell.closest('tr') : null;
          const rowIndex = rowElement ? Array.from(rowElement.parentNode.children).indexOf(rowElement) : -1;
          
          editingCell.value = {
            rowIndex,
            prop,
            value: row[prop] || ''
          };
          
          setTimeout(() => {
            const input = document.querySelector('.cell-editor input, .cell-editor select');
            if (input) {
              input.focus();
            }
          }, 50);
        }
      };

      // 获取编辑控件类型
      const getEditControlType = (prop) => {
        const column = tableColumns.value.find(col => col.prop === prop);
        return column?.type || 'input';
      };

      // 获取编辑控件的选项
      const getEditControlOptions = (prop) => {
        const column = tableColumns.value.find(col => col.prop === prop);
        return column?.options || [];
      };
      
      // 双击弹窗编辑
      const handleCellDbClick = (row, column) => {
        const prop = column.property;
        if (isEditableField(prop)) {
          editingCell.value = {
            rowIndex: -1,
            prop: '',
            value: ''
          };
          
          editingRow.value = row;
          editingColumn.value = tableColumns.value.find(col => col.prop === prop) || { prop: prop, label: prop };
          editingForm.value.value = row[prop] || '';
          editDialogVisible.value = true;
        }
      };
      
      // 保存单元格编辑
      const saveEdit = (row, prop) => {
        if (editingCell.value.prop === prop) {
          row[prop] = editingCell.value.value;
          
          // 模拟API调用
          setTimeout(() => {
            // 这里可以添加实际的API调用
            // axios.post('/api/update', { id: row.id, [prop]: editingCell.value.value })
            
            // 更新本地数据
            const index = tableData.value.findIndex(item => item.id === row.id);
            if (index !== -1) {
              tableData.value[index] = { ...row };
            }
            
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
          
          // 更新本地数据
          const index = tableData.value.findIndex(item => item.id === editingRow.value.id);
          if (index !== -1) {
            tableData.value[index] = { ...editingRow.value };
          }
          
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
      const applyMultiLevelGroup = (groupFields) => {
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
        if (['waitRegister', 'registered', 'loading', 'loaded', 'shipped', 'delivered', 'pod'].includes(currentView.value)) {
          const statusMap = {
            'waitRegister': '未装车',
            'registered': '已登记',
            'loading': '装车中',
            'loaded': '装车完成',
            'shipped': '已发货',
            'delivered': '已签收',
            'pod': '已签收POD'
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
        
        // 进行分组处理
        const groupedData = [];
        const groupMap = new Map();
        
        // 处理分组数据
        filteredData.forEach(item => {
          let currentLevel = groupedData;
          let currentPath = '';
          let parentItem = null;
          
          // 处理每个分组级别
          for (let i = 0; i < groupFields.length; i++) {
            const field = groupFields[i];
            const value = item[field] || '未分类';
            const fieldLabel = getFieldLabel(field);
            const groupKey = `${currentPath}/${field}:${value}`;
            
            // 查找或创建当前级别的分组
            let group = currentLevel.find(g => g.groupKey === groupKey);
            
            if (!group) {
              group = {
                id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                groupKey,
                groupName: `${fieldLabel}: ${value}`,
                isGroup: true,
                groupLevel: i,
                children: [],
                items: [],
                count: 0
              };
              
              // 设置分组样式
              if (i === 0) {
                group.groupClass = 'level-1-group';
              } else if (i === 1) {
                group.groupClass = 'level-2-group';
              } else {
                group.groupClass = 'level-3-group';
              }
              
              currentLevel.push(group);
              groupMap.set(groupKey, group);
            }
            
            // 更新统计信息
            group.items.push(item);
            group.count = group.items.length;
            
            // 为下一级分组做准备
            currentPath = groupKey;
            currentLevel = group.children;
            parentItem = group;
          }
          
          // 将原始数据项添加到最后一级分组的子项中
          if (parentItem) {
            // 添加原始数据项到分组的子项中，但保留其原始属性
            const clonedItem = {...item, parentGroupKey: parentItem.groupKey};
            parentItem.children.push(clonedItem);
          }
        });
        
        // 将所有分组和数据项合并到一个扁平数组中
        const flattenedData = [];
        
        // 递归函数，用于展开所有分组和数据项
        function flattenGroups(groups, level = 0) {
          groups.forEach(group => {
            // 添加分组项
            flattenedData.push(group);
            
            // 如果有子分组，递归处理
            const childGroups = group.children.filter(child => child.isGroup);
            if (childGroups.length > 0) {
              flattenGroups(childGroups, level + 1);
            } else {
              // 如果没有子分组，添加该分组下的所有数据项
              group.children.forEach(item => {
                flattenedData.push(item);
              });
            }
          });
        }
        
        flattenGroups(groupedData);
        
        // 计算总数
        totalItems.value = flattenedData.length;
        
        // 分页处理
        const start = (currentPage.value - 1) * pageSize.value;
        const end = start + pageSize.value;
        displayData.value = flattenedData.slice(start, end);
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
        
        // 克隆当前显示数据进行排序
        let sortedData = [...displayData.value];
        
        // 按照设置的顺序依次排序
        sortSettings.value.forEach(({ field, direction }) => {
          sortedData.sort((a, b) => {
            let aValue = a[field];
            let bValue = b[field];
            
            // 处理数字类型
            if (!isNaN(aValue) && !isNaN(bValue)) {
              aValue = Number(aValue);
              bValue = Number(bValue);
            }
            
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
          });
        });
        
        // 更新显示数据
        displayData.value = sortedData;
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
        localStorage.setItem('deliveryTrainsViews', JSON.stringify(customViews.value));
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
  
      const expenseDialogVisible = ref(false);
      const currentTrainData = ref(null);
  
      // 处理费用推送
      const handleExpensePushed = (pcData) => {
        console.log('费用已推送:', pcData);
        // 这里添加推送费用的逻辑
        ElMessage.success('费用推送成功');
      };
  
      // 处理取消推送
      const handlePushCancelled = (pcData) => {
        console.log('取消推送:', pcData);
        // 这里添加取消推送的逻辑
        ElMessage.success('已取消推送');
      };
  
      // 获取标签类型
      const getTagType = (tag) => {
        switch (tag.trim()) {
          case '异常':
            return 'danger';
          case '紧急':
            return 'warning';
          default:
            return '';
        }
      };
  
      // 处理标签关闭
      const handleTagClose = (row, field, tag) => {
        if (!row[field]) return;
        
        if (Array.isArray(row[field])) {
          const index = row[field].indexOf(tag);
          if (index > -1) {
            const newTags = [...row[field]];
            newTags.splice(index, 1);
            row[field] = newTags;
          }
        } else if (typeof row[field] === 'string') {
          const tags = row[field].split(',').map(t => t.trim());
          const index = tags.indexOf(tag);
          if (index > -1) {
            tags.splice(index, 1);
            row[field] = tags.join(',');
          }
        }
        
        // 可以在这里添加保存到后端的代码
        ElMessage.success('标签已移除');
      };
  
      // 在 setup 函数中添加相关数据和方法
      const memoDialogVisible = ref(false);
      const followUpDialogVisible = ref(false);
      const memoForm = ref({
        memo: ''
      });
      const followUpForm = ref({
        content: '',
        type: 'primary'
      });
      const followUpHistory = ref([
        {
          time: '2024-03-20 10:00:00',
          content: '已联系司机，预计下午到达',
          operator: '张三',
          type: 'primary'
        },
        {
          time: '2024-03-20 15:30:00',
          content: '司机到达装货点，开始装货',
          operator: '李四',
          type: 'warning'
        }
      ]);
      const currentEditingTrain = ref(null);
  
      // 处理 MEMO 按钮点击
      const handleMemo = (row) => {
        currentEditingTrain.value = row;
        memoForm.value.memo = row.memo || '';
        memoDialogVisible.value = true;
      };
  
      // 保存 MEMO
      const saveMemo = () => {
        if (currentEditingTrain.value) {
          currentEditingTrain.value.memo = memoForm.value.memo;
          // 这里可以添加保存到后端的代码
          ElMessage.success('保存成功');
          memoDialogVisible.value = false;
        }
      };
  
      // 处理跟进记录按钮点击
      const handleFollowUp = (row) => {
        currentEditingTrain.value = row;
        followUpForm.value = {
          content: '',
          type: 'primary'
        };
        followUpDialogVisible.value = true;
      };
  
      // 保存跟进记录
      const saveFollowUp = () => {
        if (!followUpForm.value.content) {
          ElMessage.warning('请输入跟进内容');
          return;
        }
  
        // 添加新的跟进记录
        followUpHistory.value.unshift({
          time: new Date().toLocaleString(),
          content: followUpForm.value.content,
          operator: '当前用户', // 这里可以替换为实际的用户名
          type: followUpForm.value.type
        });
  
        // 如果是异常标记，添加异常标签
        if (currentEditingTrain.value && followUpForm.value.type === 'danger') {
          let tags = [];
          if (Array.isArray(currentEditingTrain.value.tags)) {
            tags = [...currentEditingTrain.value.tags];
          } else if (typeof currentEditingTrain.value.tags === 'string' && currentEditingTrain.value.tags) {
            tags = currentEditingTrain.value.tags.split(',').map(t => t.trim());
          }
          
          // 如果没有异常标签，则添加
          if (!tags.includes('异常')) {
            tags.push('异常');
            currentEditingTrain.value.tags = tags;
            
            // 更新本地数据
            const index = tableData.value.findIndex(item => item.id === currentEditingTrain.value.id);
            if (index !== -1) {
              tableData.value[index] = { ...currentEditingTrain.value };
            }
            
            // 更新显示数据
            const displayIndex = displayData.value.findIndex(item => item.id === currentEditingTrain.value.id);
            if (displayIndex !== -1) {
              displayData.value[displayIndex] = { ...currentEditingTrain.value };
            }
          }
        }

        // 关闭对话框
        followUpDialogVisible.value = false;
        ElMessage.success('保存成功');
      };
  
      // 添加标记异常的处理方法
      const handleMarkException = (row) => {
        // 设置当前编辑的订单
        currentEditingTrain.value = row;
        // 打开跟进记录对话框
        followUpForm.value = {
          content: '',
          type: 'danger' // 设置为紧急类型
        };
        followUpDialogVisible.value = true;
      };
  
      const historyDialogVisible = ref(false);
  
      // 处理历史记录按钮点击
      const handleHistory = (row) => {
        currentTrainData.value = row;
        historyDialogVisible.value = true;
      };
  
      const gpsTrackDialogVisible = ref(false);
      const currentGpsTrainData = ref(null);
  
      // 处理子表格下拉菜单命令
      const handleChildCommand = (command, row) => {
        switch (command) {
          case 'lastPod':
            ElMessage.info('查看上传POD记录：' + row.pcNumber);
            break;
          case 'deletePc':
            ElMessageBox.confirm(
              '确认要删除该PC记录吗？',
              '删除PC',
              {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              }
            ).then(() => {
              // 这里添加删除PC的逻辑
              ElMessage.success('删除成功');
            }).catch(() => {
              // 用户取消操作
            });
            break;
        }
      };
  
      // 添加新的处理方法
      const handleVehicleAssignment = (row) => {
        // 处理车辆分配
        console.log('处理车辆分配', row);
      };
  
      const handleGpsTrack = (row) => {
        currentGpsTrainData.value = row;
        gpsTrackDialogVisible.value = true;
      };
  
      const handleFileUpload = (row) => {
        // 处理文件上传
        console.log('处理文件上传', row);
      };
  
      const handlePodUpload = (row) => {
        currentPodRow.value = row;
        podDialogVisible.value = true;
      };
  
      // 处理POD上传
      const handlePodCancel = () => {
        podDialogVisible.value = false;
        currentPodRow.value = null;
      };
  
      // 处理POD提交
      const handlePodSubmit = async (formData) => {
        try {
          // 这里添加实际的API调用
          console.log('提交POD数据:', formData);
          
          // 更新本地数据
          if (currentPodRow.value) {
            currentPodRow.value.podStatus = '已上传';
            currentPodRow.value.podUploadTime = formData.receiptTime;
            
            // 更新表格数据
            const index = tableData.value.findIndex(item => item.id === currentPodRow.value.id);
            if (index !== -1) {
              tableData.value[index] = { ...currentPodRow.value };
            }
            
            // 更新显示数据
            const displayIndex = displayData.value.findIndex(item => item.id === currentPodRow.value.id);
            if (displayIndex !== -1) {
              displayData.value[displayIndex] = { ...currentPodRow.value };
            }
          }
          
          ElMessage.success('POD上传成功');
          podDialogVisible.value = false;
        } catch (error) {
          console.error('POD上传失败:', error);
          ElMessage.error('POD上传失败');
        }
      };
  
      // 修改可编辑字段的判断
      const isEditableField = (prop) => {
        const column = tableColumns.value.find(col => col.prop === prop);
        return column?.editable || false;
      };
  
      const vehicleAssignmentVisible = ref(false)
      const currentOrder = ref(null)

      // 打开车辆分配弹窗
      const openVehicleAssignment = (row) => {
        currentOrder.value = row
        vehicleAssignmentVisible.value = true
      }

      // 处理车辆分配
      const handleVehicleAssign = (vehicle) => {
        if (!currentOrder.value) return;
        
        // 更新当前订单的车辆信息
        currentOrder.value.licensePlate = vehicle.plateNumber;
        currentOrder.value.driver = vehicle.driver;
        currentOrder.value.driverPhone = vehicle.driverPhone;
        currentOrder.value.gpsNumber = vehicle.gpsNumber;
        currentOrder.value.vehicleAssignment = vehicle.plateNumber; // 更新派送车牌号
        
        // 更新本地数据
        const index = tableData.value.findIndex(item => item.id === currentOrder.value.id);
        if (index !== -1) {
          tableData.value[index] = { ...currentOrder.value };
        }
        
        // 更新显示数据
        const displayIndex = displayData.value.findIndex(item => item.id === currentOrder.value.id);
        if (displayIndex !== -1) {
          displayData.value[displayIndex] = { ...currentOrder.value };
        }
        
        // 关闭弹窗
        vehicleAssignmentVisible.value = false;
        
        ElMessage.success('车辆分配成功');
      }

      // 处理取消车辆分配
      const handleVehicleCancelAssign = () => {
        if (!currentOrder.value) return;
        
        // 清空当前订单的车辆信息
        currentOrder.value.licensePlate = '';
        currentOrder.value.driver = '';
        currentOrder.value.driverPhone = '';
        currentOrder.value.gpsNumber = '';
        
        // 更新本地数据
        const index = tableData.value.findIndex(item => item.id === currentOrder.value.id);
        if (index !== -1) {
          tableData.value[index] = { ...currentOrder.value };
        }
        
        // 更新显示数据
        const displayIndex = displayData.value.findIndex(item => item.id === currentOrder.value.id);
        if (displayIndex !== -1) {
          displayData.value[displayIndex] = { ...currentOrder.value };
        }
        
        // 关闭弹窗
        vehicleAssignmentVisible.value = false;
        
        ElMessage.success('已取消车辆分配');
      }
  
      // POD上传相关
      const podDialogVisible = ref(false);
      const currentPodRow = ref(null);
  
      // 文件上传相关
      const fileUploadWithTagVisible = ref(false);
      const currentFileRow = ref(null);
  
      // 处理文件上传
      const handleFileUploadWithTag = (row) => {
        currentFileRow.value = row;
        fileUploadWithTagVisible.value = true;
      };
  
      // 处理文件上传提交
      const handleFileUploadWithTagSubmit = async (formData) => {
        try {
          // 这里添加实际的API调用
          console.log('提交文件数据:', formData);
          
          // 更新本地数据
          if (currentFileRow.value) {
            // 这里可以根据需要更新相关字段
            currentFileRow.value.fileTag = formData.fileTag;
            currentFileRow.value.fileRemark = formData.remark;
            
            // 更新表格数据
            const index = tableData.value.findIndex(item => item.id === currentFileRow.value.id);
            if (index !== -1) {
              tableData.value[index] = { ...currentFileRow.value };
            }
            
            // 更新显示数据
            const displayIndex = displayData.value.findIndex(item => item.id === currentFileRow.value.id);
            if (displayIndex !== -1) {
              displayData.value[displayIndex] = { ...currentFileRow.value };
            }
          }
          
          ElMessage.success('文件上传成功');
          fileUploadWithTagVisible.value = false;
        } catch (error) {
          console.error('文件上传失败:', error);
          ElMessage.error('文件上传失败');
        }
      };
  
      // 处理文件上传取消
      const handleFileUploadWithTagCancel = () => {
        fileUploadWithTagVisible.value = false;
        currentFileRow.value = null;
      };
  
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
        
        expenseDialogVisible,
        currentTrainData,
        handleExpensePushed,
        handlePushCancelled,
        getTagType,
        handleTagClose,
        memoDialogVisible,
        followUpDialogVisible,
        memoForm,
        followUpForm,
        followUpHistory,
        currentEditingTrain,
        handleMemo,
        saveMemo,
        handleFollowUp,
        saveFollowUp,
        handleMarkException,
        historyDialogVisible,
        handleHistory,
        gpsTrackDialogVisible,
        currentGpsTrainData,
        handleChildCommand,
        handleVehicleAssignment,
        handleGpsTrack,
        handleFileUpload,
        handlePodUpload,
        getEditControlType,
        getEditControlOptions,
        isEditableField,
        vehicleAssignmentVisible,
        openVehicleAssignment,
        handleVehicleAssign,
        handleVehicleCancelAssign,
        podDialogVisible,
        currentPodRow,
        handlePodSubmit,
        handlePodCancel,
        fileUploadWithTagVisible,
        currentFileRow,
        handleFileUploadWithTag,
        handleFileUploadWithTagSubmit,
        handleFileUploadWithTagCancel,
      };
    }
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
  
  /* 标签样式 */
  .tag-cell {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 5px;
  }
  
  .el-tag {
    margin: 2px;
    cursor: pointer;
  }
  
  .el-tag:hover {
    opacity: 0.8;
  }
  
  /* 跟进记录样式 */
  .follow-up-container {
    max-height: 600px;
    overflow-y: auto;
  }
  
  .follow-up-history {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
  }
  
  .follow-up-history h4 {
    margin: 0 0 15px 0;
    color: #303133;
    font-size: 16px;
  }
  
  .follow-up-item {
    padding: 10px;
    background-color: #fff;
    border-radius: 4px;
    margin-bottom: 10px;
  }
  
  .follow-up-content {
    color: #303133;
    line-height: 1.5;
    margin-bottom: 8px;
  }
  
  .follow-up-operator {
    color: #909399;
    font-size: 13px;
  }
  
  :deep(.el-timeline-item__node--primary) {
    background-color: #409EFF;
  }
  
  :deep(.el-timeline-item__node--warning) {
    background-color: #E6A23C;
  }
  
  :deep(.el-timeline-item__node--danger) {
    background-color: #F56C6C;
  }
  
  :deep(.el-timeline-item__content) {
    color: #303133;
  }
  
  :deep(.el-timeline-item__timestamp) {
    color: #909399;
  }
  
  /* 滚动条样式 */
  .follow-up-container::-webkit-scrollbar {
    width: 6px;
  }
  
  .follow-up-container::-webkit-scrollbar-thumb {
    background: #c0c4cc;
    border-radius: 3px;
  }
  
  .follow-up-container::-webkit-scrollbar-track {
    background: #f4f4f5;
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
  </style> 