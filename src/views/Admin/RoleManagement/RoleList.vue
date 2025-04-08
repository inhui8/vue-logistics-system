<template>
  <div class="role-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色列表</span>
          <el-button type="primary" @click="handleAddRole">
            <el-icon><Plus /></el-icon> 新增角色
          </el-button>
        </div>
      </template>

      <el-table :data="roleList" style="width: 100%" border>
        <el-table-column prop="name" label="角色名称" width="200" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="关联用户数" width="150" align="center">
            <template #default="scope">
              <el-button type="primary" link @click="handleViewUsers(scope.row)">
                  {{ scope.row.users?.length || 0 }} 人
              </el-button>
            </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="scope">
            <el-button text type="primary" size="small" @click="handleEditRole(scope.row)">编辑权限</el-button>
            <el-button text type="danger" size="small" @click="handleDeleteRole(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 新增/编辑角色弹窗 -->
      <el-dialog
        v-model="roleDialogVisible"
        :title="roleDialogTitle"
        width="50%"
        @close="handleDialogClose"
        :close-on-click-modal="false"
      >
        <el-form
          ref="roleFormRef"
          :model="roleForm"
          :rules="formRules"
          label-width="80px"
        >
          <el-form-item label="角色名称" prop="name">
            <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="roleForm.description"
              type="textarea"
              :rows="2"
              placeholder="请输入角色描述"
            />
          </el-form-item>
          <el-form-item label="权限配置">
            <el-tree
              ref="permissionTreeRef"
              :data="permissionTreeData"
              show-checkbox
              node-key="id"
              default-expand-all
              :default-checked-keys="roleForm.permissions"
              :props="{ children: 'children', label: 'label' }"
              style="width: 100%; border: 1px solid #dcdfe6; border-radius: 4px; padding: 10px; max-height: 300px; overflow-y: auto;"
              @check="handlePermissionCheck"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="roleDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSubmit">确认</el-button>
          </span>
        </template>
      </el-dialog>

       <!-- 查看关联用户弹窗 -->
      <el-dialog
        v-model="userDialogVisible"
        :title="`角色用户管理 - ${currentUserRole?.name}`"
        width="60%"
        :close-on-click-modal="false"
      >
        <el-table :data="currentUserRole?.users" style="width: 100%" border size="small">
           <el-table-column prop="username" label="用户名" />
           <el-table-column prop="realName" label="姓名" />
           <el-table-column prop="supplierName" label="所属供应商 (若有)" show-overflow-tooltip/>
           <el-table-column label="账号状态" width="120" align="center">
              <template #default="scope">
                <el-switch 
                    v-model="scope.row.enabled"
                    active-text="启用"
                    inactive-text="禁用"
                    inline-prompt
                    @change="handleUserStatusChange(scope.row)"
                />
              </template>
           </el-table-column>
           <el-table-column label="操作" width="100" align="center">
             <template #default="scope">
                <!-- 可以添加移除用户、重置密码等操作 -->
                <el-button text type="danger" size="small" @click="handleRemoveUserFromRole(scope.row)">移除</el-button>
             </template>
           </el-table-column>
        </el-table>
         <template #footer>
           <el-button @click="userDialogVisible = false">关闭</el-button>
         </template>
       </el-dialog>

    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

// --- 模拟数据 ---
// 模拟用户信息 (应从用户管理模块获取)
const mockUsers = [
    { id: 'user1', username: 'pickup_op1', realName: '提货员A', supplierId: 1, supplierName: '测试供应商A', enabled: true },
    { id: 'user2', username: 'pickup_admin', realName: '提货主管', supplierId: 1, supplierName: '测试供应商A', enabled: true },
    { id: 'user3', username: 'delivery_driver1', realName: '派送司机B1', supplierId: 2, supplierName: '测试供应商B', enabled: true },
    { id: 'user4', username: 'delivery_dispatch', realName: '派送调度B', supplierId: 2, supplierName: '测试供应商B', enabled: false }, // 禁用示例
    { id: 'user5', username: 'universal_op', realName: '全能操作C', supplierId: 3, supplierName: '测试供应商C', enabled: true },
    { id: 'user6', username: 'backend_admin1', realName: '后台管理员1', supplierId: null, supplierName: '内部', enabled: true },
    { id: 'user7', username: 'backend_admin2', realName: '后台管理员2', supplierId: null, supplierName: '内部', enabled: true },
];

const roleList = ref([
  {
    id: 'role_pickup_standard',
    name: '标准提框商',
    description: '负责码头提柜到仓库的基础操作权限',
    users: [mockUsers[0], mockUsers[1]], // 关联模拟用户
    permissions: ['order:seas:portal:list', 'order:seas:portal:assign_vehicle', 'order:seas:portal:update_status', 'vehicle:portal:list', 'account:view'] 
  },
  {
    id: 'role_delivery_standard',
    name: '标准派送商',
    description: '负责仓库到 FBA 或其他地址的派送操作权限',
    users: [mockUsers[2], mockUsers[3]],
    permissions: ['order:delivery:portal:list', 'order:delivery:portal:assign_vehicle', 'order:delivery:portal:update_status', 'vehicle:portal:list', 'account:view']
  },
   {
    id: 'role_supplier_admin', // 新增一个供应商管理员角色
    name: '供应商管理员',
    description: '管理供应商内部的用户账号、车辆信息等',
    users: [mockUsers[4]],
    permissions: [
        'order:seas:portal:list', 'order:delivery:portal:list',
        'vehicle:portal:list', 'vehicle:portal:add', 'vehicle:portal:edit', 'vehicle:portal:delete',
        'account:view', 'account:edit', 'account:upload_docs',
        'quote:portal:submit_fixed', 'quote:portal:respond_inquiry', 'quote:portal:participate_bid',
        'rating:portal:view', 'appointment:portal:request'
    ]
  },
  {
    id: 'role_admin',
    name: '后台管理员',
    description: '拥有所有后台管理权限',
    users: [mockUsers[5], mockUsers[6]],
    permissions: [ // 简化，直接用 '*' 表示所有权限 (实际不推荐)
      '*'
      // ... (或者列出所有权限 ID)
    ]
  },
]);

// 模拟权限树结构数据 (保持不变，只添加一个顶级表示所有权限的选项)
const permissionTreeData = ref([
   { id: '*' , label: '所有权限' }, // 添加一个代表所有权限的根节点
  {
    id: 'supplier',
    label: '供应商管理 (后台)',
    children: [
      { id: 'supplier:list', label: '查看列表' },
      { id: 'supplier:create', label: '新增供应商' },
      { id: 'supplier:edit', label: '编辑供应商' },
      { id: 'supplier:delete', label: '删除供应商' },
      { id: 'supplier:audit', label: '审核资质' },
      { id: 'supplier:approve_qualification', label: '批准合作 (审批)' }
    ]
  },
  // ... 其他权限树节点保持不变 ...
   {
      id: 'account',
      label: '账户管理 (门户)',
      children: [
          { id: 'account:view', label: '查看账户信息' },
          { id: 'account:edit', label: '编辑基本信息' },
          { id: 'account:upload_docs', label: '上传资质文件' },
          // 可能还有管理子账号等权限
      ]
    }
]);

// --- 响应式状态 ---
const roleDialogVisible = ref(false); // 角色编辑弹窗
const roleDialogTitle = ref('');
const userDialogVisible = ref(false); // 用户列表弹窗
const currentUserRole = ref(null); // 当前查看用户的角色

const isEditMode = ref(false);
const roleFormRef = ref(null);
const permissionTreeRef = ref(null); // 权限树引用

// 表单数据模型
const initialFormState = {
  id: null,
  name: '',
  description: '',
  permissions: [],
  users: [] // 关联的用户列表
};
const roleForm = reactive({ ...initialFormState });

// 表单验证规则
const formRules = reactive({
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
  ],
  description: [
     { required: true, message: '请输入角色描述', trigger: 'blur' },
  ]
});

// --- 方法 ---
// 处理权限树节点勾选变化
const handlePermissionCheck = (data, checkedData) => {
    console.log("Checked keys:", checkedData.checkedKeys);
    roleForm.permissions = permissionTreeRef.value.getCheckedKeys(false); // 获取选中的叶子节点key
     // 如果勾选了"所有权限"
    if (roleForm.permissions.includes('*')) {
        // 选中所有叶子节点
        const allLeafKeys = getAllLeafKeys(permissionTreeData.value);
        roleForm.permissions = allLeafKeys;
        // 在 nextTick 中更新 Tree 的选中状态，避免冲突
        nextTick(() => {
            permissionTreeRef.value.setCheckedKeys(allLeafKeys, true);
        });
    } else {
         // 过滤掉可能的 '*' （虽然上面已经处理了）
         roleForm.permissions = roleForm.permissions.filter(p => p !== '*');
    }
    console.log("Final permissions:", roleForm.permissions);
};

// 辅助函数：获取权限树所有叶子节点的 key
const getAllLeafKeys = (nodes) => {
    let keys = [];
    nodes.forEach(node => {
        if (node.id === '*') return; // 跳过特殊节点
        if (!node.children || node.children.length === 0) {
            keys.push(node.id);
        } else {
            keys = keys.concat(getAllLeafKeys(node.children));
        }
    });
    return keys;
};

// 处理新增
const handleAddRole = () => {
  Object.assign(roleForm, initialFormState);
  roleForm.permissions = []; // 确保清空
  isEditMode.value = false;
  roleDialogTitle.value = '新增角色';
  roleDialogVisible.value = true;
  nextTick(() => {
      permissionTreeRef.value?.setCheckedKeys([]); // 清空树的选中状态
      roleFormRef.value?.clearValidate();
  });
};

// 处理编辑
const handleEditRole = (row) => {
  isEditMode.value = true;
  roleDialogTitle.value = '编辑角色权限';
  // 深拷贝数据
  Object.assign(roleForm, JSON.parse(JSON.stringify(row)));
  roleDialogVisible.value = true;
  nextTick(() => {
     roleFormRef.value?.clearValidate();
      // 处理 '*' 代表所有权限的情况
     if (roleForm.permissions.includes('*')) {
         permissionTreeRef.value?.setCheckedKeys(['*'], true); 
     } else {
         permissionTreeRef.value?.setCheckedKeys(roleForm.permissions || [], true);
     }
  });
};

// 处理删除
const handleDeleteRole = (row) => {
   // 检查是否有用户关联
   if (row.users && row.users.length > 0) {
     ElMessageBox.alert(`角色 "${row.name}" 下关联了 ${row.users.length} 个用户，请先将用户移除或分配到其他角色后再删除。`, '无法删除', { type: 'error' });
     return;
   }
  ElMessageBox.confirm(`确定要删除角色 "${row.name}" 吗?`, '确认删除', {
    type: 'warning',
  })
    .then(() => {
      console.log('删除角色:', row.id);
      const index = roleList.value.findIndex(r => r.id === row.id);
      if (index !== -1) {
        roleList.value.splice(index, 1);
        ElMessage.success('角色删除成功');
      } else {
        ElMessage.error('删除失败');
      }
    })
    .catch(() => {});
};

// 处理查看关联用户
const handleViewUsers = (row) => {
    currentUserRole.value = JSON.parse(JSON.stringify(row)); // 深拷贝，防止修改影响原列表
    userDialogVisible.value = true;
};

// 处理用户状态变更 (模拟)
const handleUserStatusChange = (user) => {
    console.log(`更改用户 ${user.username} 状态为: ${user.enabled}`);
    // 实际应用中需要调用 API 更新用户状态
     // 更新 mockUsers 中的状态 (如果需要模拟持久化)
    const mockUserIndex = mockUsers.findIndex(u => u.id === user.id);
    if (mockUserIndex !== -1) {
        mockUsers[mockUserIndex].enabled = user.enabled;
    }
    // 更新 currentUserRole 中的状态，以便弹窗立即反应
    const userInDialogIndex = currentUserRole.value.users.findIndex(u => u.id === user.id);
    if (userInDialogIndex !== -1) {
         currentUserRole.value.users[userInDialogIndex].enabled = user.enabled;
    }
    ElMessage.success(`用户 ${user.username} 状态已${user.enabled ? '启用' : '禁用'}`);
};

// 处理从角色中移除用户 (模拟)
const handleRemoveUserFromRole = (user) => {
    if (!currentUserRole.value) return;
    ElMessageBox.confirm(`确定要将用户 "${user.username}" 从角色 "${currentUserRole.value.name}" 中移除吗?`, '确认移除', { type: 'warning' })
    .then(() => {
        console.log(`移除用户 ${user.username} 从角色 ${currentUserRole.value.id}`);
        // 更新弹窗内数据
        const userIndexInDialog = currentUserRole.value.users.findIndex(u => u.id === user.id);
        if (userIndexInDialog !== -1) {
            currentUserRole.value.users.splice(userIndexInDialog, 1);
        }
        // 更新主列表数据
        const roleIndex = roleList.value.findIndex(r => r.id === currentUserRole.value.id);
        if (roleIndex !== -1) {
            const userIndexInList = roleList.value[roleIndex].users.findIndex(u => u.id === user.id);
            if (userIndexInList !== -1) {
                roleList.value[roleIndex].users.splice(userIndexInList, 1);
            }
        }
        ElMessage.success('用户已移除');
    })
    .catch(() => {});
};

// 处理弹窗关闭
const handleDialogClose = () => {
  // 清理表单校验
  nextTick(() => {
     roleFormRef.value?.clearValidate();
     permissionTreeRef.value?.setCheckedKeys([]); // 清空树的选中
  });
  Object.assign(roleForm, initialFormState); // 重置表单
};

// 处理表单提交 (新增/编辑)
const handleSubmit = async () => {
  if (!roleFormRef.value) return;
  try {
    await roleFormRef.value.validate();
    // 获取最终选中的权限 key
    roleForm.permissions = permissionTreeRef.value.getCheckedKeys(false);
     // 如果包含了 '*'，实际保存时可能只需要存 '*'，或者展开存所有叶子节点，取决于后端设计
     if (roleForm.permissions.includes('*')) {
         console.warn("选择了 '所有权限', 实际保存的权限列表将根据后端逻辑处理。");
         // 假设后端能识别 '*'，或者在此处展开为所有叶子节点
         // roleForm.permissions = getAllLeafKeys(permissionTreeData.value);
     } else {
          roleForm.permissions = roleForm.permissions.filter(p => p !== '*'); // 确保不包含 '*'
     }

    console.log('提交的角色数据:', JSON.parse(JSON.stringify(roleForm)));

    if (isEditMode.value) {
      // 编辑逻辑
      const index = roleList.value.findIndex(r => r.id === roleForm.id);
      if (index !== -1) {
        roleList.value[index] = { ...roleList.value[index], ...JSON.parse(JSON.stringify(roleForm)) }; // 保留 users
        ElMessage.success('角色权限更新成功');
      } else {
        ElMessage.error('更新失败');
      }
    } else {
      // 新增逻辑
      const newRole = {
          ...JSON.parse(JSON.stringify(roleForm)),
          id: `role_${Date.now()}`,
          users: [], // 新角色默认没有用户
      };
      roleList.value.push(newRole);
      ElMessage.success('角色新增成功');
    }
    roleDialogVisible.value = false;
  } catch (error) {
    console.log('表单验证失败:', error);
    ElMessage.error('请检查表单信息');
  }
};

</script>

<style scoped>
.role-list-container {
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
</style> 