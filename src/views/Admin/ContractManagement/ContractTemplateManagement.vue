<template>
  <div class="contract-template-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>合同模板管理</span>
           <el-button type="primary" @click="handleUploadTemplate">
             <el-icon><Upload /></el-icon> 上传新模板
           </el-button>
        </div>
      </template>

      <!-- 模板列表 -->
       <el-table :data="templateList" style="width: 100%" border>
         <el-table-column prop="name" label="模板名称" min-width="200" show-overflow-tooltip />
         <el-table-column prop="type" label="适用类型" width="150">
             <template #default="scope">{{ formatContractType(scope.row.type) }}</template>
         </el-table-column>
         <el-table-column prop="version" label="版本号" width="100" align="center"/>
         <el-table-column prop="uploader" label="上传人" width="120" />
         <el-table-column prop="uploadTime" label="上传时间" width="160" sortable />
         <el-table-column prop="fileSize" label="文件大小" width="120" align="right">
             <template #default="scope">{{ (scope.row.fileSize / 1024).toFixed(1) }} KB</template>
         </el-table-column>
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="scope">
             <el-button text type="primary" size="small" :icon="Download" @click="handleDownloadTemplate(scope.row)">下载</el-button>
             <el-button text type="info" size="small" :icon="Tickets" @click="handleViewVersions(scope.row)">历史版本</el-button> 
             <el-button text type="danger" size="small" :icon="Delete" @click="handleDeleteTemplate(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 无需分页，假设模板数量不多 -->

      <!-- 上传模板弹窗 -->
       <el-dialog
         v-model="uploadDialogVisible"
         title="上传新模板"
         width="500px"
         :close-on-click-modal="false"
         @close="resetUploadForm"
       >
         <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadFormRules" label-width="100px">
           <el-form-item label="模板名称" prop="name">
             <el-input v-model="uploadForm.name" placeholder="例如：年度框架协议模板" />
           </el-form-item>
           <el-form-item label="适用类型" prop="type">
              <el-select v-model="uploadForm.type" placeholder="选择模板适用的合同类型" style="width: 100%;">
                 <el-option v-for="item in contractTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
               </el-select>
           </el-form-item>
            <el-form-item label="版本号" prop="version">
             <el-input v-model="uploadForm.version" placeholder="例如：V1.0" />
           </el-form-item>
           <el-form-item label="选择文件" prop="file">
              <el-upload
                 ref="uploadRef"
                 v-model:file-list="uploadForm.fileList"
                 action="#" 
                 :limit="1"
                 :auto-upload="false"
                 :on-exceed="handleExceed"
                 :on-change="handleFileSelect"
               >
                 <template #trigger>
                    <el-button type="primary">选择文件</el-button>
                  </template>
                 <template #tip>
                   <div class="el-upload__tip text-red">
                      仅限上传 1 个文件 (如 .docx, .pdf)
                    </div>
                 </template>
               </el-upload>
           </el-form-item>
         </el-form>
         <template #footer>
           <span class="dialog-footer">
             <el-button @click="uploadDialogVisible = false">取消</el-button>
             <el-button type="primary" @click="submitUpload" :loading="uploading">确认上传</el-button>
           </span>
         </template>
       </el-dialog>

       <!-- 历史版本弹窗 (占位) -->
        <el-dialog v-model="versionDialogVisible" title="历史版本" width="60%">
            <p>模板名称: {{ currentTemplate?.name }}</p>
            <el-table :data="currentTemplate?.versions || []" border size="small" style="margin-top: 10px;">
                <el-table-column prop="version" label="版本号" width="100"/>
                <el-table-column prop="uploader" label="上传人" width="120" />
                <el-table-column prop="uploadTime" label="上传时间" width="160" />
                 <el-table-column prop="fileSize" label="文件大小" width="120">
                     <template #default="scope">{{ (scope.row.fileSize / 1024).toFixed(1) }} KB</template>
                 </el-table-column>
                 <el-table-column label="操作" width="100">
                     <template #default="scope">
                         <el-button text type="primary" size="small" :icon="Download" @click="handleDownloadTemplate(scope.row, true)">下载</el-button>
                     </template>
                 </el-table-column>
            </el-table>
            <template #footer>
                <el-button @click="versionDialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>

    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload, Download, Tickets, Delete } from '@element-plus/icons-vue';

// --- 模拟数据 ---
const templateList = ref([]);

const contractTypeOptions = [
    { value: 'framework', label: '年度框架协议' },
    { value: 'transport', label: '单次运输合同' },
    { value: 'warehouse', label: '仓储服务合同' },
    { value: 'nda', label: '保密协议' }, // 新增类型
    { value: 'other', label: '其他' },
];

const generateMockTemplates = () => {
  const mockData = [
    {
      id: 'tpl_1',
      name: '年度运输框架协议模板',
      type: 'framework',
      version: 'V2.1',
      uploader: '法务部A',
      uploadTime: '2024-03-15 10:30:00',
      fileUrl: '/path/to/template1_v2.1.docx',
      fileSize: 120 * 1024,
      versions: [
           { id: 'tpl_1_v2.1', version: 'V2.1', uploader: '法务部A', uploadTime: '2024-03-15 10:30:00', fileSize: 120 * 1024, fileUrl: '/path/to/template1_v2.1.docx' },
           { id: 'tpl_1_v2.0', version: 'V2.0', uploader: '法务部A', uploadTime: '2024-01-10 14:00:00', fileSize: 115 * 1024, fileUrl: '/path/to/template1_v2.0.docx' },
           { id: 'tpl_1_v1.0', version: 'V1.0', uploader: '张三', uploadTime: '2023-05-20 09:00:00', fileSize: 100 * 1024, fileUrl: '/path/to/template1_v1.0.docx' },
      ]
    },
    {
      id: 'tpl_2',
      name: '标准仓储服务合同模板',
      type: 'warehouse',
      version: 'V1.0',
      uploader: '仓库主管B',
      uploadTime: '2024-02-01 16:00:00',
      fileUrl: '/path/to/template2_v1.0.pdf',
      fileSize: 85 * 1024,
       versions: [
           { id: 'tpl_2_v1.0', version: 'V1.0', uploader: '仓库主管B', uploadTime: '2024-02-01 16:00:00', fileSize: 85 * 1024, fileUrl: '/path/to/template2_v1.0.pdf' },
      ]
    },
     {
      id: 'tpl_3',
      name: '运输服务保密协议',
      type: 'nda',
      version: 'V1.1',
      uploader: '法务部A',
      uploadTime: '2024-04-10 11:00:00',
      fileUrl: '/path/to/template3_v1.1.docx',
      fileSize: 60 * 1024,
       versions: [
           { id: 'tpl_3_v1.1', version: 'V1.1', uploader: '法务部A', uploadTime: '2024-04-10 11:00:00', fileSize: 60 * 1024, fileUrl: '/path/to/template3_v1.1.docx' },
            { id: 'tpl_3_v1.0', version: 'V1.0', uploader: '法务部A', uploadTime: '2023-11-01 15:20:00', fileSize: 58 * 1024, fileUrl: '/path/to/template3_v1.0.docx' },
      ]
    },
  ];
  templateList.value = mockData.sort((a,b) => new Date(b.uploadTime) - new Date(a.uploadTime));
};

// --- 上传弹窗 --- 
const uploadDialogVisible = ref(false);
const uploadFormRef = ref(null);
const uploadRef = ref(null);
const uploading = ref(false);
const initialUploadForm = {
    name: '',
    type: '',
    version: '',
    fileList: [],
    selectedFile: null,
};
const uploadForm = reactive({ ...initialUploadForm });

const uploadFormRules = reactive({
    name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择适用类型', trigger: 'change' }],
    version: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
    file: [{ required: true, message: '请选择要上传的文件' }], // 校验 selectedFile
});

// --- 历史版本弹窗 ---
const versionDialogVisible = ref(false);
const currentTemplate = ref(null);


// --- 方法 ---
const formatContractType = (type) => contractTypeOptions.find(opt => opt.value === type)?.label || type;

// 打开上传弹窗
const handleUploadTemplate = () => {
    uploadDialogVisible.value = true;
};

// 重置上传表单
const resetUploadForm = () => {
    Object.assign(uploadForm, initialUploadForm);
    uploadForm.fileList = [];
    uploadForm.selectedFile = null;
    uploadRef.value?.clearFiles(); // 清除 el-upload 的文件列表
    uploadFormRef.value?.clearValidate();
};

// 处理文件超出限制
const handleExceed = (files) => {
  uploadRef.value.clearFiles();
  const file = files[0];
  file.uid = Date.now() + Math.random(); // 手动生成 UID
  uploadRef.value.handleStart(file); // 重新选择第一个文件
   ElMessage.warning('只能上传一个文件，已替换为最新选择的文件');
};

// 处理文件选择
const handleFileSelect = (uploadFile, uploadFiles) => {
    console.log('File selected:', uploadFile);
    if (uploadFile.status === 'ready') { // 确保只处理新选择的文件
        uploadForm.selectedFile = uploadFile; 
        // 手动触发表单文件校验
         uploadFormRef.value?.validateField('file');
    } else if(uploadFiles.length === 0) { // 文件被移除
         uploadForm.selectedFile = null;
         uploadFormRef.value?.validateField('file');
    }
     uploadForm.fileList = uploadFiles;
};

// 提交上传 (模拟)
const submitUpload = async () => {
    if (!uploadFormRef.value) return;
    
    // 额外校验文件是否已选择
    if (!uploadForm.selectedFile) {
        uploadFormRules.file[0].required = true; // 确保校验规则生效
        uploadFormRef.value?.validateField('file');
        ElMessage.error('请选择要上传的模板文件');
        return;
    } else {
         uploadFormRules.file[0].required = false; // 如果已选，则移除校验（避免显示错误）
         uploadFormRef.value?.clearValidate('file');
    }

    try {
        await uploadFormRef.value.validate();
        uploading.value = true;
        const fileData = uploadForm.selectedFile; 

        console.log('开始上传模板:', {
            name: uploadForm.name,
            type: uploadForm.type,
            version: uploadForm.version,
            fileName: fileData.name,
            fileSize: fileData.size,
        });

        // 模拟 API 上传
        setTimeout(() => {
             const newTemplate = {
                id: `tpl_${Date.now()}`,
                name: uploadForm.name,
                type: uploadForm.type,
                version: uploadForm.version,
                uploader: '当前用户',
                uploadTime: new Date().toLocaleString(),
                fileUrl: `/mock/path/${fileData.uid}/${fileData.name}`,
                fileSize: fileData.size,
                versions: [
                     { id: `tpl_ver_${Date.now()}`, version: uploadForm.version, uploader: '当前用户', uploadTime: new Date().toLocaleString(), fileSize: fileData.size, fileUrl: `/mock/path/${fileData.uid}/${fileData.name}` }
                ]
             };
             templateList.value.unshift(newTemplate); // 添加到列表顶部
             templateList.value.sort((a,b) => new Date(b.uploadTime) - new Date(a.uploadTime)); // 重新排序
             
             uploading.value = false;
             uploadDialogVisible.value = false;
             ElMessage.success('模板上传成功');
        }, 1500);

    } catch (error) {
        console.log('表单验证失败:', error);
        ElMessage.error('请检查表单信息是否完整');
    }
};

// 下载模板 (模拟)
const handleDownloadTemplate = (row/*, isVersion = false*/) => {
    console.log(`下载模板: ${row.name} (版本: ${row.version}), URL: ${row.fileUrl}`);
    ElMessage.success(`开始下载模板 ${row.name} ${row.version} (模拟)`);
    // window.open(row.fileUrl, '_blank');
};

// 查看历史版本
const handleViewVersions = (row) => {
    currentTemplate.value = JSON.parse(JSON.stringify(row));
    versionDialogVisible.value = true;
};

// 删除模板 (模拟)
const handleDeleteTemplate = (row) => {
     ElMessageBox.confirm(`确定要删除模板 "${row.name}" (版本: ${row.version}) 吗? 这将删除所有历史版本。`, '确认删除', {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
      })
      .then(() => {
         console.log('删除模板:', row.id);
         const index = templateList.value.findIndex(t => t.id === row.id);
         if (index !== -1) {
            templateList.value.splice(index, 1);
            ElMessage.success('模板已删除');
         } else {
             ElMessage.error('删除失败: 未找到模板');
         }
       })
      .catch(() => {});
};

// --- 生命周期 ---
onMounted(() => {
  generateMockTemplates();
});

</script>

<style scoped>
.contract-template-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.el-table {
  margin-top: 15px;
}
.dialog-footer {
    text-align: right;
}
.el-upload__tip {
    color: #909399;
    margin-top: 5px;
}
.text-red {
     color: #f56c6c;
}
</style> 