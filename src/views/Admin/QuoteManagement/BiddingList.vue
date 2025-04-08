<template>
  <div class="bidding-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>竞价项目列表</span>
           <el-button type="primary" @click="handleCreateBidding">
             <el-icon><Plus /></el-icon> 创建新竞价项目
           </el-button>
        </div>
      </template>

      <!-- 筛选区域 -->
       <el-form :inline="true" :model="filterForm" class="filter-form">
         <el-form-item label="竞价状态">
           <el-select v-model="filterForm.status" placeholder="选择状态" clearable>
             <el-option label="准备中" value="preparing" />
             <el-option label="竞价中" value="bidding" />
             <el-option label="已结束 (待授标)" value="ended" />
             <el-option label="已授标" value="awarded" />
             <el-option label="已流标/取消" value="cancelled" />
           </el-select>
         </el-form-item>
          <el-form-item label="项目名称/编号">
           <el-input v-model="filterForm.name" placeholder="输入名称或编号" clearable />
         </el-form-item>
          <el-form-item label="创建时间">
           <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 竞价项目列表 -->
      <div class="view-management">
        <span class="view-label"></span>
        <el-radio-group v-model="currentView" size="small" class="status-view-group">
          <el-radio-button value="all">全部({{ filteredBiddingsData.length }})</el-radio-button>
          <el-radio-button value="preparing">准备中({{ getCountByStatus('preparing') }})</el-radio-button>
          <el-radio-button value="bidding">竞价中({{ getCountByStatus('bidding') }})</el-radio-button>
          <el-radio-button value="ended">已结束({{ getCountByStatus('ended') }})</el-radio-button>
          <el-radio-button value="awarded">已授标({{ getCountByStatus('awarded') }})</el-radio-button>
          <el-radio-button value="cancelled">已流标/取消({{ getCountByStatus('cancelled') }})</el-radio-button>
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
      <groupable-table
        ref="mainTable"
        :data="filteredBiddingList"
        row-key="id"
        :group-fields="groupField ? [groupField] : []"
        :show-selection="true"
        :show-group-column="!!groupField"
        :group-column-label="groupField ? getGroupColumnLabel(groupField) : '分组'"
        :default-expand-all="false"
        :show-pagination="true"
        :current-page="pagination.currentPage"
        :page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalBiddings"
        @selection-change="handleSelectionChange"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="width: 100%"
        border
      >
        <el-table-column 
          v-for="column in visibleColumns" 
          :key="column.prop" 
          :prop="column.prop" 
          :label="column.label" 
          :width="column.width"
          :sortable="column.sortable"
          :fixed="column.fixed"
          :show-overflow-tooltip="column.showOverflowTooltip !== false"
        >
          <template #default="scope" v-if="column.prop === 'status'">
               <el-tag :type="getStatusTagType(scope.row.status)">
                 {{ formatStatus(scope.row.status) }}
               </el-tag>
            </template>
          
          <template #default="scope" v-else-if="column.prop === 'currentLowestBid'">
            {{ scope.row.currentLowestBid ? scope.row.currentLowestBid.toFixed(2) : '-' }}
          </template>
          
          <template #default="scope" v-else-if="column.prop === 'operation'">
            <el-button text type="primary" size="small" @click="handleViewDetails(scope.row)">详情</el-button>
            <el-dropdown trigger="click" @command="(command) => handleOperationCommand(command, scope.row)">
              <el-button text type="primary" size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="monitor">监控</el-dropdown-item>
                  <el-dropdown-item command="endEarly" v-if="scope.row.status === 'bidding'">提前结束竞价</el-dropdown-item>
                  <el-dropdown-item command="cancel" v-if="scope.row.status === 'preparing' || scope.row.status === 'bidding'">取消项目</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </groupable-table>

      <!-- 替换分页组件，现在由GroupableTable处理 -->

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

      <!-- 创建新竞价 / 查看详情 / 监控 / 授标 弹窗 -->
       <el-dialog
         v-model="dialogVisible"
         :title="dialogTitle"
         width="80%"
         @close="handleDialogClose"
         :close-on-click-modal="false"
       >
         <!-- 创建竞价表单 -->
         <el-form
           v-if="isCreating"
           ref="biddingFormRef"
           :model="biddingForm"
           :rules="formRules"
           label-width="120px"
         >
           <el-row :gutter="20">
             <el-col :span="12">
               <el-form-item label="项目名称" prop="name">
                 <el-input v-model="biddingForm.name" placeholder="为竞价项目起个名字" />
               </el-form-item>
             </el-col>
              <el-col :span="12">
                 <el-form-item label="服务类型/线路" prop="serviceDescription">
                   <el-input v-model="biddingForm.serviceDescription" placeholder="如：LAX-ONT8 提柜服务 (未来一个月)" />
                 </el-form-item>
               </el-col>
           </el-row>
            <el-form-item label="详细需求描述" prop="details">
             <el-input v-model="biddingForm.details" type="textarea" :rows="3" placeholder="详细描述服务要求、数量、时间范围等" />
           </el-form-item>
           <el-row :gutter="20">
             <el-col :span="8">
               <el-form-item label="开始时间" prop="startTime">
                 <el-date-picker v-model="biddingForm.startTime" type="datetime" placeholder="选择竞价开始时间" style="width: 100%;" value-format="YYYY-MM-DD HH:mm:ss"/>
               </el-form-item>
             </el-col>
              <el-col :span="8">
               <el-form-item label="结束时间" prop="endTime">
                 <el-date-picker v-model="biddingForm.endTime" type="datetime" placeholder="选择竞价结束时间" style="width: 100%;" value-format="YYYY-MM-DD HH:mm:ss"/>
               </el-form-item>
             </el-col>
             <el-col :span="8">
                 <el-form-item label="起始价格 (USD)">
                   <el-input-number v-model="biddingForm.startPrice" :precision="2" :step="10" placeholder="可选" style="width: 100%;"/>
                 </el-form-item>
               </el-col>
           </el-row>
             <el-row :gutter="20">
              <el-col :span="12">
                 <el-form-item label="邀请供应商" prop="invitedSupplierIds">
                   <el-select v-model="biddingForm.invitedSupplierIds" multiple filterable placeholder="选择参与竞价的供应商" style="width: 100%;">
                      <el-option v-for="supplier in mockSuppliers" :key="supplier.id" :label="supplier.name" :value="supplier.id" />
                   </el-select>
                 </el-form-item>
               </el-col>
                <el-col :span="12">
                 <el-form-item label="竞价规则 (占位)">
                    <el-text>例如：最低价中标，允许多次出价，显示排名等 (待实现)</el-text>
                 </el-form-item>
               </el-col>
           </el-row>
         </el-form>

         <!-- 查看详情与监控 -->
         <div v-else>
           <h4>竞价项目信息</h4>
            <el-row :gutter="20">
                <el-col :span="8"><p><strong>项目编号:</strong> {{ currentBidding?.id }}</p></el-col>
                <el-col :span="16"><p><strong>项目名称:</strong> {{ currentBidding?.name }}</p></el-col>
            </el-row>
             <el-row :gutter="20">
                <el-col :span="8"><p><strong>开始时间:</strong> {{ currentBidding?.startTime }}</p></el-col>
                <el-col :span="8"><p><strong>结束时间:</strong> {{ currentBidding?.endTime }}</p></el-col>
                <el-col :span="8"><p><strong>状态:</strong> {{ formatStatus(currentBidding?.status) }}</p></el-col>
            </el-row>
            <p><strong>服务需求:</strong> {{ currentBidding?.serviceDescription }}</p>
            <p><strong>详细描述:</strong> {{ currentBidding?.details }}</p>
             <p v-if="currentBidding?.awardedSupplierId"><strong>中标供应商:</strong> {{ currentBidding?.awardedSupplierName }} (最终价: {{ currentBidding?.awardedPrice?.toFixed(2) }} USD)</p>

           <el-divider />
           <h4>供应商出价监控 (模拟)</h4>
            <el-alert v-if="currentBidding?.status === 'bidding'" title="竞价进行中... (模拟数据每 5 秒刷新一次)" type="info" show-icon :closable="false" />
           <el-table :data="currentBidding?.bids" style="width: 100%; margin-top: 10px;" border size="small">
              <el-table-column type="index" label="排名" width="60" align="center" />
              <el-table-column prop="supplierName" label="供应商" width="200" show-overflow-tooltip />
              <el-table-column prop="bidPrice" label="当前出价 (USD)" width="150" sortable>
                  <template #default="scope">
                     <span :class="{ 'best-bid': scope.$index === 0 }">
                       {{ scope.row.bidPrice?.toFixed(2) }}
                     </span>
                  </template>
              </el-table-column>
              <el-table-column prop="bidTime" label="最后出价时间" width="160" />
              <el-table-column prop="bidCount" label="出价次数" width="100" align="center" />
              <el-table-column label="供应商评分" width="100" align="center">
                <template #default="scope">
                  <span :class="getRatingClass(scope.row.rating)">
                    {{ scope.row.rating }}分
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="remarks" label="备注" minWidth="200" show-overflow-tooltip>
                <template #default="scope">
                  <el-input
                    v-model="scope.row.remarks"
                    type="textarea"
                    :rows="1"
                    placeholder="添加备注"
                    @change="handleBidRemarkChange(scope.row)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                 <template #default="scope">
                    <el-button 
                       text 
                       type="success" 
                       size="small" 
                       @click="handleAward(scope.row)"
                       v-if="currentBidding?.status === 'ended'" 
                    >授标</el-button>
                    <el-tag type="success" v-if="currentBidding?.status === 'awarded' && currentBidding?.awardedSupplierId === scope.row.supplierId">已中标</el-tag>
                 </template>
              </el-table-column>
           </el-table>
            <p v-if="!currentBidding?.bids || currentBidding?.bids.length === 0" style="text-align: center; color: #909399; margin-top: 10px;">暂无出价记录</p>
         </div>

         <template #footer>
           <span class="dialog-footer">
             <el-button @click="dialogVisible = false">{{ isCreating ? '取消' : '关闭' }}</el-button>
             <el-button type="primary" @click="handleSubmitBidding" v-if="isCreating">确认创建</el-button>
           </span>
         </template>
       </el-dialog>

      <!-- 提前结束竞标弹窗 -->
      <el-dialog
        title="提前结束竞标"
        v-model="endEarlyDialogVisible"
        width="80%"
        :close-on-click-modal="false"
      >
        <div v-if="currentBidding">
          <h4>竞价项目信息</h4>
          <el-row :gutter="20">
            <el-col :span="8"><p><strong>项目编号:</strong> {{ currentBidding.id }}</p></el-col>
            <el-col :span="16"><p><strong>项目名称:</strong> {{ currentBidding.name }}</p></el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8"><p><strong>开始时间:</strong> {{ currentBidding.startTime }}</p></el-col>
            <el-col :span="8"><p><strong>结束时间:</strong> {{ currentBidding.endTime }}</p></el-col>
            <el-col :span="8"><p><strong>状态:</strong> {{ formatStatus(currentBidding.status) }}</p></el-col>
          </el-row>
          <p><strong>服务需求:</strong> {{ currentBidding.serviceDescription }}</p>
          <p><strong>详细描述:</strong> {{ currentBidding.details }}</p>

          <el-divider />
          <h4>供应商出价列表</h4>
          <el-table :data="currentBidding.bids" style="width: 100%; margin-top: 10px;" border size="small">
            <el-table-column type="index" label="排名" width="60" align="center" />
            <el-table-column prop="supplierName" label="供应商" width="200" show-overflow-tooltip />
            <el-table-column prop="bidPrice" label="当前出价 (USD)" width="150" sortable>
              <template #default="scope">
                <span :class="{ 'best-bid': scope.$index === 0 }">
                  {{ scope.row.bidPrice?.toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="bidTime" label="最后出价时间" width="160" />
            <el-table-column prop="bidCount" label="出价次数" width="100" align="center" />
            <el-table-column prop="remarks" label="备注" minWidth="200" show-overflow-tooltip>
              <template #default="scope">
                <el-input
                  v-model="scope.row.remarks"
                  type="textarea"
                  :rows="1"
                  placeholder="添加备注"
                  @change="handleBidRemarkChange(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="scope">
                <el-button 
                  text 
                  type="success" 
                  size="small" 
                  @click="handleEndEarlyAward(scope.row)"
                >选择中标</el-button>
              </template>
            </el-table-column>
          </el-table>
          <p v-if="!currentBidding.bids || currentBidding.bids.length === 0" style="text-align: center; color: #909399; margin-top: 10px;">暂无出价记录</p>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="endEarlyDialogVisible = false">取消</el-button>
          </span>
        </template>
      </el-dialog>

    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, ArrowDown } from '@element-plus/icons-vue';
import { DArrowLeft } from '@element-plus/icons-vue';
import draggable from 'vuedraggable';
import FilterPanel from '@/components/logistics/FilterPanel.vue';
import GroupableTable from '@/components/logistics/GroupableTable.vue';

// --- 模拟数据 ---
const mockSuppliers = ref([
  { id: 'supplier_1', name: '测试供应商A' },
  { id: 'supplier_2', name: '测试供应商B' },
  { id: 'supplier_3', name: '测试供应商C' },
  { id: 'supplier_4', name: '测试供应商D' },
]);

const allBiddings = ref([]);
let biddingRefreshTimer = null;

const generateMockBiddings = (count = 20) => {
  const names = ['年度提柜服务竞标', 'Q3 旺季派送补充运力', '紧急线路竞价', '新仓库启用运输招标'];
  const services = ['LAX-ONT8 提柜', 'LGB-LAX9 提柜', 'ONT8-SBD1 派送', 'JFK-TEB9 提柜'];
  const statuses = ['preparing', 'bidding', 'ended', 'awarded', 'cancelled'];
  const mockData = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdAt = new Date(now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
    const startTime = new Date(createdAt.getTime() + (status === 'preparing' ? Math.random() * 5 * 24 * 60 * 60 * 1000 : -Math.random() * 3 * 24 * 60 * 60 * 1000)); // 准备中则未来开始，否则过去开始
    const endTime = new Date(startTime.getTime() + (Math.random() * 4 + 1) * 60 * 60 * 1000); // 持续 1-5 小时
    const invitedCount = Math.floor(Math.random() * (mockSuppliers.value.length -1)) + 2;
    const invitedSuppliers = [...mockSuppliers.value].sort(() => 0.5 - Math.random()).slice(0, invitedCount);
    
    let bids = [];
    let bidCount = 0;
    let currentLowestBid = null;
    let awardedSupplierId = null;
    let awardedSupplierName = null;
    let awardedPrice = null;

    if (status === 'bidding' || status === 'ended' || status === 'awarded') {
        // 模拟生成一些出价记录
        const bidderCount = Math.floor(Math.random() * invitedCount) + 1;
        const bidders = invitedSuppliers.slice(0, bidderCount);
        bids = bidders.map(sup => {
            const supplierBids = [];
            const bidTimes = Math.floor(Math.random() * 5) + 1; // 1-5 次出价
            let currentBid = 1000 + Math.random() * 1000; // 初始价格较高
            let lastBidTime = new Date(startTime.getTime() + Math.random() * (Math.min(endTime.getTime(), Date.now()) - startTime.getTime()));

            for(let j=0; j<bidTimes; j++){
                supplierBids.push({ price: currentBid, time: lastBidTime });
                currentBid -= Math.random() * 100; // 价格逐渐降低
                lastBidTime = new Date(lastBidTime.getTime() - Math.random() * 10 * 60 * 1000); // 时间往前推
            }
             supplierBids.sort((a,b)=> a.price - b.price); // 取最低价

            return {
                supplierId: sup.id,
                supplierName: sup.name,
                bidPrice: Math.max(100, supplierBids[0].price), // 最低出价
                bidTime: supplierBids[0].time.toLocaleString(),
                bidCount: bidTimes,
                remarks: Math.random() > 0.8 ? `供应商${sup.name}的竞价备注...` : '', // 添加随机备注
                rating: Math.floor(Math.random() * 40) + 60, // 生成60-100之间的随机分数
            };
        });
        bids.sort((a, b) => a.bidPrice - b.bidPrice); // 按最终出价排序
        bidCount = bids.reduce((sum, b) => sum + b.bidCount, 0);
        if (bids.length > 0) currentLowestBid = bids[0].bidPrice;
    }

     if (status === 'awarded' && bids.length > 0) {
        const awardedBid = bids[0]; // 假设授予最低价
        awardedSupplierId = awardedBid.supplierId;
        awardedSupplierName = awardedBid.supplierName;
        awardedPrice = awardedBid.bidPrice;
    }

    mockData.push({
      id: `BID-${String(createdAt.getFullYear()).slice(2)}${String(i + 1000).slice(1)}`,
      name: `${names[Math.floor(Math.random() * names.length)]} #${i+1}`,
      serviceDescription: services[Math.floor(Math.random() * services.length)],
      details: `详细需求描述 ${i+1}...`, // 简化
      startTime: startTime.toLocaleString(),
      endTime: endTime.toLocaleString(),
      startPrice: Math.random() > 0.5 ? parseFloat((1500 + Math.random() * 500).toFixed(2)) : null,
      invitedSupplierIds: invitedSuppliers.map(s => s.id),
      invitedCount: invitedCount,
      status: status,
      remarks: Math.random() > 0.7 ? `项目备注 ${i+1}...` : '', // 添加随机备注
      bids: bids,
      bidCount: bidCount,
      currentLowestBid: currentLowestBid,
      awardedSupplierId: awardedSupplierId,
      awardedSupplierName: awardedSupplierName,
      awardedPrice: awardedPrice,
    });
  }
  return mockData;
};

// --- 选项数据 ---
const statusOptions = {
  preparing: { label: '准备中', tag: 'info' },
  bidding: { label: '竞价中', tag: 'primary' },
  ended: { label: '已结束 (待授标)', tag: 'warning' },
  awarded: { label: '已授标', tag: 'success' },
  cancelled: { label: '已流标/取消', tag: 'danger' },
};

// --- 表格列定义 ---
const defaultTableColumns = [
  { prop: 'id', label: '项目编号', width: 150, sortable: true },
  { prop: 'name', label: '项目名称', minWidth: 200, showOverflowTooltip: true, sortable: true },
  { prop: 'startTime', label: '开始时间', width: 160, sortable: true },
  { prop: 'endTime', label: '结束时间', width: 160, sortable: true },
  { prop: 'invitedCount', label: '受邀供应商数', width: 130, align: 'center', sortable: true },
  { prop: 'bidCount', label: '出价次数', width: 110, align: 'center', sortable: true },
  { prop: 'currentLowestBid', label: '当前最低价 (USD)', width: 160, sortable: true },
  { prop: 'remarks', label: '备注', width: 200, showOverflowTooltip: true },
  { prop: 'status', label: '状态', width: 150, sortable: true },
  { prop: 'operation', label: '操作', fixed: 'right', width: 280 },
];

// --- 视图与表格状态 ---
const tableColumns = ref([...defaultTableColumns]);
const visibleColumns = ref([...defaultTableColumns]);
const selectedRows = ref([]);
const currentView = ref('all');
const customViews = ref([]);
const saveViewDialogVisible = ref(false);
const viewOptionsDialogVisible = ref(false);
const renameViewDialogVisible = ref(false);
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const groupField = ref('');
const viewForm = ref({
  name: '',
  columns: []
});
const currentEditingView = ref(null);
const renameForm = ref({
  name: ''
});

// --- 筛选相关 ---
const filterPanelVisible = ref(false);
const activeFilters = ref([]);
const filterLogic = ref('and');

// --- 分组相关 ---
const groupModalVisible = ref(false);
const groupSettings = ref({
  level1: '',
  level2: '',
  level3: ''
});
const groupableFields = computed(() => {
  return tableColumns.value.filter(col => 
    col.prop !== 'operation' && 
    !['id'].includes(col.prop)
  );
});

// --- 排序相关 ---
const sortModalVisible = ref(false);
const sortSettings = ref([{ field: '', direction: 'desc' }]);
const sortableFields = computed(() => {
  return tableColumns.value.filter(col => col.sortable && col.prop !== 'operation');
});

// --- 字段配置相关 ---
const columnSettingsVisible = ref(false);
const columnSettingsList = ref([]);
const allColumnsSelected = ref(true);

// 按状态统计数量
const getCountByStatus = (status) => {
  return allBiddings.value.filter(item => item.status === status).length;
};

// --- 分组与视图相关方法 ---
// 获取分组列字段名称
const getGroupColumnLabel = (field) => {
  const column = tableColumns.value.find(col => col.prop === field);
  return column ? `按${column.label}分组` : '分组';
};

// 显示筛选面板
const showFilterPanel = () => {
  filterPanelVisible.value = true;
};

// 应用筛选
const applyFilters = (filterData) => {
  activeFilters.value = filterData.filters;
  filterLogic.value = filterData.logic;
  applyCustomFilters();
};

// 取消筛选
const cancelFilters = () => {
  // 可以不做任何操作，或重置筛选
};

// 应用自定义筛选
const applyCustomFilters = () => {
  // 这里应用自定义筛选逻辑，修改filteredBiddingsData的计算方式
  // 为简化，我们会在computed中直接使用activeFilters
};

// 显示分组设置弹窗
const showGroupModal = () => {
  groupModalVisible.value = true;
};

// 清除分组设置
const clearGroupSettings = () => {
  groupSettings.value = {
    level1: '',
    level2: '',
    level3: ''
  };
  groupField.value = '';
};

// 应用分组设置
const applyGroupSettings = () => {
  if (groupSettings.value.level1) {
    groupField.value = groupSettings.value.level1;
  } else {
    groupField.value = '';
  }
  groupModalVisible.value = false;
};

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
    sortSettings.value = [{ field: '', direction: 'asc' }];
  }
};

// 清除排序设置
const clearSortSettings = () => {
  sortSettings.value = [{ field: '', direction: 'asc' }];
};

// 应用排序设置
const applySortSettings = () => {
  // 实现排序逻辑
  const validSortSettings = sortSettings.value.filter(sort => sort.field);
  if (validSortSettings.length > 0) {
    // 按照排序设置对数据进行排序
    // 为简单起见，这里只应用第一个排序规则
    const { field, direction } = validSortSettings[0];
    allBiddings.value.sort((a, b) => {
      const fieldA = a[field];
      const fieldB = b[field];
      
      if (direction === 'asc') {
        return fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
      } else {
        return fieldA > fieldB ? -1 : fieldA < fieldB ? 1 : 0;
      }
    });
  }
  sortModalVisible.value = false;
};

// 显示字段配置
const showColumnSettings = () => {
  columnSettingsList.value = JSON.parse(JSON.stringify(tableColumns.value));
  allColumnsSelected.value = columnSettingsList.value.every(col => col.visible !== false);
  columnSettingsVisible.value = true;
};

// 全选/取消全选列
const handleSelectAllColumns = (val) => {
  columnSettingsList.value.forEach(col => {
    col.visible = val;
  });
};

// 重置列设置
const resetColumnSettings = () => {
  columnSettingsList.value = JSON.parse(JSON.stringify(defaultTableColumns));
  allColumnsSelected.value = true;
};

// 应用列设置
const applyColumnSettings = () => {
  tableColumns.value = columnSettingsList.value;
  visibleColumns.value = tableColumns.value.filter(col => col.visible !== false);
  columnSettingsVisible.value = false;
};

// 拖动列结束
const handleDragEnd = () => {
  // 拖动结束后的操作，可以更新列顺序
};

// 处理右键菜单
const handleContextMenu = (event, view) => {
  event.preventDefault();
  currentEditingView.value = view;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
  
  // 添加一个全局点击事件处理器，点击其他地方关闭菜单
  const closeContextMenu = () => {
    contextMenuVisible.value = false;
    document.removeEventListener('click', closeContextMenu);
  };
  setTimeout(() => {
    document.addEventListener('click', closeContextMenu);
  }, 0);
};

// 处理保存视图
const handleSaveView = () => {
  viewForm.value = {
    name: '',
    columns: tableColumns.value.filter(col => col.visible !== false).map(col => col.prop)
  };
  saveViewDialogVisible.value = true;
};

// 保存视图
const saveView = () => {
  if (!viewForm.value.name.trim()) {
    ElMessage.warning('请输入视图名称');
    return;
  }
  
  const viewId = 'view_' + Date.now();
  const newView = {
    id: viewId,
    name: viewForm.value.name,
    columns: viewForm.value.columns,
    filters: JSON.parse(JSON.stringify(activeFilters.value)),
    filterLogic: filterLogic.value,
    groupField: groupField.value
  };
  
  customViews.value.push(newView);
  currentView.value = viewId;
  saveViewDialogVisible.value = false;
  
  ElMessage.success('视图保存成功');
};

// 重命名视图
const handleRenameView = () => {
  if (!currentEditingView.value) return;
  
  renameForm.value.name = currentEditingView.value.name;
  renameViewDialogVisible.value = true;
  viewOptionsDialogVisible.value = false;
};

// 保存重命名
const saveRenameView = () => {
  if (!renameForm.value.name.trim()) {
    ElMessage.warning('请输入视图名称');
    return;
  }
  
  const index = customViews.value.findIndex(v => v.id === currentEditingView.value.id);
  if (index !== -1) {
    customViews.value[index].name = renameForm.value.name;
    ElMessage.success('视图重命名成功');
  }
  
  renameViewDialogVisible.value = false;
};

// 复制视图
const handleCopyView = () => {
  if (!currentEditingView.value) return;
  
  const viewId = 'view_' + Date.now();
  const newView = JSON.parse(JSON.stringify(currentEditingView.value));
  newView.id = viewId;
  newView.name = `${newView.name} (复制)`;
  
  customViews.value.push(newView);
  currentView.value = viewId;
  viewOptionsDialogVisible.value = false;
  
  ElMessage.success('视图复制成功');
};

// 删除视图
const handleDeleteView = () => {
  if (!currentEditingView.value) return;
  
  ElMessageBox.confirm(
    `确定要删除视图"${currentEditingView.value.name}"吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = customViews.value.findIndex(v => v.id === currentEditingView.value.id);
    if (index !== -1) {
      customViews.value.splice(index, 1);
      
      if (currentView.value === currentEditingView.value.id) {
        currentView.value = 'all';
      }
      
      ElMessage.success('视图删除成功');
    }
    
    viewOptionsDialogVisible.value = false;
  }).catch(() => {
    // 取消删除
  });
};

// --- 表格行选择 ---
const handleSelectionChange = (selection) => {
  selectedRows.value = selection;
};

// --- 重新计算数据过滤逻辑 ---
const filteredBiddingsData = computed(() => {
  let filtered = allBiddings.value;
  
  // 1. 应用当前视图筛选
  if (currentView.value !== 'all' && !currentView.value.startsWith('view_')) {
    filtered = filtered.filter(b => b.status === currentView.value);
  } else if (currentView.value.startsWith('view_')) {
    // 应用自定义视图
    const view = customViews.value.find(v => v.id === currentView.value);
    if (view) {
      // 应用视图的过滤条件
      if (view.filters && view.filters.length > 0) {
        filtered = filtered.filter(item => {
          const results = view.filters.map(filter => {
            const { field, operator, value } = filter;
            const itemValue = item[field];
            
            switch (operator) {
              case 'eq': return itemValue === value;
              case 'neq': return itemValue !== value;
              case 'contains': return String(itemValue).includes(value);
              case 'notContains': return !String(itemValue).includes(value);
              case 'startsWith': return String(itemValue).startsWith(value);
              case 'endsWith': return String(itemValue).endsWith(value);
              case 'gt': return itemValue > value;
              case 'gte': return itemValue >= value;
              case 'lt': return itemValue < value;
              case 'lte': return itemValue <= value;
              case 'in': return Array.isArray(value) ? value.includes(itemValue) : false;
              case 'notIn': return Array.isArray(value) ? !value.includes(itemValue) : true;
              default: return true;
            }
          });
          
          return view.filterLogic === 'and' 
            ? results.every(r => r) 
            : results.some(r => r);
        });
      }
      
      // 不在计算属性中设置groupField的值，而是通过监听器来处理
    }
  }
  
  // 2. 应用表单筛选
  filtered = filtered.filter(b => {
    const statusMatch = filterForm.status ? b.status === filterForm.status : true;
    const nameMatch = filterForm.name ? (b.name.includes(filterForm.name) || b.id.includes(filterForm.name)) : true;
    const dateMatch = filterForm.dateRange && filterForm.dateRange.length === 2
      ? (new Date(b.startTime.split(' ')[0]) >= new Date(filterForm.dateRange[0]) && new Date(b.startTime.split(' ')[0]) <= new Date(filterForm.dateRange[1]))
      : true;
    return statusMatch && nameMatch && dateMatch;
  });
  
  // 3. 应用高级筛选
  if (activeFilters.value && activeFilters.value.length > 0) {
    filtered = filtered.filter(item => {
      const results = activeFilters.value.map(filter => {
        const { field, operator, value } = filter;
        const itemValue = item[field];
        
        switch (operator) {
          case 'eq': return itemValue === value;
          case 'neq': return itemValue !== value;
          case 'contains': return String(itemValue).includes(value);
          case 'notContains': return !String(itemValue).includes(value);
          case 'startsWith': return String(itemValue).startsWith(value);
          case 'endsWith': return String(itemValue).endsWith(value);
          case 'gt': return itemValue > value;
          case 'gte': return itemValue >= value;
          case 'lt': return itemValue < value;
          case 'lte': return itemValue <= value;
          case 'in': return Array.isArray(value) ? value.includes(itemValue) : false;
          case 'notIn': return Array.isArray(value) ? !value.includes(itemValue) : true;
          default: return true;
        }
      });
      
      return filterLogic.value === 'and' 
        ? results.every(r => r) 
        : results.some(r => r);
    });
  }
  
  return filtered;
});

// 添加对currentView的监听，当视图改变时设置对应的分组字段
watch(currentView, (newValue) => {
  if (newValue.startsWith('view_')) {
    const view = customViews.value.find(v => v.id === newValue);
    if (view && view.groupField) {
      groupField.value = view.groupField;
    }
  }
}, { immediate: true });

// --- 生命周期钩子 ---
onMounted(() => {
  allBiddings.value = generateMockBiddings();
  
  // 初始化表格列设置
  visibleColumns.value = tableColumns.value.filter(col => col.visible !== false);
});

onUnmounted(() => {
    stopBiddingMonitor(); // 组件销毁时停止刷新
});

// --- 筛选与分页 ---
const filterForm = reactive({
  status: '',
  name: '',
  dateRange: [],
});

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
});

const totalBiddings = computed(() => filteredBiddingsData.value.length);

// 分页逻辑
const filteredBiddingList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  // 应用我们的排序、分组处理逻辑
  let results = [...filteredBiddingsData.value];
  
  // 按开始时间降序排序（默认排序）
  return results.slice(start, end);
});

// --- 弹窗与表单 ---
const dialogVisible = ref(false);
const endEarlyDialogVisible = ref(false);
const dialogTitle = ref('');
const isCreating = ref(false);
const biddingFormRef = ref(null);
const currentBidding = ref(null);

// 新竞价表单模型
const initialFormState = {
  name: '',
  serviceDescription: '',
  details: '',
  startTime: '',
  endTime: '',
  startPrice: null,
  invitedSupplierIds: [],
};
const biddingForm = reactive({ ...initialFormState });

// 表单验证规则
const formRules = reactive({
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  serviceDescription: [{ required: true, message: '请输入服务类型/线路', trigger: 'blur' }],
  details: [{ required: true, message: '请输入详细需求描述', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  invitedSupplierIds: [{ required: true, type: 'array', message: '请至少邀请一个供应商', trigger: 'change' }],
});

// --- 方法 ---
// 格式化
const formatStatus = (status) => statusOptions[status]?.label || status;
const getStatusTagType = (status) => statusOptions[status]?.tag || 'info';

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
};

// 创建新竞价项目
const handleCreateBidding = () => {
  resetForm();
  isCreating.value = true;
  dialogTitle.value = '创建新竞价项目';
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  Object.assign(biddingForm, initialFormState);
  nextTick(() => {
    biddingFormRef.value?.clearValidate();
  });
};

// 查看详情与监控
const handleViewDetails = (row) => {
  currentBidding.value = JSON.parse(JSON.stringify(row)); // 深拷贝
  isCreating.value = false;
  dialogTitle.value = `竞价详情 (${row.id})`;
  dialogVisible.value = true;
  startBiddingMonitor(); // 如果竞价中，开始模拟刷新
};

// 取消项目 (模拟)
const handleCancelBidding = (row) => {
   ElMessageBox.confirm(`确定要取消竞价项目 ${row.name} (${row.id}) 吗?`, '确认取消', { type: 'warning' })
     .then(() => {
       console.log('取消竞价项目:', row.id);
       const index = allBiddings.value.findIndex(b => b.id === row.id);
       if (index !== -1 && (allBiddings.value[index].status === 'preparing' || allBiddings.value[index].status === 'bidding')) {
         allBiddings.value[index].status = 'cancelled';
         ElMessage.success('竞价项目已取消');
       } else {
           ElMessage.error('操作失败或状态已不允许取消');
       }
     })
     .catch(() => ElMessage.info('取消操作'));
};

// 授标 (模拟)
const handleAward = (bidRow) => {
    if (!currentBidding.value) return;
    const bidding = currentBidding.value;

     ElMessageBox.confirm(`确定将此项目授予供应商 ${bidRow.supplierName} (最终价: ${bidRow.bidPrice?.toFixed(2)} USD) 吗?`, '确认授标', { type: 'success' })
     .then(() => {
       console.log(`授标给: ${bidRow.supplierName} for bidding ${bidding.id}`);
        const index = allBiddings.value.findIndex(b => b.id === bidding.id);
        if (index !== -1 && allBiddings.value[index].status === 'ended') {
            allBiddings.value[index].status = 'awarded';
            allBiddings.value[index].awardedSupplierId = bidRow.supplierId;
            allBiddings.value[index].awardedSupplierName = bidRow.supplierName;
            allBiddings.value[index].awardedPrice = bidRow.bidPrice;

            // 更新弹窗内的数据
            currentBidding.value.status = 'awarded';
            currentBidding.value.awardedSupplierId = bidRow.supplierId;
            currentBidding.value.awardedSupplierName = bidRow.supplierName;
            currentBidding.value.awardedPrice = bidRow.bidPrice;

            ElMessage.success('授标成功');
        } else {
            ElMessage.error('授标失败: 状态不是"已结束"');
        }
     })
     .catch(() => ElMessage.info('取消授标'));
};

// 弹窗关闭
const handleDialogClose = () => {
  resetForm();
  currentBidding.value = null;
  stopBiddingMonitor(); // 关闭弹窗时停止刷新
  dialogVisible.value = false;
};

// 提交新竞价项目 (模拟)
const handleSubmitBidding = async () => {
  if (!biddingFormRef.value) return;
  try {
    await biddingFormRef.value.validate();
    const now = new Date();
    const newBidding = {
      id: `BID-${String(now.getFullYear()).slice(2)}${String(Date.now()).slice(-5)}`,
      name: biddingForm.name,
      serviceDescription: biddingForm.serviceDescription,
      details: biddingForm.details,
      startTime: biddingForm.startTime,
      endTime: biddingForm.endTime,
      startPrice: biddingForm.startPrice,
      invitedSupplierIds: biddingForm.invitedSupplierIds,
      invitedCount: biddingForm.invitedSupplierIds.length,
      status: 'preparing', // 初始状态为准备中
      bids: [],
      bidCount: 0,
      currentLowestBid: null,
      awardedSupplierId: null,
      awardedSupplierName: null,
      awardedPrice: null,
    };
    console.log('创建新竞价项目:', newBidding);
    allBiddings.value.unshift(newBidding);
    ElMessage.success('竞价项目创建成功，状态：准备中');
    dialogVisible.value = false;
  } catch (error) {
    console.log('表单验证失败:', error);
    ElMessage.error('请检查表单填写是否正确');
  }
};

// 模拟竞价监控刷新
const startBiddingMonitor = () => {
    stopBiddingMonitor(); // 先停止旧的
    if (currentBidding.value && currentBidding.value.status === 'bidding') {
        biddingRefreshTimer = setInterval(() => {
            if (currentBidding.value && currentBidding.value.status === 'bidding') {
                console.log('模拟刷新竞价数据...');
                // 简单模拟：随机让一个供应商降低一点价格
                const bids = currentBidding.value.bids;
                if (bids && bids.length > 0) {
                    const bidderIndex = Math.floor(Math.random() * bids.length);
                    const bidder = bids[bidderIndex];
                    bidder.bidPrice = Math.max(100, bidder.bidPrice - Math.random() * 50);
                    bidder.bidCount += 1;
                    bidder.bidTime = new Date().toLocaleString();
                    // 重新排序
                    bids.sort((a, b) => a.bidPrice - b.bidPrice);
                    currentBidding.value.currentLowestBid = bids[0]?.bidPrice;
                    currentBidding.value.bidCount += 1;
                }
            }
        }, 5000); // 每 5 秒刷新一次
    }
};

const stopBiddingMonitor = () => {
    if (biddingRefreshTimer) {
        clearInterval(biddingRefreshTimer);
        biddingRefreshTimer = null;
    }
};

// 处理操作命令
const handleOperationCommand = (command, row) => {
  switch (command) {
    case 'monitor':
      handleViewDetails(row);
      break;
    case 'endEarly':
      handleEndEarlyBidding(row);
      break;
    case 'cancel':
      handleCancelBidding(row);
      break;
  }
};

// 提前结束竞价
const handleEndEarlyBidding = (row) => {
  currentBidding.value = JSON.parse(JSON.stringify(row)); // 深拷贝
  endEarlyDialogVisible.value = true;
};

// 提前结束并授标
const handleEndEarlyAward = (bidRow) => {
  ElMessageBox.confirm(
    `确定要提前结束竞价并授予供应商 ${bidRow.supplierName} (最终价: ${bidRow.bidPrice?.toFixed(2)} USD) 吗?`, 
    '确认提前结束并授标', 
    { type: 'warning' }
  ).then(() => {
    const index = allBiddings.value.findIndex(b => b.id === currentBidding.value.id);
    if (index !== -1 && allBiddings.value[index].status === 'bidding') {
      // 更新竞价状态
      allBiddings.value[index].status = 'awarded';
      allBiddings.value[index].endTime = new Date().toLocaleString();
      allBiddings.value[index].awardedSupplierId = bidRow.supplierId;
      allBiddings.value[index].awardedSupplierName = bidRow.supplierName;
      allBiddings.value[index].awardedPrice = bidRow.bidPrice;

      // 更新弹窗内的数据
      currentBidding.value.status = 'awarded';
      currentBidding.value.awardedSupplierId = bidRow.supplierId;
      currentBidding.value.awardedSupplierName = bidRow.supplierName;
      currentBidding.value.awardedPrice = bidRow.bidPrice;

      ElMessage.success('竞价项目已提前结束并授标');
      endEarlyDialogVisible.value = false;
    } else {
      ElMessage.error('操作失败或状态已不允许提前结束');
    }
  }).catch(() => ElMessage.info('取消操作'));
};

// 处理竞价备注变更
const handleBidRemarkChange = (bidRow) => {
  // 这里可以添加保存备注的逻辑
  console.log('更新竞价备注:', bidRow);
};

// 在 script setup 部分添加以下方法
const getRatingClass = (rating) => {
  if (rating >= 90) return 'rating-excellent';
  if (rating >= 80) return 'rating-good';
  if (rating >= 70) return 'rating-fair';
  return 'rating-poor';
};
</script>

<style scoped>
.bidding-list-container {
  padding: 20px;
}
.best-bid {
    color: #F56C6C; /* 红色 */
    font-weight: bold;
}

.supplier-rating {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.rating-count {
  color: #909399;
  font-size: 12px;
}

/* 其他样式与之前类似 */
.card-header, .dialog-footer, .filter-form, .el-table, .el-divider, h4 { /* 沿用之前样式 */
    /* ... */
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-form .el-form-item {
  margin-bottom: 10px;
}
.el-table {
  margin-top: 15px;
}
.dialog-footer button:first-child {
  margin-right: 10px;
}
.el-divider {
    margin: 15px 0;
}
h4 {
    margin-bottom: 10px;
}

/* 视图管理样式 */
.view-management {
  display: flex;
  align-items: center;
  padding: 10px 0;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.status-view-group {
  margin-right: auto;
  flex-wrap: wrap;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 9999;
  padding: 8px 0;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
}

.context-menu-item:hover {
  background-color: #f5f7fa;
}

/* 视图选项 */
.view-options-menu {
  padding: 10px 0;
}

.view-option-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
}

.view-option-item:hover {
  background-color: #f5f7fa;
}

.view-option-item i {
  margin-right: 10px;
}

/* 分组设置 */
.group-settings {
  padding: 20px 0;
}

.group-level {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.group-level-label {
  width: 100px;
  text-align: right;
  margin-right: 20px;
}

/* 排序设置 */
.sort-settings {
  padding: 20px 0;
}

.sort-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
}

.sort-actions {
  margin-top: 20px;
}

/* 列设置样式 */
.column-settings {
  padding: 10px 0;
}

.column-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.column-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
}

.column-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.column-item:last-child {
  border-bottom: none;
}

.drag-handle {
  cursor: move;
  margin-right: 10px;
  color: #909399;
}

.rating-excellent {
  background-color: #f0f9eb;
  color: #67c23a;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  display: inline-block;
  min-width: 60px;
  text-align: center;
}

.rating-good {
  background-color: #fdf6ec;
  color: #e6a23c;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  display: inline-block;
  min-width: 60px;
  text-align: center;
}

.rating-fair {
  background-color: #f4f4f5;
  color: #909399;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  display: inline-block;
  min-width: 60px;
  text-align: center;
}

.rating-poor {
  background-color: #fef0f0;
  color: #f56c6c;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  display: inline-block;
  min-width: 60px;
  text-align: center;
}

.rating-count {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}
</style> 