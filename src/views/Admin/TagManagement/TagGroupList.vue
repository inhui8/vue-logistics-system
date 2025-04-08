/* eslint-disable @typescript-eslint/no-explicit-any */
<template>
  <div class="tag-group-list-container">
    <!-- 搜索表单 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="关键词">
        <el-input v-model="searchForm.keyword" placeholder="分组名称/描述" clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearchForm">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <div class="operation-bar">
      <el-button type="primary" @click="handleAddGroup">新建分组</el-button>
    </div>

    <!-- 数据表格 -->
    <el-table :data="groupTableData" v-loading="loading" border style="width: 100%">
      <el-table-column prop="groupName" label="分组名称" min-width="120" />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="rulesSummary" label="标签规则" min-width="250" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag 
            v-for="(rule, index) in row.rulesSummary" 
            :key="index"
            size="small"
            class="rule-tag"
          >
            {{ rule }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="creator" label="创建者" width="120" />
      <el-table-column prop="updatedAt" label="更新时间" width="160" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEditGroup(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDeleteGroup(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 分组表单对话框 -->
    <el-dialog
      v-model="groupFormDialogVisible"
      :title="dialogTitle"
      width="70%"
      :close-on-click-modal="false"
      @close="handleCloseDialog"
      destroy-on-close
    >
      <TagGroupForm 
        ref="groupFormRef" 
        :initial-data="currentGroup" 
        :mode="dialogMode" 
        @save-success="handleSaveSuccess" 
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import TagGroupForm from './TagGroupForm.vue';

export default {
  name: 'TagGroupList',
  components: {
    TagGroupForm
  },
  setup() {
    // 状态定义
    const loading = ref(false);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const total = ref(0);
    const groupTableData = ref([]);
    const searchForm = reactive({
      keyword: ''
    });
    const groupFormDialogVisible = ref(false);
    const dialogMode = ref('add');
    const currentGroup = ref(null);
    const groupFormRef = ref(null);

    // 计算属性
    const dialogTitle = computed(() => {
      return dialogMode.value === 'add' ? '新建标签分组' : '编辑标签分组';
    });

    // 方法定义
    const fetchGroups = async () => {
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        groupTableData.value = [
          {
            id: 1,
            groupName: 'VIP用户分组',
            description: '所有VIP等级的用户分组',
            rulesSummary: [
              'business.userType = VIP',
              'business.vipLevel >= 3'
            ],
            creator: 'admin',
            createdAt: '2024-03-20 10:00:00',
            updatedAt: '2024-03-20 10:00:00'
          },
          {
            id: 2,
            groupName: '高风险订单',
            description: '需要特别关注的高风险订单分组',
            rulesSummary: [
              'warning.orderRisk = high',
              'error.paymentCount > 3'
            ],
            creator: 'admin',
            createdAt: '2024-03-20 11:00:00',
            updatedAt: '2024-03-20 11:00:00'
          }
        ];
        total.value = groupTableData.value.length;
      } catch (error) {
        ElMessage.error('获取分组列表失败');
        console.error('Failed to fetch groups:', error);
      } finally {
        loading.value = false;
      }
    };

    const handleSearch = () => {
      currentPage.value = 1;
      fetchGroups();
    };

    const resetSearchForm = () => {
      searchForm.keyword = '';
      currentPage.value = 1;
      fetchGroups();
    };

    const handleAddGroup = () => {
      dialogMode.value = 'add';
      currentGroup.value = null;
      groupFormDialogVisible.value = true;
    };

    const handleEditGroup = (row) => {
      dialogMode.value = 'edit';
      currentGroup.value = JSON.parse(JSON.stringify(row));
      groupFormDialogVisible.value = true;
    };

    const handleDeleteGroup = (row) => {
      ElMessageBox.confirm(
        `确定要删除分组"${row.groupName}"吗？此操作不可恢复！`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 500));
          groupTableData.value = groupTableData.value.filter(item => item.id !== row.id);
          total.value = groupTableData.value.length;
          ElMessage.success('删除成功');
        } catch (error) {
          ElMessage.error('删除失败');
          console.error('Failed to delete group:', error);
        }
      }).catch(() => {
        ElMessage.info('已取消删除');
      });
    };

    const handleCloseDialog = () => {
      groupFormDialogVisible.value = false;
      currentGroup.value = null;
    };

    const handleSubmitForm = () => {
      groupFormRef.value?.submitForm();
    };

    const handleSaveSuccess = (savedData) => {
      handleCloseDialog();
      if (dialogMode.value === 'add') {
        groupTableData.value.unshift(savedData);
      } else {
        const index = groupTableData.value.findIndex(item => item.id === savedData.id);
        if (index !== -1) {
          groupTableData.value[index] = savedData;
        }
      }
      total.value = groupTableData.value.length;
      ElMessage.success(`分组${dialogMode.value === 'add' ? '创建' : '更新'}成功`);
    };

    const handleSizeChange = (val) => {
      pageSize.value = val;
      currentPage.value = 1;
      fetchGroups();
    };

    const handleCurrentChange = (val) => {
      currentPage.value = val;
      fetchGroups();
    };

    // 生命周期钩子
    onMounted(() => {
      fetchGroups();
    });

    return {
      loading,
      currentPage,
      pageSize,
      total,
      groupTableData,
      searchForm,
      groupFormDialogVisible,
      dialogMode,
      currentGroup,
      groupFormRef,
      dialogTitle,
      handleSearch,
      resetSearchForm,
      handleAddGroup,
      handleEditGroup,
      handleDeleteGroup,
      handleCloseDialog,
      handleSubmitForm,
      handleSaveSuccess,
      handleSizeChange,
      handleCurrentChange
    };
  }
};
</script>

<style scoped>
.tag-group-list-container {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.operation-bar {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.rule-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.rule-tag:last-child {
  margin-right: 0;
}
</style> 