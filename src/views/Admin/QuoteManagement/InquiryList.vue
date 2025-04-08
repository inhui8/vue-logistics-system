<template>
  <div class="inquiry-list-container">
    <!-- 顶部筛选区 -->
    <div class="filter-bar">
      <div class="filter-row">
        <!-- 询价状态 -->
        <el-select v-model="filterForm.status" placeholder="询价状态" size="small" class="filter-item">
          <el-option label="询价中" value="inquiring" />
          <el-option label="报价收集完成" value="quoted" />
          <el-option label="已授标" value="awarded" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        
        <!-- 订单类型 -->
        <el-select v-model="filterForm.orderType" placeholder="订单类型" size="small" class="filter-item">
          <el-option label="FBA派送" value="FBA" />
          <el-option label="提柜服务" value="PICKUP" />
          <el-option label="派送服务" value="DELIVERY" />
          <el-option label="仓储服务" value="WAREHOUSE" />
        </el-select>
        
        <!-- 创建日期 -->
        <el-select v-model="createDateType" placeholder="创建日期" size="small" class="filter-item">
          <el-option label="创建日期" value="create" />
          <el-option label="报价截止日期" value="deadline" />
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
          <el-option label="询价单号" value="id" />
          <el-option label="订单号" value="orderNumber" />
          <el-option label="发起人" value="initiator" />
        </el-select>
        
        <!-- 搜索框 -->
        <el-input
          v-model="searchText"
          placeholder="请输入搜索内容"
          size="small"
          class="search-input"
          clearable
        ></el-input>
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" size="small" @click="handleCreateInquiry">
            <el-icon><Plus /></el-icon> 发起新询价
          </el-button>
          <el-button size="small" @click="showFilterPanel">
            <el-icon><Filter /></el-icon> 高级筛选
          </el-button>
        </div>
      </div>
    </div>

    <!-- 视图管理 -->
    <div class="view-management">
      <div class="status-view-group">
        <el-radio-group v-model="currentView" size="small">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="inquiring">询价中</el-radio-button>
          <el-radio-button label="quoted">待授标</el-radio-button>
          <el-radio-button label="awarded">已授标</el-radio-button>
          <el-radio-button label="cancelled">已取消</el-radio-button>
        </el-radio-group>
      </div>
      
      <div class="custom-view-group">
        <el-select v-model="selectedCustomView" placeholder="自定义视图" size="small" class="view-select">
          <el-option
            v-for="view in customViews"
            :key="view.id"
            :label="view.name"
            :value="view.id"
          />
        </el-select>
        <el-button-group>
          <el-button size="small" @click="handleCreateView">
            <el-icon><Plus /></el-icon> 新增视图
          </el-button>
          <el-button size="small" @click="handleViewOptions">视图管理</el-button>
        </el-button-group>
      </div>
      
      <div class="table-tools">
        <el-button-group>
          <el-button size="small" @click="showGroupModal">
            <el-icon><Grid /></el-icon> 分组
          </el-button>
          <el-button size="small" @click="showSortModal">
            <el-icon><Sort /></el-icon> 排序
          </el-button>
          <el-button size="small" @click="showColumnSettings">
            <el-icon><Setting /></el-icon> 列设置
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 表格容器 -->
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
              <h4 class="sub-table-title">子订单信息</h4>
              <el-table
                :data="props.row.subOrders || []"
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
                    <el-button type="text" size="small" @click="handleSubOrderDetail(scope.row)">详情</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        
        <!-- 动态列 -->
        <el-table-column
          v-for="column in visibleColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :fixed="column.fixed"
          :sortable="column.sortable"
        >
          <template #default="scope" v-if="column.prop === 'status'">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ formatStatus(scope.row.status) }}
            </el-tag>
          </template>
          <template #default="scope" v-else-if="column.prop === 'operation'">
            <el-button text type="primary" size="small" @click="handleViewDetails(scope.row)">详情</el-button>
            <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, scope.row)">
              <el-button text type="primary" size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="viewQuotes">查看报价</el-dropdown-item>
                  <el-dropdown-item command="cancelInquiry" v-if="scope.row.status === 'inquiring'">取消询价</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </groupable-table>
    </div>

    <!-- 高级筛选面板 -->
    <filter-panel
      v-model:visible="filterPanelVisible"
      :columns="tableColumns"
      :active-filters="activeFilters"
      :filter-logic="filterLogic"
      @apply="applyFilters"
      @cancel="cancelFilters"
    />

    <!-- 分组设置对话框 -->
    <el-dialog
      title="分组设置"
      v-model="groupModalVisible"
      width="500px"
    >
      <el-form :model="groupSettings" label-width="100px">
        <el-form-item label="一级分组">
          <el-select v-model="groupSettings.level1" placeholder="请选择" clearable>
            <el-option
              v-for="field in groupableFields"
              :key="field.prop"
              :label="field.label"
              :value="field.prop"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="二级分组">
          <el-select v-model="groupSettings.level2" placeholder="请选择" clearable>
            <el-option
              v-for="field in groupableFields"
              :key="field.prop"
              :label="field.label"
              :value="field.prop"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="三级分组">
          <el-select v-model="groupSettings.level3" placeholder="请选择" clearable>
            <el-option
              v-for="field in groupableFields"
              :key="field.prop"
              :label="field.label"
              :value="field.prop"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="groupModalVisible = false">取消</el-button>
          <el-button type="primary" @click="applyGroupSettings">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 排序设置对话框 -->
    <el-dialog
      title="排序设置"
      v-model="sortModalVisible"
      width="500px"
    >
      <div class="sort-list">
        <draggable
          v-model="sortSettings"
          item-key="field"
          handle=".drag-handle"
        >
          <template #item="{ element }">
            <div class="sort-item">
              <el-icon class="drag-handle"><d-arrow-left /></el-icon>
              <el-select v-model="element.field" placeholder="选择字段" style="width: 200px">
                <el-option
                  v-for="field in sortableFields"
                  :key="field.prop"
                  :label="field.label"
                  :value="field.prop"
                />
              </el-select>
              <el-select v-model="element.order" placeholder="排序方式" style="width: 120px">
                <el-option label="升序" value="ascending" />
                <el-option label="降序" value="descending" />
              </el-select>
              <el-button type="danger" link @click="removeSortField(element)">删除</el-button>
            </div>
          </template>
        </draggable>
        <el-button type="primary" link @click="addSortField">添加排序字段</el-button>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="sortModalVisible = false">取消</el-button>
          <el-button type="primary" @click="applySortSettings">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 列设置对话框 -->
    <el-dialog
      title="列设置"
      v-model="columnSettingsVisible"
      width="500px"
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

    <!-- 发起新询价 / 查看详情与报价 / 授标 弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="75%"
      @close="handleDialogClose"
      :close-on-click-modal="false"
    >
      <!-- 发起询价表单 -->
      <el-form
        v-if="isCreating"
        ref="inquiryFormRef"
        :model="inquiryForm"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="服务需求描述" prop="serviceDescription">
          <el-input v-model="inquiryForm.serviceDescription" type="textarea" :rows="3" placeholder="详细描述询价的服务内容、起止地、货物信息、时效要求等" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报价截止时间" prop="deadline">
              <el-date-picker
                v-model="inquiryForm.deadline"
                type="datetime"
                placeholder="选择截止时间"
                style="width: 100%;"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邀请供应商" prop="invitedSupplierIds">
              <el-select
                v-model="inquiryForm.invitedSupplierIds"
                multiple
                filterable
                placeholder="选择要邀请报价的供应商"
                style="width: 100%;"
              >
                <el-option
                  v-for="supplier in mockSuppliers"
                  :key="supplier.id"
                  :label="supplier.name"
                  :value="supplier.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注 (可选)">
          <el-input v-model="inquiryForm.remarks" type="textarea" :rows="2" placeholder="其他补充说明" />
        </el-form-item>
      </el-form>

      <!-- 查看详情与报价列表 -->
      <div v-else>
        <h4>询价信息</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="询价单号">{{ currentInquiry?.id }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ currentInquiry?.orderNumber }}</el-descriptions-item>
          <el-descriptions-item label="服务类型">{{ formatServiceType(currentInquiry?.serviceType) }}</el-descriptions-item>
          <el-descriptions-item label="截止时间">{{ currentInquiry?.deadline }}</el-descriptions-item>
          <el-descriptions-item label="需要预约">{{ currentInquiry?.needAppointment ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ formatStatus(currentInquiry?.status) }}</el-descriptions-item>
          <el-descriptions-item label="服务需求" :span="2">{{ currentInquiry?.serviceDescription }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentInquiry?.remarks || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider />
        <div class="quote-list-header">
          <h4>供应商报价列表 ({{ currentInquiry?.quotes?.length || 0 }} 条)</h4>
          <el-button type="primary" size="small" @click="handleInviteSuppliers" v-if="currentInquiry?.status === 'inquiring'">
            邀请供应商报价
          </el-button>
        </div>
        
        <el-table :data="currentInquiry?.quotes" style="width: 100%" border size="small">
          <el-table-column prop="supplierName" label="供应商" width="200" show-overflow-tooltip />
          <el-table-column prop="price" label="报价 (USD)" width="120" sortable>
            <template #default="scope">
              <span :class="{ 'best-quote': isBestQuote(scope.row.price) }">
                {{ scope.row.price?.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="responseTime" label="报价时间" width="160" />
          <el-table-column prop="remarks" label="备注" show-overflow-tooltip />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <el-button 
                text 
                type="success" 
                size="small" 
                @click="handleAward(scope.row)"
                v-if="currentInquiry?.status === 'quoted' || currentInquiry?.status === 'inquiring'" 
              >授标</el-button>
              <el-dropdown trigger="click" @command="(command) => handleQuoteCommand(command, scope.row)">
                <el-button text type="primary" size="small">
                  更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="negotiate">议价</el-dropdown-item>
                    <el-dropdown-item command="viewNegotiationHistory">查看议价记录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-tag type="success" v-if="currentInquiry?.status === 'awarded' && currentInquiry?.awardedSupplierId === scope.row.supplierId">已中标</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 议价对话框 -->
      <el-dialog
        v-model="negotiateDialogVisible"
        title="议价"
        width="500px"
        append-to-body
      >
        <el-form :model="negotiateForm" label-width="100px">
          <el-form-item label="当前报价">
            <span>{{ currentQuote?.price }} USD</span>
          </el-form-item>
          <el-form-item label="议价金额" prop="price">
            <el-input-number 
              v-model="negotiateForm.price" 
              :precision="2"
              :step="0.1"
              :min="0"
              controls-position="right"
            />
            <span class="unit">USD</span>
          </el-form-item>
          <el-form-item label="议价说明" prop="remarks">
            <el-input 
              type="textarea" 
              v-model="negotiateForm.remarks"
              :rows="3"
              placeholder="请输入议价说明"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="negotiateDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitNegotiation">确认</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 议价记录对话框 -->
      <el-dialog
        v-model="negotiationHistoryDialogVisible"
        title="议价记录"
        width="700px"
        append-to-body
      >
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in negotiationHistory"
            :key="index"
            :timestamp="record.time"
            :type="record.type"
          >
            <h4>{{ record.title }}</h4>
            <p>{{ record.content }}</p>
            <p v-if="record.price" class="negotiation-price">金额：{{ record.price }} USD</p>
          </el-timeline-item>
        </el-timeline>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="negotiationHistoryDialogVisible = false">关闭</el-button>
          </span>
        </template>
      </el-dialog>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ isCreating ? '取消' : '关闭' }}</el-button>
          <el-button type="primary" @click="handleSubmitInquiry" v-if="isCreating">确认发起</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 视图管理对话框 -->
    <el-dialog
      title="保存视图"
      v-model="saveViewDialogVisible"
      width="500px"
    >
      <el-form :model="viewForm" label-width="80px">
        <el-form-item label="视图名称">
          <el-input v-model="viewForm.name" placeholder="请输入视图名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="saveViewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveView">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 视图选项对话框 -->
    <el-dialog
      title="视图管理"
      v-model="viewOptionsDialogVisible"
      width="600px"
    >
      <div class="view-list">
        <el-table :data="customViews" style="width: 100%">
          <el-table-column prop="name" label="视图名称" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button text type="primary" @click="handleRenameView(scope.row)">重命名</el-button>
              <el-button text type="primary" @click="handleCopyView(scope.row)">复制</el-button>
              <el-button text type="danger" @click="handleDeleteView(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewOptionsDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 重命名视图对话框 -->
    <el-dialog
      title="重命名视图"
      v-model="renameViewDialogVisible"
      width="500px"
    >
      <el-form :model="renameForm" label-width="80px">
        <el-form-item label="视图名称">
          <el-input v-model="renameForm.name" placeholder="请输入新的视图名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="renameViewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveRenameView">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Filter, Grid, Sort, Setting, ArrowDown } from '@element-plus/icons-vue';
import { DArrowLeft } from '@element-plus/icons-vue';
import FilterPanel from '@/components/logistics/FilterPanel.vue';
import GroupableTable from '@/components/logistics/GroupableTable.vue';
import draggable from 'vuedraggable';
import inquiryColumns from '@/assets/json/inquiryColumns.json';
import inquiryChildColumns from '@/assets/json/inquiryChildColumns.json';
import inquiryData from '@/assets/json/inquiryData.json';

// 定义表格列
const defaultTableColumns = inquiryColumns;

// 定义子表格列
const defaultChildColumns = inquiryChildColumns;

// 使用导入的JSON数据
const defaultData = inquiryData.items;

export default {
  name: 'InquiryList',
  components: {
    FilterPanel,
    GroupableTable,
    draggable,
    Plus,
    Filter,
    Grid,
    Sort,
    Setting,
    DArrowLeft,
    ArrowDown
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
    const filterForm = ref({
      status: '',
      orderType: '',
      dateRange: []
    });
    const createDateType = ref('create');
    const dateRange = ref([]);
    const searchType = ref('id');
    const searchText = ref('');
    const filterPanelVisible = ref(false);
    const activeFilters = ref([]);
    const filterLogic = ref('and');
    
    // 分页相关
    const currentPage = ref(1);
    const pageSize = ref(20);
    const totalItems = ref(0);
    const total = computed(() => totalItems.value);
    
    // 视图相关
    const currentView = ref('all');
    const selectedCustomView = ref('');
    const customViews = ref([]);
    const saveViewDialogVisible = ref(false);
    const viewOptionsDialogVisible = ref(false);
    const renameViewDialogVisible = ref(false);
    const groupField = ref('');
    const viewForm = ref({
      name: '',
      columns: []
    });
    const currentEditingView = ref(null);
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
    
    // 排序相关
    const sortModalVisible = ref(false);
    const sortSettings = ref([]);
    const sortableFields = computed(() => 
      tableColumns.value.filter(col => col.sortable && col.prop !== 'operation')
    );
    
    // 列设置相关
    const columnSettingsVisible = ref(false);
    const columnSettingsList = ref([...defaultTableColumns]);
    const allColumnsSelected = computed({
      get: () => columnSettingsList.value.every(col => col.visible),
      set: (value) => columnSettingsList.value.forEach(col => col.visible = value)
    });
    
    // 弹窗相关
    const dialogVisible = ref(false);
    const dialogTitle = ref('');
    const isCreating = ref(false);
    const inquiryFormRef = ref(null);
    const currentInquiry = ref(null);
    
    // 表单相关
    const initialFormState = {
      serviceDescription: '',
      deadline: '',
      invitedSupplierIds: [],
      remarks: ''
    };
    const inquiryForm = ref({ ...initialFormState });
    
    const formRules = {
      serviceDescription: [{ required: true, message: '请输入服务需求描述', trigger: 'blur' }],
      deadline: [{ required: true, message: '请选择报价截止时间', trigger: 'change' }],
      invitedSupplierIds: [{ required: true, type: 'array', message: '请至少邀请一个供应商', trigger: 'change' }],
    };
    
    // 模拟数据
    const mockSuppliers = ref([
      { id: 'supplier_1', name: '测试供应商A - 专做提框服务' },
      { id: 'supplier_2', name: '测试供应商B - FBA派送专家' },
      { id: 'supplier_3', name: '测试供应商C - 全能型选手' },
      { id: 'supplier_4', name: '测试供应商D - 区域小霸王' },
    ]);
    
    // 计算属性
    const lowestPrice = computed(() => {
      if (!currentInquiry.value || !currentInquiry.value.quotes || currentInquiry.value.quotes.length === 0) {
        return Infinity;
      }
      return Math.min(...currentInquiry.value.quotes.map(q => q.price));
    });
    
    const isBestQuote = (price) => {
      if (price === null || price === undefined) return false;
      return price === lowestPrice.value;
    };
    
    // 方法
    const formatStatus = (status) => {
      const statusMap = {
        'inquiring': '询价中',
        'quoted': '报价收集完成',
        'awarded': '已授标',
        'cancelled': '已取消'
      };
      return statusMap[status] || status;
    };
    
    const getStatusTagType = (status) => {
      const statusMap = {
        'inquiring': 'primary',
        'quoted': 'warning',
        'awarded': 'success',
        'cancelled': 'info'
      };
      return statusMap[status] || 'info';
    };
    
    // 数据加载和处理
    const fetchData = () => {
      loading.value = true;
      try {
        totalItems.value = tableData.value.length;
        applyFiltersAndPagination();
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // 应用筛选和分页
    const applyFiltersAndPagination = () => {
      let filteredData = [...tableData.value];
      
      // 状态筛选
      if (currentView.value !== 'all') {
        filteredData = filteredData.filter(item => item.status === currentView.value);
      }
      
      // 订单类型筛选
      if (filterForm.value.orderType) {
        filteredData = filteredData.filter(item => item.orderType === filterForm.value.orderType);
      }
      
      // 日期范围筛选
      if (dateRange.value && dateRange.value.length === 2) {
        const [startDate, endDate] = dateRange.value;
        filteredData = filteredData.filter(item => {
          const date = createDateType.value === 'create' ? item.createdAt : item.deadline;
          return date >= startDate && date <= endDate;
        });
      }
      
      // 关键字搜索
      if (searchText.value) {
        filteredData = filteredData.filter(item => {
          const value = item[searchType.value];
          if (!value) return false;
          return value.toString().toLowerCase().includes(searchText.value.toLowerCase());
        });
      }
      
      // 应用排序
      if (sortSettings.value.length > 0) {
        filteredData.sort((a, b) => {
          for (const setting of sortSettings.value) {
            const aValue = a[setting.field];
            const bValue = b[setting.field];
            if (aValue === bValue) continue;
            return setting.order === 'ascending' 
              ? (aValue > bValue ? 1 : -1)
              : (aValue < bValue ? 1 : -1);
          }
          return 0;
        });
      }
      
      // 应用分组
      if (groupField.value) {
        filteredData = groupData(filteredData, groupField.value);
      }
      
      // 分页
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
    
    // 事件处理
    const handleSelectionChange = (rows) => {
      selectedRows.value = rows;
    };
    
    const handleSizeChange = (newSize) => {
      pageSize.value = newSize;
      currentPage.value = 1;
      applyFiltersAndPagination();
    };
    
    const handleCurrentChange = (newPage) => {
      currentPage.value = newPage;
      applyFiltersAndPagination();
    };
    
    const handleSearch = () => {
      currentPage.value = 1;
      applyFiltersAndPagination();
    };
    
    const handleCreateInquiry = () => {
      inquiryForm.value = { ...initialFormState };
      isCreating.value = true;
      dialogTitle.value = '发起新询价';
      dialogVisible.value = true;
    };
    
    const handleViewDetails = (row) => {
      currentInquiry.value = JSON.parse(JSON.stringify(row));
      isCreating.value = false;
      dialogTitle.value = `询价单详情 (${row.id})`;
      dialogVisible.value = true;
    };
    
    const handleCancelInquiry = (row) => {
      ElMessageBox.confirm(`确定要取消询价单 ${row.id} 吗?`, '确认取消', { type: 'warning' })
        .then(() => {
          const index = tableData.value.findIndex(inq => inq.id === row.id);
          if (index !== -1 && tableData.value[index].status === 'inquiring') {
            tableData.value[index].status = 'cancelled';
            ElMessage.success('询价已取消');
            applyFiltersAndPagination();
          } else {
            ElMessage.error('操作失败或状态已不允许取消');
          }
        })
        .catch(() => ElMessage.info('取消操作'));
    };
    
    const handleAward = (quoteRow) => {
      if (!currentInquiry.value) return;
      const inquiry = currentInquiry.value;
      
      ElMessageBox.confirm(`确定将此询价授予供应商 ${quoteRow.supplierName} (${quoteRow.price?.toFixed(2)} USD) 吗?`, '确认授标', { type: 'success' })
        .then(() => {
          const index = tableData.value.findIndex(inq => inq.id === inquiry.id);
          if (index !== -1) {
            tableData.value[index].status = 'awarded';
            tableData.value[index].awardedSupplierId = quoteRow.supplierId;
            tableData.value[index].awardedSupplierName = quoteRow.supplierName;
            tableData.value[index].awardedPrice = quoteRow.price;
            
            currentInquiry.value.status = 'awarded';
            currentInquiry.value.awardedSupplierId = quoteRow.supplierId;
            currentInquiry.value.awardedSupplierName = quoteRow.supplierName;
            currentInquiry.value.awardedPrice = quoteRow.price;
            
            ElMessage.success('授标成功');
            applyFiltersAndPagination();
          } else {
            ElMessage.error('授标失败: 未找到询价单');
          }
        })
        .catch(() => ElMessage.info('取消授标'));
    };
    
    const handleSubmitInquiry = async () => {
      if (!inquiryFormRef.value) return;
      try {
        await inquiryFormRef.value.validate();
        const now = new Date();
        const newInquiry = {
          id: `INQ-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(Date.now()).slice(-4)}`,
          orderNumber: `ORD-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(Date.now()).slice(-4)}`,
          orderType: 'FBA', // 默认类型
          serviceDescription: inquiryForm.value.serviceDescription,
          initiator: '当前用户',
          createdAt: now.toLocaleString(),
          deadline: inquiryForm.value.deadline,
          supplierCount: inquiryForm.value.invitedSupplierIds.length,
          quoteCount: 0,
          status: 'inquiring',
          invitedSupplierIds: inquiryForm.value.invitedSupplierIds,
          quotes: [],
          awardedSupplierId: null,
          awardedSupplierName: null,
          awardedPrice: null,
          remarks: inquiryForm.value.remarks,
          subOrders: []
        };
        
        tableData.value.unshift(newInquiry);
        ElMessage.success('询价发起成功');
        dialogVisible.value = false;
        applyFiltersAndPagination();
      } catch (error) {
        console.log('表单验证失败:', error);
        ElMessage.error('请检查表单填写是否正确');
      }
    };
    
    const handleDialogClose = () => {
      inquiryForm.value = { ...initialFormState };
      currentInquiry.value = null;
      dialogVisible.value = false;
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
    
    // 应用视图配置
    const applyViewConfig = (viewId) => {
      const view = customViews.value.find(v => v.id === viewId);
      if (view) {
        // 应用列设置
        visibleColumns.value = tableColumns.value.filter(col => 
          view.columns.includes(col.prop)
        );
        
        // 应用筛选条件
        activeFilters.value = view.filters || [];
        filterLogic.value = view.filterLogic || 'and';
        
        // 应用分组设置
        groupSettings.value = view.groupSettings || {
          level1: '',
          level2: '',
          level3: ''
        };
        groupField.value = groupSettings.value.level1;
        
        // 应用排序设置
        sortSettings.value = view.sortSettings || [];
        
        // 重新应用筛选和分页
        applyFiltersAndPagination();
      }
    };
    
    const saveView = () => {
      if (!viewForm.value.name) {
        ElMessage.warning('请输入视图名称');
        return;
      }
      
      const newView = {
        id: Date.now().toString(),
        name: viewForm.value.name,
        columns: viewForm.value.columns,
        filters: activeFilters.value,
        filterLogic: filterLogic.value,
        groupSettings: groupSettings.value,
        sortSettings: sortSettings.value
      };
      
      customViews.value.push(newView);
      saveViewsToStorage();
      saveViewDialogVisible.value = false;
      ElMessage.success('视图保存成功');
    };
    
    const handleDeleteView = (view) => {
      ElMessageBox.confirm(`确定要删除视图 "${view.name}" 吗?`, '确认删除', { type: 'warning' })
        .then(() => {
          const index = customViews.value.findIndex(v => v.id === view.id);
          if (index !== -1) {
            customViews.value.splice(index, 1);
            saveViewsToStorage();
            ElMessage.success('视图删除成功');
          }
        })
        .catch(() => ElMessage.info('取消删除'));
    };
    
    const handleViewOptions = () => {
      viewOptionsDialogVisible.value = true;
    };
    
    const handleRenameView = (view) => {
      currentEditingView.value = view;
      renameForm.value.name = view.name;
      renameViewDialogVisible.value = true;
    };
    
    const saveRenameView = () => {
      if (!renameForm.value.name) {
        ElMessage.warning('请输入视图名称');
        return;
      }
      
      const view = currentEditingView.value;
      if (view) {
        view.name = renameForm.value.name;
        saveViewsToStorage();
        renameViewDialogVisible.value = false;
        ElMessage.success('视图重命名成功');
      }
    };
    
    const handleCopyView = (view) => {
      const newView = {
        id: Date.now().toString(),
        name: `${view.name} (副本)`,
        columns: [...view.columns],
        filters: [...view.filters],
        filterLogic: view.filterLogic,
        groupSettings: { ...view.groupSettings },
        sortSettings: [...view.sortSettings]
      };
      
      customViews.value.push(newView);
      saveViewsToStorage();
      ElMessage.success('视图复制成功');
    };
    
    // 分组相关方法
    const showGroupModal = () => {
      groupModalVisible.value = true;
    };
    
    const applyGroupSettings = () => {
      groupField.value = groupSettings.value.level1;
      applyFiltersAndPagination();
      groupModalVisible.value = false;
    };
    
    // 排序相关方法
    const showSortModal = () => {
      sortModalVisible.value = true;
    };
    
    const addSortField = () => {
      sortSettings.value.push({
        field: '',
        order: 'ascending'
      });
    };
    
    const removeSortField = (field) => {
      const index = sortSettings.value.findIndex(f => f === field);
      if (index !== -1) {
        sortSettings.value.splice(index, 1);
      }
    };
    
    const applySortSettings = () => {
      applyFiltersAndPagination();
      sortModalVisible.value = false;
    };
    
    // 列设置相关方法
    const showColumnSettings = () => {
      columnSettingsVisible.value = true;
    };
    
    const handleSelectAllColumns = (value) => {
      columnSettingsList.value.forEach(col => col.visible = value);
    };
    
    const resetColumnSettings = () => {
      columnSettingsList.value = [...defaultTableColumns];
    };
    
    const handleDragEnd = () => {
      // 可以在这里添加拖拽结束后的处理逻辑
    };
    
    const applyColumnSettings = () => {
      visibleColumns.value = columnSettingsList.value.filter(col => col.visible);
      applyFiltersAndPagination();
      columnSettingsVisible.value = false;
    };
    
    // 存储相关方法
    const saveViewsToStorage = () => {
      localStorage.setItem('inquiryViews', JSON.stringify(customViews.value));
    };
    
    const loadSavedViews = () => {
      const saved = localStorage.getItem('inquiryViews');
      if (saved) {
        try {
          customViews.value = JSON.parse(saved);
        } catch (error) {
          console.error('加载保存的视图失败:', error);
        }
      }
    };
    
    // 监听视图变化
    watch(selectedCustomView, (newView) => {
      if (newView) {
        currentView.value = newView;
        applyViewConfig(newView);
      }
    });
    
    // 视图管理方法
    const handleCreateView = () => {
      viewForm.value = {
        name: '',
        columns: tableColumns.value
          .filter(col => col.visible !== false)
          .map(col => col.prop),
        filters: activeFilters.value,
        filterLogic: filterLogic.value,
        groupSettings: groupSettings.value,
        sortSettings: sortSettings.value
      };
      saveViewDialogVisible.value = true;
    };

    const handleOperationCommand = (command, row) => {
      switch (command) {
        case 'viewQuotes':
          handleViewDetails(row);
          break;
        case 'cancelInquiry':
          handleCancelInquiry(row);
          break;
      }
    };
    
    // 在 setup 中添加新的响应式变量和方法
    const negotiateDialogVisible = ref(false);
    const negotiationHistoryDialogVisible = ref(false);
    const currentQuote = ref(null);
    const negotiateForm = ref({
      price: 0,
      remarks: ''
    });
    const negotiationHistory = ref([]);

    // 格式化服务类型
    const formatServiceType = (type) => {
      const typeMap = {
        'PICKUP': '提柜',
        'DELIVERY': '派送',
        'DIRECT': '直送'
      };
      return typeMap[type] || type;
    };

    // 处理议价相关的方法
    const handleQuoteCommand = (command, quote) => {
      currentQuote.value = quote;
      switch (command) {
        case 'negotiate':
          negotiateForm.value.price = quote.price;
          negotiateDialogVisible.value = true;
          break;
        case 'viewNegotiationHistory':
          loadNegotiationHistory(quote);
          break;
      }
    };

    const submitNegotiation = () => {
      if (!currentQuote.value) return;
      
      // 这里添加议价记录
      negotiationHistory.value.unshift({
        time: new Date().toLocaleString(),
        type: 'primary',
        title: '发起议价',
        content: negotiateForm.value.remarks,
        price: negotiateForm.value.price
      });

      // 更新报价
      currentQuote.value.price = negotiateForm.value.price;
      currentQuote.value.remarks = `${currentQuote.value.remarks || ''}\n[议价]${negotiateForm.value.remarks}`;
      
      negotiateDialogVisible.value = false;
      ElMessage.success('议价提交成功');
    };

    const loadNegotiationHistory = (quote) => {
      // 这里模拟加载议价记录，后续可以根据 quote.supplierId 或其他标识加载真实数据
      negotiationHistory.value = [
        {
          time: '2024-03-14 14:30:00',
          type: 'primary',
          title: '供应商回复',
          content: '考虑到运力安排，可以接受这个价格',
          price: quote.price
        },
        {
          time: '2024-03-14 14:00:00',
          type: 'warning',
          title: '发起议价',
          content: '希望能够优化一下价格',
          price: quote.price + 20
        },
        {
          time: '2024-03-14 10:00:00',
          type: 'info',
          title: '初始报价',
          content: '首次报价',
          price: quote.price + 40
        }
      ];
      negotiationHistoryDialogVisible.value = true;
    };

    // 邀请供应商报价
    const handleInviteSuppliers = () => {
      ElMessage.success('邀请供应商报价功能待实现');
    };
    
    // 初始化
    onMounted(() => {
      visibleColumns.value = tableColumns.value;
      loadSavedViews();
      fetchData();
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
      filterForm,
      createDateType,
      dateRange,
      searchType,
      searchText,
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
      
      // 分组相关
      groupModalVisible,
      groupSettings,
      hasGroupedData,
      
      // 排序相关
      sortModalVisible,
      sortSettings,
      sortableFields,
      
      // 列设置相关
      columnSettingsVisible,
      columnSettingsList,
      allColumnsSelected,
      
      // 弹窗相关
      dialogVisible,
      dialogTitle,
      isCreating,
      inquiryFormRef,
      currentInquiry,
      
      // 表单相关
      inquiryForm,
      formRules,
      
      // 模拟数据
      mockSuppliers,
      
      // 计算属性
      lowestPrice,
      isBestQuote,
      
      // 方法
      formatStatus,
      getStatusTagType,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      handleSearch,
      handleCreateInquiry,
      handleViewDetails,
      handleCancelInquiry,
      handleAward,
      handleSubmitInquiry,
      handleDialogClose,
      handleSaveView,
      saveView,
      handleDeleteView,
      handleViewOptions,
      handleRenameView,
      saveRenameView,
      handleCopyView,
      showGroupModal,
      applyGroupSettings,
      showSortModal,
      addSortField,
      removeSortField,
      applySortSettings,
      showColumnSettings,
      handleSelectAllColumns,
      resetColumnSettings,
      handleDragEnd,
      applyColumnSettings,
      applyViewConfig,
      handleCreateView,
      handleOperationCommand,
      formatServiceType,
      negotiateDialogVisible,
      negotiationHistoryDialogVisible,
      currentQuote,
      negotiateForm,
      negotiationHistory,
      handleQuoteCommand,
      submitNegotiation,
      handleInviteSuppliers
    };
  }
};
</script>

<style scoped>
.inquiry-list-container {
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

.view-select {
  width: 150px;
}

.table-container {
  flex: 1;
  position: relative;
  margin-bottom: 5px;
  overflow: visible;
  min-height: 450px;
}

.sub-table-container {
  padding: 20px;
  background-color: #f9f9f9;
  width: 100%;
  overflow: visible;
}

.sub-table-title {
  font-size: 16px;
  margin-bottom: 10px;
  color: #303133;
}

.sort-list {
  max-height: 400px;
  overflow-y: auto;
}

.sort-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.column-settings {
  max-height: 400px;
  overflow-y: auto;
}

.column-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.column-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.column-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.drag-handle {
  cursor: move;
}

.best-quote {
  color: #67C23A;
  font-weight: bold;
}

:deep(.el-table__expanded-cell) {
  padding: 20px;
}

:deep(.el-table__expanded-cell .el-table) {
  height: auto !important;
  max-height: none !important;
}

.quote-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.unit {
  margin-left: 8px;
}

.negotiation-price {
  color: #67C23A;
  font-weight: bold;
  margin-top: 8px;
}

:deep(.el-timeline-item__content h4) {
  color: #303133;
  margin: 0;
}

:deep(.el-descriptions) {
  margin: 16px 0;
}

:deep(.el-descriptions__cell) {
  padding: 12px 16px;
}
</style> 