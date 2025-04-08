<template>
  <el-dialog
    title="车辆分配"
    v-model="dialogVisible"
    width="900px"
    :close-on-click-modal="false"
  >
    <!-- 搜索区域 -->
    <div class="search-area">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="搜索车辆">
          <el-input
            v-model="searchForm.plateNumber"
            placeholder="请输入车牌号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="忙碌中" value="busy" />
            <el-option label="空闲" value="idle" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <el-table
      :data="tableData"
      border
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column prop="plateNumber" label="车牌号" width="120" />
      <el-table-column prop="driver" label="司机" width="100" />
      <el-table-column prop="driverPhone" label="司机电话" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'busy' ? 'danger' : 'success'">
            {{ scope.row.status === 'busy' ? '忙碌中' : '空闲' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="gpsNumber" label="GPS绑定号码" width="120" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button
            v-if="scope.row.status === 'idle'"
            type="primary"
            size="small"
            @click="handleAssign(scope.row)"
          >
            分配
          </el-button>
          <el-button
            v-else
            type="danger"
            size="small"
            @click="handleCancelAssign(scope.row)"
          >
            取消分配
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
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
  </el-dialog>
</template>

<script>
import { ref, reactive, watch } from 'vue'
import { ElMessageBox } from 'element-plus'

export default {
  name: 'VehicleAssignmentDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'assign', 'cancel-assign'],
  setup(props, { emit }) {
    const dialogVisible = ref(props.modelValue)
    const loading = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(100)

    // 搜索表单
    const searchForm = reactive({
      plateNumber: '',
      status: ''
    })

    // 模拟数据
    const mockData = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      plateNumber: `粤B${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
      driver: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)],
      driverPhone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      status: Math.random() > 0.5 ? 'busy' : 'idle',
      gpsNumber: `GPS${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    }))

    const tableData = ref(mockData)

    // 监听弹窗显示状态
    watch(() => props.modelValue, (val) => {
      dialogVisible.value = val
    })

    watch(() => dialogVisible.value, (val) => {
      emit('update:modelValue', val)
    })

    // 搜索方法
    const handleSearch = () => {
      loading.value = true
      // 模拟搜索
      setTimeout(() => {
        const filteredData = mockData.filter(item => {
          const matchPlate = !searchForm.plateNumber || 
            item.plateNumber.includes(searchForm.plateNumber)
          const matchStatus = !searchForm.status || 
            item.status === searchForm.status
          return matchPlate && matchStatus
        })
        tableData.value = filteredData
        total.value = filteredData.length
        loading.value = false
      }, 500)
    }

    // 重置搜索
    const resetSearch = () => {
      searchForm.plateNumber = ''
      searchForm.status = ''
      handleSearch()
    }

    // 分配车辆
    const handleAssign = (row) => {
      ElMessageBox.confirm(
        '确认要分配该车辆吗？',
        '分配车辆',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 更新车辆状态为忙碌中
        row.status = '忙碌中';
        
        // 触发分配事件
        emit('assign', row);
      }).catch(() => {
        // 用户取消操作
      });
    };

    // 取消分配
    const handleCancelAssign = (row) => {
      ElMessageBox.confirm(
        '确认要取消分配该车辆吗？',
        '取消分配',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 更新车辆状态为空闲
        row.status = '空闲';
        
        // 触发取消分配事件
        emit('cancel-assign', row);
      }).catch(() => {
        // 用户取消操作
      });
    };

    // 分页方法
    const handleSizeChange = (val) => {
      pageSize.value = val
      handleSearch()
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
      handleSearch()
    }

    return {
      dialogVisible,
      loading,
      searchForm,
      tableData,
      currentPage,
      pageSize,
      total,
      handleSearch,
      resetSearch,
      handleAssign,
      handleCancelAssign,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.search-area {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 