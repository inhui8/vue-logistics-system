<template>
  <div class="message-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="message-type" :class="message.type">{{ getTypeText(message.type) }}</span>
          <span class="message-number">单号：{{ message.number }}</span>
        </div>
      </template>
      <div class="message-info">
        <div class="info-item">
          <span class="label">标题：</span>
          <span class="value">{{ message.title }}</span>
        </div>
        <div class="info-item">
          <span class="label">发送时间：</span>
          <span class="value">{{ formatTime(message.createTime) }}</span>
        </div>
        <div class="info-item">
          <span class="label">发送方式：</span>
          <span class="value">{{ message.isSystem ? '系统自动' : '人工发送' }}</span>
        </div>
        <div class="info-item">
          <span class="label">接收对象：</span>
          <span class="value">{{ formatReceivers(message.receivers) }}</span>
        </div>
        <div class="info-item">
          <span class="label">状态：</span>
          <span class="value" :class="{ unread: !message.read }">
            {{ message.read ? '已读' : '未读' }}
          </span>
        </div>
      </div>
      <div class="message-content" v-html="message.content"></div>
      <div class="message-actions">
        <el-button type="primary" @click="markAsRead" v-if="!message.read">标记已读</el-button>
        <el-button type="danger" @click="deleteMessage">删除</el-button>
        <el-button @click="goBack">返回</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatTime } from '@/utils/time'

export default {
  name: 'MessageDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const message = ref({
      id: 0,
      type: '',
      number: '',
      title: '',
      content: '',
      createTime: new Date(),
      read: false,
      isSystem: false,
      receivers: []
    })

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

    const formatReceivers = (receivers) => {
      if (receivers.includes('all')) {
        return '全体用户'
      }
      return receivers.length + '个用户'
    }

    const fetchMessageDetail = (id) => {
      // 这里应该是从API获取数据
      const mockMessage = {
        id: id,
        type: 'command',
        number: 'CMD20240315001',
        title: '新的指令工单',
        content: '<p>您有一个新的指令工单需要处理</p><p>工单号：CMD20240315001</p><p>请及时处理</p>',
        createTime: new Date(),
        read: false,
        isSystem: true,
        receivers: ['all']
      }
      message.value = mockMessage
    }

    const markAsRead = () => {
      message.value.read = true
      ElMessage.success('已标记为已读')
    }

    const deleteMessage = () => {
      ElMessageBox.confirm('确定要删除这条消息吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 这里应该是调用API删除消息
        ElMessage.success('删除成功')
        goBack()
      })
    }

    const goBack = () => {
      router.back()
    }

    onMounted(() => {
      const id = route.query.id
      if (id) {
        fetchMessageDetail(id)
      }
    })

    return {
      message,
      formatTime,
      getTypeText,
      formatReceivers,
      markAsRead,
      deleteMessage,
      goBack
    }
  }
}
</script>

<style scoped>
.message-detail {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 14px;
  color: #fff;
}

.message-type.command {
  background-color: #409EFF;
}

.message-type.exception {
  background-color: #F56C6C;
}

.message-type.value-added {
  background-color: #67C23A;
}

.message-type.announcement {
  background-color: #E6A23C;
}

.message-type.admin {
  background-color: #909399;
}

.message-number {
  color: #909399;
  font-size: 14px;
}

.message-info {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.info-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  width: 80px;
  color: #606266;
}

.value {
  color: #303133;
}

.value.unread {
  color: #F56C6C;
}

.message-content {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.message-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 