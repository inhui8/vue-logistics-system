<template>
  <div class="message-manage">
    <el-card class="send-message">
      <template #header>
        <div class="card-header">
          <span>发送消息</span>
        </div>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="消息类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择消息类型">
            <el-option label="指令工单" value="command" />
            <el-option label="异常工单" value="exception" />
            <el-option label="增值服务" value="value-added" />
            <el-option label="系统公告" value="announcement" />
            <el-option label="管理员信息" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="接收对象" prop="receivers">
          <el-select v-model="form.receivers" multiple placeholder="请选择接收对象">
            <el-option label="全体用户" value="all" />
            <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="消息标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入消息标题" />
        </el-form-item>
        <el-form-item label="消息内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入消息内容"
          />
        </el-form-item>
        <el-form-item label="发送方式" prop="isSystem">
          <el-radio-group v-model="form.isSystem">
            <el-radio :label="true">系统自动</el-radio>
            <el-radio :label="false">人工发送</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm">发送</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="message-history">
      <template #header>
        <div class="card-header">
          <span>发送历史</span>
        </div>
      </template>
      <el-table :data="messageHistory" style="width: 100%">
        <el-table-column prop="number" label="单号" width="180" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTagType(row.type)">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="receivers" label="接收对象" width="150">
          <template #default="{ row }">
            {{ formatReceivers(row.receivers) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发送时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="isSystem" label="发送方式" width="120">
          <template #default="{ row }">
            {{ row.isSystem ? '系统自动' : '人工发送' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="text" @click="viewDetail(row)">查看</el-button>
            <el-button type="text" class="delete-btn" @click="deleteMessage(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatTime } from '@/utils/time'
import { useRouter } from 'vue-router'

export default {
  name: 'MessageManage',
  setup() {
    const formRef = ref(null)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(100)
    const router = useRouter()

    const form = reactive({
      type: '',
      receivers: [],
      title: '',
      content: '',
      isSystem: false
    })

    const rules = {
      type: [{ required: true, message: '请选择消息类型', trigger: 'change' }],
      receivers: [{ required: true, message: '请选择接收对象', trigger: 'change' }],
      title: [{ required: true, message: '请输入消息标题', trigger: 'blur' }],
      content: [{ required: true, message: '请输入消息内容', trigger: 'blur' }]
    }

    // 模拟用户数据
    const users = ref([
      { id: 1, name: '张三' },
      { id: 2, name: '李四' },
      { id: 3, name: '王五' }
    ])

    // 模拟消息历史数据
    const messageHistory = ref([
      {
        id: 1,
        number: 'CMD20240315001',
        type: 'command',
        title: '新的指令工单',
        receivers: ['all'],
        createTime: new Date(),
        isSystem: true
      },
      {
        id: 2,
        number: 'EXP20240315001',
        type: 'exception',
        title: '异常工单提醒',
        receivers: [1, 2],
        createTime: new Date(Date.now() - 1000 * 60 * 30),
        isSystem: true
      },
      {
        id: 3,
        number: 'VAS20240315001',
        type: 'value-added',
        title: '增值服务通知',
        receivers: [3],
        createTime: new Date(Date.now() - 1000 * 60 * 60),
        isSystem: false
      }
    ])

    const getTypeText = (type) => {
      const typeMap = {
        command: '指令工单',
        exception: '异常工单',
        'value-added': '增值服务',
        announcement: '系统公告',
        admin: '管理员信息'
      }
      return typeMap[type] || '未知类型'
    }

    const getTagType = (type) => {
      const typeMap = {
        command: 'primary',
        exception: 'danger',
        'value-added': 'success',
        announcement: 'warning',
        admin: 'info'
      }
      return typeMap[type] || ''
    }

    const formatReceivers = (receivers) => {
      if (receivers.includes('all')) {
        return '全体用户'
      }
      return receivers.length + '个用户'
    }

    const submitForm = () => {
      formRef.value.validate((valid) => {
        if (valid) {
          // 这里应该是调用API发送消息
          ElMessage.success('消息发送成功')
          resetForm()
        }
      })
    }

    const resetForm = () => {
      formRef.value.resetFields()
    }

    const viewDetail = (row) => {
      // 跳转到消息详情页
      router.push({
        path: '/messages/detail',
        query: { id: row.id }
      })
    }

    const deleteMessage = (row) => {
      ElMessageBox.confirm('确定要删除这条消息吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 这里应该是调用API删除消息
        messageHistory.value = messageHistory.value.filter(item => item.id !== row.id)
        ElMessage.success('删除成功')
      })
    }

    const handleSizeChange = (val) => {
      pageSize.value = val
      // 这里应该是重新加载数据
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
      // 这里应该是重新加载数据
    }

    return {
      formRef,
      form,
      rules,
      users,
      messageHistory,
      currentPage,
      pageSize,
      total,
      formatTime,
      getTypeText,
      getTagType,
      formatReceivers,
      submitForm,
      resetForm,
      viewDetail,
      deleteMessage,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.message-manage {
  padding: 20px;
}

.send-message {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.delete-btn {
  color: #F56C6C;
}
</style> 