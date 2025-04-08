<template>
  <div class="warehouse-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>货量统计</span>
          <div class="header-buttons">
            <el-button type="primary" size="small" @click="handleAdd">自动统筹</el-button>
            <el-button type="info" size="small" @click="showLogs">操作日志</el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item>
            <el-select v-model="searchForm.timeType" style="width: 120px;">
              <el-option label="ETA" value="eta"></el-option>
              <el-option label="预计提柜时间" value="pickupTime"></el-option>
              <el-option label="预计抵仓时间" value="arrivalTime"></el-option>
              <el-option label="Available时间" value="availableTime"></el-option>
              <el-option label="卸船时间" value="unloadingTime"></el-option>
              <el-option label="提柜时间" value="containerPickupTime"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-date-picker
              v-model="searchForm.startDate"
              type="date"
              placeholder="开始日期"
              value-format="YYYY-MM-DD"
              style="width: 130px;"
            />
          </el-form-item>
          <el-form-item class="date-separator">
            至
          </el-form-item>
          <el-form-item>
            <el-date-picker
              v-model="searchForm.endDate"
              type="date"
              placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 130px;"
            />
          </el-form-item>
          <el-form-item label="平台">
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
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格区域 -->
      <el-table
        :data="tableData"
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="platform" label="平台" width="100">
          <template #default="scope">
            <el-tag :type="getPlatformType(scope.row.platform)">
              {{ scope.row.platform }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="warehouseCode" label="仓库代码" width="120" />
        
        <!-- 海柜数量列 -->
        <el-table-column prop="containerCount" label="海柜数量" width="120">
          <template #default="scope">
            <el-button 
              type="text" 
              @click="showContainerDetail(scope.row)"
            >
              {{ scope.row.containerCount || 0 }}
            </el-button>
          </template>
        </el-table-column>
        
        <!-- 货量列 -->
        <el-table-column prop="cargoVolume" label="货量(CBM)" width="120">
          <template #default="scope">
            <span>{{ scope.row.cargoVolume || 0 }}</span>
          </template>
        </el-table-column>

        <!-- 未使用预约数量列 -->
        <el-table-column prop="unusedAppointments" label="未使用预约" width="120">
          <template #default="scope">
            <el-button 
              type="text" 
              @click="showUnusedAppointments(scope.row)"
            >
              {{ scope.row.unusedAppointments || 0 }}
            </el-button>
          </template>
        </el-table-column>

        <!-- 限高字段 -->
        <el-table-column prop="heightLimit" label="限高(m)" width="100">
          <template #default="scope">
            <span>{{ scope.row.heightLimit || '-' }}</span>
          </template>
        </el-table-column>

        <!-- 动态日期货量列 -->
        <template v-for="date in dateColumns" :key="date">
          <el-table-column 
            :prop="'volume_' + date.replace(/-/g, '_')"
            :label="formatDateColumn(date)"
            width="120"
          >
            <template #default="scope">
              <span>{{ scope.row['volume_' + date.replace(/-/g, '_')] || 0 }}</span>
            </template>
          </el-table-column>
        </template>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="text" size="small" @click="handleDelete(scope.row)">删除</el-button>
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
      width="800px"
    >
      <el-table :data="currentUnusedAppointments" border>
        <el-table-column prop="platform" label="平台" width="100"></el-table-column>
        <el-table-column prop="warehouseCode" label="仓库代码" width="120"></el-table-column>
        <el-table-column prop="appointmentId" label="预约号" width="150"></el-table-column>
        <el-table-column prop="account" label="预约账户" width="150"></el-table-column>
        <el-table-column prop="appointmentTime" label="预约时间" width="160"></el-table-column>
        <el-table-column prop="status" label="预约状态" width="100">
          <template #default="scope">
            <el-tag type="info">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 海柜详情弹窗 -->
    <el-dialog
      v-model="containerDetailVisible"
      title="海柜详情"
      width="800px"
    >
      <el-table :data="currentContainerDetail" border>
        <el-table-column prop="containerNo" label="集装箱号" width="150" />
        <el-table-column prop="containerType" label="箱型" width="100" />
        <el-table-column prop="containerSize" label="尺寸" width="100" />
        <el-table-column prop="sealNo" label="封条号" width="150" />
        <el-table-column prop="weight" label="重量(kg)" width="120" />
        <el-table-column prop="volume" label="体积(CBM)" width="120" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import WarehouseForm from '@/components/WarehouseForm.vue'

export default {
  name: 'PlanManagement',
  components: { WarehouseForm },
  setup() {
    // 获取默认时间范围（今天到一周后）
    const getDefaultDateRange = () => {
      const start = dayjs()
      const end = dayjs().add(7, 'day')
      return {
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD')
      }
    }

    // 搜索表单
    const searchForm = reactive({
      timeType: 'eta',
      ...getDefaultDateRange(),
      platform: '',
      warehouseCode: ''
    })

    // 表格数据
    const tableData = ref([])
    const loading = ref(false)
    const dateColumns = ref([])

    // 格式化日期列标题
    const formatDateColumn = (date) => {
      return dayjs(date).format('M/D')
    }

    // 平台类型映射
    const getPlatformType = (platform) => {
      const typeMap = {
        'Amazon': 'success',
        'Walmart': 'warning',
        'eBay': 'info',
        'Shopify': 'primary'
      }
      return typeMap[platform] || 'info'
    }

    // 状态类型映射
    const getStatusType = (status) => {
      const typeMap = {
        'normal': 'success',
        'warning': 'warning',
        'error': 'danger'
      }
      return typeMap[status] || 'info'
    }

    // 状态文本映射
    const getStatusText = (status) => {
      const textMap = {
        'normal': '正常',
        'warning': '警告',
        'error': '错误'
      }
      return textMap[status] || status
    }

    // 生成日期列
    const generateDateColumns = () => {
      const columns = []
      const start = dayjs(searchForm.startDate)
      const end = dayjs(searchForm.endDate)
      let current = start

      while (current.isBefore(end) || current.isSame(end, 'day')) {
        columns.push(current.format('YYYY-MM-DD'))
        current = current.add(1, 'day')
      }
      dateColumns.value = columns
    }

    // 海柜详情弹窗
    const containerDetailVisible = ref(false)
    const currentContainerDetail = ref([])

    // 未使用预约弹窗数据
    const unusedAppointmentDialogVisible = ref(false)
    const currentUnusedAppointments = ref([])

    // 显示未使用预约详情
    const showUnusedAppointments = (row) => {
      currentUnusedAppointments.value = [
        {
          platform: 'Amazon',
          warehouseCode: row.warehouseCode,
          appointmentId: 'APPT001',
          account: 'AccountA',
          appointmentTime: '2024-07-30 10:00',
          status: '未使用'
        },
        {
          platform: 'Amazon',
          warehouseCode: row.warehouseCode,
          appointmentId: 'APPT002',
          account: 'AccountB',
          appointmentTime: '2024-07-31 14:00',
          status: '未使用'
        }
      ]
      unusedAppointmentDialogVisible.value = true
    }

    // 分页相关
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)

    // 处理分页大小改变
    const handleSizeChange = (val) => {
      pageSize.value = val
      handleSearch()
    }

    // 处理页码改变
    const handleCurrentChange = (val) => {
      currentPage.value = val
      handleSearch()
    }

    // 生成随机数
    const getRandomNumber = (min, max) => {
      return Math.floor(Math.random() * (max - min + 1)) + min
    }

    // 模拟API调用
    const handleSearch = () => {
      loading.value = true
      setTimeout(() => {
        const today = dayjs()
        const warehouseData = [
          { warehouseCode: 'ONT9', city: 'Redlands', state: 'CA', address: '2125 W. San Bernardino Ave' },
          { warehouseCode: 'HOU2', city: 'Houston', state: 'TX', address: '10550 Ella Blvd.' },
          { warehouseCode: 'HOU3', city: 'Brookshire', state: 'TX', address: '31555 Highway 90 E' },
          { warehouseCode: 'XUS8', city: 'Dallas', state: 'TX', address: '14900 Frye Rd.Fort Worth, Tarrant' },
          { warehouseCode: 'FTW1', city: 'Dallas', state: 'TX', address: '33333 LBJ FWY' },
          { warehouseCode: 'FTW2', city: 'Dallas', state: 'TX', address: '2701 West Bethel Road' },
          { warehouseCode: 'RIC1', city: 'Petersburg', state: 'VA', address: '5000 Commerce Way' },
          { warehouseCode: 'RIC2', city: 'Chester', state: 'VA', address: '1901 Meadowville Technology Parkway' },
          { warehouseCode: 'RIC3', city: 'Richmond', state: 'VA', address: '4949 Commerce Rd' },
          { warehouseCode: 'BFI1', city: 'Sumner', state: 'WA', address: '1800 140th Ave.E Pierce County' },
          { warehouseCode: 'BFI3', city: 'Dupont', state: 'WA', address: '2700 Center Drive Pierce County' },
          { warehouseCode: 'XUSD', city: 'Stockton', state: 'CA', address: '1909 Zephyr St' },
          { warehouseCode: 'BFI4', city: 'Kent', state: 'WA', address: '21005 64th Ave S' },
          { warehouseCode: 'BFI5', city: 'Kent', state: 'WA', address: '20526 59th Place South, King County' },
          { warehouseCode: 'PHX3', city: 'Phoenix', state: 'AZ', address: '6835 West Buckeye Road' },
          { warehouseCode: 'BFI7', city: 'Sumner', state: 'WA', address: '1901 140th Ave E' },
          { warehouseCode: 'SEA6', city: 'Seattle', state: 'WA', address: '2646 Rainier Ave.South King Coun' },
          { warehouseCode: 'SEA8', city: 'Bellevue', state: 'WA', address: '1227 124th Avenue Northeast' },
          { warehouseCode: 'MKE1', city: 'Kenosha', state: 'WI', address: '3501 120th Avenue' },
          { warehouseCode: 'ATL6', city: 'East Point', state: 'GA', address: '4200 North Commerce' },
          { warehouseCode: 'MGE3', city: 'Jefferson', state: 'GA', address: '808 Hog Mountain Road' }
        ]

        // 计算分页
        const start = (currentPage.value - 1) * pageSize.value
        const end = start + pageSize.value
        const paginatedData = warehouseData.slice(start, end)

        // 生成表格数据
        tableData.value = paginatedData.map(warehouse => ({
          platform: 'Amazon',
          warehouseCode: warehouse.warehouseCode,
          containerCount: getRandomNumber(0, 5),
          cargoVolume: getRandomNumber(20, 100),
          unusedAppointments: getRandomNumber(0, 3),
          heightLimit: getRandomNumber(35, 45) / 10,
          status: 'normal',
          city: warehouse.city,
          state: warehouse.state,
          address: warehouse.address,
          [`volume_${today.format('YYYY_MM_DD')}`]: getRandomNumber(10, 50),
          [`volume_${today.add(1, 'day').format('YYYY_MM_DD')}`]: getRandomNumber(10, 50),
          [`volume_${today.add(2, 'day').format('YYYY_MM_DD')}`]: getRandomNumber(10, 50)
        }))

        total.value = warehouseData.length
        loading.value = false
        generateDateColumns()
      }, 1000)
    }

    const resetForm = () => {
      Object.assign(searchForm, {
        timeType: 'eta',
        ...getDefaultDateRange(),
        platform: '',
        warehouseCode: ''
      })
      handleSearch()
    }

    // eslint-disable-next-line no-unused-vars
    const showContainerDetail = (row) => {
      currentContainerDetail.value = [
        {
          containerNo: 'CN123456789',
          containerType: '20GP',
          containerSize: '20ft',
          sealNo: 'SL123456',
          weight: 2000,
          volume: 33.5
        },
        {
          containerNo: 'CN987654321',
          containerType: '40GP',
          containerSize: '40ft',
          sealNo: 'SL987654',
          weight: 4000,
          volume: 67.0
        }
      ]
      containerDetailVisible.value = true
    }

    // 初始化
    onMounted(() => {
      handleSearch()
    })

    return {
      searchForm,
      tableData,
      loading,
      dateColumns,
      containerDetailVisible,
      currentContainerDetail,
      unusedAppointmentDialogVisible,
      currentUnusedAppointments,
      currentPage,
      pageSize,
      total,
      handleSearch,
      handleSizeChange,
      handleCurrentChange,
      resetForm,
      showContainerDetail,
      showUnusedAppointments,
      formatDateColumn,
      getPlatformType,
      getStatusType,
      getStatusText
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

.date-separator {
  margin: 0 -10px;
}

.el-table .cell {
  text-align: center;
}

.el-button--text {
  padding: 0;
}
</style> 