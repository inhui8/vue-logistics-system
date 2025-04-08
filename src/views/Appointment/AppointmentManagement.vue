<template>
  <div class="appointment-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>预约管理</span>
          <div class="header-buttons">
            <el-button type="primary" size="small" @click="handleAdd">添加预约</el-button>
            <el-button type="info" size="small" @click="showLogs">操作日志</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="平台">
            <el-select v-model="searchForm.platform" placeholder="请选择平台" style="width: 200px;">
              <el-option label="全部" value=""></el-option>
              <el-option label="Amazon" value="Amazon"></el-option>
              <el-option label="Walmart" value="Walmart"></el-option>
              <el-option label="eBay" value="eBay"></el-option>
              <el-option label="Shopify" value="Shopify"></el-option>
              <!-- 可根据需要添加更多平台 -->
            </el-select>
          </el-form-item>
          <el-form-item label="仓库代码">
            <el-input v-model="searchForm.warehouseCode" placeholder="请输入仓库代码"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 状态筛选区域和视图控制 -->
      <div class="view-management">
        <span class="view-label"></span>
        <el-radio-group v-model="currentView" size="small" class="status-view-group">
          <el-radio-button value="all">全部({{ total }})</el-radio-button>
          <el-radio-button value="unused">未使用({{ getStatusCount('unused') }})</el-radio-button>
          <el-radio-button value="used">已使用({{ getStatusCount('used') }})</el-radio-button>
          <el-radio-button value="amazon_deleted">亚马逊删约({{ getStatusCount('amazon_deleted') }})</el-radio-button>
          <el-radio-button value="deleted">删约({{ getStatusCount('deleted') }})</el-radio-button>
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

      <!-- 表格区域 -->
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
        <!-- 平台列 -->
        <el-table-column prop="platform" label="平台" width="100">
          <template #default="scope">
            <el-tag :type="getPlatformType(scope.row.platform)">
              {{ scope.row.platform }}
            </el-tag>
          </template>
        </el-table-column>
        
        <!-- 仓库代码列 -->
        <el-table-column prop="warehouseCode" label="仓库代码" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDbClick(scope.row, 'warehouseCode')">
              <el-input
                v-if="editingCell.rowId === scope.row.id && editingCell.prop === 'warehouseCode'"
                v-model="editingCell.value"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'warehouseCode')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'warehouseCode')"
                v-focus
              />
              <span v-else>{{ scope.row.warehouseCode }}</span>
            </div>
          </template>
        </el-table-column>
        
        <!-- 预约账户列 -->
        <el-table-column prop="account" label="预约账户" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDbClick(scope.row, 'account')">
              <el-input
                v-if="editingCell.rowId === scope.row.id && editingCell.prop === 'account'"
                v-model="editingCell.value"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'account')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'account')"
                v-focus
              />
              <span v-else>{{ scope.row.account }}</span>
            </div>
          </template>
        </el-table-column>
        
        <!-- 预约号列 -->
        <el-table-column prop="appointmentId" label="预约号" width="150">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDbClick(scope.row, 'appointmentId')">
              <el-input
                v-if="editingCell.rowId === scope.row.id && editingCell.prop === 'appointmentId'"
                v-model="editingCell.value"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'appointmentId')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'appointmentId')"
                v-focus
              />
              <span v-else>{{ scope.row.appointmentId }}</span>
            </div>
          </template>
        </el-table-column>
        
        <!-- PC号列 -->
        <el-table-column prop="pcNumber" label="PC号" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDbClick(scope.row, 'pcNumber')">
              <el-input
                v-if="editingCell.rowId === scope.row.id && editingCell.prop === 'pcNumber'"
                v-model="editingCell.value"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'pcNumber')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'pcNumber')"
                v-focus
              />
              <span v-else>{{ scope.row.pcNumber }}</span>
            </div>
          </template>
        </el-table-column>
        
        <!-- CRDD列 -->
        <el-table-column prop="crdd" label="CRDD" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDbClick(scope.row, 'crdd')">
              <el-date-picker
                v-if="editingCell.rowId === scope.row.id && editingCell.prop === 'crdd'"
                v-model="editingCell.value"
                type="date"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'crdd')"
                v-focus
              />
              <span v-else>{{ scope.row.crdd }}</span>
            </div>
          </template>
        </el-table-column>
        
        <!-- 预约类型列 -->
        <el-table-column prop="appointmentType" label="预约类型" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDbClick(scope.row, 'appointmentType')">
              <el-select
                v-if="editingCell.rowId === scope.row.id && editingCell.prop === 'appointmentType'"
                v-model="editingCell.value"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'appointmentType')"
                @change="handleCellEditConfirm(scope.row, 'appointmentType')"
                v-focus
              >
                <el-option label="地板" value="floor"></el-option>
                <el-option label="卡板" value="pallet"></el-option>
              </el-select>
              <span v-else>{{ scope.row.appointmentType === 'floor' ? '地板' : '卡板' }}</span>
            </div>
          </template>
        </el-table-column>
        
        <!-- 预约时间列 -->
        <el-table-column prop="appointmentTime" label="预约时间" width="160">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDbClick(scope.row, 'appointmentTime')">
              <el-date-picker
                v-if="editingCell.rowId === scope.row.id && editingCell.prop === 'appointmentTime'"
                v-model="editingCell.value"
                type="datetime"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'appointmentTime')"
                v-focus
              />
              <span v-else>{{ scope.row.appointmentTime }}</span>
            </div>
          </template>
        </el-table-column>
        
        <!-- 最早预约时间列 -->
        <el-table-column prop="earliestAppointmentTime" label="最早预约时间" width="160">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDbClick(scope.row, 'earliestAppointmentTime')">
              <el-date-picker
                v-if="editingCell.rowId === scope.row.id && editingCell.prop === 'earliestAppointmentTime'"
                v-model="editingCell.value"
                type="datetime"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'earliestAppointmentTime')"
                v-focus
              />
              <span v-else>{{ scope.row.earliestAppointmentTime }}</span>
            </div>
          </template>
        </el-table-column>
        
        <!-- 状态列 -->
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDbClick(scope.row, 'status')">
              <el-select
                v-if="editingCell.rowId === scope.row.id && editingCell.prop === 'status'"
                v-model="editingCell.value"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'status')"
                @change="handleCellEditConfirm(scope.row, 'status')"
                v-focus
              >
                <el-option label="未使用" value="unused"></el-option>
                <el-option label="已使用" value="used"></el-option>
                <el-option label="亚马逊删约" value="amazon_deleted"></el-option>
                <el-option label="删约" value="deleted"></el-option>
              </el-select>
              <el-tag v-else :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <!-- 跟进记录列 -->
        <el-table-column prop="followUpRecord" label="跟进记录" min-width="150">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDbClick(scope.row, 'followUpRecord')">
              <el-input
                v-if="editingCell.rowId === scope.row.id && editingCell.prop === 'followUpRecord'"
                v-model="editingCell.value"
                type="textarea"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'followUpRecord')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'followUpRecord')"
                v-focus
              />
              <span v-else>{{ scope.row.followUpRecord }}</span>
            </div>
          </template>
        </el-table-column>
        
        <!-- Memo列 -->
        <el-table-column prop="memo" label="Memo" min-width="150">
          <template #default="scope">
            <div v-if="!scope.row.isGroup" class="editable-cell" @dblclick="handleCellDbClick(scope.row, 'memo')">
              <el-input
                v-if="editingCell.rowId === scope.row.id && editingCell.prop === 'memo'"
                v-model="editingCell.value"
                type="textarea"
                size="small"
                @blur="handleCellEditConfirm(scope.row, 'memo')"
                @keyup.enter="handleCellEditConfirm(scope.row, 'memo')"
                v-focus
              />
              <span v-else>{{ scope.row.memo }}</span>
            </div>
          </template>
        </el-table-column>
        
        <!-- 操作列 -->
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleDetail(scope.row)">详情</el-button>
            <el-dropdown @command="handleCommand" style="margin-left: 10px;">
              <el-button size="small">
                更多<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{action: 'edit', row: scope.row}">修改预约</el-dropdown-item>
                  <el-dropdown-item :command="{action: 'followUp', row: scope.row}">跟进记录</el-dropdown-item>
                  <el-dropdown-item :command="{action: 'delete', row: scope.row}">删除</el-dropdown-item>
                  <el-dropdown-item :command="{action: 'createPC', row: scope.row}">创建PC</el-dropdown-item>
                  <el-dropdown-item :command="{action: 'statistics', row: scope.row}">货量统计</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </groupable-table>

      <!-- 分页删除，已在groupable-table组件中实现 -->
    </el-card>

    <!-- 添加/编辑预约对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="dialogTitle"
      width="60%"
      :before-close="handleCloseDialog"
      destroy-on-close
    >
      <el-form :model="currentAppointment" ref="appointmentFormRef" label-width="120px">
        <el-form-item label="平台" prop="platform" :rules="{ required: true, message: '请选择平台', trigger: 'change' }">
          <el-select v-model="currentAppointment.platform" placeholder="请选择平台">
            <el-option label="Amazon" value="Amazon"></el-option>
            <el-option label="Walmart" value="Walmart"></el-option>
            <el-option label="eBay" value="eBay"></el-option>
            <el-option label="Shopify" value="Shopify"></el-option>
             <!-- 可根据需要添加更多平台 -->
          </el-select>
        </el-form-item>
        <el-form-item label="仓库代码" prop="warehouseCode" :rules="{ required: true, message: '请输入仓库代码', trigger: 'blur' }">
          <el-input v-model="currentAppointment.warehouseCode" placeholder="请输入仓库代码"></el-input>
        </el-form-item>
        <el-form-item label="预约账户" prop="account">
          <el-input v-model="currentAppointment.account" placeholder="请输入预约账户"></el-input>
        </el-form-item>
        <el-form-item label="预约号" prop="appointmentId" :rules="{ required: true, message: '请输入预约号', trigger: 'blur' }">
          <el-input v-model="currentAppointment.appointmentId" placeholder="请输入预约号"></el-input>
        </el-form-item>
        <el-form-item label="PC号" prop="pcNumber">
          <el-input v-model="currentAppointment.pcNumber" placeholder="请输入PC号"></el-input>
        </el-form-item>
        <el-form-item label="CRDD" prop="crdd">
          <el-date-picker
            v-model="currentAppointment.crdd"
            type="date"
            placeholder="选择CRDD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="预约类型" prop="appointmentType">
          <el-select v-model="currentAppointment.appointmentType" placeholder="请选择预约类型">
            <el-option label="地板" value="floor"></el-option>
            <el-option label="卡板" value="pallet"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="预约时间" prop="appointmentTime">
          <el-date-picker
            v-model="currentAppointment.appointmentTime"
            type="datetime"
            placeholder="选择预约时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="最早预约时间" prop="earliestAppointmentTime">
           <el-date-picker
            v-model="currentAppointment.earliestAppointmentTime"
            type="datetime"
            placeholder="选择最早预约时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status" :rules="{ required: true, message: '请选择状态', trigger: 'change' }">
          <el-select v-model="currentAppointment.status" placeholder="请选择状态">
            <el-option label="未使用" value="unused"></el-option>
            <el-option label="已使用" value="used"></el-option>
            <el-option label="亚马逊删约" value="amazon_deleted"></el-option>
            <el-option label="删约" value="deleted"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="跟进记录" prop="followUpRecord">
          <el-input type="textarea" v-model="currentAppointment.followUpRecord" placeholder="请输入跟进记录"></el-input>
        </el-form-item>
        <el-form-item label="Memo" prop="memo">
          <el-input type="textarea" v-model="currentAppointment.memo" placeholder="请输入Memo"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmitForm">保存</el-button>
        </span>
      </template>
    </el-dialog>

     <!-- TODO: 操作日志对话框 -->
     <!-- TODO: 详情对话框 -->
     <!-- TODO: 跟进记录对话框 -->

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
          <div v-for="item in columnSettingsList" :key="item.prop" class="column-item">
            <span class="drag-handle">≡</span>
            <el-checkbox v-model="item.visible">{{ item.label }}</el-checkbox>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="columnSettingsVisible = false">取消</el-button>
          <el-button type="primary" @click="applyColumnSettings">确定</el-button>
        </span>
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
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus';

import GroupableTable from '@/components/logistics/GroupableTable.vue';
import FilterPanel from '@/components/logistics/FilterPanel.vue';

export default {
  name: 'AppointmentManagement',
  components: { 
    GroupableTable,
    FilterPanel
  },
  directives: {
    focus: {
      mounted(el) {
        el.focus();
      }
    }
  },
  data() {
    return {
      searchForm: {
        platform: '',
        warehouseCode: ''
      },
      // 表格相关
      tableData: [
        // 模拟数据
        {
          id: '1', platform: 'Amazon', warehouseCode: 'ONT9', account: 'Acc1', appointmentId: 'AP001', appointmentTime: '2024-07-30 10:00:00', earliestAppointmentTime: '2024-07-29 09:00:00', status: 'unused', followUpRecord: '首次录入', memo: '加急', pcNumber: 'PC001', crdd: '2024-07-28', appointmentType: 'floor'
        },
        {
          id: '2', platform: 'Amazon', warehouseCode: 'LAX9', account: 'Acc2', appointmentId: 'AP002', appointmentTime: '2024-07-31 14:30:00', earliestAppointmentTime: '2024-07-30 08:00:00', status: 'used', followUpRecord: '已送达', memo: '', pcNumber: 'PC002', crdd: '2024-07-29', appointmentType: 'pallet'
        },
        {
          id: '3', platform: 'Walmart', warehouseCode: 'WMT-CA1', account: 'Acc3', appointmentId: 'AP003', appointmentTime: '2024-08-01 11:00:00', earliestAppointmentTime: '2024-07-31 10:00:00', status: 'amazon_deleted', followUpRecord: '联系客户重新预约', memo: '货多', pcNumber: 'PC003', crdd: '2024-07-30', appointmentType: 'floor'
        },
        {
           id: '4', platform: 'Amazon', warehouseCode: 'ONT8', account: 'Acc1', appointmentId: 'AP004', appointmentTime: '2024-08-02 16:00:00', earliestAppointmentTime: '2024-08-01 14:00:00', status: 'deleted', followUpRecord: '客户取消', memo: '', pcNumber: 'PC004', crdd: '2024-07-31', appointmentType: 'pallet'
        }
      ],
      displayData: [],
      loading: false,
      selectedRows: [],
      
      // 视图相关
      currentView: 'all',
      customViews: [],
      saveViewDialogVisible: false,
      viewOptionsDialogVisible: false,
      renameViewDialogVisible: false,
      viewForm: {
        name: '',
        columns: []
      },
      currentEditingView: null,
      renameForm: {
        name: ''
      },
      
      // 编辑相关
      editingCell: {
        rowId: null,
        prop: null,
        value: null
      },
      
      // 分页相关
      currentPage: 1,
      pageSize: 10,
      
      // 筛选相关
      filterPanelVisible: false,
      activeFilters: [],
      filterLogic: 'and',
      
      // 分组相关
      groupField: '',
      groupModalVisible: false,
      groupSettings: {
        level1: '',
        level2: '',
        level3: ''
      },
      
      // 排序相关
      sortModalVisible: false,
      sortSettings: [{ field: '', direction: 'asc' }],
      
      // 字段配置相关
      columnSettingsVisible: false,
      allColumnsSelected: true,
      columnSettingsList: [],
      
      // 上下文菜单相关
      contextMenuVisible: false,
      contextMenuX: 0,
      contextMenuY: 0,
      
      // 当前表单数据
      formDialogVisible: false,
      dialogMode: 'add', // 'add' or 'edit'
      currentAppointment: { // 用于表单的数据模型
        id: null,
        platform: '',
        warehouseCode: '',
        account: '',
        appointmentId: '',
        appointmentTime: '',
        earliestAppointmentTime: '',
        status: 'unused', // 默认状态
        followUpRecord: '',
        memo: '',
        pcNumber: '',
        crdd: '',
        appointmentType: 'floor' // 默认预约类型
      }
    }
  },
  computed: {
    dialogTitle() {
      return this.dialogMode === 'add' ? '新增预约' : '修改预约';
    },
    
    total() {
      return this.tableData.length;
    },
    
    // 表格列定义
    tableColumns() {
      return [
        { prop: 'platform', label: '平台', width: 100, sortable: true, filterType: 'select', 
          filterOptions: [
            { label: 'Amazon', value: 'Amazon' },
            { label: 'Walmart', value: 'Walmart' },
            { label: 'eBay', value: 'eBay' },
            { label: 'Shopify', value: 'Shopify' }
          ]
        },
        { prop: 'warehouseCode', label: '仓库代码', width: 120, sortable: true },
        { prop: 'account', label: '预约账户', width: 120, sortable: true },
        { prop: 'appointmentId', label: '预约号', width: 150, sortable: true },
        { prop: 'pcNumber', label: 'PC号', width: 120, sortable: true },
        { prop: 'crdd', label: 'CRDD', width: 120, sortable: true, filterType: 'date' },
        { prop: 'appointmentType', label: '预约类型', width: 120, sortable: true, filterType: 'select',
          filterOptions: [
            { label: '地板', value: 'floor' },
            { label: '卡板', value: 'pallet' }
          ]
        },
        { prop: 'appointmentTime', label: '预约时间', width: 160, sortable: true, filterType: 'datetime' },
        { prop: 'earliestAppointmentTime', label: '最早预约时间', width: 160, sortable: true, filterType: 'datetime' },
        { prop: 'status', label: '状态', width: 120, sortable: true, filterType: 'select',
          filterOptions: [
            { label: '未使用', value: 'unused' },
            { label: '已使用', value: 'used' },
            { label: '亚马逊删约', value: 'amazon_deleted' },
            { label: '删约', value: 'deleted' }
          ]
        },
        { prop: 'followUpRecord', label: '跟进记录', minWidth: 150, sortable: false },
        { prop: 'memo', label: 'Memo', minWidth: 150, sortable: false },
        { prop: 'operation', label: '操作', width: 180, sortable: false, fixed: 'right' }
      ];
    },
    
    // 可分组字段
    groupableFields() {
      return this.tableColumns.filter(col => col.sortable && col.prop !== 'operation');
    },
    
    // 可排序字段
    sortableFields() {
      return this.tableColumns.filter(col => col.sortable);
    },
    
    // 判断是否有分组数据
    hasGroupedData() {
      return this.displayData.some(item => item.isGroup);
    }
  },
  methods: {
    // 平台标签类型
    getPlatformType(platform) {
      const platformMap = {
        'Amazon': '',
        'Walmart': 'success',
        'eBay': 'warning',
        'Shopify': 'info'
      };
      return platformMap[platform] || 'info';
    },
    
    // 状态标签类型
    getStatusType(status) {
      const statusMap = {
        unused: 'info',        // 未使用
        used: 'success',      // 已使用
        amazon_deleted: 'danger', // 亚马逊删约
        deleted: 'warning'        // 删约
      };
      return statusMap[status] || 'info';
    },
    
    // 状态文本
    getStatusText(status) {
      const statusMap = {
        unused: '未使用',
        used: '已使用',
        amazon_deleted: '亚马逊删约',
        deleted: '删约'
      };
      return statusMap[status] || '未知';
    },
    
    // 获取状态数量
    getStatusCount(status) {
      return this.tableData.filter(item => item.status === status).length;
    },
    
    // 获取分组列标签
    getGroupColumnLabel(fieldName) {
      const field = this.tableColumns.find(col => col.prop === fieldName);
      return field ? field.label : '分组';
    },
    
    // 基础操作
    handleSearch() {
      console.log('搜索条件：', this.searchForm);
      // 实际操作中，应该调用接口按条件获取数据
      this.refreshDisplayData();
    },
    
    resetForm() {
      this.searchForm = {
        platform: '',
        warehouseCode: ''
      };
      this.handleSearch();
    },
    
    // 刷新表格数据
    refreshDisplayData() {
      this.loading = true;
      // 模拟异步操作
      setTimeout(() => {
        // 1. 先应用筛选条件
        let data = [...this.tableData];
        
        // 根据当前视图筛选
        if (this.currentView !== 'all' && ['unused', 'used', 'amazon_deleted', 'deleted'].includes(this.currentView)) {
          data = data.filter(item => item.status === this.currentView);
        }
        
        // 应用高级筛选
        if (this.activeFilters.length > 0) {
          data = this.applyDataFilters(data);
        }
        
        // 2. 应用分组
        if (this.groupField) {
          data = this.applyGrouping(data, this.groupField);
        }
        
        // 应用自定义视图的配置
        const foundView = this.customViews.find(view => view.id === this.currentView);
        if (foundView && foundView.config) {
          // Todo: 应用自定义视图配置
        }
        
        this.displayData = data;
        this.loading = false;
      }, 300);
    },
    
    // 应用筛选条件
    applyDataFilters(data) {
      // 实现筛选逻辑
      if (this.activeFilters.length === 0) return data;
      
      return data.filter(item => {
        const filterResults = this.activeFilters.map(filter => {
          const { field, operator, value } = filter;
          
          // Skip invalid filters
          if (!field || !operator) return true;
          
          const itemValue = item[field];
          
          switch (operator) {
            case 'eq': return itemValue === value;
            case 'neq': return itemValue !== value;
            case 'contains': return String(itemValue).includes(String(value));
            case 'notContains': return !String(itemValue).includes(String(value));
            case 'startsWith': return String(itemValue).startsWith(String(value));
            case 'endsWith': return String(itemValue).endsWith(String(value));
            case 'gt': return itemValue > value;
            case 'gte': return itemValue >= value;
            case 'lt': return itemValue < value;
            case 'lte': return itemValue <= value;
            case 'in': return Array.isArray(value) ? value.includes(itemValue) : false;
            case 'notIn': return Array.isArray(value) ? !value.includes(itemValue) : true;
            default: return true;
          }
        });
        
        return this.filterLogic === 'and'
          ? filterResults.every(Boolean)
          : filterResults.some(Boolean);
      });
    },
    
    // 应用分组
    applyGrouping(data, groupField) {
      if (!groupField) return data;
      
      const groupedData = [];
      const groups = {};
      
      // 创建分组
      data.forEach(item => {
        const groupValue = item[groupField] || '未设置';
        if (!groups[groupValue]) {
          groups[groupValue] = {
            id: `group_${groupValue}`,
            isGroup: true,
            groupLevel: 1,
            groupName: groupValue,
            groupField: groupField,
            count: 0,
            children: []
          };
          groupedData.push(groups[groupValue]);
        }
        
        groups[groupValue].children.push(item);
        groups[groupValue].count++;
      });
      
      return groupedData;
    },
    
    // 表格事件处理
    handleSelectionChange(selection) {
      this.selectedRows = selection;
    },
    
    handleCellClick(row, column) {
      console.log('单元格点击:', row, column.property);
    },
    
    handleCellDbClick(row, prop) {
      if (!row.isGroup && ['platform', 'warehouseCode', 'account', 'appointmentId', 'appointmentTime', 'earliestAppointmentTime', 'status', 'followUpRecord', 'memo'].includes(prop)) {
        this.editingCell = {
          rowId: row.id,
          prop: prop,
          value: row[prop]
        };
      }
    },
    
    handleCellEditConfirm(row, prop) {
      if (this.editingCell.rowId === row.id && this.editingCell.prop === prop) {
        // 实际应用中，应该调用接口来保存修改
        row[prop] = this.editingCell.value;
        
        // 清除编辑状态
        this.editingCell = {
          rowId: null,
          prop: null,
          value: null
        };
        
        ElMessage.success('修改成功');
      }
    },
    
    // 按钮操作
    handleAdd() {
      this.dialogMode = 'add';
      this.currentAppointment = {
        id: null,
        platform: '',
        warehouseCode: '',
        account: '',
        appointmentId: '',
        appointmentTime: '',
        earliestAppointmentTime: '',
        status: 'unused',
        followUpRecord: '',
        memo: '',
        pcNumber: '',
        crdd: '',
        appointmentType: 'floor'
      };
      this.formDialogVisible = true;
    },
    
    showLogs() {
      ElMessage.info('操作日志功能待实现');
    },
    
    handleDetail(/* row */) {
      ElMessage.info('详情功能待实现');
    },
    
    handleCommand(command) {
      const { action, row } = command;
      if (action === 'edit') {
        this.handleEdit(row);
      } else if (action === 'followUp') {
        this.handleFollowUp(row);
      } else if (action === 'delete') {
        this.handleDelete(row);
      } else if (action === 'createPC') {
        this.handleCreatePC(row);
      }
    },
    
    handleEdit(row) {
      this.dialogMode = 'edit';
      this.currentAppointment = JSON.parse(JSON.stringify(row));
      this.formDialogVisible = true;
    },
    
    handleFollowUp(/* row */) {
      ElMessage.info('跟进记录功能待实现');
    },
    
    handleDelete(row) {
      ElMessageBox.confirm('确定要删除该条预约记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 实际应用中，应该调用接口来删除数据
        const index = this.tableData.findIndex(item => item.id === row.id);
        if (index !== -1) {
          this.tableData.splice(index, 1);
          this.refreshDisplayData();
          ElMessage.success('删除成功');
        }
      }).catch(() => {});
    },
    
    handleCreatePC(/* row */) {
      ElMessage.info('创建PC功能待实现');
    },
    
    // 分页事件
    handleSizeChange(size) {
      this.pageSize = size;
      // 实际应用中，应该调用接口重新获取数据
    },
    
    handleCurrentChange(page) {
      this.currentPage = page;
      // 实际应用中，应该调用接口重新获取数据
    },
    
    // 表单提交
    handleCloseDialog() {
      this.formDialogVisible = false;
    },
    
    handleSubmitForm() {
      // 模拟表单验证
      if (!this.currentAppointment.platform || !this.currentAppointment.appointmentId) {
        ElMessage.error('请完善必填项');
        return;
      }
      
      // 实际应用中，应该调用接口来保存数据
      if (this.dialogMode === 'add') {
        const newId = String(Date.now());
        this.tableData.unshift({ ...this.currentAppointment, id: newId });
        ElMessage.success('添加成功');
      } else {
        const index = this.tableData.findIndex(item => item.id === this.currentAppointment.id);
        if (index !== -1) {
          this.tableData.splice(index, 1, { ...this.currentAppointment });
          ElMessage.success('修改成功');
        }
      }
      
      this.refreshDisplayData();
      this.handleCloseDialog();
    },
    
    // 视图和分组功能
    showFilterPanel() {
      this.filterPanelVisible = true;
    },
    
    applyFilters(filters, logic) {
      this.activeFilters = filters;
      this.filterLogic = logic;
      this.refreshDisplayData();
    },
    
    cancelFilters() {
      // 不执行任何操作，保持原有筛选条件
    },
    
    handleSaveView() {
      this.viewForm = {
        name: '',
        columns: this.tableColumns.map(col => col.prop)
      };
      this.saveViewDialogVisible = true;
    },
    
    saveView() {
      if (!this.viewForm.name) {
        ElMessage.error('请输入视图名称');
        return;
      }
      
      const newView = {
        id: `custom_${Date.now()}`,
        name: this.viewForm.name,
        config: {
          columns: this.viewForm.columns,
          filters: [...this.activeFilters],
          filterLogic: this.filterLogic,
          groupField: this.groupField,
          sortSettings: [...this.sortSettings]
        }
      };
      
      this.customViews.push(newView);
      this.saveViewDialogVisible = false;
      this.currentView = newView.id;
      
      ElMessage.success('视图保存成功');
    },
    
    showGroupModal() {
      this.groupSettings = {
        level1: this.groupField || '',
        level2: '',
        level3: ''
      };
      this.groupModalVisible = true;
    },
    
    clearGroupSettings() {
      this.groupSettings = {
        level1: '',
        level2: '',
        level3: ''
      };
    },
    
    applyGroupSettings() {
      this.groupField = this.groupSettings.level1;
      this.groupModalVisible = false;
      this.refreshDisplayData();
    },
    
    showSortModal() {
      this.sortModalVisible = true;
    },
    
    addSortField() {
      this.sortSettings.push({ field: '', direction: 'asc' });
    },
    
    removeSortField(index) {
      this.sortSettings.splice(index, 1);
      if (this.sortSettings.length === 0) {
        this.sortSettings.push({ field: '', direction: 'asc' });
      }
    },
    
    clearSortSettings() {
      this.sortSettings = [{ field: '', direction: 'asc' }];
    },
    
    applySortSettings() {
      // 实现排序逻辑
      this.sortModalVisible = false;
      this.refreshDisplayData();
    },
    
    showColumnSettings() {
      this.columnSettingsList = JSON.parse(JSON.stringify(this.tableColumns));
      this.allColumnsSelected = this.columnSettingsList.every(col => col.visible !== false);
      this.columnSettingsVisible = true;
    },
    
    handleSelectAllColumns(val) {
      this.columnSettingsList.forEach(col => {
        col.visible = val;
      });
    },
    
    resetColumnSettings() {
      this.columnSettingsList = JSON.parse(JSON.stringify(this.tableColumns));
      this.allColumnsSelected = true;
    },
    
    applyColumnSettings() {
      // 应用字段配置
      this.tableColumns.forEach(col => {
        const foundCol = this.columnSettingsList.find(c => c.prop === col.prop);
        if (foundCol) {
          col.visible = foundCol.visible;
        }
      });
      this.columnSettingsVisible = false;
      ElMessage.success('字段配置已应用');
    },
    
    // 上下文菜单
    handleContextMenu(event, view) {
      event.preventDefault();
      this.currentEditingView = view;
      this.contextMenuX = event.clientX;
      this.contextMenuY = event.clientY;
      this.contextMenuVisible = true;
      
      // 自动关闭上下文菜单
      document.addEventListener('click', this.closeContextMenu, { once: true });
    },
    
    closeContextMenu() {
      this.contextMenuVisible = false;
    },
    
    handleRenameView() {
      if (!this.currentEditingView) return;
      
      this.renameForm.name = this.currentEditingView.name;
      this.viewOptionsDialogVisible = false;
      this.contextMenuVisible = false;
      this.renameViewDialogVisible = true;
    },
    
    saveRenameView() {
      if (!this.renameForm.name) {
        ElMessage.error('请输入视图名称');
        return;
      }
      
      const view = this.customViews.find(v => v.id === this.currentEditingView.id);
      if (view) {
        view.name = this.renameForm.name;
        ElMessage.success('视图重命名成功');
      }
      
      this.renameViewDialogVisible = false;
    },
    
    handleCopyView() {
      if (!this.currentEditingView) return;
      
      const newView = JSON.parse(JSON.stringify(this.currentEditingView));
      newView.id = `custom_${Date.now()}`;
      newView.name = `${newView.name} (复制)`;
      
      this.customViews.push(newView);
      this.viewOptionsDialogVisible = false;
      this.contextMenuVisible = false;
      
      ElMessage.success('视图复制成功');
    },
    
    handleDeleteView() {
      if (!this.currentEditingView) return;
      
      ElMessageBox.confirm('确定要删除该视图吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.customViews.findIndex(v => v.id === this.currentEditingView.id);
        if (index !== -1) {
          this.customViews.splice(index, 1);
          
          if (this.currentView === this.currentEditingView.id) {
            this.currentView = 'all';
          }
          
          ElMessage.success('视图删除成功');
        }
        
        this.viewOptionsDialogVisible = false;
        this.contextMenuVisible = false;
      }).catch(() => {});
    }
  },
  created() {
    // 初始化表格数据
    this.displayData = [...this.tableData];
  },
  mounted() {
    // 初始化完成后的操作
    this.refreshDisplayData();
  },
  watch: {
    currentView() {
      this.refreshDisplayData();
    }
  }
}
</script>

<style scoped>
.appointment-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.search-area {
  margin-bottom: 20px;
}

.view-management {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
}

.status-view-group {
  margin-right: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  text-align: right;
}

/* 可编辑单元格样式 */
.editable-cell {
  padding: 5px;
  border-radius: 3px;
  cursor: pointer;
  min-height: 20px;
}

.editable-cell:hover {
  background-color: #f0f9ff;
}

/* 上下文菜单样式 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 5px 0;
  min-width: 120px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 3000;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
}

.context-menu-item:hover {
  background-color: #f5f7fa;
}

/* 分组样式 */
.group-row {
  background-color: #f5f7fa;
  font-weight: bold;
}

.group-level-1 {
  background-color: #ecf5ff;
}

.group-level-2 {
  background-color: #f0f9eb;
}

.group-level-3 {
  background-color: #fdf6ec;
}

/* 字段配置样式 */
.column-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.column-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
}

.drag-handle {
  cursor: move;
  margin-right: 10px;
  color: #909399;
}

/* 表单样式优化 */
.el-form-item .el-date-editor.el-input,
.el-form-item .el-date-editor.el-input__inner {
  width: 100%;
}
</style>
