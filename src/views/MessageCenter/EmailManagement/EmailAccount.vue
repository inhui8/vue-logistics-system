<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 操作区域 -->
      <div class="flex justify-between mb-4">
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增账号</el-button>
        <div>
          <!-- 可以在这里添加搜索等 -->
        </div>
      </div>

      <!-- 表格区域 -->
      <el-table v-loading="loading" :data="accountList">
        <el-table-column label="邮箱地址" align="center" prop="mail" />
        <el-table-column label="SMTP服务器" align="center" prop="host" width="180"/>
        <el-table-column label="端口" align="center" prop="port" width="80"/>
        <el-table-column label="用户名" align="center" prop="username" />
        <el-table-column label="启用SSL" align="center" prop="enableSsl" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.enableSsl ? 'success' : 'danger'">
              {{ scope.row.enableSsl ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
         <el-table-column label="是否默认" align="center" prop="isDefault" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isDefault ? 'success' : 'info'">
               {{ scope.row.isDefault ? '是' : '否' }}
             </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="240" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="el-icon-edit" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button link type="primary" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
             <el-button link type="primary" icon="el-icon-connection" @click="handleTestConnection(scope.row)">测试连接</el-button>
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

    <!-- 添加或修改邮箱账号对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="邮箱地址" prop="mail">
          <el-input v-model="form.mail" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码/授权码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码或授权码" />
        </el-form-item>
        <el-form-item label="SMTP服务器地址" prop="host">
          <el-input v-model="form.host" placeholder="请输入 SMTP 服务器地址" />
        </el-form-item>
        <el-form-item label="SMTP服务器端口" prop="port">
          <el-input-number v-model="form.port" controls-position="right" :min="0" placeholder="请输入 SMTP 服务器端口" style="width: 100%"/>
        </el-form-item>
        <el-form-item label="启用SSL" prop="enableSsl">
           <el-switch v-model="form.enableSsl" />
        </el-form-item>
        <el-form-item label="是否默认" prop="isDefault">
           <el-switch v-model="form.isDefault" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'; // Assuming Element Plus is used

// --- 数据定义 ---
const loading = ref(true); // 列表加载状态
const accountList = ref([]); // 账号列表
const total = ref(0); // 总条数
const dialogVisible = ref(false); // 弹窗可见性
const dialogTitle = ref(''); // 弹窗标题
const formRef = ref(null); // 表单引用

// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  // 其他查询参数可以加在这里
});

// 表单数据模型
const form = ref({
  id: undefined,
  mail: '',
  username: '',
  password: '',
  host: '',
  port: 465, // Default SSL port
  enableSsl: true,
  isDefault: false,
});

// 表单校验规则
const rules = reactive({
  mail: [
    { required: true, message: '邮箱地址不能为空', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '密码/授权码不能为空', trigger: 'blur' } // Might adjust validation later if editing
  ],
  host: [
    { required: true, message: 'SMTP服务器地址不能为空', trigger: 'blur' }
  ],
  port: [
    { required: true, message: 'SMTP服务器端口不能为空', trigger: 'blur' }
  ],
});

// --- 方法定义 ---

// 获取账号列表 (模拟)
const getList = () => {
  loading.value = true;
  console.log('Fetching list with params:', queryParams);
  // --- 模拟 API 调用 ---
  setTimeout(() => {
    const mockData = [
      { id: 1, mail: 'sender1@example.com', host: 'smtp.example.com', port: 465, username: 'sender1', password: '***', enableSsl: true, isDefault: true },
      { id: 2, mail: 'sender2@example.com', host: 'smtp.gmail.com', port: 587, username: 'sender2@gmail.com', password: '***', enableSsl: true, isDefault: false },
      { id: 3, mail: 'no-ssl@example.com', host: 'smtp.office365.com', port: 587, username: 'no-ssl', password: '***', enableSsl: true, isDefault: false }, // Note: Office365 typically uses STARTTLS on 587
      { id: 4, mail: 'another@domain.net', host: 'mail.domain.net', port: 25, username: 'another', password: '***', enableSsl: false, isDefault: false },
    ];
    // Simulate pagination
    const start = (queryParams.pageNo - 1) * queryParams.pageSize;
    const end = start + queryParams.pageSize;
    accountList.value = mockData.slice(start, end);
    total.value = mockData.length;
    loading.value = false;
  }, 500);
  // --- 模拟结束 ---
  // 实际应用中:
  // try {
  //   const response = await emailAccountApi.getPage(queryParams);
  //   accountList.value = response.data.list;
  //   total.value = response.data.total;
  // } finally {
  //   loading.value = false;
  // }
};

// 重置表单
const resetForm = () => {
  form.value = {
    id: undefined,
    mail: '',
    username: '',
    password: '',
    host: '',
    port: 465,
    enableSsl: true,
    isDefault: false,
  };
  formRef.value?.resetFields(); // Reset validation state
};

// 打开新增弹窗
const handleAdd = () => {
  resetForm();
  dialogTitle.value = '新增邮箱账号';
  dialogVisible.value = true;
};

// 打开修改弹窗
const handleUpdate = (row) => {
  resetForm();
   // Create a copy to avoid modifying the original list data directly
  form.value = { ...row };
   // Password field might not be sent from backend list, handle accordingly
  form.value.password = ''; // Clear password for editing, prompt user to re-enter if changing
  dialogTitle.value = '修改邮箱账号';
  dialogVisible.value = true;
  // Adjust password validation if needed for update (e.g., make it optional unless changed)
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
      console.log('Submitting form:', form.value);
      const isUpdate = !!form.value.id;
      ElMessage.success(isUpdate ? '修改成功' : '新增成功');
      dialogVisible.value = false;
      getList(); // Refresh list after success
      // --- 模拟结束 ---

      // 实际应用中:
      // try {
      //   if (form.value.id) {
      //     await emailAccountApi.update(form.value);
      //     ElMessage.success('修改成功');
      //   } else {
      //     await emailAccountApi.create(form.value);
      //     ElMessage.success('新增成功');
      //   }
      //   dialogVisible.value = false;
      //   getList();
      // } catch (error) {
      //   console.error('Form submission error:', error);
      //   // Handle error display
      // }
    } else {
      console.log('Form validation failed');
    }
  });
};

// 删除账号 (模拟)
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除邮箱账号 "${row.mail}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // --- 模拟 API 调用 ---
    console.log('Deleting account:', row.id);
    ElMessage.success('删除成功');
    getList(); // Refresh list
    // --- 模拟结束 ---
    // 实际应用中:
    // await emailAccountApi.delete(row.id);
    // ElMessage.success('删除成功');
    // getList();
  }).catch(() => {
    // User cancelled
  });
};

// 测试连接 (模拟)
const handleTestConnection = (row) => {
  console.log('Testing connection for:', row.mail);
  // --- 模拟 API 调用 ---
   ElMessage.info(`正在测试账号 ${row.mail}...`);
   setTimeout(() => {
     // Simulate success/failure based on some condition maybe
     const success = Math.random() > 0.3; // Simulate 70% success rate
     if (success) {
        ElMessage.success(`账号 ${row.mail} 连接测试成功！`);
     } else {
       ElMessage.error(`账号 ${row.mail} 连接测试失败，请检查配置和网络。`);
     }
   }, 1500);
  // --- 模拟结束 ---
  // 实际应用中:
  // try {
  //   ElMessage.info(`正在测试账号 ${row.mail}...`);
  //   await emailAccountApi.testConnection(row.id);
  //   ElMessage.success(`账号 ${row.mail} 连接测试成功！`);
  // } catch (error) {
  //    ElMessage.error(`账号 ${row.mail} 连接测试失败: ${error.message || '请检查配置和网络。'}`);
  // }
};


// --- 生命周期钩子 ---
onMounted(() => {
  getList();
});

</script>

<style scoped>
/* Add custom styles if needed */
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
  margin-bottom: 16px; /* Adjust spacing */
}
.mt-4 {
  margin-top: 16px; /* Adjust spacing */
}
/* Ensure action buttons in table don't wrap unnecessarily */
.el-table .cell .el-button {
  margin-left: 5px;
}
.el-table .cell .el-button + .el-button {
  margin-left: 5px;
}
</style> 