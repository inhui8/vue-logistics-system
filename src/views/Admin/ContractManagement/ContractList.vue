<template>
  <div class="contract-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>合同列表</span>
           <el-button type="primary" @click="handleCreateContract">
             <el-icon><Plus /></el-icon> 新增合同
           </el-button>
        </div>
      </template>

      <!-- 筛选区域 -->
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="合同编号/名称">
           <el-input v-model="filterForm.keyword" placeholder="输入编号或名称关键字" clearable />
         </el-form-item>
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
         <el-form-item label="合同类型">
           <el-select v-model="filterForm.contractType" placeholder="选择类型" clearable>
             <el-option v-for="item in contractTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
           </el-select>
         </el-form-item>
         <el-form-item label="合同状态">
           <el-select v-model="filterForm.status" placeholder="选择状态" clearable>
             <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
           </el-select>
         </el-form-item>
         <el-form-item label="有效期">
           <el-date-picker
              v-model="filterForm.validityRange"
              type="daterange"
              range-separator="至"
              start-placeholder="生效开始"
              end-placeholder="到期结束"
              value-format="YYYY-MM-DD"
            />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 合同列表 -->
      <el-table :data="filteredContractList" style="width: 100%" border>
         <el-table-column prop="contractNumber" label="合同编号" width="160" fixed="left" sortable />
         <el-table-column prop="contractName" label="合同名称" min-width="220" show-overflow-tooltip />
         <el-table-column prop="supplierName" label="供应商" width="200" show-overflow-tooltip />
         <el-table-column prop="contractType" label="合同类型" width="130">
            <template #default="scope">{{ formatContractType(scope.row.contractType) }}</template>
         </el-table-column>
         <el-table-column prop="amount" label="合同金额 (USD)" width="150" align="right">
             <template #default="scope">
                {{ scope.row.amount ? scope.row.amount.toFixed(2) : '-' }}
             </template>
         </el-table-column>
         <el-table-column prop="effectiveDate" label="生效日期" width="120" sortable />
         <el-table-column prop="expiryDate" label="到期日期" width="120" sortable />
         <el-table-column prop="status" label="状态" width="120" align="center">
            <template #default="scope">
               <el-tag :type="getStatusTagType(scope.row.status)">
                 {{ formatStatus(scope.row.status) }}
               </el-tag>
            </template>
         </el-table-column>
          <el-table-column prop="creator" label="创建人" width="100" />
          <el-table-column prop="createdAt" label="创建时间" width="160" />
         <el-table-column label="附件数" width="80" align="center">
             <template #default="scope">
                 {{ scope.row.attachments?.length || 0 }}
             </template>
         </el-table-column>
        <el-table-column label="操作" fixed="right" width="280">
          <template #default="scope">
             <el-button text type="primary" size="small" @click="handleViewDetails(scope.row)">详情</el-button>
              <el-button text type="warning" size="small" @click="handleEdit(scope.row)" v-if="canEdit(scope.row)">编辑</el-button>
             <el-button text type="success" size="small" @click="handleSubmitReview(scope.row)" v-if="scope.row.status === 'draft'">提交审核</el-button>
             <el-dropdown size="small" style="margin-left: 8px;">
                <el-button text type="info" size="small">更多<el-icon class="el-icon--right"><arrow-down /></el-icon></el-button>
                <template #dropdown>
                    <el-dropdown-menu>
                       <el-dropdown-item @click="handleUploadAttachment(scope.row)" :icon="Upload">上传附件</el-dropdown-item>
                       <el-dropdown-item @click="handleDownloadAttachment(scope.row)" :icon="Download" :disabled="!scope.row.attachments || scope.row.attachments.length === 0">下载附件</el-dropdown-item>
                       <el-dropdown-item @click="handleViewHistory(scope.row)" :icon="Tickets">查看历史</el-dropdown-item>
                       <el-dropdown-item @click="handleTerminate(scope.row)" v-if="canTerminate(scope.row)" divided :icon="CircleCloseFilled">终止合同</el-dropdown-item>
                       <el-dropdown-item @click="handleRenew(scope.row)" v-if="canRenew(scope.row)" :icon="RefreshRight">发起续签</el-dropdown-item>
                       <!-- 审批操作可以放在详情里，或者根据权限显示 -->
                       <el-dropdown-item @click="handleApprove(scope.row)" v-if="scope.row.status === 'pending_review'" divided :icon="CircleCheck">审核合同</el-dropdown-item> 
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
          :total="totalContracts"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          :current-page="pagination.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />

      <!-- 新增/编辑/详情 弹窗 (占位) -->
       <el-dialog
         v-model="dialogVisible"
         :title="dialogTitle"
         width="70%"
         top="5vh"
         :close-on-click-modal="false"
         @close="resetForm"
       >
         <el-form ref="contractFormRef" :model="contractForm" :rules="formRules" label-width="100px">
            <el-row :gutter="20">
                <el-col :span="12">
                   <el-form-item label="合同名称" prop="contractName">
                     <el-input v-model="contractForm.contractName" placeholder="输入合同名称" :disabled="!isEditing"/>
                   </el-form-item>
                </el-col>
                <el-col :span="12">
                   <el-form-item label="合同编号" prop="contractNumber">
                     <el-input v-model="contractForm.contractNumber" placeholder="系统自动生成或手动输入" :disabled="!isEditing"/>
                   </el-form-item>
                </el-col>
            </el-row>
             <el-row :gutter="20">
                <el-col :span="12">
                   <el-form-item label="供应商" prop="supplierId">
                      <el-select v-model="contractForm.supplierId" placeholder="选择供应商" filterable style="width: 100%;" :disabled="!isEditing">
                           <el-option
                             v-for="supplier in mockSuppliers"
                             :key="supplier.id"
                             :label="supplier.name"
                             :value="supplier.id"
                           />
                        </el-select>
                   </el-form-item>
                </el-col>
                <el-col :span="12">
                   <el-form-item label="合同类型" prop="contractType">
                        <el-select v-model="contractForm.contractType" placeholder="选择类型" style="width: 100%;" :disabled="!isEditing">
                         <el-option v-for="item in contractTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                       </el-select>
                   </el-form-item>
                </el-col>
            </el-row>
             <el-row :gutter="20">
                <el-col :span="12">
                   <el-form-item label="生效日期" prop="effectiveDate">
                       <el-date-picker v-model="contractForm.effectiveDate" type="date" placeholder="选择日期" style="width: 100%;" value-format="YYYY-MM-DD" :disabled="!isEditing"/>
                   </el-form-item>
                </el-col>
                <el-col :span="12">
                   <el-form-item label="到期日期" prop="expiryDate">
                        <el-date-picker v-model="contractForm.expiryDate" type="date" placeholder="选择日期" style="width: 100%;" value-format="YYYY-MM-DD" :disabled="!isEditing"/>
                   </el-form-item>
                </el-col>
            </el-row>
             <el-form-item label="合同金额 (USD)">
                 <el-input-number v-model="contractForm.amount" :precision="2" :step="1000" placeholder="可选" style="width: 250px;" :disabled="!isEditing"/>
             </el-form-item>
             <el-form-item label="合同内容/条款">
                 <el-input v-model="contractForm.content" type="textarea" :rows="5" placeholder="输入合同主要内容或条款摘要" :disabled="!isEditing"/>
             </el-form-item>
             
             <!-- 附件列表 (查看详情时显示) -->
              <el-form-item label="附件列表" v-if="!isEditing">
                <div v-if="contractForm.attachments && contractForm.attachments.length > 0">
                    <div v-for="(file, index) in contractForm.attachments" :key="index" class="attachment-item">
                       <el-icon><Document /></el-icon> 
                       <span style="margin-left: 5px;">{{ file.name }} ({{ (file.size / 1024).toFixed(1) }} KB)</span>
                       <el-button text type="primary" size="small" @click="downloadSingleAttachment(file)" style="margin-left: 15px;">下载</el-button>
                       <el-button text type="danger" size="small" @click="removeAttachment(index)">删除</el-button>
                    </div>
                </div>
                <el-empty v-else description="暂无附件" :image-size="50"/>
             </el-form-item>

              <!-- 状态历史 (查看详情时显示) -->
             <el-form-item label="状态历史" v-if="!isEditing && contractForm.statusHistory && contractForm.statusHistory.length > 0">
                <el-timeline style="margin-top: 10px;">
                    <el-timeline-item
                      v-for="(item, index) in contractForm.statusHistory"
                      :key="index"
                      :timestamp="item.timestamp"
                      :type="item.type || 'primary'"
                     >
                      {{ item.operator }} {{ item.action }} {{ item.status ? `(状态变为: ${formatStatus(item.status)})` : '' }} {{ item.comment ? `- ${item.comment}` : '' }}
                    </el-timeline-item>
                </el-timeline>
             </el-form-item>

              <!-- 上传组件 (编辑/新增时) -->
             <el-form-item label="上传附件" v-if="isEditing">
                <el-upload
                   v-model:file-list="contractForm.uploadFiles"
                   action="#" 
                   :auto-upload="false"
                   multiple
                   :on-change="handleFileChange"
                   :on-remove="handleFileRemove"
                 >
                   <el-button type="primary">选择文件</el-button>
                   <template #tip>
                     <div class="el-upload__tip">
                        可以将合同扫描件等文件上传
                     </div>
                   </template>
                 </el-upload>
             </el-form-item>
         </el-form>

         <template #footer>
           <span class="dialog-footer">
             <el-button @click="dialogVisible = false">取消</el-button>
             <el-button type="primary" @click="handleSubmit" :loading="submitting" v-if="isEditing">确认</el-button>
           </span>
         </template>
       </el-dialog>

    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Upload, Download, Tickets, CircleCloseFilled, RefreshRight, ArrowDown, Document, CircleCheck } from '@element-plus/icons-vue';

// --- 模拟数据 ---
const mockSuppliers = ref([
  { id: 'supplier_1', name: '测试供应商A - 专做提框服务' },
  { id: 'supplier_2', name: '测试供应商B - FBA派送专家' },
  { id: 'supplier_3', name: '测试供应商C - 全能型选手' },
]);

const allContracts = ref([]);

const contractTypeOptions = [
    { value: 'framework', label: '年度框架协议' },
    { value: 'transport', label: '单次运输合同' },
    { value: 'warehouse', label: '仓储服务合同' },
    { value: 'spot_quote', label: '临时报价协议' },
    { value: 'other', label: '其他' },
];

const statusOptions = [
  { value: 'draft', label: '草稿', tag: 'info' },
  { value: 'pending_review', label: '待审核', tag: 'warning' },
  { value: 'active', label: '生效中', tag: 'success' },
  { value: 'expired', label: '已到期', tag: 'default' },
  { value: 'terminated', label: '已终止', tag: 'danger' },
  { value: 'rejected', label: '已驳回', tag: 'danger' },
];

const generateMockContracts = (count = 40) => {
  const names = ['年度运输框架协议', '旺季仓储服务合同', '专线运输协议', '临时加车协议'];
  const creators = ['张三', '李四', '王五'];
  const mockData = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const supplier = mockSuppliers.value[Math.floor(Math.random() * mockSuppliers.value.length)];
    const contractType = contractTypeOptions[Math.floor(Math.random() * contractTypeOptions.length)].value;
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)].value;
    const createdAt = new Date(now.getTime() - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000)); // 半年内
    let effectiveDate, expiryDate;
    if (contractType === 'framework') {
        effectiveDate = new Date(createdAt.getFullYear(), createdAt.getMonth() + 1, 1); // 次月1号生效
        expiryDate = new Date(effectiveDate.getFullYear() + 1, effectiveDate.getMonth(), effectiveDate.getDate() -1); // 有效期一年
    } else {
        effectiveDate = new Date(createdAt.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
        expiryDate = new Date(effectiveDate.getTime() + (Math.random() * 60 + 30) * 24 * 60 * 60 * 1000); // 30-90天有效期
    }

    // 模拟附件
    let attachments = [];
    if (Math.random() > 0.3) {
        const fileCount = Math.floor(Math.random() * 3) + 1;
        for(let j=0; j<fileCount; j++) {
            attachments.push({ 
                name: `合同附件_${i}_${j+1}.pdf`, 
                url: `/path/to/mock/file_${i}_${j}.pdf`, // 模拟 URL
                size: Math.floor(Math.random() * 2048 + 512) * 1024 // 512KB - 2.5MB
            });
        }
    }
    
    // 模拟状态历史
     let statusHistory = [
         { timestamp: createdAt.toLocaleString(), operator: creators[Math.floor(Math.random()*creators.length)], action: '创建合同', status: 'draft', type:'info' },
     ];
     if (status !== 'draft') {
         statusHistory.push({ timestamp: new Date(createdAt.getTime() + 1*60*60*1000).toLocaleString(), operator: '系统', action: '提交审核', status: 'pending_review', type: 'primary' });
     }
     if (status === 'active' || status === 'expired' || status === 'terminated') {
         statusHistory.push({ timestamp: new Date(createdAt.getTime() + 1*24*60*60*1000).toLocaleString(), operator: '审批经理', action: '审核通过', status: 'active', type: 'success' });
     }
      if (status === 'rejected') {
         statusHistory.push({ timestamp: new Date(createdAt.getTime() + 1*24*60*60*1000).toLocaleString(), operator: '审批经理', action: '审核驳回', status: 'rejected', comment: '条款不清', type: 'danger' });
     }
      if (status === 'terminated') {
          statusHistory.push({ timestamp: new Date(expiryDate.getTime() - 10*24*60*60*1000).toLocaleString(), operator: '法务部', action: '手动终止', status: 'terminated', comment: '协商一致', type: 'danger' });
      }
      if (status === 'expired') {
            // 可能没有额外记录，或者有一个系统自动标记过期的记录
      }

    // 修正状态：如果有效期已过，则状态应为 expired (除非已终止)
     let finalStatus = status;
     if (status !== 'terminated' && new Date(expiryDate) < now) {
         finalStatus = 'expired';
     }

    mockData.push({
      id: `CON-${String(createdAt.getFullYear())}${String(i + 1000).slice(1)}`,
      contractNumber: `CON-${String(createdAt.getFullYear())}${String(i + 1000).slice(1)}`,
      contractName: `${supplier.name} ${names[Math.floor(Math.random() * names.length)]} ${createdAt.getFullYear()}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      contractType: contractType,
      amount: contractType === 'framework' ? null : parseFloat((Math.random() * 50000 + 5000).toFixed(2)), // 框架协议可能无固定金额
      effectiveDate: effectiveDate.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      status: finalStatus,
      content: `这是合同 ${i+1} 的主要内容摘要...`, // 简化
      creator: creators[Math.floor(Math.random() * creators.length)],
      createdAt: createdAt.toLocaleString(),
      attachments: attachments,
      statusHistory: statusHistory.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp)), // 按时间排序
      uploadFiles: [] // 用于 el-upload
    });
  }
  return mockData;
};

// --- 筛选与分页 ---
const filterForm = reactive({
  keyword: '',
  supplierId: '',
  contractType: '',
  status: '',
  validityRange: [],
});

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
});

const totalContracts = computed(() => filteredContractsData.value.length);

// 过滤逻辑
const filteredContractsData = computed(() => {
  return allContracts.value.filter(contract => {
    const keywordMatch = filterForm.keyword ? (contract.contractNumber.includes(filterForm.keyword) || contract.contractName.includes(filterForm.keyword)) : true;
    const supplierMatch = filterForm.supplierId ? contract.supplierId === filterForm.supplierId : true;
    const typeMatch = filterForm.contractType ? contract.contractType === filterForm.contractType : true;
    const statusMatch = filterForm.status ? contract.status === filterForm.status : true;
    const dateMatch = filterForm.validityRange && filterForm.validityRange.length === 2
      ? (contract.effectiveDate <= filterForm.validityRange[1] && contract.expiryDate >= filterForm.validityRange[0]) // 时间范围有交集
      : true;
    return keywordMatch && supplierMatch && typeMatch && statusMatch && dateMatch;
  });
});

// 分页逻辑
const filteredContractList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
   // 默认按创建时间降序
   return filteredContractsData.value.slice(start, end).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

// --- 弹窗与表单 ---
const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEditing = ref(false); // true: 新增/编辑模式, false: 查看详情模式
const contractFormRef = ref(null);
const submitting = ref(false);

const initialFormState = {
  id: null,
  contractNumber: '',
  contractName: '',
  supplierId: '',
  contractType: '',
  amount: null,
  effectiveDate: '',
  expiryDate: '',
  content: '',
  status: 'draft',
  attachments: [],
  statusHistory: [],
  uploadFiles: [], // 用于 el-upload 的 file list
};
const contractForm = reactive({ ...initialFormState });

// 表单验证规则 (简化)
const formRules = reactive({
  contractName: [{ required: true, message: '请输入合同名称', trigger: 'blur' }],
  supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  contractType: [{ required: true, message: '请选择合同类型', trigger: 'change' }],
  effectiveDate: [{ required: true, message: '请选择生效日期', trigger: 'change' }],
  expiryDate: [{ required: true, message: '请选择到期日期', trigger: 'change' }], // 可加校验：到期日期 > 生效日期
});

// --- 方法 ---
// 格式化
const formatContractType = (type) => contractTypeOptions.find(opt => opt.value === type)?.label || type;
const formatStatus = (status) => statusOptions.find(opt => opt.value === status)?.label || status;
const getStatusTagType = (status) => statusOptions.find(opt => opt.value === status)?.tag || 'info';

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

// 重置表单
const resetForm = () => {
  Object.assign(contractForm, initialFormState);
  contractForm.uploadFiles = []; // 确保 uploadFiles 也被清空
  nextTick(() => {
    contractFormRef.value?.clearValidate();
  });
};

// 判断是否可编辑
const canEdit = (row) => row.status === 'draft' || row.status === 'rejected';
// 判断是否可终止
const canTerminate = (row) => row.status === 'active';
// 判断是否可续签 (简单逻辑：快到期或已到期)
const canRenew = (row) => {
    if (row.status === 'terminated') return false;
    const expiry = new Date(row.expiryDate);
    const now = new Date();
    const oneMonthLater = new Date(now.setDate(now.getDate() + 30));
    return expiry <= oneMonthLater;
};

// 新增合同
const handleCreateContract = () => {
  resetForm();
  isEditing.value = true;
  dialogTitle.value = '新增合同';
  dialogVisible.value = true;
};

// 编辑合同
const handleEdit = (row) => {
  resetForm();
  isEditing.value = true;
  dialogTitle.value = '编辑合同';
  // 深拷贝数据到表单
  Object.assign(contractForm, JSON.parse(JSON.stringify(row)));
   // 将已有的附件模拟成 el-upload 需要的格式
   contractForm.uploadFiles = contractForm.attachments.map(file => ({ 
      name: file.name, 
      // url: file.url, // 如果需要预览，可能需要 URL
      status: 'success', // 标记为已上传成功状态
      uid: Date.now() + Math.random(), // 给个唯一ID
      raw: { type: 'application/pdf' } // 模拟文件类型
   }));
  dialogVisible.value = true;
};

// 查看详情
const handleViewDetails = (row) => {
  resetForm();
  isEditing.value = false;
  dialogTitle.value = '合同详情';
  Object.assign(contractForm, JSON.parse(JSON.stringify(row)));
  dialogVisible.value = true;
};

// 提交审核 (模拟)
const handleSubmitReview = (row) => {
   ElMessageBox.confirm(`确定要将合同 "${row.contractName}" 提交审核吗?`, '确认提交', { type: 'warning' })
     .then(() => {
       console.log('提交审核:', row.id);
       const index = allContracts.value.findIndex(c => c.id === row.id);
       if (index !== -1 && allContracts.value[index].status === 'draft') {
          allContracts.value[index].status = 'pending_review';
          // 添加状态历史
           if (!allContracts.value[index].statusHistory) allContracts.value[index].statusHistory = [];
           allContracts.value[index].statusHistory.push({timestamp: new Date().toLocaleString(), operator: '当前用户', action: '提交审核', status: 'pending_review', type:'primary' });
           
         ElMessage.success('提交审核成功');
       } else {
           ElMessage.error('操作失败或状态不允许提交');
       }
     })
     .catch(() => {});
};

// 审核合同 (占位 - 打开详情并显示审核按钮/区域)
const handleApprove = (row) => {
    handleViewDetails(row); // 先打开详情
    ElMessage.info('显示审核操作区域 (待实现)');
    // 可以在详情弹窗中增加审核通过/驳回的按钮和意见输入框
};

// 上传附件 (占位)
const handleUploadAttachment = (row) => {
    console.log('为合同上传附件:', row.id);
    ElMessage.info(`触发 ${row.contractNumber} 的附件上传操作 (待实现)`);
    // 实际应用会打开文件选择框，或集成到编辑弹窗的上传组件
};

// 下载附件 (模拟全部下载)
const handleDownloadAttachment = (row) => {
    if (!row.attachments || row.attachments.length === 0) {
        ElMessage.warning('该合同没有附件可供下载');
        return;
    }
    console.log('下载合同附件:', row.id, row.attachments);
    ElMessage.success(`开始下载 ${row.attachments.length} 个附件 (模拟)`);
    // 实际应用中，可能需要逐个下载，或打包下载
};

// 下载单个附件 (模拟)
const downloadSingleAttachment = (file) => {
    console.log('下载单个附件:', file);
    ElMessage.success(`开始下载文件 ${file.name} (模拟)`);
    // window.open(file.url, '_blank'); // 如果 URL 可用
};

// 移除附件 (模拟，仅在编辑状态下)
const removeAttachment = (index) => {
    if (contractForm.attachments) {
        contractForm.attachments.splice(index, 1);
        // 如果 uploadFiles 也存在对应文件，也需要移除
        // 此处简化，假设只操作 attachments
        ElMessage.success('附件已移除 (未保存)');
    }
};

// 查看历史 (占位)
const handleViewHistory = (row) => {
    console.log('查看合同历史:', row.id);
    // 可以复用详情弹窗显示历史记录
    handleViewDetails(row);
    ElMessage.info('已在详情中展示状态历史 (附件变更历史待实现)');
};

// 终止合同 (模拟)
const handleTerminate = (row) => {
     ElMessageBox.prompt('请输入终止原因 (可选)', '确认终止合同', {
        confirmButtonText: '确认终止',
        cancelButtonText: '取消',
        type: 'warning',
      })
      .then(({ value }) => {
         console.log('终止合同:', row.id, '原因:', value);
         const index = allContracts.value.findIndex(c => c.id === row.id);
         if (index !== -1 && allContracts.value[index].status === 'active') {
            allContracts.value[index].status = 'terminated';
             // 添加状态历史
             if (!allContracts.value[index].statusHistory) allContracts.value[index].statusHistory = [];
             allContracts.value[index].statusHistory.push({timestamp: new Date().toLocaleString(), operator: '当前用户', action: '终止合同', status: 'terminated', comment: value, type:'danger' });
            ElMessage.success('合同已终止');
         } else {
              ElMessage.error('操作失败或合同状态不符');
         }
       })
      .catch(() => {});
};

// 发起续签 (占位)
const handleRenew = (row) => {
    console.log('发起合同续签:', row.id);
    ElMessage.info(`基于合同 ${row.contractNumber} 发起续签流程 (待实现)`);
    // 实际可能跳转到新增合同页面，并预填部分信息
};

// 处理文件列表变化 (el-upload)
const handleFileChange = (uploadFile, uploadFiles) => {
    console.log('File changed:', uploadFile, uploadFiles);
    contractForm.uploadFiles = uploadFiles; 
};

// 处理文件移除 (el-upload)
const handleFileRemove = (uploadFile, uploadFiles) => {
    console.log('File removed:', uploadFile, uploadFiles);
    contractForm.uploadFiles = uploadFiles;
};


// 提交表单 (新增/编辑)
const handleSubmit = async () => {
  if (!contractFormRef.value) return;
  try {
    await contractFormRef.value.validate();
    submitting.value = true;
    
    // 模拟处理上传的文件 (实际需要上传到服务器)
    const uploadedAttachments = contractForm.uploadFiles
      .filter(f => f.status === 'ready' || f.status === 'success') // 假设 status 是 success 或刚选的 ready
      .map(f => ({
          name: f.name,
          url: `/mock/path/${f.uid}/${f.name}`, // 模拟服务器返回的 URL
          size: f.size
      }));
      
    // 合并旧附件和新上传的附件 (如果是在编辑状态下)
     let finalAttachments = [];
     if (contractForm.id) { // 编辑状态
        // 需要区分哪些是旧的，哪些是新增的，哪些是删除了的
        // 简化处理：直接使用 uploadFiles 里的文件作为最终附件列表
        finalAttachments = contractForm.uploadFiles.map(f => ({ name: f.name, url: f.url || `/mock/path/${f.uid}/${f.name}`, size: f.size || Math.random()*1000*1024 }));
     } else {
         finalAttachments = uploadedAttachments;
     }

    const saveData = { ...contractForm, attachments: finalAttachments };
    delete saveData.uploadFiles; // 不需要保存 uploadFiles 自身

    if (saveData.id) { // 编辑
      console.log('更新合同:', saveData);
      const index = allContracts.value.findIndex(c => c.id === saveData.id);
      if (index !== -1) {
          // 更新列表数据
         Object.assign(allContracts.value[index], saveData);
          // 添加编辑历史 (可选)
          if (!allContracts.value[index].statusHistory) allContracts.value[index].statusHistory = [];
          allContracts.value[index].statusHistory.push({timestamp: new Date().toLocaleString(), operator: '当前用户', action: '编辑合同内容', type:'info' });
         ElMessage.success('合同更新成功');
      } else {
          ElMessage.error('更新失败: 未找到合同');
      }
    } else { // 新增
      const newId = `CON-${String(new Date().getFullYear())}${String(Date.now()).slice(-4)}`;
      const newContract = {
          ...saveData,
          id: newId,
          contractNumber: saveData.contractNumber || newId,
          status: 'draft', // 新增默认是草稿
          creator: '当前用户',
          createdAt: new Date().toLocaleString(),
          statusHistory: [
              { timestamp: new Date().toLocaleString(), operator: '当前用户', action: '创建合同', status: 'draft', type:'info' }
          ]
      };
      console.log('新增合同:', newContract);
      allContracts.value.unshift(newContract);
      ElMessage.success('合同新增成功');
    }
    dialogVisible.value = false;
  } catch (error) {
    console.log('表单验证失败:', error);
    ElMessage.error('请检查表单填写是否正确');
  } finally {
    submitting.value = false;
  }
};

// --- 生命周期 ---
onMounted(() => {
  allContracts.value = generateMockContracts();
});

</script>

<style scoped>
.contract-list-container {
  padding: 20px;
}
.attachment-item {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
    font-size: 13px;
    color: #606266;
}
/* 其他样式与之前类似 */
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
.dialog-footer {
    text-align: right;
}
.dialog-footer button:first-child {
  margin-right: 10px;
}
.el-timeline {
    padding-left: 10px; 
}
</style> 