<template>
  <div class="message-notification">
    <el-badge :value="unreadCount" :max="99" class="badge">
      <el-button type="text" @click="toggleMessageList">
        <el-icon><Bell /></el-icon>
      </el-button>
    </el-badge>

    <el-drawer
      title="消息通知"
      v-model="drawerVisible"
      direction="rtl"
      size="50%"
      :before-close="handleClose">
      <div class="message-list">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="全部" name="all">
            <div v-for="message in messages" :key="message.id" 
                 class="message-item" 
                 :class="{ unread: !message.read }">
              <div class="message-header">
                <span class="message-type" :class="message.type">{{ getTypeText(message.type) }}</span>
                <span class="message-number">单号：{{ message.number }}</span>
                <span class="message-time">{{ formatTime(message.createTime) }}</span>
              </div>
              <div class="message-content" @click="handleMessageClick(message)">
                <h4 class="message-title">{{ message.title }}</h4>
                <p class="message-summary">{{ message.summary }}</p>
                <div class="message-order-status">
                  <el-tag size="small" :type="getOrderStatusType(message.orderStatus)">
                    {{ getOrderStatusText(message.orderStatus) }}
                  </el-tag>
                </div>
              </div>
              <div class="message-footer">
                <span class="message-source">{{ message.isSystem ? '系统自动' : '人工发送' }}</span>
                <span class="message-status" :class="{ unread: !message.read }">
                  {{ message.read ? '已读' : '未读' }}
                </span>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="指令工单" name="command">
            <div v-for="message in commandMessages" :key="message.id" 
                 class="message-item" 
                 :class="{ unread: !message.read }">
              <div class="message-header">
                <span class="message-type command">指令工单</span>
                <span class="message-number">单号：{{ message.number }}</span>
                <span class="message-time">{{ formatTime(message.createTime) }}</span>
              </div>
              <div class="message-content" @click="handleMessageClick(message)">
                <h4 class="message-title">{{ message.title }}</h4>
                <p class="message-summary">{{ message.summary }}</p>
                <div class="message-order-status">
                  <el-tag size="small" :type="getOrderStatusType(message.orderStatus)">
                    {{ getOrderStatusText(message.orderStatus) }}
                  </el-tag>
                </div>
              </div>
              <div class="message-footer">
                <span class="message-source">{{ message.isSystem ? '系统自动' : '人工发送' }}</span>
                <span class="message-status" :class="{ unread: !message.read }">
                  {{ message.read ? '已读' : '未读' }}
                </span>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="异常工单" name="exception">
            <div v-for="message in exceptionMessages" :key="message.id" 
                 class="message-item" 
                 :class="{ unread: !message.read }">
              <div class="message-header">
                <span class="message-type exception">异常工单</span>
                <span class="message-number">单号：{{ message.number }}</span>
                <span class="message-time">{{ formatTime(message.createTime) }}</span>
              </div>
              <div class="message-content" @click="handleMessageClick(message)">
                <h4 class="message-title">{{ message.title }}</h4>
                <p class="message-summary">{{ message.summary }}</p>
              </div>
              <div class="message-footer">
                <span class="message-source">{{ message.isSystem ? '系统自动' : '人工发送' }}</span>
                <span class="message-status" :class="{ unread: !message.read }">
                  {{ message.read ? '已读' : '未读' }}
                </span>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="增值服务" name="value-added">
            <div v-for="message in valueAddedMessages" :key="message.id" 
                 class="message-item" 
                 :class="{ unread: !message.read }">
              <div class="message-header">
                <span class="message-type value-added">增值服务</span>
                <span class="message-number">单号：{{ message.number }}</span>
                <span class="message-time">{{ formatTime(message.createTime) }}</span>
              </div>
              <div class="message-content" @click="handleMessageClick(message)">
                <h4 class="message-title">{{ message.title }}</h4>
                <p class="message-summary">{{ message.summary }}</p>
              </div>
              <div class="message-footer">
                <span class="message-source">{{ message.isSystem ? '系统自动' : '人工发送' }}</span>
                <span class="message-status" :class="{ unread: !message.read }">
                  {{ message.read ? '已读' : '未读' }}
                </span>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="系统公告" name="announcement">
            <div v-for="message in announcementMessages" :key="message.id" 
                 class="message-item" 
                 :class="{ unread: !message.read }">
              <div class="message-header">
                <span class="message-type announcement">系统公告</span>
                <span class="message-number">单号：{{ message.number }}</span>
                <span class="message-time">{{ formatTime(message.createTime) }}</span>
              </div>
              <div class="message-content" @click="handleMessageClick(message)">
                <h4 class="message-title">{{ message.title }}</h4>
                <p class="message-summary">{{ message.summary }}</p>
              </div>
              <div class="message-footer">
                <span class="message-source">{{ message.isSystem ? '系统自动' : '人工发送' }}</span>
                <span class="message-status" :class="{ unread: !message.read }">
                  {{ message.read ? '已读' : '未读' }}
                </span>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="管理员信息" name="admin">
            <div v-for="message in adminMessages" :key="message.id" 
                 class="message-item" 
                 :class="{ unread: !message.read }">
              <div class="message-header">
                <span class="message-type admin">管理员信息</span>
                <span class="message-number">单号：{{ message.number }}</span>
                <span class="message-time">{{ formatTime(message.createTime) }}</span>
              </div>
              <div class="message-content" @click="handleMessageClick(message)">
                <h4 class="message-title">{{ message.title }}</h4>
                <p class="message-summary">{{ message.summary }}</p>
              </div>
              <div class="message-footer">
                <span class="message-source">{{ message.isSystem ? '系统自动' : '人工发送' }}</span>
                <span class="message-status" :class="{ unread: !message.read }">
                  {{ message.read ? '已读' : '未读' }}
                </span>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Bell } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/time'
import { debounce } from 'lodash-es'

export default {
  name: 'MessageNotification',
  components: {
    Bell
  },
  setup() {
    const router = useRouter()
    const drawerVisible = ref(false)
    const activeTab = ref('all')
    const messages = ref([
      {
        id: 1,
        type: 'command',
        number: 'CMD20240315001',
        title: '新的指令工单',
        summary: '您有一个新的指令工单需要处理',
        createTime: new Date(),
        read: false,
        isSystem: true,
        orderStatus: 'pending'
      },
      {
        id: 2,
        type: 'exception',
        number: 'EXP20240315001',
        title: '异常工单提醒',
        summary: '发现异常情况，请及时处理',
        createTime: new Date(Date.now() - 1000 * 60 * 30),
        read: false,
        isSystem: true,
        orderStatus: 'processing'
      },
      {
        id: 3,
        type: 'value-added',
        number: 'VAS20240315001',
        title: '增值服务通知',
        summary: '您申请的增值服务已受理',
        createTime: new Date(Date.now() - 1000 * 60 * 60),
        read: true,
        isSystem: false,
        orderStatus: 'completed'
      },
      {
        id: 4,
        type: 'announcement',
        number: 'ANN20240315001',
        title: '系统维护通知',
        summary: '系统将于今晚进行例行维护',
        createTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
        read: true,
        isSystem: true,
        orderStatus: 'scheduled'
      },
      {
        id: 5,
        type: 'admin',
        number: 'ADM20240315001',
        title: '管理员通知',
        summary: '请及时更新您的个人信息',
        createTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
        read: true,
        isSystem: false,
        orderStatus: 'resolved'
      }
    ])

    const unreadCount = computed(() => {
      return messages.value.filter(msg => !msg.read).length
    })

    const commandMessages = computed(() => {
      return messages.value.filter(msg => msg.type === 'command')
    })

    const exceptionMessages = computed(() => {
      return messages.value.filter(msg => msg.type === 'exception')
    })

    const valueAddedMessages = computed(() => {
      return messages.value.filter(msg => msg.type === 'value-added')
    })

    const announcementMessages = computed(() => {
      return messages.value.filter(msg => msg.type === 'announcement')
    })

    const adminMessages = computed(() => {
      return messages.value.filter(msg => msg.type === 'admin')
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

    const getOrderStatusText = (status) => {
      const statusMap = {
        pending: '待开始',
        processing: '处理中',
        scheduled: '已安排',
        completed: '已完成',
        resolved: '已解决',
        cancelled: '已取消'
      }
      return statusMap[status] || '未知状态'
    }

    const getOrderStatusType = (status) => {
      const statusMap = {
        pending: 'info',
        processing: 'warning',
        scheduled: 'primary',
        completed: 'success',
        resolved: 'success',
        cancelled: 'danger'
      }
      return statusMap[status] || 'info'
    }

    const toggleMessageList = debounce(() => {
      drawerVisible.value = !drawerVisible.value
    }, 200)

    const handleClose = debounce((done) => {
      done()
    }, 200)

    const handleMessageClick = debounce((message) => {
      message.read = true
      router.push({
        path: '/messages/detail',
        query: { id: message.id }
      })
    }, 200)

    return {
      drawerVisible,
      activeTab,
      messages,
      unreadCount,
      commandMessages,
      exceptionMessages,
      valueAddedMessages,
      announcementMessages,
      adminMessages,
      formatTime,
      getTypeText,
      getOrderStatusText,
      getOrderStatusType,
      toggleMessageList,
      handleClose,
      handleMessageClick
    }
  }
}
</script>

<style scoped>
.message-notification {
  margin-right: 20px;
  display: flex;
  align-items: center;
}

.badge {
  margin-right: 0;
}

.message-notification .el-button {
  padding: 8px;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-notification .el-icon {
  font-size: 20px;
  color: #606266;
}

.message-list {
  padding: 20px;
}

.message-item {
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.3s;
}

.message-item:hover {
  background-color: #f5f7fa;
}

.message-item.unread {
  background-color: #f0f9ff;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.message-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
}

.message-type.command {
  background-color: #409eff;
}

.message-type.exception {
  background-color: #f56c6c;
}

.message-type.value-added {
  background-color: #67c23a;
}

.message-type.announcement {
  background-color: #e6a23c;
}

.message-type.admin {
  background-color: #909399;
}

.message-number {
  color: #909399;
  font-size: 12px;
}

.message-time {
  color: #909399;
  font-size: 12px;
}

.message-content {
  margin-bottom: 10px;
}

.message-title {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #303133;
}

.message-summary {
  margin: 0;
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}

.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-source {
  color: #909399;
  font-size: 12px;
}

.message-status {
  font-size: 12px;
  color: #67c23a;
}

.message-status.unread {
  color: #e6a23c;
}

.message-order-status {
  margin-top: 8px;
}

.message-order-status .el-tag {
  font-size: 12px;
}
</style> 