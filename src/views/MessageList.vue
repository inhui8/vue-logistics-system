<template>
  <div class="message-list-container">
    <div class="message-list-header">
      <div class="header-title">消息列表</div>
      <div class="header-buttons">
        <el-button type="primary" @click="markAllRead" :disabled="!hasUnread">全部标记已读</el-button>
        <el-button type="danger" @click="batchDelete" :disabled="selectedMessages.length === 0">批量删除</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="全部" name="all">
        <el-table
          :data="messages"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="number" label="单号" width="180" />
          <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getTagType(row.type)">{{ getTypeText(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="createTime" label="时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="orderStatus" label="订单状态" width="120">
            <template #default="{ row }">
              <div @click.stop>
                <el-tag :type="getOrderStatusType(row.orderStatus)" size="small">
                  {{ getOrderStatusText(row.orderStatus) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="isSystem" label="发送方式" width="120">
            <template #default="{ row }">
              {{ row.isSystem ? '系统自动' : '人工发送' }}
            </template>
          </el-table-column>
          <el-table-column prop="read" label="状态" width="100">
            <template #default="{ row }">
              <div @click.stop>
                <el-tag :type="row.read ? 'success' : 'warning'" size="small">
                  {{ row.read ? '已读' : '未读' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <div @click.stop>
                <el-button type="text" @click="viewDetail(row)">查看</el-button>
                <el-button type="text" class="delete-btn" @click="deleteMessage(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="指令工单" name="command">
        <el-table
          :data="commandMessages"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="number" label="单号" width="180" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="createTime" label="时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="orderStatus" label="订单状态" width="120">
            <template #default="{ row }">
              <div @click.stop>
                <el-tag :type="getOrderStatusType(row.orderStatus)" size="small">
                  {{ getOrderStatusText(row.orderStatus) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="isSystem" label="发送方式" width="120">
            <template #default="{ row }">
              {{ row.isSystem ? '系统自动' : '人工发送' }}
            </template>
          </el-table-column>
          <el-table-column prop="read" label="状态" width="100">
            <template #default="{ row }">
              <div @click.stop>
                <el-tag :type="row.read ? 'success' : 'warning'" size="small">
                  {{ row.read ? '已读' : '未读' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <div @click.stop>
                <el-button type="text" @click="viewDetail(row)">查看</el-button>
                <el-button type="text" class="delete-btn" @click="deleteMessage(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="异常工单" name="exception">
        <el-table
          :data="exceptionMessages"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="number" label="单号" width="180" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="createTime" label="时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="orderStatus" label="订单状态" width="120">
            <template #default="{ row }">
              <div @click.stop>
                <el-tag :type="getOrderStatusType(row.orderStatus)" size="small">
                  {{ getOrderStatusText(row.orderStatus) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="isSystem" label="发送方式" width="120">
            <template #default="{ row }">
              {{ row.isSystem ? '系统自动' : '人工发送' }}
            </template>
          </el-table-column>
          <el-table-column prop="read" label="状态" width="100">
            <template #default="{ row }">
              <div @click.stop>
                <el-tag :type="row.read ? 'success' : 'warning'" size="small">
                  {{ row.read ? '已读' : '未读' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <div @click.stop>
                <el-button type="text" @click="viewDetail(row)">查看</el-button>
                <el-button type="text" class="delete-btn" @click="deleteMessage(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="增值服务" name="value-added">
        <el-table
          :data="valueAddedMessages"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="number" label="单号" width="180" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="createTime" label="时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="orderStatus" label="订单状态" width="120">
            <template #default="{ row }">
              <div @click.stop>
                <el-tag :type="getOrderStatusType(row.orderStatus)" size="small">
                  {{ getOrderStatusText(row.orderStatus) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="isSystem" label="发送方式" width="120">
            <template #default="{ row }">
              {{ row.isSystem ? '系统自动' : '人工发送' }}
            </template>
          </el-table-column>
          <el-table-column prop="read" label="状态" width="100">
            <template #default="{ row }">
              <div @click.stop>
                <el-tag :type="row.read ? 'success' : 'warning'" size="small">
                  {{ row.read ? '已读' : '未读' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <div @click.stop>
                <el-button type="text" @click="viewDetail(row)">查看</el-button>
                <el-button type="text" class="delete-btn" @click="deleteMessage(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="系统公告" name="announcement">
        <el-table
          :data="announcementMessages"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="number" label="单号" width="180" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="createTime" label="时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="orderStatus" label="订单状态" width="120">
            <template #default="{ row }">
              <div @click.stop>
                <el-tag :type="getOrderStatusType(row.orderStatus)" size="small">
                  {{ getOrderStatusText(row.orderStatus) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="isSystem" label="发送方式" width="120">
            <template #default="{ row }">
              {{ row.isSystem ? '系统自动' : '人工发送' }}
            </template>
          </el-table-column>
          <el-table-column prop="read" label="状态" width="100">
            <template #default="{ row }">
              <div @click.stop>
                <el-tag :type="row.read ? 'success' : 'warning'" size="small">
                  {{ row.read ? '已读' : '未读' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <div @click.stop>
                <el-button type="text" @click="viewDetail(row)">查看</el-button>
                <el-button type="text" class="delete-btn" @click="deleteMessage(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="管理员信息" name="admin">
        <el-table
          :data="adminMessages"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="number" label="单号" width="180" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="createTime" label="时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="orderStatus" label="订单状态" width="120">
            <template #default="{ row }">
              <div @click.stop>
                <el-tag :type="getOrderStatusType(row.orderStatus)" size="small">
                  {{ getOrderStatusText(row.orderStatus) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="isSystem" label="发送方式" width="120">
            <template #default="{ row }">
              {{ row.isSystem ? '系统自动' : '人工发送' }}
            </template>
          </el-table-column>
          <el-table-column prop="read" label="状态" width="100">
            <template #default="{ row }">
              <div @click.stop>
                <el-tag :type="row.read ? 'success' : 'warning'" size="small">
                  {{ row.read ? '已读' : '未读' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <div @click.stop>
                <el-button type="text" @click="viewDetail(row)">查看</el-button>
                <el-button type="text" class="delete-btn" @click="deleteMessage(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

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
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatTime } from '@/utils/time'
import { debounce } from 'lodash-es'

export default {
  name: 'MessageList',
  setup() {
    const router = useRouter()
    const activeTab = ref('all')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(100)
    const selectedMessages = ref([])

    // 模拟消息数据
    const messages = ref([
      {
        id: 1,
        type: 'command',
        number: 'CMD20240315001',
        title: '新的指令工单',
        content: '您有一个新的指令工单需要处理',
        createTime: new Date(),
        read: false,
        isSystem: true,
        orderStatus: 'pending' // 待开始
      },
      {
        id: 2,
        type: 'exception',
        number: 'EXP20240315001',
        title: '异常工单提醒',
        content: '发现异常情况，请及时处理',
        createTime: new Date(Date.now() - 1000 * 60 * 30),
        read: false,
        isSystem: true,
        orderStatus: 'processing' // 处理中
      },
      {
        id: 3,
        type: 'value-added',
        number: 'VAS20240315001',
        title: '增值服务通知',
        content: '您申请的增值服务已受理',
        createTime: new Date(Date.now() - 1000 * 60 * 60),
        read: true,
        isSystem: false,
        orderStatus: 'completed' // 已完成
      },
      {
        id: 4,
        type: 'announcement',
        number: 'ANN20240315001',
        title: '系统维护通知',
        content: '系统将于今晚进行例行维护',
        createTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
        read: true,
        isSystem: true,
        orderStatus: 'scheduled' // 已安排
      },
      {
        id: 5,
        type: 'admin',
        number: 'ADM20240315001',
        title: '管理员通知',
        content: '请及时更新您的个人信息',
        createTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
        read: true,
        isSystem: false,
        orderStatus: 'resolved' // the order already resolved
      }
    ])

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

    const hasUnread = computed(() => {
      return messages.value.some(msg => !msg.read)
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

    const handleSelectionChange = (selection) => {
      selectedMessages.value = selection
    }

    const markAllRead = () => {
      messages.value.forEach(msg => {
        msg.read = true
      })
      ElMessage.success('已全部标记为已读')
    }

    const batchDelete = () => {
      ElMessageBox.confirm('确定要删除选中的消息吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const ids = selectedMessages.value.map(msg => msg.id)
        messages.value = messages.value.filter(msg => !ids.includes(msg.id))
        selectedMessages.value = []
        ElMessage.success('删除成功')
      })
    }

    const viewDetail = (row) => {
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
        messages.value = messages.value.filter(msg => msg.id !== row.id)
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

    // 添加标签页点击处理函数
    const handleTabClick = debounce(() => {
      // 只切换标签，不执行其他操作
      console.log('Tab changed to:', activeTab.value)
    }, 200)

    return {
      activeTab,
      messages,
      commandMessages,
      exceptionMessages,
      valueAddedMessages,
      announcementMessages,
      adminMessages,
      currentPage,
      pageSize,
      total,
      selectedMessages,
      hasUnread,
      formatTime,
      getTypeText,
      getTagType,
      getOrderStatusText,
      getOrderStatusType,
      handleSelectionChange,
      handleTabClick,
      markAllRead,
      batchDelete,
      viewDetail,
      deleteMessage,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.message-list-container {
  contain: content;
}

.message-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.delete-btn {
  color: #F56C6C;
}

.el-table {
  contain: layout;
}

.el-tag {
  display: inline-block;
}

.el-table-column--action .cell div {
  display: inline-block;
}
</style> 