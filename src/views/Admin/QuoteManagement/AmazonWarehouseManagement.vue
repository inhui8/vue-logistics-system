<template>
  <div class="warehouse-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>仓库管理</span>
          <div class="header-buttons">
            <el-button type="primary" size="small" @click="handleAdd">添加仓库</el-button>
            <el-button type="info" size="small" @click="showLogs">操作日志</el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="平台" class="platform-select">
            <el-select v-model="searchForm.platform" placeholder="请选择平台" style="width: 200px;">
              <el-option label="全部" value=""></el-option>
              <el-option label="Amazon" value="Amazon"></el-option>
              <el-option label="Walmart" value="Walmart"></el-option>
              <el-option label="eBay" value="eBay"></el-option>
              <el-option label="Shopify" value="Shopify"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="仓库代码">
            <el-input v-model="searchForm.warehouseCode" placeholder="请输入仓库代码"></el-input>
          </el-form-item>
          <el-form-item label="仓库状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态">
              <el-option label="全部" value=""></el-option>
              <el-option label="正常" value="normal"></el-option>
              <el-option label="维护中" value="maintenance"></el-option>
              <el-option label="已关闭" value="closed"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格区域 -->
      <el-table :data="tableData" style="width: 100%" border>
        <el-table-column prop="platform" label="平台" width="100">
          <template #default="scope">
            <el-tag :type="getPlatformType(scope.row.platform)">
              {{ scope.row.platform }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warehouseCode" label="仓库代码" width="120"></el-table-column>
        <el-table-column prop="location" label="详细地址" min-width="200"></el-table-column>
        <el-table-column prop="city" label="城市" width="120"></el-table-column>
        <el-table-column prop="state" label="州/省" width="80"></el-table-column>
        <el-table-column prop="zipCode" label="邮编" width="100"></el-table-column>
        <el-table-column label="报价数量" width="100" align="center">
          <template #default="scope">
            <el-button 
              type="text" 
              @click="showQuoteDetails(scope.row)"
              :class="{'has-quotes': scope.row.quoteCount > 0}"
            >
              {{ scope.row.quoteCount }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="未使用预约" width="120" align="center">
          <template #default="scope">
            <el-button
              type="text"
              @click="showUnusedAppointments(scope.row)"
              :class="{'has-appointments': scope.row.unusedAppointmentCount > 0}"
            >
              {{ scope.row.unusedAppointmentCount }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="货量统计" width="120" align="center">
           <template #default="scope">
            <el-button type="text" @click="showCargoStatistics(scope.row)">查看货量统计</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="earliestAppointmentTime" label="最早预约时间" width="160"></el-table-column>
        <el-table-column prop="maxHeight" label="限高(M)" width="100" align="center"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastUpdate" label="最后更新时间" width="160"></el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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
    </el-card>

    <!-- 添加/编辑仓库对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="dialogTitle"
      width="70%"
      :before-close="handleCloseDialog"
      destroy-on-close
    >
      <WarehouseForm 
        ref="warehouseFormRef" 
        :initial-data="currentWarehouse"
        :mode="dialogMode"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmitForm">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 报价详情对话框 -->
    <el-dialog
      v-model="quoteDialogVisible"
      title="报价详情"
      width="600px"
    >
      <el-table :data="currentQuotes" border>
        <el-table-column prop="supplierName" label="供应商名称" width="150"></el-table-column>
        <el-table-column prop="quotePrice" label="报价" width="100"></el-table-column>
        <el-table-column prop="quoteDate" label="报价时间" width="160"></el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="getQuoteStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 未使用预约详情对话框 -->
    <el-dialog
      v-model="unusedAppointmentDialogVisible"
      title="未使用预约详情"
      width="1200px"
    >
      <el-table :data="currentUnusedAppointments" border>
        <el-table-column prop="platform" label="平台" width="100"></el-table-column>
        <el-table-column prop="warehouseCode" label="仓库代码" width="120"></el-table-column>
        <el-table-column prop="appointmentId" label="预约号" width="150"></el-table-column>
        <el-table-column prop="account" label="预约账户" width="150"></el-table-column>
        <el-table-column prop="appointmentTime" label="预约时间" width="160"></el-table-column>
        <el-table-column prop="crdd" label="CRDD" width="160"></el-table-column>
        <el-table-column prop="appointmentType" label="预约类型" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.appointmentType === '地板' ? 'success' : 'warning'">
              {{ scope.row.appointmentType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="预约状态" width="100">
          <template #default="scope">
            <el-tag type="info">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-dropdown>
              <el-button type="primary" size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleAppointmentAction(scope.row, 'edit')">编辑</el-dropdown-item>
                  <el-dropdown-item @click="handleAppointmentAction(scope.row, 'cancel')">取消</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import WarehouseForm from '@/components/WarehouseForm.vue'
import { ArrowDown } from '@element-plus/icons-vue'

export default {
  name: 'WarehouseManagement',
  components: { 
    WarehouseForm,
    ArrowDown
  },
  data() {
    return {
      searchForm: {
        platform: '',
        warehouseCode: '',
        status: ''
      },
      tableData: [
        {
          platform: 'Amazon',
          warehouseCode: 'ONT9',
          location: '2125 W. San Bernardino Ave',
          city: 'Redlands',
          state: 'CA',
          zipCode: '92374',
          quoteCount: 5,
          unusedAppointmentCount: 2,
          earliestAppointmentTime: '2024-07-25 09:00:00',
          maxHeight: 1.5,
          status: 'normal',
          lastUpdate: '2024-03-20 10:00:00'
        },
        {
          platform: 'Amazon',
          warehouseCode: 'HOU2',
          location: '10550 Ella Blvd.',
          city: 'Houston',
          state: 'TX',
          zipCode: '77038',
          quoteCount: 3,
          unusedAppointmentCount: 0,
          earliestAppointmentTime: null,
          maxHeight: 1.8,
          status: 'normal',
          lastUpdate: '2024-03-19 15:30:00'
        },
        {
          platform: 'Amazon',
          warehouseCode: 'HOU3',
          location: '31555 Highway 90 E',
          city: 'Brookshire',
          state: 'TX',
          zipCode: '77423',
          quoteCount: 2,
          unusedAppointmentCount: 1,
          earliestAppointmentTime: '2024-07-28 14:30:00',
          maxHeight: 1.6,
          status: 'maintenance',
          lastUpdate: '2024-03-18 09:15:00'
        },
        {
          platform: 'Amazon',
          warehouseCode: 'XUSB',
          location: '14900 Frye Rd.Fort Worth',
          city: 'Dallas',
          state: 'TX',
          zipCode: '76155',
          quoteCount: 4,
          unusedAppointmentCount: 3,
          earliestAppointmentTime: '2024-07-26 11:00:00',
          maxHeight: 1.7,
          status: 'normal',
          lastUpdate: '2024-03-17 14:20:00'
        }
      ],
      currentPage: 1,
      pageSize: 10,
      total: 100,
      formDialogVisible: false,
      dialogMode: 'add',
      currentWarehouse: {},
      quoteDialogVisible: false,
      currentQuotes: [],
      unusedAppointmentDialogVisible: false,
      currentUnusedAppointments: []
    }
  },
  computed: {
    dialogTitle() {
      return this.dialogMode === 'add' ? '新增仓库' : '编辑仓库'
    }
  },
  methods: {
    getPlatformType(platform) {
      const platformMap = {
        'Amazon': '',
        'Walmart': 'success',
        'eBay': 'warning',
        'Shopify': 'info'
      }
      return platformMap[platform] || ''
    },
    handleSearch() {
      console.log('搜索条件：', this.searchForm)
    },
    resetForm() {
      this.searchForm = {
        platform: '',
        warehouseCode: '',
        status: ''
      }
    },
    getStatusType(status) {
      const statusMap = {
        normal: 'success',
        maintenance: 'warning',
        closed: 'danger'
      }
      return statusMap[status] || 'info'
    },
    getStatusText(status) {
      const statusMap = {
        normal: '正常',
        maintenance: '维护中',
        closed: '已关闭'
      }
      return statusMap[status] || '未知'
    },
    getQuoteStatusType(status) {
      const statusMap = {
        '已接受': 'success',
        '待审核': 'warning',
        '已拒绝': 'danger'
      }
      return statusMap[status] || 'info'
    },
    handleAdd() {
      this.dialogMode = 'add'
      this.currentWarehouse = {}
      this.formDialogVisible = true
    },
    handleEdit(row) {
      this.dialogMode = 'edit'
      this.currentWarehouse = JSON.parse(JSON.stringify(row))
      this.currentWarehouse.address1 = row.location;
      this.formDialogVisible = true
    },
    handleDelete(row) {
      console.log('删除：', row)
      const index = this.tableData.findIndex(item => item.warehouseCode === row.warehouseCode);
      if (index !== -1) {
        this.tableData.splice(index, 1);
        this.total--;
      }
    },
    showLogs() {
      console.log('显示日志')
    },
    // eslint-disable-next-line no-unused-vars
    showQuoteDetails(row) {
      this.currentQuotes = [
        {
          supplierName: '供应商A',
          quotePrice: '￥1000',
          quoteDate: '2024-03-20 10:00:00',
          status: '已接受'
        },
        {
          supplierName: '供应商B',
          quotePrice: '￥1200',
          quoteDate: '2024-03-19 15:30:00',
          status: '待审核'
        },
        {
          supplierName: '供应商C',
          quotePrice: '￥1500',
          quoteDate: '2024-03-18 09:15:00',
          status: '已拒绝'
        }
      ]
      this.quoteDialogVisible = true
    },
    showUnusedAppointments(row) {
      console.log('显示未使用预约详情:', row);
      this.currentUnusedAppointments = [
        { platform: row.platform, warehouseCode: row.warehouseCode, appointmentId: 'APPT001', account: 'AccountA', appointmentTime: '2024-07-30 10:00', status: '未使用', crdd: 'CRDD001', appointmentType: '地板' },
        { platform: row.platform, warehouseCode: row.warehouseCode, appointmentId: 'APPT002', account: 'AccountB', appointmentTime: '2024-07-31 14:00', status: '未使用', crdd: 'CRDD002', appointmentType: '地板' },
      ].filter(appt => appt.warehouseCode === row.warehouseCode);

      if (this.currentUnusedAppointments.length > 0) {
        this.unusedAppointmentDialogVisible = true;
      } else {
        this.$message.info('该仓库暂无未使用的预约');
      }
    },
    showCargoStatistics(row) {
      console.log('查看货量统计:', row);
      this.$message.info(`正在开发查看 ${row.warehouseCode} 货量统计的功能`);
    },
    handleCloseDialog() {
      this.formDialogVisible = false
      this.$refs.warehouseFormRef?.resetForm();
    },
    async handleSubmitForm() {
      const isValid = await this.$refs.warehouseFormRef?.validate();
      if (isValid) {
        const formData = this.$refs.warehouseFormRef?.getFormData();
        console.log('Form Data Submitted:', formData)
        if (this.dialogMode === 'add') {
          const newWarehouse = {
            ...formData,
            location: formData.address1 + (formData.address2 ? ' ' + formData.address2 : ''),
            quoteCount: 0,
            unusedAppointmentCount: 0,
            earliestAppointmentTime: null,
            lastUpdate: new Date().toLocaleString()
          };
          this.tableData.unshift(newWarehouse);
          this.total++;
        } else {
          const index = this.tableData.findIndex(item => item.warehouseCode === formData.warehouseCode);
          if (index !== -1) {
             const updatedWarehouse = {
               ...this.tableData[index],
               ...formData,
               location: formData.address1 + (formData.address2 ? ' ' + formData.address2 : ''),
               unusedAppointmentCount: this.tableData[index].unusedAppointmentCount,
               lastUpdate: new Date().toLocaleString()
            };
             this.tableData.splice(index, 1, updatedWarehouse);
          }
        }
        this.handleCloseDialog()
      } else {
        console.log('Form validation failed');
      }
    },
    handleSizeChange(val) {
      this.pageSize = val
      console.log(`每页 ${val} 条`)
    },
    handleCurrentChange(val) {
      this.currentPage = val
      console.log(`当前页: ${val}`)
    },
    handleAppointmentAction(row, action) {
      console.log(`处理预约操作: ${action}`, row);
      // 实现预约操作的逻辑
    }
  }
}
</script>

<style scoped>
.warehouse-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.search-area {
  margin-bottom: 20px;
}

.platform-select {
  margin-right: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.has-quotes {
  color: #409EFF;
  text-decoration: underline;
  cursor: pointer;
}

.has-quotes:hover {
  color: #66b1ff;
}

.has-appointments {
  color: #E6A23C;
  text-decoration: underline;
  cursor: pointer;
}

.has-appointments:hover {
  color: #ebb563;
}

.dialog-footer {
  text-align: right;
}
</style> 