/* eslint-disable @typescript-eslint/no-explicit-any */
<template>
  <div class="tag-list-container">
    <!-- 搜索表单 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="关键词">
        <el-input v-model="searchForm.keyword" placeholder="标签名称/描述" clearable />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="searchForm.category" placeholder="选择分类" clearable>
          <el-option label="Business" value="Business" />
          <el-option label="Warning" value="Warning" />
          <el-option label="Anomaly" value="Anomaly" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="选择状态" clearable>
          <el-option label="活跃" value="Active" />
          <el-option label="弃用" value="Deprecated" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearchForm">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <div class="operation-bar">
      <el-button type="primary" @click="handleAddTag">新建标签</el-button>
    </div>

    <!-- 数据表格 -->
    <el-table :data="allTableData" v-loading="loading" border style="width: 100%">
      <el-table-column prop="tagKey" label="标签键" min-width="120" />
      <el-table-column prop="tagValue" label="标签值" min-width="120" />
      <el-table-column prop="category" label="分类" width="120">
        <template #default="{ row }">
          <el-tag :type="getCategoryTagType(row.category)">{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)">
            {{ row.status === 'Active' ? '活跃' : '弃用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="updatedAt" label="更新时间" width="160" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEditTag(row)">编辑</el-button>
          <el-button 
            link 
            :type="row.status === 'Active' ? 'warning' : 'success'"
            @click="handleChangeStatus(row)"
          >
            {{ row.status === 'Active' ? '弃用' : '激活' }}
          </el-button>
          <el-button link type="danger" @click="handleDeleteTag(row)">删除</el-button>
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

    <!-- 标签表单对话框 -->
    <el-dialog
      v-model="tagFormDialogVisible"
      :title="tagDialogTitle"
      width="60%"
      :close-on-click-modal="false"
      @close="handleCloseTagFormDialog"
      destroy-on-close
    >
      <TagForm 
        ref="tagFormRef" 
        :initial-data="currentTag" 
        :mode="tagDialogMode" 
        @save-success="handleSaveSuccess" 
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseTagFormDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmitTagForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import TagForm from './tagForm.vue'; // 使用正确的相对路径和文件名
import { ElMessage, ElMessageBox } from 'element-plus'; // 确保引入 Message 和 MessageBox

export default {
  name: 'TagList',
  components: { TagForm }, // 注册组件 (确保组件名与 import 一致)
  data() {
    return {
      loading: false,
      currentPage: 1,
      pageSize: 10,
      tagFormDialogVisible: false,
      tagDialogMode: 'add', // 'add' or 'edit'
      currentTag: null, // 用于编辑时传递数据
      tagFormRef: null, // 用于引用 TagForm 组件实例
      searchForm: { keyword: '', category: '', status: '' },
      allTableData: [], // 用于存储表格数据
      total: 0, // 用于存储总数据量
    };
  },
  computed: {
    tagDialogTitle() {
      return this.tagDialogMode === 'add' ? '新建标签' : '编辑标签';
    }
  },
  methods: {
    handleSearch() {
      this.currentPage = 1; // 重置到第一页
      // 实际应用中这里会调用 API 获取数据
      console.log('搜索条件:', this.searchForm);
      this.fetchTags(); // 模拟调用 API
    },
    resetSearchForm() {
      this.searchForm = { keyword: '', category: '', status: '' };
      this.currentPage = 1;
      this.fetchTags(); // 模拟调用 API
    },
    fetchTags() {
      this.loading = true;
      // 模拟 API 调用
      console.log('Fetching tags with filters:', this.searchForm);
      setTimeout(() => {
        // 模拟数据
        this.allTableData = [
          {
            id: 1,
            tagKey: 'environment',
            tagValue: 'production',
            category: 'Business',
            status: 'Active',
            description: '生产环境标签',
            updatedAt: '2024-03-20 10:00:00'
          },
          {
            id: 2,
            tagKey: 'priority',
            tagValue: 'high',
            category: 'Warning',
            status: 'Active',
            description: '高优先级标签',
            updatedAt: '2024-03-20 11:00:00'
          },
          {
            id: 3,
            tagKey: 'error',
            tagValue: 'critical',
            category: 'Anomaly',
            status: 'Deprecated',
            description: '严重错误标签',
            updatedAt: '2024-03-20 12:00:00'
          }
        ];
        this.total = this.allTableData.length;
        this.loading = false;
        console.log('Tags fetched (simulated).');
      }, 500);
    },
    getCategoryTagType(category) {
       const map = { 'Business': 'primary', 'Warning': 'warning', 'Anomaly': 'danger' };
       return map[category] || 'info';
    },
    getStatusTagType(status) {
       return status === 'Active' ? 'success' : 'info';
    },
    handleAddTag() {
      this.tagDialogMode = 'add';
      this.currentTag = null; // 清空当前标签数据
      this.tagFormDialogVisible = true;
      console.log('打开新建标签对话框');
      this.$nextTick(() => {
         // 确保 DOM 更新后再访问 ref
         this.$refs.tagFormRef?.resetForm(); // 重置表单
      });
    },
    handleEditTag(row) {
      this.tagDialogMode = 'edit';
      // 使用深拷贝传递数据给表单，避免直接修改表格行数据
      this.currentTag = JSON.parse(JSON.stringify(row));
      this.tagFormDialogVisible = true;
      console.log('打开编辑标签对话框, 数据:', this.currentTag);
       // setForm 应该在 TagForm 内部通过 watch initialData 处理，这里无需显式调用
    },
    handleChangeStatus(row) {
      const newStatus = row.status === 'Active' ? 'Deprecated' : 'Active';
      const actionText = newStatus === 'Active' ? '弃用' : '激活';
      ElMessageBox.confirm(`确定要${actionText}标签 "${row.tagKey}" 吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 确认后的逻辑放在 then 回调中
        const index = this.allTableData.findIndex(item => item.id === row.id);
        if (index !== -1) {
          this.allTableData[index].status = newStatus;
          this.allTableData[index].updatedAt = new Date().toLocaleString(); // 更新时间
          ElMessage.success(`${actionText}成功`);
          // this.fetchTags(); // 可选：重新获取数据
        }
      }).catch(() => {
        ElMessage.info(`已取消${actionText}`);
      });
    },
    handleDeleteTag(row) {
       if (row.status === 'Active') {
        ElMessage.warning('活跃状态的标签不能删除，请先弃用。');
        return;
      }
      ElMessageBox.confirm(`确定要删除标签 "${row.tagKey}" 吗? 此操作不可恢复!`, '警告', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }).then(() => {
         // 确认删除的逻辑放在 then 回调中
         // 模拟 API 调用
        console.log(`Deleting tag ${row.tagKey}`);
        // 在实际应用中，这里应该调用 API 删除，成功后再更新前端数据
        this.allTableData = this.allTableData.filter(item => item.id !== row.id);
        ElMessage.success('删除成功');
        // this.fetchTags(); // 重新加载数据
      }).catch(() => {
        ElMessage.info('已取消删除');
      });
    },
    handleCloseTagFormDialog() {
      this.tagFormDialogVisible = false;
      this.currentTag = null;
      console.log('关闭标签对话框');
    },
    handleSubmitTagForm() {
      console.log('触发表单提交，调用 TagForm 的 submitForm 方法');
      this.$refs.tagFormRef?.submitForm();
    },
    handleSaveSuccess(savedTagData) {
        console.log('TagList 收到 save-success 事件, 数据:', savedTagData);
        this.handleCloseTagFormDialog(); // 关闭对话框

        // 更新表格数据：根据模式判断是新增还是修改
        if (this.tagDialogMode === 'add') {
            // 添加到数据列表顶部（或根据需要排序）
            this.allTableData.unshift(savedTagData);
        } else {
            // 查找并更新现有数据
            const index = this.allTableData.findIndex(item => item.id === savedTagData.id);
            if (index !== -1) {
                this.allTableData.splice(index, 1, savedTagData);
            } else {
                // 如果找不到（理论上不应发生），则添加到末尾
                this.allTableData.push(savedTagData);
            }
        }
        ElMessage.success(`标签 ${this.tagDialogMode === 'add' ? '创建' : '更新'}成功!`);
    },
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1; // 切换每页大小时，重置到第一页
      this.fetchTags();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchTags();
    }
  },
  mounted() {
    this.fetchTags(); // 页面加载时获取初始数据
  }
};
</script>

<style scoped>
.tag-list-container {
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
</style> 