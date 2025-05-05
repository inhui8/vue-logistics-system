<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 搜索区域 -->
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
         <el-form-item label="收件邮箱" prop="toMail">
          <el-input
            v-model="queryParams.toMail"
            placeholder="请输入收件邮箱"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="发送账号" prop="accountId">
           <el-select
            v-model="queryParams.accountId"
            placeholder="请选择发送账号"
            clearable
            style="width: 240px"
          >
             <el-option
                v-for="item in accountOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
           </el-select>
        </el-form-item>
        <el-form-item label="模板编码" prop="templateCode">
          <el-input
            v-model="queryParams.templateCode"
            placeholder="请输入模板编码"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
         <el-form-item label="发送状态" prop="sendStatus">
           <el-select
            v-model="queryParams.sendStatus"
            placeholder="请选择发送状态"
            clearable
            style="width: 240px"
          >
            <el-option label="发送成功" :value="0" />
            <el-option label="发送失败" :value="1" />
           </el-select>
        </el-form-item>
         <el-form-item label="发送时间" prop="sendTimeRange">
           <el-date-picker
              v-model="queryParams.sendTimeRange"
              type="datetimerange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD HH:mm:ss" 
              style="width: 240px"
            />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

    </el-card>

     <el-card shadow="never" class="mt-4">
      <!-- 表格区域 -->
      <el-table v-loading="loading" :data="logList">
        <el-table-column label="编号" align="center" prop="id" width="80"/>
        <el-table-column label="发送邮箱账号" align="center" prop="fromMail" width="180" />
        <el-table-column label="收件邮箱" align="center" prop="toMail" width="180" />
        <el-table-column label="模板标题" align="center" prop="templateTitle" show-overflow-tooltip/>
        <el-table-column label="发送内容" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="openContentDialog(scope.row.templateContent)">查看</el-button>
          </template>
        </el-table-column>
         <el-table-column label="发送参数" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="openContentDialog(scope.row.templateParams)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="发送状态" align="center" width="100">
           <template #default="scope">
            <el-tag :type="scope.row.sendStatus === 0 ? 'success' : 'danger'">
              {{ scope.row.sendStatus === 0 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
         <el-table-column label="模板编号" align="center" prop="templateId" width="100"/>
         <el-table-column label="消息编号" align="center" prop="messageId" width="100"/>
        <el-table-column label="发送时间" align="center" prop="sendTime" width="180">
          <template #default="scope">
            <span>{{ scope.row.sendTime ? new Date(scope.row.sendTime).toLocaleString() : '' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="异常信息" align="center">
          <template #default="scope">
            <el-button v-if="scope.row.sendStatus === 1" link type="danger" @click="openContentDialog(scope.row.exceptionMessage)">
              查看
            </el-button>
             <span v-else>-</span>
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

     <!-- 查看内容对话框 -->
     <el-dialog title="查看详情" v-model="contentDialogVisible" width="700px" append-to-body>
       <div style="white-space: pre-wrap; word-break: break-all; max-height: 60vh; overflow-y: auto;">
         {{ contentToShow }}
       </div>
        <template #footer>
         <el-button @click="contentDialogVisible = false">关 闭</el-button>
       </template>
     </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

// --- 数据定义 ---
const loading = ref(true);
const logList = ref([]);
const total = ref(0);
const queryFormRef = ref(null);
const accountOptions = ref([]); // 发送账号选项
const contentDialogVisible = ref(false);
const contentToShow = ref('');

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  toMail: undefined,
  accountId: undefined,
  templateCode: undefined,
  sendStatus: undefined,
  sendTimeRange: [], // Renamed from sendTime
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

// 获取日志列表 (模拟)
const getList = () => {
  loading.value = true;
  // Process date range before sending query
  const params = { ...queryParams };
  if (params.sendTimeRange && params.sendTimeRange.length === 2) {
    params.beginSendTime = params.sendTimeRange[0];
    params.endSendTime = params.sendTimeRange[1];
  }
  delete params.sendTimeRange;

  console.log('Fetching log list with params:', params);
  // --- 模拟 API 调用 ---
  setTimeout(() => {
    const mockData = [
      { id: 1001, userId: 1, userType: 1, toMail: 'user1@test.com', accountId: 1, fromMail: 'sender1@example.com', templateId: 101, templateCode: 'ORDER_CONFIRM', templateTitle: '您的订单 {orderNo} 已确认', templateContent: '尊敬的 {customerName}，您的订单 {orderNo} 已确认，感谢您的购买！', templateParams: '{"customerName": "测试用户A", "orderNo": "ORD1001"}', sendStatus: 0, sendTime: new Date(Date.now() - 3600000), messageId: 'msg-111', exceptionMessage: null },
      { id: 1002, userId: 2, userType: 1, toMail: 'user2@test.com', accountId: 2, fromMail: 'sender2@example.com', templateId: 102, templateCode: 'PASSWORD_RESET', templateTitle: '密码重置请求', templateContent: '请点击以下链接重置您的密码：{resetLink}', templateParams: '{"resetLink": "http://example.com/reset?token=abc"}', sendStatus: 0, sendTime: new Date(Date.now() - 7200000), messageId: 'msg-222', exceptionMessage: null },
      { id: 1003, userId: 3, userType: 2, toMail: 'admin@test.com', accountId: 1, fromMail: 'sender1@example.com', templateId: 103, templateCode: 'PROMOTION_NEWS', templateTitle: '最新优惠活动！', templateContent: '亲爱的用户，我们有新的优惠活动，详情请见：{promoLink}', templateParams: '{"promoLink": "http://example.com/promo"}', sendStatus: 1, sendTime: new Date(Date.now() - 10800000), messageId: 'msg-333', exceptionMessage: 'ConnectException: Connection refused' },
      { id: 1004, userId: 1, userType: 1, toMail: 'user1_again@test.com', accountId: 4, fromMail: 'another@domain.net', templateId: 101, templateCode: 'ORDER_CONFIRM', templateTitle: '您的订单 {orderNo} 已确认', templateContent: '尊敬的 {customerName}，您的订单 {orderNo} 已确认，感谢您的购买！', templateParams: '{"customerName": "测试用户B", "orderNo": "ORD1004"}', sendStatus: 0, sendTime: new Date(Date.now() - 14400000), messageId: 'msg-444', exceptionMessage: null },
    ];

     // Simulate filtering based on queryParams (basic example)
    let filteredData = mockData.filter(item => {
      let match = true;
      if (params.toMail && !item.toMail.includes(params.toMail)) match = false;
      if (params.accountId && item.accountId !== params.accountId) match = false;
      if (params.templateCode && !item.templateCode.includes(params.templateCode)) match = false;
      if (params.sendStatus !== undefined && item.sendStatus !== params.sendStatus) match = false;
       if (params.beginSendTime && new Date(item.sendTime) < new Date(params.beginSendTime)) match = false;
       if (params.endSendTime && new Date(item.sendTime) > new Date(params.endSendTime)) match = false;
      return match;
    });

    const start = (params.pageNo - 1) * params.pageSize;
    const end = start + params.pageSize;
    logList.value = filteredData.slice(start, end);
    total.value = filteredData.length;
    loading.value = false;
  }, 500);
  // --- 模拟结束 ---
  // Actual API call:
  // emailLogApi.getPage(params).then(res => { ... });
};

// 处理搜索
const handleQuery = () => {
  queryParams.pageNo = 1;
  getList();
};

// 重置搜索
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

// 打开内容查看弹窗
const openContentDialog = (content) => {
  contentToShow.value = content;
  contentDialogVisible.value = true;
};

// --- 生命周期钩子 ---
onMounted(() => {
  getList();
  getAccountOptions();
});

</script>

<style scoped>
/* Reusing styles */
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