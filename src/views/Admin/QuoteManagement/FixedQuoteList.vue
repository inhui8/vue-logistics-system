<template>
  <div class="fixed-quote-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>固定报价列表 (待审核/已生效)</span>
          <div class="header-actions">
            <!-- 视图管理 -->
            <el-dropdown @command="handleViewCommand">
              <el-button type="primary" plain>
                视图管理
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="save">保存当前视图</el-dropdown-item>
                  <el-dropdown-item command="manage">管理视图</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            
            <!-- 批量操作 -->
            <el-dropdown @command="handleBatchCommand" :disabled="!selectedRows.length">
              <el-button type="primary" plain>
                批量操作
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="export">导出选中</el-dropdown-item>
                  <el-dropdown-item command="approve">批量通过</el-dropdown-item>
                  <el-dropdown-item command="reject">批量拒绝</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>

      <!-- 视图选择器 -->
      <div class="view-selector">
        <el-radio-group v-model="currentView" @change="handleViewChange">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="pending">待审核</el-radio-button>
          <el-radio-button label="approved">已通过</el-radio-button>
          <el-radio-button label="rejected">已拒绝</el-radio-button>
          <el-radio-button label="active">生效中</el-radio-button>
          <el-radio-button label="expired">已过期</el-radio-button>
          <el-select v-model="selectedCustomView" placeholder="自定义视图" clearable>
            <el-option
              v-for="view in customViews"
              :key="view.id"
              :label="view.name"
              :value="view.id"
            />
          </el-select>
        </el-radio-group>
      </div>

      <!-- 筛选区域 -->
      <el-form :inline="true" :model="filterForm" class="filter-form">
         <el-form-item label="供应商">
            <el-select v-model="filterForm.supplierId" placeholder="选择供应商" clearable filterable>
               <el-option
                 v-for="supplier in mockSuppliers" 
                 :key="supplier.id"
                 :label="supplier.name"
                 :value="supplier.id"
               />
            </el-select>
         </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" clearable>
             <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
          </el-select>
        </el-form-item>
         <el-form-item label="服务描述">
           <el-input v-model="filterForm.serviceDescription" placeholder="输入线路/服务关键字" clearable />
         </el-form-item>
         <el-form-item label="有效期">
           <el-date-picker
              v-model="filterForm.validityRange"
              type="daterange"
              range-separator="至"
              start-placeholder="生效开始"
              end-placeholder="生效结束"
              value-format="YYYY-MM-DD"
            />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="showAdvancedFilter">高级筛选</el-button>
          <el-button @click="showGroupModal">分组设置</el-button>
          <el-button @click="showSortModal">排序设置</el-button>
          <el-button @click="showColumnSettings">字段配置</el-button>
        </el-form-item>
      </el-form>

      <!-- 高级筛选对话框 -->
      <el-dialog v-model="advancedFilterVisible" title="高级筛选" width="800px">
        <div class="advanced-filter">
          <div class="filter-header">
            <el-radio-group v-model="filterLogic">
              <el-radio label="and">且</el-radio>
              <el-radio label="or">或</el-radio>
            </el-radio-group>
            <el-button type="primary" link @click="addFilter">添加条件</el-button>
          </div>
          
          <div class="filter-conditions">
            <div v-for="(filter, index) in activeFilters" :key="index" class="filter-item">
              <el-select v-model="filter.field" placeholder="选择字段" style="width: 150px">
                <el-option
                  v-for="field in filterableFields"
                  :key="field.prop"
                  :label="field.label"
                  :value="field.prop"
                />
              </el-select>
              
              <el-select v-model="filter.operator" placeholder="选择操作符" style="width: 120px">
                <el-option label="等于" value="eq" />
                <el-option label="不等于" value="ne" />
                <el-option label="包含" value="contains" />
                <el-option label="不包含" value="notContains" />
                <el-option label="大于" value="gt" />
                <el-option label="小于" value="lt" />
                <el-option label="大于等于" value="ge" />
                <el-option label="小于等于" value="le" />
                <el-option label="开始于" value="startWith" />
                <el-option label="结束于" value="endWith" />
              </el-select>
              
              <el-input v-model="filter.value" placeholder="输入值" style="width: 200px" />
              
              <el-button type="danger" link @click="removeFilter(index)">删除</el-button>
            </div>
          </div>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="advancedFilterVisible = false">取消</el-button>
            <el-button type="primary" @click="applyAdvancedFilter">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 分组设置对话框 -->
      <el-dialog v-model="groupModalVisible" title="分组设置" width="600px">
        <div class="group-settings">
          <div class="group-levels">
            <div class="group-level">
              <span class="level-label">一级分组：</span>
              <el-select v-model="groupSettings.level1" placeholder="选择分组字段" clearable>
                <el-option
                  v-for="field in groupableFields"
                  :key="field.prop"
                  :label="field.label"
                  :value="field.prop"
                />
              </el-select>
            </div>
            <div class="group-level">
              <span class="level-label">二级分组：</span>
              <el-select v-model="groupSettings.level2" placeholder="选择分组字段" clearable>
                <el-option
                  v-for="field in groupableFields"
                  :key="field.prop"
                  :label="field.label"
                  :value="field.prop"
                />
              </el-select>
            </div>
            <div class="group-level">
              <span class="level-label">三级分组：</span>
              <el-select v-model="groupSettings.level3" placeholder="选择分组字段" clearable>
                <el-option
                  v-for="field in groupableFields"
                  :key="field.prop"
                  :label="field.label"
                  :value="field.prop"
                />
              </el-select>
            </div>
          </div>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="clearGroupSettings">清除分组</el-button>
            <el-button type="primary" @click="applyGroupSettings">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 排序设置对话框 -->
      <el-dialog v-model="sortModalVisible" title="排序设置" width="600px">
        <div class="sort-settings">
          <div v-for="(sort, index) in sortSettings" :key="index" class="sort-item">
            <el-select v-model="sort.field" placeholder="选择排序字段" style="width: 200px">
              <el-option
                v-for="field in sortableFields"
                :key="field.prop"
                :label="field.label"
                :value="field.prop"
              />
            </el-select>
            
            <el-select v-model="sort.direction" placeholder="排序方向" style="width: 120px">
              <el-option label="升序" value="asc" />
              <el-option label="降序" value="desc" />
            </el-select>
            
            <el-button type="danger" link @click="removeSortField(index)">删除</el-button>
          </div>
          
          <el-button type="primary" link @click="addSortField">添加排序</el-button>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="clearSortSettings">清除排序</el-button>
            <el-button type="primary" @click="applySortSettings">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 字段配置对话框 -->
      <el-dialog v-model="columnSettingsVisible" title="字段配置" width="800px">
        <div class="column-settings">
          <div class="settings-header">
            <el-checkbox v-model="allColumnsSelected" @change="handleSelectAllColumns">
              全选/取消全选
            </el-checkbox>
            <el-button type="primary" link @click="resetColumnSettings">重置</el-button>
          </div>
          
          <draggable
            v-model="columnSettingsList"
            item-key="prop"
            handle=".drag-handle"
            @end="handleDragEnd"
          >
            <template #item="{ element }">
              <div class="column-item">
                <el-icon class="drag-handle"><rank /></el-icon>
                <el-checkbox v-model="element.visible">
                  {{ element.label }}
                </el-checkbox>
                <el-input-number
                  v-if="element.visible"
                  v-model="element.width"
                  :min="80"
                  :max="500"
                  size="small"
                  style="width: 100px"
                  placeholder="宽度"
                />
              </div>
            </template>
          </draggable>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="columnSettingsVisible = false">取消</el-button>
            <el-button type="primary" @click="applyColumnSettings">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 报价列表 -->
      <el-table 
        :data="filteredQuoteList" 
        style="width: 100%" 
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="supplierName" label="供应商" width="200" show-overflow-tooltip />
        <el-table-column prop="serviceDescription" label="服务/线路描述" minWidth="250" show-overflow-tooltip/>
        <el-table-column prop="quoteType" label="报价类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.quoteType === 'FBA' ? 'success' : 'warning'">
              {{ scope.row.quoteType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="serviceWarehouse" label="服务仓库" width="120">
          <template #default="scope">
            {{ scope.row.serviceWarehouse ? serviceWarehouseOptions.find(w => w.value === scope.row.serviceWarehouse).label : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="报价 (USD)" width="120">
           <template #default="scope">
             {{ scope.row.price ? scope.row.price.toFixed(2) : '-' }}
           </template>
        </el-table-column>
         <el-table-column prop="validFrom" label="生效开始日期" width="130" />
         <el-table-column prop="validTo" label="生效结束日期" width="130" />
         <el-table-column prop="submittedAt" label="提交时间" width="160" />
         <el-table-column prop="status" label="状态" width="120">
            <template #default="scope">
               <el-tag :type="getStatusTagType(scope.row.status)">
                 {{ formatStatus(scope.row.status) }}
               </el-tag>
            </template>
         </el-table-column>
         <el-table-column label="审批进度" width="150">
             <template #default="scope">
                <el-tooltip placement="top">
                   <template #content>
                      <div v-if="scope.row.approvalHistory && scope.row.approvalHistory.length > 0">
                        <div v-for="(item, index) in scope.row.approvalHistory" :key="index">
                            {{ item.timestamp }}: {{ item.approver }} {{ item.action }} {{ item.comment ? '- ' + item.comment : '' }}
                        </div>
                      </div>
                      <div v-else>暂无审批记录</div>
                   </template>
                   <span>{{ getCurrentApprovalStep(scope.row.status) }}</span>
                 </el-tooltip>
             </template>
         </el-table-column>
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="scope">
            <el-button text type="primary" size="small" @click="handleViewDetails(scope.row)">详情</el-button>
            <el-dropdown size="small" @command="command => handleCommand(command, scope.row)">
              <el-button text type="primary" size="small">
                更多<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
             <!-- 根据状态显示不同审批按钮 -->
             <template v-if="canApprove(scope.row, 'first_approve')">
                    <el-dropdown-item command="first_approve" divided>初审通过</el-dropdown-item>
                    <el-dropdown-item command="first_reject">初审拒绝</el-dropdown-item>
             </template>
             <template v-else-if="canApprove(scope.row, 'final_approve')">
                    <el-dropdown-item command="final_approve" divided>最终批准</el-dropdown-item>
                    <el-dropdown-item command="final_reject">最终拒绝</el-dropdown-item>
             </template>
                  <el-dropdown-item command="history">查看历史</el-dropdown-item>
                  <el-dropdown-item command="followUp">跟进记录</el-dropdown-item>
                  <el-dropdown-item command="memo">备注</el-dropdown-item>
                  <el-dropdown-item command="export">导出</el-dropdown-item>
                  <el-dropdown-item command="seeQuote">查看报价</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

       <!-- 分页 -->
      <el-pagination
         style="margin-top: 20px; justify-content: flex-end;"
         background
         layout="total, sizes, prev, pager, next, jumper"
         :total="totalQuotes"
         :page-sizes="[10, 20, 50, 100]"
         :page-size="pagination.pageSize"
         :current-page="pagination.currentPage"
         @size-change="handleSizeChange"
         @current-change="handleCurrentChange"
       />

       <!-- 详情/审批意见弹窗 (复用或新建) -->
       <el-dialog
         v-model="detailDialogVisible"
         title="报价详情"
         width="80%"
         :close-on-click-modal="false"
       >
         <div v-if="currentQuote" class="quote-details">
           <el-descriptions :column="2" border>
             <el-descriptions-item label="供应商">{{ currentQuote.supplierName }}</el-descriptions-item>
             <el-descriptions-item label="服务描述">{{ currentQuote.serviceDescription }}</el-descriptions-item>
             <el-descriptions-item label="报价类型">{{ currentQuote.quoteType }}</el-descriptions-item>
             <el-descriptions-item label="服务仓库">
               {{ currentQuote.serviceWarehouse ? serviceWarehouseOptions.find(w => w.value === currentQuote.serviceWarehouse).label : '-' }}
             </el-descriptions-item>
             <el-descriptions-item label="价格">{{ currentQuote.price }} USD</el-descriptions-item>
             <el-descriptions-item label="有效期">{{ currentQuote.validFrom }} 至 {{ currentQuote.validTo }}</el-descriptions-item>
             <el-descriptions-item label="提交时间">{{ currentQuote.submittedAt }}</el-descriptions-item>
             <el-descriptions-item label="状态" :span="2">
               <el-tag :type="getStatusType(currentQuote.status)">
                 {{ formatStatus(currentQuote.status) }}
               </el-tag>
             </el-descriptions-item>
           </el-descriptions>

           <!-- FBA报价的仓库信息 -->
           <div v-if="currentQuote.quoteType === 'FBA' && currentQuote.warehouseQuotes" class="warehouse-details">
             <h3>仓库报价详情</h3>
             <el-table :data="currentQuote.warehouseQuotes" border style="width: 100%">
               <el-table-column prop="warehouseCode" label="仓库代码" width="120" />
               <el-table-column prop="warehouseName" label="仓库名称" width="180" />
               <el-table-column prop="state" label="州" width="100" />
               <el-table-column prop="zipcode" label="邮编" width="100" />
               <el-table-column prop="address" label="详细地址" />
               <el-table-column prop="price" label="价格" width="120">
                 <template #default="{ row }">
                   {{ row.price }} USD
                 </template>
               </el-table-column>
             </el-table>
             <div class="warehouse-summary" style="margin-top: 15px; text-align: right;">
               <span>平均价格：{{ (currentQuote.warehouseQuotes.reduce((sum, wq) => sum + wq.price, 0) / currentQuote.warehouseQuotes.length).toFixed(2) }} USD</span>
               <span style="margin-left: 20px;">仓库数量：{{ currentQuote.warehouseQuotes.length }}</span>
             </div>
           </div>

           <!-- 审批历史 -->
           <div class="approval-history" style="margin-top: 20px;">
             <h3>审批历史</h3>
             <el-timeline>
            <el-timeline-item 
                 v-for="(record, index) in currentQuote.approvalHistory"
              :key="index"
                 :timestamp="record.timestamp"
                 :type="record.approved ? 'success' : 'danger'"
               >
                 <h4>{{ record.approver }} - {{ record.action }}</h4>
                 <p>{{ record.approved ? '通过' : '拒绝' }}</p>
                 <p v-if="record.comment" style="color: #666;">备注：{{ record.comment }}</p>
             </el-timeline-item>
          </el-timeline>
           </div>
         </div>
         <template #footer>
           <div class="dialog-footer">
             <el-button @click="detailDialogVisible = false">关闭</el-button>
           </div>
         </template>
       </el-dialog>

       <!-- 保存视图对话框 -->
       <el-dialog v-model="saveViewDialogVisible" title="保存视图" width="500px">
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

       <!-- 管理视图对话框 -->
       <el-dialog v-model="viewOptionsDialogVisible" title="管理视图" width="600px">
         <div class="view-list">
           <el-table :data="customViews" style="width: 100%">
             <el-table-column prop="name" label="视图名称" />
             <el-table-column label="操作" width="200">
               <template #default="scope">
                 <el-button text type="primary" @click="handleViewOptions(scope.row, 'edit')">编辑</el-button>
                 <el-button text type="primary" @click="handleViewOptions(scope.row, 'copy')">复制</el-button>
                 <el-button text type="danger" @click="handleViewOptions(scope.row, 'delete')">删除</el-button>
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

       <!-- 跟进记录对话框 -->
       <el-dialog v-model="followUpDialogVisible" title="跟进记录" width="800px">
         <div class="follow-up-container">
           <div class="follow-up-form">
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
             <div class="form-footer">
               <el-button type="primary" @click="saveFollowUp">添加跟进</el-button>
             </div>
         </div>

           <div class="follow-up-history">
             <el-timeline>
               <el-timeline-item
                 v-for="(item, index) in followUpHistory"
                 :key="index"
                 :timestamp="item.timestamp"
                 :type="item.type"
               >
                 {{ item.content }}
               </el-timeline-item>
             </el-timeline>
           </div>
         </div>
       </el-dialog>

       <!-- 备注对话框 -->
       <el-dialog v-model="memoDialogVisible" title="备注" width="600px">
         <el-form :model="memoForm" label-width="80px">
           <el-form-item label="备注内容">
             <el-input
               v-model="memoForm.content"
               type="textarea"
               :rows="4"
               placeholder="请输入备注内容"
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

       <!-- 报价详情对话框 -->
       <el-dialog v-model="quoteDetailsDialogVisible" title="FBA报价详情" width="90%">
         <div v-if="currentQuoteDetails" class="quote-details">
           <el-descriptions :column="2" border>
             <el-descriptions-item label="供应商">{{ currentQuoteDetails.supplierName }}</el-descriptions-item>
             <el-descriptions-item label="报价类型">{{ currentQuoteDetails.quoteType }}</el-descriptions-item>
             <el-descriptions-item label="服务描述">{{ currentQuoteDetails.serviceDescription }}</el-descriptions-item>
             <el-descriptions-item label="服务仓库">
               {{ currentQuoteDetails.serviceWarehouse ? serviceWarehouseOptions.find(w => w.value === currentQuoteDetails.serviceWarehouse).label : '-' }}
             </el-descriptions-item>
             <el-descriptions-item label="生效日期">{{ currentQuoteDetails.validFrom }} 至 {{ currentQuoteDetails.validTo }}</el-descriptions-item>
           </el-descriptions>

           <div class="warehouse-quotes-table">
             <h3>仓库报价明细</h3>
             <el-table :data="currentQuoteDetails.warehouseQuotes" border style="width: 100%; margin-top: 15px;">
               <el-table-column prop="platformName" label="平台名称" width="120">
                 <template #default>Amazon</template>
               </el-table-column>
               <el-table-column prop="code" label="仓库代码" width="120" />
               <el-table-column prop="country" label="国家" width="100">
                 <template #default>US</template>
               </el-table-column>
               <el-table-column prop="state" label="省/州" width="100" />
               <el-table-column prop="city" label="城市" width="120" />
               <el-table-column prop="address" label="详细地址" min-width="250" show-overflow-tooltip />
               <el-table-column prop="zipcode" label="邮编" width="100" />
               <el-table-column prop="price" label="报价 (USD)" width="120">
                 <template #default="{ row }">
                   {{ row.price.toFixed(2) }}
                 </template>
               </el-table-column>
               <el-table-column prop="palletRules.maxHeight" label="打板规则" width="120">
                 <template #default="{ row }">
                   {{ row.palletRules.maxHeight }}
                 </template>
               </el-table-column>
             </el-table>
             
             <div class="quote-summary" style="margin-top: 15px; text-align: right;">
               <span>仓库数量：{{ currentQuoteDetails.warehouseQuotes.length }}</span>
               <span style="margin-left: 20px;">平均价格：{{ (currentQuoteDetails.warehouseQuotes.reduce((sum, wq) => sum + wq.price, 0) / currentQuoteDetails.warehouseQuotes.length).toFixed(2) }} USD</span>
             </div>
           </div>
         </div>
       </el-dialog>

    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown, Rank } from '@element-plus/icons-vue';
import draggable from 'vuedraggable';

// --- 模拟数据 ---
const mockSuppliers = ref([
  { id: 'supplier_1', name: '测试供应商A - 专做提框服务' },
  { id: 'supplier_2', name: '测试供应商B - FBA派送专家' },
  { id: 'supplier_3', name: '测试供应商C - 全能型选手' },
]);

const mockAmazonWarehouses = ref([
  { code: 'ONT9', name: 'Redlands', state: 'CA', city: 'Redlands', zipcode: '92374', address: '2125 W. San Bernardino Ave' },
  { code: 'HOU2', name: 'Houston', state: 'TX', city: 'Houston', zipcode: '77038', address: '10550 Ella Blvd.' },
  { code: 'HOU3', name: 'Brookshire', state: 'TX', city: 'Brookshire', zipcode: '77423', address: '31555 Highway 90 E' },
  { code: 'XUS8', name: 'Dallas', state: 'TX', city: 'Dallas', zipcode: '76155', address: '14900 Frye Rd.Fort Worth, Tarrant' },
  { code: 'FTW1', name: 'Dallas', state: 'TX', city: 'Dallas', zipcode: '75241', address: '33333 LBJ FWY' },
  { code: 'FTW2', name: 'Dallas', state: 'TX', city: 'Dallas', zipcode: '75261', address: '2701 West Bethel Road' },
  { code: 'RIC1', name: 'Petersburg', state: 'VA', city: 'Petersburg', zipcode: '23803', address: '5000 Commerce Way' },
  { code: 'RIC2', name: 'Chester', state: 'VA', city: 'Chester', zipcode: '23836', address: '1901 Meadowville Technology Parkway' },
  { code: 'RIC3', name: 'Richmond', state: 'VA', city: 'Richmond', zipcode: '23234-2207', address: '4949 Commerce Rd' },
  { code: 'BFI1', name: 'Sumner', state: 'WA', city: 'Sumner', zipcode: '98390', address: '1800 140th Ave.E Pierce County' },
  { code: 'BFI3', name: 'Dupont', state: 'WA', city: 'Dupont', zipcode: '98327', address: '2700 Center Drive Pierce County' },
  { code: 'XUSD', name: 'Stockton', state: 'CA', city: 'Stockton', zipcode: '95206', address: '1909 Zephyr St' },
  { code: 'BFI4', name: 'Kent', state: 'WA', city: 'Kent', zipcode: '98032', address: '21005 64th Ave S' },
  { code: 'BFI5', name: 'Kent', state: 'WA', city: 'Kent', zipcode: '98032', address: '20526 59th Place South, King County' },
  { code: 'PHX3', name: 'Phoenix', state: 'AZ', city: 'Phoenix', zipcode: '85043', address: '6835 West Buckeye Road' },
  { code: 'BFI7', name: 'Sumner', state: 'WA', city: 'Sumner', zipcode: '98390', address: '1901 140th Ave E' },
  { code: 'SEA6', name: 'Seattle', state: 'WA', city: 'Seattle', zipcode: '98144', address: '2646 Rainier Ave.South King Coun' },
  { code: 'SEA8', name: 'Bellevue', state: 'WA', city: 'Bellevue', zipcode: '98005', address: '1227 124th Avenue Northeast' },
  { code: 'MKE1', name: 'Kenosha', state: 'WI', city: 'Kenosha', zipcode: '53144', address: '3501 120th Avenue' },
  { code: 'ATL6', name: 'East Point', state: 'GA', city: 'East Point', zipcode: '30344', address: '4200 North Commerce' },
  { code: 'MGE3', name: 'Jefferson', state: 'GA', city: 'Jefferson', zipcode: '30549', address: '808 Hog Mountain Road' },
  { code: 'MDW2', name: 'Joliet', state: 'IL', city: 'Joliet', zipcode: '60433', address: '250 Emerald Drive' },
  { code: 'MDW6', name: 'Romeoville', state: 'IL', city: 'ROMEOVILLE', zipcode: '60446', address: '1125 W REMINGTON BLVD' },
  { code: 'SNA4', name: 'Rialto', state: 'CA', city: 'Rialto', zipcode: '92376', address: '2496 W Walnut Ave' },
  { code: 'MDW7', name: 'Monee', state: 'IL', city: 'Monee', zipcode: '60449', address: '6605 Monee Manhattan Road' },
  { code: 'MDW8', name: 'Waukegan', state: 'IL', city: 'Waukegan', zipcode: '60085', address: '1750 Bridge Drive' },
  { code: 'MDW9', name: 'Aurora', state: 'IL', city: 'Aurora', zipcode: '60502', address: '2865 Duke Parkway' }
]);

const allQuotes = ref([]);

const generatePalletRules = (warehouseCode) => {
  const heightRules = ['72inch', '80inch', '96inch', '不限高'];
  // 根据仓库代码分配固定的高度规则，这样每次生成的规则都是一样的
  const index = warehouseCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % heightRules.length;
  return {
    warehouseCode,
    maxHeight: heightRules[index]
  };
};

const generateMockQuotes = (count = 50) => {
  const services = [
    'LAX 港 - FBA 仓库提柜', 
    'LGB 港 - FBA 仓库提柜', 
    'NY/NJ 港 - FBA 仓库提柜',
  ];
  const quoteTypes = ['FBA', 'FBX'];
  const statuses = ['pending', 'first_approved', 'final_approved', 'rejected', 'active', 'expired'];
  const mockData = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const supplier = mockSuppliers.value[Math.floor(Math.random() * mockSuppliers.value.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const quoteType = quoteTypes[Math.floor(Math.random() * quoteTypes.length)];
    const submittedAt = new Date(now - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000));
    const validFrom = new Date(submittedAt.getTime() + Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000));
    const validTo = new Date(validFrom.getFullYear() + 1, validFrom.getMonth(), validFrom.getDate());

    // 生成审批历史
    let approvalHistory = [];
    if (status === 'first_approved' || status === 'final_approved' || status === 'rejected') {
        approvalHistory.push({ 
            timestamp: new Date(submittedAt.getTime() + 1 * 24 * 60 * 60 * 1000).toLocaleString(), 
            approver: '审批员 L1', 
            action: '初审', 
        approved: status !== 'rejected' || Math.random() > 0.5,
            comment: status === 'rejected' && Math.random() < 0.5 ? '价格偏高' : ''
        });
    }
    if (status === 'final_approved' || (status === 'rejected' && approvalHistory[0]?.approved)) {
         approvalHistory.push({ 
            timestamp: new Date(submittedAt.getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleString(), 
            approver: '审批经理 L2', 
            action: '终审', 
            approved: status === 'final_approved',
            comment: status === 'rejected' ? '市场价格已变动' : ''
        });
    }

    // 如果是FBA报价，生成所有仓库的报价信息
    let warehouseQuotes = [];
    if (quoteType === 'FBA') {
      warehouseQuotes = mockAmazonWarehouses.value.map(warehouse => ({
        ...warehouse,
        price: parseFloat((Math.random() * 1000 + 200).toFixed(2)),
        palletRules: generatePalletRules(warehouse.code)
      }));
    }

    mockData.push({
      id: `fq_${now - i}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      quoteType: quoteType,
      serviceDescription: services[Math.floor(Math.random() * services.length)] + (Math.random() > 0.5 ? ' (含燃油)' : ''),
      price: quoteType === 'FBA' ? warehouseQuotes.reduce((sum, wq) => sum + wq.price, 0) / warehouseQuotes.length : parseFloat((Math.random() * 1000 + 200).toFixed(2)),
      validFrom: validFrom.toISOString().split('T')[0],
      validTo: validTo.toISOString().split('T')[0],
      submittedAt: submittedAt.toLocaleString(),
      status: status,
      approvalHistory: approvalHistory,
      warehouseQuotes: quoteType === 'FBA' ? warehouseQuotes : null
    });
  }
  return mockData;
};

// --- 选项数据 ---
const statusOptions = [
  { value: 'pending', label: '待初审', tag: 'warning' },
  { value: 'first_approved', label: '待终审', tag: 'primary' },
  { value: 'final_approved', label: '已批准 (待生效)', tag: 'success' },
  { value: 'active', label: '生效中', tag: 'success' },
  { value: 'rejected', label: '已拒绝', tag: 'danger' },
  { value: 'expired', label: '已过期', tag: 'info' },
];

// --- 筛选与分页 ---
const filterForm = reactive({
  supplierId: '',
  status: '',
  serviceDescription: '',
  validityRange: [],
});

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
});

const totalQuotes = computed(() => filteredQuotesData.value.length);

// 过滤逻辑
const filteredQuotesData = computed(() => {
  return allQuotes.value.filter(quote => {
    const supplierMatch = filterForm.supplierId ? quote.supplierId === filterForm.supplierId : true;
    const statusMatch = filterForm.status ? quote.status === filterForm.status : true;
    const descMatch = filterForm.serviceDescription ? quote.serviceDescription.includes(filterForm.serviceDescription) : true;
    const dateMatch = filterForm.validityRange && filterForm.validityRange.length === 2
      ? (quote.validFrom <= filterForm.validityRange[1] && quote.validTo >= filterForm.validityRange[0])
      : true;
    return supplierMatch && statusMatch && descMatch && dateMatch;
  });
});

// 分页逻辑
const filteredQuoteList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredQuotesData.value.slice(start, end);
});

// --- 弹窗 ---
const quoteDetailsDialogVisible = ref(false);
const currentQuoteDetails = ref(null);
const detailDialogVisible = ref(false);
const currentQuote = ref(null);
const showApprovalSection = ref(false);
const approvalComment = ref('');
const approvalAction = ref({ step: '', approved: true });
const approvalActionText = ref('通过');
const rejectionActionText = ref('拒绝');

// --- 方法 ---
// 格式化
const formatStatus = (status) => statusOptions.find(opt => opt.value === status)?.label || status;
const getStatusTagType = (status) => statusOptions.find(opt => opt.value === status)?.tag || 'info';
const getCurrentApprovalStep = (status) => {
    switch(status) {
        case 'pending': return '待 L1 初审';
        case 'first_approved': return '待 L2 终审';
        case 'final_approved': return '审批完成 (待生效)';
        case 'active': return '审批完成 (生效中)';
        case 'rejected': return '审批流程已拒绝';
        case 'expired': return '已过期';
        default: return '未知';
    }
};

// 判断当前用户是否有权限审批 (简单模拟，实际应基于用户角色权限)
const canApprove = (quote, step) => {
  if (step === 'first_approve') {
    return quote.status === 'pending';
  }
  if (step === 'final_approve') {
    return quote.status === 'first_approved';
  }
  return false;
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
};

// 分页
const handleSizeChange = (newSize) => {
  pagination.pageSize = newSize;
  pagination.currentPage = 1;
};
const handleCurrentChange = (newPage) => {
  pagination.currentPage = newPage;
};

// 查看详情
const handleViewDetails = (row) => {
  currentQuote.value = JSON.parse(JSON.stringify(row));
  showApprovalSection.value = false;
  detailDialogVisible.value = true;
};

// 处理审批按钮点击 (打开弹窗并设置审批信息)
const handleApproval = (row, step, approved) => {
    currentQuote.value = JSON.parse(JSON.stringify(row));
  approvalComment.value = '';
    approvalAction.value = { step, approved };
    showApprovalSection.value = true;
    
    if (step === 'first_approve') {
        approvalActionText.value = approved ? '初审通过' : '初审拒绝';
        rejectionActionText.value = '初审拒绝';
    } else {
        approvalActionText.value = approved ? '最终批准' : '最终拒绝';
        rejectionActionText.value = '最终拒绝';
    }
    
    detailDialogVisible.value = true;
};

// 查看历史 (占位)
const handleViewHistory = (row) => {
    console.log('查看报价历史 for:', row.serviceDescription, 'by', row.supplierName);
    ElMessage.info('跳转到报价历史页面 (待实现)');
    // 实际应导航到 QuoteComparisonHistory.vue 并传入参数
};

// 视图相关
const currentView = ref('all');
const selectedCustomView = ref('');
const customViews = ref([]);
const saveViewDialogVisible = ref(false);
const viewOptionsDialogVisible = ref(false);
const viewForm = ref({
  name: '',
  columns: []
});

// 批量操作相关
const selectedRows = ref([]);

// 处理视图命令
const handleViewCommand = (command) => {
  switch (command) {
    case 'save':
      viewForm.value = {
        name: '',
        columns: tableColumns.value.filter(col => col.visible !== false).map(col => col.prop)
      };
      saveViewDialogVisible.value = true;
      break;
    case 'manage':
      viewOptionsDialogVisible.value = true;
      break;
  }
};

// 处理批量操作命令
const handleBatchCommand = (command) => {
  switch (command) {
    case 'export':
      handleExport();
      break;
    case 'approve':
      handleBatchApprove();
      break;
    case 'reject':
      handleBatchReject();
      break;
  }
};

// 导出功能
const handleExport = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择要导出的数据');
    return;
  }
  console.log('导出选中数据:', selectedRows.value);
  ElMessage.success('导出成功');
};

// 批量审批
const handleBatchApprove = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择要审批的数据');
    return;
  }
  
  ElMessageBox.confirm(
    `确定要批量通过选中的 ${selectedRows.value.length} 条报价吗？`,
    '批量审批',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    console.log('批量通过:', selectedRows.value);
    ElMessage.success('批量审批成功');
  });
};

// 批量拒绝
const handleBatchReject = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择要拒绝的数据');
    return;
  }
  
  ElMessageBox.confirm(
    `确定要批量拒绝选中的 ${selectedRows.value.length} 条报价吗？`,
    '批量拒绝',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    console.log('批量拒绝:', selectedRows.value);
    ElMessage.success('批量拒绝成功');
  });
};

// 保存视图
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
    sortSettings: sortSettings.value
  };
  
  customViews.value.push(newView);
  saveViewsToStorage();
  saveViewDialogVisible.value = false;
  ElMessage.success('视图保存成功');
};

// 管理视图选项
const handleViewOptions = (view, action) => {
  switch (action) {
    case 'edit':
      // 实现编辑视图逻辑
      break;
    case 'copy':
      // 实现复制视图逻辑
      break;
    case 'delete':
      ElMessageBox.confirm(
        '确定要删除该视图吗？',
        '删除视图',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const index = customViews.value.findIndex(v => v.id === view.id);
        if (index > -1) {
          customViews.value.splice(index, 1);
          saveViewsToStorage();
          ElMessage.success('视图删除成功');
        }
      });
      break;
  }
};

// 保存视图到本地存储
const saveViewsToStorage = () => {
  localStorage.setItem('fixedQuoteViews', JSON.stringify(customViews.value));
};

// 加载保存的视图
const loadSavedViews = () => {
  const savedViews = localStorage.getItem('fixedQuoteViews');
  if (savedViews) {
    customViews.value = JSON.parse(savedViews);
  }
};

// 处理视图变化
const handleViewChange = (view) => {
  if (view === 'all') {
    filterForm.supplierId = '';
    filterForm.status = '';
    filterForm.serviceDescription = '';
    filterForm.validityRange = [];
    } else {
    filterForm.status = view;
  }
  handleSearch();
};

// 处理表格选择变化
const handleSelectionChange = (rows) => {
  selectedRows.value = rows;
};

// 高级筛选相关
const advancedFilterVisible = ref(false);
const filterLogic = ref('and');
const activeFilters = ref([]);
const filterableFields = computed(() => [
  { prop: 'supplierName', label: '供应商' },
  { prop: 'serviceDescription', label: '服务描述' },
  { prop: 'price', label: '报价' },
  { prop: 'status', label: '状态' },
  { prop: 'validFrom', label: '生效开始日期' },
  { prop: 'validTo', label: '生效结束日期' },
  { prop: 'submittedAt', label: '提交时间' }
]);

// 分组相关
const groupModalVisible = ref(false);
const groupSettings = ref({
  level1: '',
  level2: '',
  level3: ''
});
const groupableFields = computed(() => 
  filterableFields.value.filter(field => field.prop !== 'operation')
);

// 排序相关
const sortModalVisible = ref(false);
const sortSettings = ref([
  { field: '', direction: 'asc' }
]);
const sortableFields = computed(() => 
  filterableFields.value.filter(field => field.prop !== 'operation')
);

// 显示高级筛选
const showAdvancedFilter = () => {
  advancedFilterVisible.value = true;
};

// 添加筛选条件
const addFilter = () => {
  activeFilters.value.push({
    field: '',
    operator: 'eq',
    value: ''
  });
};

// 移除筛选条件
const removeFilter = (index) => {
  activeFilters.value.splice(index, 1);
};

// 应用高级筛选
const applyAdvancedFilter = () => {
  handleSearch();
  advancedFilterVisible.value = false;
};

// 显示分组设置
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
};

// 应用分组设置
const applyGroupSettings = () => {
  const levels = [groupSettings.value.level1, groupSettings.value.level2, groupSettings.value.level3]
    .filter(Boolean);
  
  if (levels.length > 0) {
    console.log('应用分组:', levels);
    handleSearch();
  }
  
  groupModalVisible.value = false;
};

// 显示排序设置
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

// 清除排序设置
const clearSortSettings = () => {
  sortSettings.value = [{ field: '', direction: 'asc' }];
};

// 应用排序设置
const applySortSettings = () => {
  const validSorts = sortSettings.value.filter(sort => sort.field);
  if (validSorts.length > 0) {
    console.log('应用排序:', validSorts);
    handleSearch();
  }
  
  sortModalVisible.value = false;
};

// 字段配置相关
const columnSettingsVisible = ref(false);
const columnSettingsList = ref([]);
const allColumnsSelected = computed({
  get: () => columnSettingsList.value.length > 0 && columnSettingsList.value.every(col => col.visible),
  set: (value) => {
    columnSettingsList.value.forEach(col => {
      col.visible = value;
    });
  }
});

// 显示字段配置
const showColumnSettings = () => {
  columnSettingsList.value = tableColumns.value.map(col => ({
    prop: col.prop,
    label: col.label,
    visible: col.visible !== false,
    width: col.width || 120
  }));
  columnSettingsVisible.value = true;
};

// 处理全选/取消全选
const handleSelectAllColumns = (value) => {
  columnSettingsList.value.forEach(col => {
    col.visible = value;
  });
};

// 重置列配置
const resetColumnSettings = () => {
  columnSettingsList.value = tableColumns.value.map(col => ({
    prop: col.prop,
    label: col.label,
    visible: true,
    width: col.width || 120
  }));
};

// 处理拖拽结束
const handleDragEnd = () => {
  tableColumns.value = columnSettingsList.value.map(col => ({
    ...tableColumns.value.find(c => c.prop === col.prop),
    visible: col.visible,
    width: col.width
  }));
};

// 应用列配置
const applyColumnSettings = () => {
  tableColumns.value = columnSettingsList.value.map(col => ({
    ...tableColumns.value.find(c => c.prop === col.prop),
    visible: col.visible,
    width: col.width
  }));
  
  if (selectedCustomView.value) {
    updateViewConfig(selectedCustomView.value);
  }
  
  columnSettingsVisible.value = false;
  ElMessage.success('字段配置已更新');
};

// 跟进记录相关
const followUpDialogVisible = ref(false);
const followUpForm = ref({
  content: '',
  type: 'primary'
});
const followUpHistory = ref([]);
const currentEditingQuote = ref(null);

// 备注相关
const memoDialogVisible = ref(false);
const memoForm = ref({
  content: ''
});

// 处理下拉菜单命令
const handleCommand = (command, row) => {
  switch (command) {
    case 'first_approve':
      handleApproval(row, 'first_approve', true);
      break;
    case 'first_reject':
      handleApproval(row, 'first_approve', false);
      break;
    case 'final_approve':
      handleApproval(row, 'final_approve', true);
      break;
    case 'final_reject':
      handleApproval(row, 'final_approve', false);
      break;
    case 'history':
      handleViewHistory(row);
      break;
    case 'followUp':
      handleFollowUp(row);
      break;
    case 'memo':
      handleMemo(row);
      break;
    case 'export':
      handleExport([row]);
      break;
    case 'seeQuote':
      handleSeeQuote(row);
      break;
  }
};

// 处理跟进记录
const handleFollowUp = (row) => {
  currentEditingQuote.value = row;
  followUpForm.value = {
    content: '',
    type: 'primary'
  };
  followUpHistory.value = [
    {
      timestamp: '2024-01-01 10:00:00',
      content: '报价已提交，等待初审',
      type: 'primary'
    },
    {
      timestamp: '2024-01-02 14:30:00',
      content: '初审通过，等待终审',
      type: 'success'
    }
  ];
  followUpDialogVisible.value = true;
};

// 保存跟进记录
const saveFollowUp = () => {
  if (!followUpForm.value.content) {
    ElMessage.warning('请输入跟进内容');
    return;
  }
  
  followUpHistory.value.unshift({
    timestamp: new Date().toLocaleString(),
    content: followUpForm.value.content,
    type: followUpForm.value.type
  });
  
  followUpForm.value.content = '';
  ElMessage.success('跟进记录已添加');
};

// 处理备注
const handleMemo = (row) => {
  currentEditingQuote.value = row;
  memoForm.value = {
    content: row.memo || ''
  };
  memoDialogVisible.value = true;
};

// 保存备注
const saveMemo = () => {
  if (!currentEditingQuote.value) return;
  
  currentEditingQuote.value.memo = memoForm.value.content;
  memoDialogVisible.value = false;
  ElMessage.success('备注已保存');
};

// 添加查看报价处理函数
const handleSeeQuote = (row) => {
  if (row.quoteType === 'FBA') {
    currentQuoteDetails.value = {
      ...row,
      warehouseDetails: mockAmazonWarehouses.value.find(w => 
        row.serviceDescription.includes(w.code)
      )
    };
    quoteDetailsDialogVisible.value = true;
  } else {
    ElMessage.info('FBX报价详情查看功能开发中');
  }
};

// --- 表格列配置 ---
const tableColumns = ref([
  { prop: 'supplierName', label: '供应商', width: 200, visible: true },
  { prop: 'serviceDescription', label: '服务/线路描述', minWidth: 250, visible: true },
  { prop: 'quoteType', label: '报价类型', width: 100, visible: true },
  { prop: 'serviceWarehouse', label: '服务仓库', width: 120, visible: true },
  { prop: 'price', label: '报价 (USD)', width: 120, visible: true },
  { prop: 'validFrom', label: '生效开始日期', width: 130, visible: true },
  { prop: 'validTo', label: '生效结束日期', width: 130, visible: true },
  { prop: 'submittedAt', label: '提交时间', width: 160, visible: true },
  { prop: 'status', label: '状态', width: 120, visible: true },
  { prop: 'approvalProgress', label: '审批进度', width: 150, visible: true },
  { prop: 'operation', label: '操作', width: 220, fixed: 'right', visible: true }
]);

// 服务仓库选项
const serviceWarehouseOptions = [
  { value: 'west1', label: '美西一号仓' },
  { value: 'west2', label: '美西二号仓' },
  { value: 'east', label: '美东仓' }
];

// 更新视图配置
const updateViewConfig = (viewId) => {
  const view = customViews.value.find(v => v.id === viewId);
  if (view) {
    view.columns = tableColumns.value.map(col => ({
      prop: col.prop,
      visible: col.visible,
      width: col.width
    }));
    saveViewsToStorage();
  }
};

// --- 生命周期 ---
onMounted(() => {
  allQuotes.value = generateMockQuotes();
  loadSavedViews();
});

</script>

<style scoped>
.fixed-quote-list-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-form {
  margin-bottom: 20px;
}

.filter-form .el-form-item {
  margin-bottom: 10px;
}

.el-table {
  margin-top: 15px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.el-timeline {
  padding-left: 10px;
}

.view-selector {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.view-list {
  max-height: 400px;
  overflow-y: auto;
}

.advanced-filter {
  padding: 20px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-conditions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.group-settings {
  padding: 20px;
}

.group-levels {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.group-level {
  display: flex;
  align-items: center;
  gap: 10px;
}

.level-label {
  width: 80px;
  text-align: right;
}

.sort-settings {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sort-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.column-settings {
  padding: 20px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.column-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.column-item:last-child {
  border-bottom: none;
}

.drag-handle {
  cursor: move;
  color: #909399;
}

.drag-handle:hover {
  color: #409EFF;
}

.follow-up-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.follow-up-form {
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.follow-up-history {
  max-height: 400px;
  overflow-y: auto;
}

.quote-details {
  padding: 20px;
}

.warehouse-details {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.warehouse-details h3 {
  margin-bottom: 15px;
}
</style> 