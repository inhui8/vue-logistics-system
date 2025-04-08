<template>
  <div class="supplier-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>供应商列表</span>
          <el-button type="primary" @click="handleAddSupplier">
            <el-icon><Plus /></el-icon> 新增供应商
          </el-button>
        </div>
      </template>

      <!-- 筛选区域 (可以添加) -->
      <el-form :inline="true" :model="filterForm" class="filter-form">
         <el-form-item label="供应商名称">
           <el-input v-model="filterForm.name" placeholder="输入名称关键字" clearable />
         </el-form-item>
         <el-form-item label="供应商类型">
             <el-select v-model="filterForm.type" placeholder="选择类型" clearable>
                <el-option
                   v-for="item in supplierTypeOptions"
                   :key="item.value"
                   :label="item.label"
                   :value="item.value"
                 />
             </el-select>
         </el-form-item>
          <el-form-item label="合作状态">
               <el-select v-model="filterForm.status" placeholder="选择状态" clearable>
                  <el-option
                   v-for="item in statusOptions"
                   :key="item.value"
                   :label="item.label"
                   :value="item.value"
                 />
               </el-select>
           </el-form-item>
           <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
           </el-form-item>
      </el-form>

      <el-table :data="filteredSupplierList" style="width: 100%" border>
        <el-table-column prop="name" label="供应商名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="type" label="供应商类型" width="120">
           <template #default="scope">
             {{ formatSupplierType(scope.row.type) }}
           </template>
        </el-table-column>
         <el-table-column prop="industryTypes" label="行业类型" width="120">
            <template #default="scope">
               {{ formatIndustryTypes(scope.row.industryTypes) }}
            </template>
        </el-table-column>
        <el-table-column prop="associatedRoles" label="关联角色" width="200" show-overflow-tooltip>
             <template #default="scope">
               {{ formatRoles(scope.row.associatedRoles) }}
             </template>
        </el-table-column>
        <el-table-column prop="serviceAreas" label="服务区域" width="200" show-overflow-tooltip>
            <template #default="scope">
               {{ formatServiceAreas(scope.row.serviceAreas) }}
            </template>
        </el-table-column>
        <el-table-column prop="primaryContact.name" label="主要联系人" width="120" />
        <el-table-column prop="primaryContact.phone" label="联系电话" width="130" />
        <el-table-column prop="status" label="合作状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ formatStatus(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="supplierCode" label="供应商编号" width="140" />
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="scope">
            <el-button text type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button text type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <el-pagination
         style="margin-top: 20px; justify-content: flex-end;"
         background
         layout="total, sizes, prev, pager, next, jumper"
         :total="totalSuppliers"
         :page-sizes="[10, 20, 50, 100]"
         :page-size="pagination.pageSize"
         :current-page="pagination.currentPage"
         @size-change="handleSizeChange"
         @current-change="handleCurrentChange"
       />

      <!-- 新增/编辑供应商弹窗 -->
      <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="75%" 
        top="5vh"
        @close="handleDialogClose"
        :close-on-click-modal="false"
      >
        <el-tabs v-model="activeTabName">
            <el-tab-pane label="基础信息" name="basicInfo">
        <el-form
          ref="supplierFormRef"
          :model="supplierForm"
          :rules="formRules"
          label-width="110px"
                  style="max-height: 65vh; overflow-y: auto; padding-right: 10px;" 
        >
          <!-- 基础信息 -->
          <el-divider content-position="left">基础信息</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="行业类型">
                 <el-input value="运输" disabled />
              </el-form-item>
            </el-col>
             <el-col :span="12">
                 <el-form-item label="供应商类型" prop="type">
                     <el-select v-model="supplierForm.type" placeholder="选择供应商主要服务类型" style="width: 100%;">
                        <el-option
                           v-for="item in supplierTypeOptions"
                           :key="item.value"
                           :label="item.label"
                           :value="item.value"
                         />
                     </el-select>
                 </el-form-item>
              </el-col>
          </el-row>
           <el-row :gutter="20">
              <el-col :span="12">
                 <el-form-item label="供应商名称" prop="name">
                   <el-input v-model="supplierForm.name" placeholder="请输入供应商公司全称" />
                 </el-form-item>
              </el-col>
               <el-col :span="12">
                 <el-form-item label="供应商编号">
                    <el-input :value="supplierForm.supplierCode || '提交后自动生成'" disabled />
                 </el-form-item>
              </el-col>
            </el-row>
             <el-row :gutter="20">
              <el-col :span="8">
                 <el-form-item label="国家" prop="address.country">
                    <el-select v-model="supplierForm.address.country" placeholder="请选择国家" style="width: 100%;">
                       <el-option label="美国" value="US" />
                               <el-option label="中国(CN)" value="CN" />
                       <el-option label="加拿大" value="CA" />
                    </el-select>
                 </el-form-item>
              </el-col>
              <el-col :span="8">
                 <el-form-item label="省/州" prop="address.state">
                   <el-input v-model="supplierForm.address.state" placeholder="例如：CA, NY" />
                 </el-form-item>
              </el-col>
              <el-col :span="8">
                 <el-form-item label="城市" prop="address.city">
                   <el-input v-model="supplierForm.address.city" placeholder="例如：Los Angeles" />
                 </el-form-item>
              </el-col>
            </el-row>
             <el-row :gutter="20">
                <el-col :span="16">
                   <el-form-item label="详细地址" prop="address.street">
                     <el-input v-model="supplierForm.address.street" placeholder="请输入详细街道地址" />
                   </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="营业执照">
                    <el-upload
                       action="#" 
                       :limit="1"
                       :auto-upload="false"
                      >
                      <template #trigger>
                          <el-button type="primary" link>点击上传</el-button>
                       </template>
                     </el-upload>
                  </el-form-item>
               </el-col>
             </el-row>
             <el-row :gutter="20">
                <el-col :span="24">
                   <el-form-item label="服务区域" prop="serviceAreas">
                     <el-select v-model="supplierForm.serviceAreas" multiple filterable placeholder="请选择供应商可服务的仓库区域" style="width: 100%;">
                        <el-option v-for="item in serviceAreaOptions" :key="item.value" :label="item.label" :value="item.value" />
                     </el-select>
                   </el-form-item>
                </el-col>
             </el-row>

            <!-- 结算 -->
            <el-divider content-position="left">结算</el-divider>
             <el-row :gutter="20">
                <el-col :span="12">
                   <el-form-item label="结算方式" prop="settlement.method">
                     <el-radio-group v-model="supplierForm.settlement.method">
                        <el-radio label="invoice">票结</el-radio>
                        <el-radio label="monthly">月结</el-radio>
                        <el-radio label="weekly">周结</el-radio>
                        <el-radio label="biweekly">半月结</el-radio>
                     </el-radio-group>
                   </el-form-item>
                </el-col>
                <el-col :span="12">
                   <el-form-item label="结算天数" prop="settlement.days">
                      <el-input-number v-model="supplierForm.settlement.days" :min="0" placeholder="例如：30" style="width: 100%;"/>
                   </el-form-item>
                </el-col>
             </el-row>

             <!-- 数据权限 -->
                     <el-divider content-position="left">数据权限 <el-tooltip content="控制该供应商信息及相关数据（如成本）对内部哪些用户可见" placement="top"><el-icon><QuestionFilled /></el-icon></el-tooltip></el-divider>
              <el-row :gutter="20">
                 <el-col :span="24">
                   <el-form-item label="使用人员" prop="dataPermission">
                     <el-radio-group v-model="supplierForm.dataPermission">
                        <el-radio label="all">全部</el-radio>
                        <el-radio label="department" disabled>指定部门 (待实现)</el-radio>
                        <el-radio label="position" disabled>指定岗位 (待实现)</el-radio>
                     </el-radio-group>
                   </el-form-item>
                 </el-col>
             </el-row>

             <!-- 联系方式 -->
             <el-divider content-position="left">联系方式</el-divider>
              <el-table :data="supplierForm.contacts" style="width: 100%; margin-bottom: 15px;" border size="small">
                 <el-table-column label="联系人" prop="name" width="120">
                    <template #default="scope">
                       <el-input v-model="scope.row.name" size="small" placeholder="姓名"/>
                    </template>
                 </el-table-column>
                 <el-table-column label="电话号码" prop="phone" width="150">
                     <template #default="scope">
                       <el-input v-model="scope.row.phone" size="small" placeholder="手机或座机"/>
                    </template>
                 </el-table-column>
                 <el-table-column label="岗位" prop="position" width="120">
                     <template #default="scope">
                       <el-input v-model="scope.row.position" size="small" placeholder="如：销售经理"/>
                    </template>
                 </el-table-column>
                  <el-table-column label="QQ" prop="qq" width="120">
                     <template #default="scope">
                       <el-input v-model="scope.row.qq" size="small"/>
                    </template>
                 </el-table-column>
                 <el-table-column label="邮箱" prop="email">
                     <template #default="scope">
                       <el-input v-model="scope.row.email" size="small" placeholder="常用邮箱"/>
                    </template>
                 </el-table-column>
                  <el-table-column label="备注" prop="remark">
                     <template #default="scope">
                       <el-input v-model="scope.row.remark" size="small"/>
                    </template>
                 </el-table-column>
                 <el-table-column label="操作" width="80" align="center">
                     <template #default="scope">
                       <el-button type="danger" :icon="Delete" circle size="small" @click="removeContact(scope.$index)"/>
                    </template>
                 </el-table-column>
              </el-table>
              <el-button type="primary" link :icon="Plus" @click="addContact">添加联系人</el-button>

                    <!-- 其他信息 -->
            <el-divider content-position="left">其他信息</el-divider>
            <el-row :gutter="20">
                <el-col :span="12">
                   <el-form-item label="合作状态" prop="status">
                       <el-select v-model="supplierForm.status" placeholder="请选择合作状态" style="width: 100%;">
                          <el-option
                           v-for="item in statusOptions"
                           :key="item.value"
                           :label="item.label"
                           :value="item.value"
                         />
                       </el-select>
                   </el-form-item>
                </el-col>
                <el-col :span="12">
                   <el-form-item label="关联角色" prop="associatedRoles">
                     <el-select v-model="supplierForm.associatedRoles" multiple placeholder="选择关联的角色" style="width: 100%;">
                        <el-option v-for="role in roleOptions" :key="role.id" :label="role.name" :value="role.id" />
                     </el-select>
                   </el-form-item>
                </el-col>
             </el-row>
                </el-form>
            </el-tab-pane>

            <el-tab-pane label="合同信息" name="contractInfo" disabled>
              <!-- 合同信息内容待添加 -->
              <el-empty description="合同信息功能待开发" />
            </el-tab-pane>
            <el-tab-pane label="开票信息" name="billingInfo" disabled>
              <!-- 开票信息内容待添加 -->
               <el-empty description="开票信息功能待开发" />
            </el-tab-pane>
             <el-tab-pane label="考核管理" name="assessmentInfo" disabled>
              <!-- 考核管理内容待添加 -->
               <el-empty description="考核管理功能待开发" />
            </el-tab-pane>
            <el-tab-pane label="成本管理" name="costManagement">
                <div style="margin-bottom: 15px; display: flex; justify-content: flex-end;">
                    <el-button type="primary" @click="showCostHistory = true">查看历史报价</el-button>
                </div>
                <el-table :data="currentCosts" style="width: 100%" border size="small">
                    <el-table-column prop="feeName" label="费用名称" min-width="180" show-overflow-tooltip />
                    <el-table-column prop="quoteType" label="费用类型" width="100" />
                    <el-table-column prop="effectiveDate" label="生效日期" width="120" />
                    <el-table-column prop="endDate" label="结束日期" width="120" />
                    <el-table-column prop="effectiveStatus" label="生效状态" width="100">
                         <template #default="scope">
                             <el-tag :type="getCostStatusTagType(scope.row.effectiveStatus)">
                                {{ formatCostStatus(scope.row.effectiveStatus) }}
                             </el-tag>
                         </template>
                    </el-table-column>
                    <el-table-column prop="remarks" label="备注" min-width="150" show-overflow-tooltip/>
                    <el-table-column label="操作" fixed="right" width="220">
                      <template #default="scope">
                         <el-button text type="primary" size="small" @click="handleActivateCost(scope.row)" :disabled="scope.row.effectiveStatus !== 'pending'">报价生效</el-button>
                         <el-button text type="warning" size="small" @click="handleEndCost(scope.row)" :disabled="scope.row.effectiveStatus !== 'active'">结束报价</el-button>
                         <el-button text type="info" size="small" @click="handleViewCost(scope.row)">查看报价</el-button>
                      </template>
                    </el-table-column>
                </el-table>

                 <!-- 历史报价弹窗 (示例) -->
                 <el-dialog
                    v-model="showCostHistory"
                    title="历史成本报价"
                    width="70%"
                    append-to-body
                  >
                    <el-table :data="historyCosts" style="width: 100%" border size="small">
                       <el-table-column prop="feeName" label="费用名称" min-width="180" show-overflow-tooltip />
                       <el-table-column prop="quoteType" label="费用类型" width="100" />
                        <el-table-column prop="effectiveDate" label="生效日期" width="120" />
                        <el-table-column prop="endDate" label="结束日期" width="120" />
                        <el-table-column prop="effectiveStatus" label="状态" width="100">
                             <template #default="scope">
                                 <el-tag type="info">已过期</el-tag>
                             </template>
                        </el-table-column>
                        <el-table-column prop="remarks" label="备注" min-width="150" show-overflow-tooltip/>
                        <el-table-column label="操作" fixed="right" width="100">
                          <template #default="scope">
                             <el-button text type="info" size="small" @click="handleViewCost(scope.row)">查看报价</el-button>
                          </template>
                        </el-table-column>
                    </el-table>
                     <template #footer>
                        <el-button @click="showCostHistory = false">关闭</el-button>
                     </template>
                  </el-dialog>
                  
                  <!-- 查看报价详情弹窗 (占位) -->
                 <el-dialog
                    v-model="viewCostDetailVisible"
                    title="查看报价详情"
                    width="60%"
                    append-to-body
                  >
                     <!-- Re-adapted FBA style view based on image -->
                     <div v-if="currentViewingCost" class="quote-details">
                         <el-descriptions :column="2" border title="报价详情" :title-style="{fontWeight: 'bold'}" style="margin-bottom: 20px;">
                            <el-descriptions-item label="供应商">{{ supplierForm.name }}</el-descriptions-item> 
                            <el-descriptions-item label="报价类型">{{ currentViewingCost.quoteType }}</el-descriptions-item>
                            <el-descriptions-item label="服务描述" :span="2">{{ currentViewingCost.feeName }}</el-descriptions-item>
                            <el-descriptions-item label="生效日期" :span="2">{{ currentViewingCost.effectiveDate }} 至 {{ currentViewingCost.endDate }}</el-descriptions-item>
                            <el-descriptions-item label="服务仓库" v-if="currentViewingCost.quoteType === 'FBA'">
                                {{ serviceWarehouseOptions.find(w => w.value === currentViewingCost.serviceWarehouse)?.label || '-' }}
                            </el-descriptions-item>
                         </el-descriptions>

                         <div v-if="currentViewingCost.quoteType === 'FBA' && currentViewingCost.details && currentViewingCost.details.length > 0" class="warehouse-details">
                             <h3 style="margin-bottom: 10px; font-size: 16px; font-weight: bold;">仓库报价明细</h3> 
                             <el-table :data="currentViewingCost.details" border stripe style="width: 100%">
                                 <el-table-column prop="platform" label="平台名称" width="100" />
                                 <el-table-column prop="warehouseCode" label="仓库代码" width="120" />
                                 <el-table-column prop="country" label="国家" width="80" />
                                 <el-table-column prop="state" label="省/州" width="80" />
                                 <el-table-column prop="city" label="城市" width="120" />
                                 <el-table-column prop="address" label="详细地址" min-width="200" show-overflow-tooltip/>
                                 <el-table-column prop="zipcode" label="邮编" width="100" />
                                 <el-table-column prop="price" label="报价 (USD)" width="120">
                                     <template #default="{ row }">
                                         {{ row.price?.toFixed(2) || '-' }}
                                     </template>
                                 </el-table-column>
                                 <el-table-column prop="palletRule" label="打板规则" width="100" />
                             </el-table>
                         </div>
                         <div v-else-if="currentViewingCost.quoteType === 'FBA'">
                             <el-alert title="无FBA仓库报价明细数据" type="info" show-icon :closable="false" />
                         </div>
                         <div v-else>
                              <el-alert :title="`非FBA报价类型 (${currentViewingCost.quoteType})，无仓库明细。`" type="info" show-icon :closable="false" />
                         </div>
                     </div>
                     <div v-else>
                        <el-empty description="无法加载报价详情" />
                     </div>

                     <template #footer>
                        <el-button @click="viewCostDetailVisible = false">关闭</el-button>
                     </template>
                  </el-dialog>

                   <!-- 新增/编辑报价弹窗 (占位) -->
                 <el-dialog
                    v-model="addEditCostVisible"
                    :title="costDialogTitle"
                    width="60%"
                    append-to-body
                    :close-on-click-modal="false"
                  >
                     <el-form ref="costFormRef" :model="costForm" label-width="100px">
                         <el-form-item label="费用名称" prop="feeName">
                             <el-input v-model="costForm.feeName" placeholder="例如：FBA-固定报价-LA" />
                         </el-form-item>
                         <el-form-item label="费用类型" prop="quoteType">
                             <el-select v-model="costForm.quoteType" placeholder="选择费用类型" style="width: 100%;">
                                <el-option
                                  v-for="type in quoteTypes"
                                  :key="type"
                                  :label="type"
                                  :value="type"
                                />
                             </el-select>
                         </el-form-item>
                         <el-form-item label="生效日期" prop="effectiveDate">
                             <el-date-picker v-model="costForm.effectiveDate" type="date" placeholder="选择日期" style="width: 100%;"/>
                         </el-form-item>
                         <el-form-item label="结束日期" prop="endDate">
                              <el-date-picker v-model="costForm.endDate" type="date" placeholder="选择日期" style="width: 100%;"/>
                         </el-form-item>
                         <el-form-item label="备注" prop="remarks">
                              <el-input v-model="costForm.remarks" type="textarea" placeholder="请输入备注"/>
                         </el-form-item>
                         <el-form-item label="服务仓库" prop="serviceWarehouse" v-if="costForm.quoteType === 'FBA'">
                             <el-select v-model="costForm.serviceWarehouse" placeholder="选择服务仓库" style="width: 100%;">
                                <el-option
                                    v-for="warehouse in serviceWarehouseOptions"
                                    :key="warehouse.value"
                                    :label="warehouse.label"
                                    :value="warehouse.value"
                                />
                             </el-select>
                         </el-form-item>
                     </el-form>
                     <template #footer>
                        <el-button @click="addEditCostVisible = false">取消</el-button>
                         <el-button type="primary" @click="handleSaveCost">保存报价</el-button>
                     </template>
                  </el-dialog>

            </el-tab-pane>
        </el-tabs>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSubmit">保存</el-button>
          </span>
        </template>
      </el-dialog>

    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue'; 
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue'; 

// --- 选项数据 ---
const supplierTypeOptions = [
  { value: 'pickup', label: '提框' },
  { value: 'delivery', label: '派送' },
  { value: 'both', label: '提框 & 派送' },
  { value: 'warehouse', label: '仓储' },
  { value: 'customs', label: '报关' },
  { value: 'other', label: '其他' },
];

const industryTypeOptions = [
    { value: 'freight_forwarding', label: '货代' },
    { value: 'ocean_shipping', label: '船东' },
    { value: 'express', label: '快递' },
    { value: 'warehousing', label: '仓储' },
    { value: 'air_freight', label: '航空' },
    { value: 'customs_brokerage', label: '报关' },
    { value: 'clearance', label: '清关' },
    { value: 'transportation', label: '运输' },
    { value: 'insurance', label: '保险' },
];

const statusOptions = [
  { value: 'active', label: '合作中', tag: 'success' },
  { value: 'inactive', label: '已停止', tag: 'info' },
  { value: 'pending', label: '待审批', tag: 'warning' },
];

const serviceAreaOptions = [
    { value: 'lax_wh1', label: '美西一号仓 (LAX)' },
    { value: 'lax_wh2', label: '美西二号仓 (LGB)' },
    { value: 'ewr_wh1', label: '新泽西仓库 (EWR)' },
    { value: 'sav_wh1', label: '萨凡纳仓库 (SAV)' },
    { value: 'dfw_wh1', label: '达拉斯仓库 (DFW)' },
];

const roleOptions = ref([
  { id: 'role_pickup_standard', name: '标准提框商' },
  { id: 'role_delivery_standard', name: '标准派送商' },
  { id: 'role_supplier_admin', name: '供应商管理员' },
  { id: 'role_admin', name: '后台管理员' }, // Maybe exclude this one depending on logic
]);

// --- 响应式状态 ---
const allSuppliers = ref([]); // 存储所有供应商数据

const generateMockSuppliers = (count = 15) => {
    const mockData = [];

    for (let i = 0; i < count; i++) {
        const typeKeys = Object.keys(supplierTypeOptions);
        const statusKeys = Object.keys(statusOptions);
        const areaKeys = Object.keys(serviceAreaOptions);
        const numServiceAreas = Math.floor(Math.random() * areaKeys.length) + 1;
        
        let assignedRoles = [];
        const supplierType = supplierTypeOptions[i % typeKeys.length].value;
        if (supplierType === 'pickup') {
            assignedRoles.push('role_pickup_standard');
        } else if (supplierType === 'delivery') {
            assignedRoles.push('role_delivery_standard');
        } else if (supplierType === 'both') {
             assignedRoles.push('role_pickup_standard', 'role_delivery_standard');
        }
         if (Math.random() > 0.6) {
             assignedRoles.push('role_supplier_admin');
         }
         assignedRoles = [...new Set(assignedRoles)]; 

        mockData.push({
            id: i + 1,
            name: `测试供应商 ${String.fromCharCode(65 + i)} - ${supplierTypeOptions[i % typeKeys.length].label}专家`,
            supplierCode: `SUP${String(2024000 + i + 1)}`,
            type: supplierType,
            industryTypes: ['transportation'],
            address: {
                country: 'US',
                state: ['CA', 'NY', 'TX', 'GA'][i % 4],
                city: ['Los Angeles', 'New York', 'Dallas', 'Savannah'][i % 4],
                street: `1${i} Mock Street`,
            },
            serviceAreas: [...areaKeys].sort(() => 0.5 - Math.random()).slice(0, numServiceAreas).map(k => serviceAreaOptions[k].value),
            settlement: {
                method: ['invoice', 'monthly', 'weekly', 'biweekly'][i % 4],
                days: [0, 30, 7, 15][i % 4]
            },
            dataPermission: 'all',
            contacts: [
                { name: `联系人${i+1}-A`, phone: `13${i}00001111`, position: '销售经理', qq: `${i+1}0001`, email: `contactA_${i+1}@supplier.com`, remark: '主要对接人' },
                (i % 3 === 0) ? { name: `联系人${i+1}-B`, phone: `13${i}00002222`, position: '操作员', qq: `${i+1}0002`, email: `contactB_${i+1}@supplier.com`, remark: '' } : null
            ].filter(c => c !== null),
            status: statusOptions[i % statusKeys.length].value,
            associatedRoles: assignedRoles,
        });
    }
    allSuppliers.value = mockData;
};

const filterForm = reactive({ name: '', type: '', status: '' });
const pagination = reactive({ currentPage: 1, pageSize: 10 });

const filteredSuppliersData = computed(() => {
  return allSuppliers.value.filter(supplier => {
      const nameMatch = filterForm.name ? supplier.name.includes(filterForm.name) : true;
      const typeMatch = filterForm.type ? supplier.type === filterForm.type : true;
      const statusMatch = filterForm.status ? supplier.status === filterForm.status : true;
      return nameMatch && typeMatch && statusMatch;
  });
});

const totalSuppliers = computed(() => filteredSuppliersData.value.length);

const filteredSupplierList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return filteredSuppliersData.value.slice(start, end);
});

const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEditMode = ref(false);
const supplierFormRef = ref(null); 

const activeTabName = ref('basicInfo'); // 控制当前激活的Tab

const initialFormState = {
  id: null,
  name: '',
  supplierCode: '',
  type: '',
  industryTypes: ['transportation'],
  address: {
      country: 'US',
      state: '',
      city: '',
      street: ''
  },
  serviceAreas: [],
  settlement: {
      method: 'invoice',
      days: 0
  },
  dataPermission: 'all',
  contacts: [],
  status: 'active', 
  associatedRoles: [],
  costs: [], // 新增成本数据
};
const supplierForm = reactive({ ...initialFormState });

const formRules = reactive({
  name: [
    { required: true, message: '请输入供应商名称', trigger: 'blur' },
  ],
  type: [
      { required: true, message: '请选择供应商类型', trigger: 'change' }
  ],
  'address.country': [
      { required: true, message: '请选择国家', trigger: 'change' }
  ],
  'address.state': [
      { required: true, message: '请输入省/州', trigger: 'blur' }
  ],
   'address.city': [
      { required: true, message: '请输入城市', trigger: 'blur' }
  ],
   'address.street': [
      { required: true, message: '请输入详细地址', trigger: 'blur' }
  ],
   serviceAreas: [
      { required: true, type: 'array', message: '请至少选择一个服务区域', trigger: 'change' }
  ],
   'settlement.method': [
      { required: true, message: '请选择结算方式', trigger: 'change' }
  ],
   'settlement.days': [
      { required: true, message: '请输入结算天数', trigger: 'blur' },
      { type: 'number', message: '结算天数必须是数字'} 
  ],
   dataPermission: [
      { required: true, message: '请选择数据权限范围', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择合作状态', trigger: 'change' },
  ],
});

const formatSupplierType = (type) => supplierTypeOptions.find(opt => opt.value === type)?.label || type;
const formatStatus = (status) => statusOptions.find(opt => opt.value === status)?.label || status;
const getStatusTagType = (status) => statusOptions.find(opt => opt.value === status)?.tag || 'info';
const formatIndustryTypes = (types) => {
    if (!types || types.length === 0) return '-';
    if (types.includes('transportation')) {
        return industryTypeOptions.find(opt => opt.value === 'transportation')?.label || '运输';
    }
    return types.map(t => industryTypeOptions.find(opt => opt.value === t)?.label || t).join(', ');
};
const formatServiceAreas = (areas) => {
     if (!areas || areas.length === 0) return '-';
    return areas.map(a => serviceAreaOptions.find(opt => opt.value === a)?.label || a).join(', ');
};
const formatRoles = (roleIds) => {
    if (!roleIds || roleIds.length === 0) return '-';
    return roleIds.map(id => roleOptions.value.find(opt => opt.id === id)?.name || id).join(', ');
};

const handleSearch = () => {
    pagination.currentPage = 1;
};
const handleSizeChange = (newSize) => {
  pagination.pageSize = newSize;
  pagination.currentPage = 1;
};
const handleCurrentChange = (newPage) => {
  pagination.currentPage = newPage;
};

const resetForm = () => {
  Object.assign(supplierForm, JSON.parse(JSON.stringify(initialFormState)));
   supplierForm.contacts = [];
   supplierForm.associatedRoles = [];
   supplierForm.costs = []; // 重置成本信息
   
  nextTick(() => {
    supplierFormRef.value?.clearValidate();
  });
};

const addContact = () => {
    if (!supplierForm.contacts) {
        supplierForm.contacts = [];
    }
    supplierForm.contacts.push({ name: '', phone: '', position: '', qq: '', email: '', remark: '' });
};
const removeContact = (index) => {
    if (supplierForm.contacts) {
        supplierForm.contacts.splice(index, 1);
    }
};

const handleAddSupplier = () => {
  resetForm();
  activeTabName.value = 'basicInfo'; // 确保打开时显示基础信息Tab
  isEditMode.value = false;
  dialogTitle.value = '新增供应商';
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  resetForm(); 
  activeTabName.value = 'basicInfo'; // 确保打开时显示基础信息Tab
  isEditMode.value = true;
  dialogTitle.value = '编辑供应商';
  const rowData = JSON.parse(JSON.stringify(row));
  // 模拟成本数据 - 实际应从后端获取
   if (!rowData.costs) {
       rowData.costs = generateMockCosts(rowData.id);
   }
  Object.assign(supplierForm, rowData);
   if (!supplierForm.contacts) {
       supplierForm.contacts = [];
   }
   if (!supplierForm.associatedRoles) {
       supplierForm.associatedRoles = [];
   }
   if (!supplierForm.costs) {
      supplierForm.costs = [];
   }
   supplierForm.industryTypes = ['transportation']; 

  dialogVisible.value = true;
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除供应商 "${row.name}" 吗?`, '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      console.log('删除供应商:', row.id);
      const index = allSuppliers.value.findIndex(s => s.id === row.id);
      if (index !== -1) {
        allSuppliers.value.splice(index, 1);
        ElMessage.success('删除成功');
      } else {
          ElMessage.error('删除失败');
      }
    })
    .catch(() => {
      // ElMessage.info('取消删除');
    });
};

const handleDialogClose = () => {
  resetForm();
  showCostHistory.value = false; // 关闭可能打开的子弹窗
  viewCostDetailVisible.value = false;
  addEditCostVisible.value = false;
};

const handleSubmit = async () => {
  if (!supplierFormRef.value) return;
  try {
    await supplierFormRef.value.validate();

    supplierForm.industryTypes = ['transportation'];

    const submittedData = JSON.parse(JSON.stringify(supplierForm));
    console.log('提交的表单数据:', submittedData);
    
    if (isEditMode.value) {
      const index = allSuppliers.value.findIndex(s => s.id === submittedData.id);
      if (index !== -1) {
         const originalSupplier = allSuppliers.value[index];
         const updatedSupplier = { ...originalSupplier, ...submittedData };

         if(submittedData.contacts && submittedData.contacts.length > 0) {
             updatedSupplier.primaryContact = {
                 name: submittedData.contacts[0].name,
                 phone: submittedData.contacts[0].phone
             };
         } else {
             updatedSupplier.primaryContact = { name: '-', phone: '-' };
         }
        
         allSuppliers.value[index] = updatedSupplier;
         ElMessage.success('供应商信息更新成功');
      } else {
           ElMessage.error('更新失败: 未找到供应商');
      }
    } else {
      const newId = Date.now();
      const newSupplier = {
          ...submittedData,
          id: newId,
          supplierCode: `SUP${String(2024000 + allSuppliers.value.length + 1)}`,
          primaryContact: (submittedData.contacts && submittedData.contacts.length > 0) 
                          ? { name: submittedData.contacts[0].name, phone: submittedData.contacts[0].phone }
                          : { name: '-', phone: '-' }
      };
      allSuppliers.value.push(newSupplier);
      ElMessage.success('供应商新增成功');
    }
    dialogVisible.value = false;
  } catch (error) {
    console.log('表单验证失败:', error);
    ElMessage.error('请检查表单填写是否完整且正确');
  }
};

// --- 成本管理相关状态 ---
const showCostHistory = ref(false); // 控制历史报价弹窗
const viewCostDetailVisible = ref(false); // 控制查看报价详情弹窗
const currentViewingCost = ref(null); // 当前查看的报价详情
const addEditCostVisible = ref(false); // 控制新增/编辑报价弹窗
const isEditCostMode = ref(false);
const costFormRef = ref(null);
const quoteTypes = ['FBA', 'FBX', '直送', '拆柜', '提柜']; // 添加费用类型选项
const costForm = reactive({ // 新增/编辑报价的表单
    id: null,
    feeName: '',
    quoteType: 'FBA', // 默认FBA类型
    effectiveDate: '',
    endDate: '',
    remarks: '',
    effectiveStatus: 'pending', // 默认待生效
    details: [], // 新增：用于存储FBA式的明细
    serviceWarehouse: '', // 新增：服务仓库
});
const costStatusOptions = [
    { value: 'active', label: '生效中', tag: 'success' },
    { value: 'pending', label: '待生效', tag: 'warning' },
    { value: 'expired', label: '已过期', tag: 'info' },
    { value: 'ended', label: '已结束', tag: 'danger' },
];

// --- 计算属性 ---
const currentCosts = computed(() => {
    // 实际应用中，这里应该是 supplierForm.costs.filter(...) 来区分当前和历史
    return supplierForm.costs?.filter(c => c.effectiveStatus === 'active' || c.effectiveStatus === 'pending') || [];
});
const historyCosts = computed(() => {
    // 实际应用中，这里应该是 supplierForm.costs.filter(...)
     return supplierForm.costs?.filter(c => c.effectiveStatus === 'expired' || c.effectiveStatus === 'ended') || [];
});

// --- 方法 ---
const formatCostStatus = (status) => costStatusOptions.find(opt => opt.value === status)?.label || status;
const getCostStatusTagType = (status) => costStatusOptions.find(opt => opt.value === status)?.tag || 'info';

const handleSaveCost = async () => {
     // TODO: 添加 costForm 的验证逻辑 (if needed using costFormRef.value.validate())
     console.log('保存报价:', costForm);
    if (!supplierForm.costs) {
        supplierForm.costs = [];
    }

    if (isEditCostMode.value) { // 实际编辑逻辑需要根据后端API调整
         ElMessage.info('编辑报价功能暂未实现');
        // const index = supplierForm.costs.findIndex(c => c.id === costForm.id);
        // if (index !== -1) {
        //     supplierForm.costs[index] = { ...costForm };
        //     ElMessage.success('报价更新成功');
        // }
    } else { // 新增
         const newCost = {
            ...costForm,
            id: Date.now(), // 临时ID
            effectiveStatus: 'pending' // 新增的默认为待生效
         };
         supplierForm.costs.push(newCost);
         ElMessage.success('报价新增成功');
    }
     addEditCostVisible.value = false;
};

const handleActivateCost = (cost) => {
     ElMessageBox.confirm(`确定要将报价 "${cost.feeName}" 设为生效状态吗?`, '确认生效', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
           const targetCost = supplierForm.costs.find(c => c.id === cost.id);
           if (targetCost) {
                targetCost.effectiveStatus = 'active';
                 // TODO: 可能需要调用API更新后端状态
                ElMessage.success('报价已生效');
           }
      }).catch(() => {});
};

const handleEndCost = (cost) => {
     ElMessageBox.confirm(`确定要结束当前生效的报价 "${cost.feeName}" 吗?结束后不可恢复。`, '确认结束报价', {
        confirmButtonText: '确定结束',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
           const targetCost = supplierForm.costs.find(c => c.id === cost.id);
           if (targetCost) {
                targetCost.effectiveStatus = 'ended'; // 或 'expired'，根据业务定义
                 targetCost.endDate = new Date().toISOString().split('T')[0]; // 记录结束日期为今天
                 // TODO: 可能需要调用API更新后端状态
                ElMessage.success('报价已结束');
           }
      }).catch(() => {});
};

const handleViewCost = (cost) => {
    console.log('查看报价详情:', cost);
    currentViewingCost.value = cost; // 存储当前查看的报价信息
    viewCostDetailVisible.value = true;
    // 在这里可以加载报价详情，或者打开一个新的组件/页面
    // ElMessage.info(`查看报价 ${cost.feeName} 的详情 (功能待实现)`);
};

// 模拟生成成本数据
const generateMockCosts = (supplierId) => {
    const costs = [];
    const types = ['FBA固定报价', '卡车派送', '海运附加费'];
    const locations = ['LA', 'NY', 'SAV', 'DAL'];
    const count = Math.floor(Math.random() * 3) + 1; // 1-3条报价

    for(let i = 0; i < count; i++) {
        const statusRand = Math.random();
        let status = 'pending';
        let quoteType = quoteTypes[i % quoteTypes.length]; // 使用费用类型数组
        if (statusRand < 0.4) status = 'active';
        else if (statusRand < 0.7) status = 'expired';

        const startDate = new Date(2023 + Math.floor(Math.random()*2), Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1);
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + Math.floor(Math.random() * 12) + 1); // 生效1-12个月

        // Generate details only for FBA type for example
        let costDetails = [];
        const feeName = `${types[i % types.length]}-${locations[i % locations.length]}`;
        if (quoteType === 'FBA') {
            const detailCount = Math.floor(Math.random() * 10) + 5; // 5-14 warehouse details
            for (let j = 0; j < detailCount; j++) {
                const warehouseCodes = ['ONT9', 'HOU2', 'XUS8', 'FTW1', 'FTW2', 'RIC1', 'RIC2', 'RIC3', 'BF11', 'BF13', 'XUSD', 'BF14', 'BF15'];
                const states = ['CA', 'TX', 'VA', 'WA'];
                const cities = ['Redlands', 'Houston', 'Dallas', 'Petersburg', 'Richmond', 'Sumner', 'Dupont', 'Stockton', 'Kent'];
                const palletRules = ['96inch', '72inch', '不限高', '80inch'];
                costDetails.push({
                    id: `detail_${supplierId}_${i+1}_${j+1}`,
                    platform: 'Amazon',
                    warehouseCode: warehouseCodes[j % warehouseCodes.length],
                    country: 'US',
                    state: states[j % states.length],
                    city: cities[j % cities.length],
                    address: `${1000 + j * 150} Mock Warehouse St, ${cities[j % cities.length]}`, 
                    zipcode: `${90000 + j * 10}-${1000 + j}`,
                    price: parseFloat((Math.random() * 1000 + 100).toFixed(2)),
                    palletRule: palletRules[j % palletRules.length]
                });
            }
        }

        costs.push({
            id: `cost_${supplierId}_${i+1}`,
            feeName: feeName,
            quoteType: quoteType,
            effectiveDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            effectiveStatus: status,
            remarks: `这是第 ${i+1} 条模拟报价备注信息 (${status})`,
            details: costDetails, // Add details array
        });
    }
    // Ensure at least one active/pending for testing
    if (!costs.some(c => c.effectiveStatus === 'active' || c.effectiveStatus === 'pending')) {
        if(costs.length > 0) costs[0].effectiveStatus = Math.random() > 0.5 ? 'active' : 'pending';
    }
     // Add some ended ones
     const endedCount = Math.floor(Math.random() * 2);
     for(let i=0; i< endedCount; i++) {
         const startDate = new Date(2022, Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1);
         const endDate = new Date(startDate);
         endDate.setMonth(startDate.getMonth() + Math.floor(Math.random() * 6) + 1);
         // Generate details for ended FBA quotes too for history viewing
         let endedDetails = [];
         const feeName = `${types[(i+1) % types.length]}-历史-${locations[(i+1) % locations.length]}`;
         let quoteType = quoteTypes[(i+1) % quoteTypes.length]; // 为历史记录也添加费用类型
         if (quoteType === 'FBA') {
             const detailCount = Math.floor(Math.random() * 5) + 2; // 2-6 details
             for (let j = 0; j < detailCount; j++) {
                 // Simplified details for ended quotes
                  endedDetails.push({
                     id: `ended_detail_${supplierId}_${i+1}_${j+1}`,
                     platform: 'Amazon', warehouseCode: `WH${100+j}`, country: 'US', state: 'CA', city: 'Old City',
                     address: `${j+1} Old St`, zipcode: '99999', price: parseFloat((Math.random() * 50 + 50).toFixed(2)), palletRule: '72inch'
                 });
             }
         }

          costs.push({
            id: `cost_${supplierId}_ended_${i+1}`,
            feeName: feeName,
            quoteType: quoteType,
            effectiveDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            effectiveStatus: 'ended', // 'expired' or 'ended'
            remarks: `这是第 ${i+1} 条模拟已结束报价 (${quoteType})`,
            details: endedDetails,
        });
     }

    return costs;
};

// 服务仓库选项
const serviceWarehouseOptions = [
    { value: 'west1', label: '美西一号仓' },
    { value: 'west2', label: '美西二号仓' },
    { value: 'east', label: '美东仓' }
];

onMounted(() => {
  generateMockSuppliers();
});

</script>

<style scoped>
.supplier-list-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-form .el-form-item {
  margin-bottom: 10px;
  margin-right: 15px;
}
.el-table {
  margin-top: 15px;
}
.dialog-footer {
  text-align: right;
}
.el-divider {
    margin: 25px 0;
}
:deep(.el-divider__text.is-left) {
    font-weight: bold;
    color: #303133;
}
/* Make sure form inside tab has scroll */
.el-dialog .el-form {
    /* max-height: 65vh; /* Adjust as needed */
    /* overflow-y: auto; */
    /* padding-right: 10px; /* Avoid scrollbar overlap */
}
</style> 