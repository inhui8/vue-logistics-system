<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 操作区域 -->
      <div class="flex justify-between mb-4">
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增模板</el-button>
        <div>
          <!-- 可以在这里添加按名称/编码搜索 -->
        </div>
      </div>

      <!-- 表格区域 -->
      <el-table v-loading="loading" :data="templateList">
        <el-table-column label="模板编码" align="center" prop="code" />
        <el-table-column label="模板名称" align="center" prop="name" width="180"/>
        <el-table-column label="邮件主题" align="center" prop="subject" show-overflow-tooltip />
        <el-table-column label="发送邮箱" align="center" prop="accountMail" width="180"/>
        <el-table-column label="状态" align="center" prop="status" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'">
              {{ scope.row.status === 0 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
           <template #default="scope">
             <span>{{ scope.row.createTime ? new Date(scope.row.createTime).toLocaleString() : '' }}</span>
           </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="el-icon-edit" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button link type="primary" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
            <el-button link type="primary" icon="el-icon-s-promotion" @click="openTestSendDialog(scope.row)">测试发送</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-show="total > 0"
        v-model:current-page="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getList"
        @current-change="getList"
        class="mt-4 justify-end"
      />
    </el-card>

    <!-- 添加或修改邮件模板对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="700px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板编码" prop="code">
              <el-input v-model="form.code" placeholder="请输入模板编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
             <el-form-item label="模板名称" prop="name">
               <el-input v-model="form.name" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
        </el-row>
         <el-row :gutter="20">
          <el-col :span="12">
             <el-form-item label="邮件主题" prop="subject">
              <el-input v-model="form.subject" placeholder="请输入邮件主题" />
            </el-form-item>
          </el-col>
           <el-col :span="12">
             <el-form-item label="发送账号" prop="accountId">
                <el-select v-model="form.accountId" placeholder="请选择发送账号" style="width:100%">
                   <!-- 假设 accountOptions 是从账号管理获取的 {label: 'email', value: id} 列表 -->
                  <el-option
                    v-for="item in accountOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value" />
                </el-select>
              </el-form-item>
           </el-col>
         </el-row>
         <el-form-item label="模板内容" prop="content">
           <el-input
             v-model="form.content"
             type="textarea"
             :rows="6"
             placeholder="请输入模板内容，使用 {变量名} 作为占位符"
           />
         </el-form-item>
          <el-row :gutter="20">
          <el-col :span="12">
             <el-form-item label="状态" prop="status">
                <el-radio-group v-model="form.status">
                  <el-radio :label="0">启用</el-radio>
                  <el-radio :label="1">禁用</el-radio>
                </el-radio-group>
             </el-form-item>
          </el-col>
        </el-row>
         <el-form-item label="备注" prop="remark">
           <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
         </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

     <!-- 测试发送对话框 -->
    <el-dialog title="测试发送邮件" v-model="testDialogVisible" width="600px" append-to-body>
      <el-form ref="testFormRef" :model="testForm" :rules="testRules" label-width="100px">
        <el-form-item label="模板编码">
          <el-input :value="currentTemplate?.code" disabled />
        </el-form-item>
        <el-form-item label="收件邮箱" prop="mail">
          <el-input v-model="testForm.mail" placeholder="请输入收件邮箱" />
        </el-form-item>
        <el-form-item label="模板参数" prop="params">
          <el-input
            v-model="testForm.params"
            type="textarea"
            :rows="4"
            placeholder='请输入模板参数，JSON 格式，例如：{"name": "张三", "orderNo": "12345"}'
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleTestSend">发 送</el-button>
          <el-button @click="testDialogVisible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// --- 数据定义 ---
const loading = ref(true);
const templateList = ref([]);
const total = ref(0);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref(null);
const testDialogVisible = ref(false);
const testFormRef = ref(null);
const currentTemplate = ref(null); // Store the template being tested
const accountOptions = ref([]); // Store available email accounts for select dropdown

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  // name: '',
  // code: ''
});

const form = ref({
  id: undefined,
  code: '',
  name: '',
  accountId: undefined,
  subject: '',
  content: '',
  status: 0, // 0:启用, 1:禁用
  remark: ''
});

const rules = reactive({
  code: [{ required: true, message: '模板编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }],
  accountId: [{ required: true, message: '发送账号不能为空', trigger: 'change' }],
  subject: [{ required: true, message: '邮件主题不能为空', trigger: 'blur' }],
  content: [{ required: true, message: '模板内容不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
});

const testForm = ref({
  mail: '',
  templateId: undefined,
  params: '' // JSON string for parameters
});

const testRules = reactive({
  mail: [
      { required: true, message: '收件邮箱不能为空', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
    ],
  params: [
    {
      validator: (rule, value, callback) => {
        if (!value) {
           callback(); // Allow empty params
           return;
        }
        try {
          JSON.parse(value);
          callback();
        } catch (e) {
          callback(new Error('请输入有效的 JSON 格式'));
        }
      },
      trigger: 'blur'
    }
  ]
});

// --- 方法定义 ---

// 获取账号选项 (模拟)
const getAccountOptions = () => {
  // In real app, fetch from emailAccountApi.getList()
  accountOptions.value = [
    { value: 1, label: 'sender1@example.com' },
    { value: 2, label: 'sender2@example.com' },
    { value: 3, label: 'no-ssl@example.com' },
    { value: 4, label: 'another@domain.net' },
  ];
};

// 获取模板列表 (模拟)
const getList = () => {
  loading.value = true;
  console.log('Fetching template list with params:', queryParams);
  // --- 模拟 API 调用 ---
  setTimeout(() => {
    const mockData = [
      { id: 101, code: 'ORDER_CONFIRM', name: '订单确认邮件', accountId: 1, accountMail: 'sender1@example.com', subject: '您的订单 {orderNo} 已确认', content: '尊敬的 {customerName}，您的订单 {orderNo} 已确认，感谢您的购买！', status: 0, createTime: new Date(Date.now() - 86400000), remark: '给客户发送订单确认信息' },
      { id: 102, code: 'PASSWORD_RESET', name: '密码重置邮件', accountId: 2, accountMail: 'sender2@example.com', subject: '密码重置请求', content: '请点击以下链接重置您的密码：{resetLink}', status: 0, createTime: new Date(Date.now() - 172800000), remark: '用户请求重置密码' },
      { id: 103, code: 'PROMOTION_NEWS', name: '推广活动', accountId: 1, accountMail: 'sender1@example.com', subject: '最新优惠活动！', content: '亲爱的用户，我们有新的优惠活动，详情请见：{promoLink}', status: 1, createTime: new Date(Date.now() - 259200000), remark: '节日推广' },
    ];
    const start = (queryParams.pageNo - 1) * queryParams.pageSize;
    const end = start + queryParams.pageSize;
    templateList.value = mockData.slice(start, end);
    total.value = mockData.length;
    loading.value = false;
  }, 500);
  // --- 模拟结束 ---
  // Actual API call:
  // emailTemplateApi.getPage(queryParams).then(res => { ... });
};

// 重置表单
const resetForm = () => {
  form.value = {
    id: undefined,
    code: '',
    name: '',
    accountId: undefined,
    subject: '',
    content: '',
    status: 0,
    remark: ''
  };
  formRef.value?.resetFields();
};

// 打开新增弹窗
const handleAdd = () => {
  resetForm();
  getAccountOptions(); // Ensure options are loaded
  dialogTitle.value = '新增邮件模板';
  dialogVisible.value = true;
};

// 打开修改弹窗
const handleUpdate = (row) => {
  resetForm();
  getAccountOptions(); // Ensure options are loaded
  form.value = { ...row };
  dialogTitle.value = '修改邮件模板';
  dialogVisible.value = true;
};

// 取消弹窗
const cancel = () => {
  dialogVisible.value = false;
  resetForm();
};

// 提交表单 (模拟)
const submitForm = () => {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      // --- 模拟 API 调用 ---
      console.log('Submitting template form:', form.value);
      const isUpdate = !!form.value.id;
      ElMessage.success(isUpdate ? '修改成功' : '新增成功');
      dialogVisible.value = false;
      getList();
      // --- 模拟结束 ---
      // Actual API call:
      // if (isUpdate) { emailTemplateApi.update(form.value).then(...); }
      // else { emailTemplateApi.create(form.value).then(...); }
    } else {
      console.log('Template form validation failed');
    }
  });
};

// 删除模板 (模拟)
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除模板 "${row.name}" (编码: ${row.code}) 吗？`,
    '提示',
    { type: 'warning' }
  ).then(() => {
    // --- 模拟 API 调用 ---
    console.log('Deleting template:', row.id);
    ElMessage.success('删除成功');
    getList();
    // --- 模拟结束 ---
    // Actual API call: emailTemplateApi.delete(row.id).then(...);
  }).catch(() => {});
};

// 打开测试发送弹窗
const openTestSendDialog = (row) => {
  currentTemplate.value = row;
  testForm.value = {
    mail: '',
    templateId: row.id,
    params: ''
  };
  testFormRef.value?.resetFields();
  testDialogVisible.value = true;
};

// 处理测试发送 (模拟)
const handleTestSend = () => {
  testFormRef.value?.validate(async (valid) => {
    if (valid) {
      // --- 模拟 API 调用 ---
      let paramsObject = {};
      try {
        paramsObject = testForm.value.params ? JSON.parse(testForm.value.params) : {};
      } catch (e) { /* Already validated, but double check */ }

      const payload = {
        mail: testForm.value.mail,
        templateId: testForm.value.templateId,
        templateParams: paramsObject
      }
      console.log('Sending test email with payload:', payload);
      ElMessage.info(`正在向 ${testForm.value.mail} 发送测试邮件...`);
      setTimeout(() => {
        ElMessage.success(`测试邮件已发送（模拟）`);
      }, 1000);
      testDialogVisible.value = false;
       // --- 模拟结束 ---
      // Actual API call:
      // emailTemplateApi.sendTest(payload).then(...);
    }
  });
};

// --- 生命周期钩子 ---
onMounted(() => {
  getList();
  getAccountOptions(); // Load account options initially as well
});

</script>

<style scoped>
/* Reusing styles from EmailAccount.vue */
.app-container {
  padding: 20px;
}
.flex {
  display: flex;
}
.justify-between {
  justify-content: space-between;
}
.justify-end {
  justify-content: flex-end;
}
.mb-4 {
  margin-bottom: 16px;
}
.mt-4 {
  margin-top: 16px;
}
.el-table .cell .el-button {
  margin-left: 5px;
}
.el-table .cell .el-button + .el-button {
  margin-left: 5px;
}
</style> 