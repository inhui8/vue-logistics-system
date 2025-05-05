<template>
  <div class="app-container history-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="车次号" prop="trainNumber">
        <el-input
          v-model="queryParams.trainNumber"
          placeholder="请输入车次号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="供应商" prop="supplierName">
        <el-input
          v-model="queryParams.supplierName"
          placeholder="请输入供应商"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="预约日期" prop="appointmentDate">
        <el-date-picker
          v-model="queryParams.appointmentDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择日期"
          clearable
        />
      </el-form-item>
      <el-form-item label="预约状态" prop="appointmentStatus">
        <el-select v-model="queryParams.appointmentStatus" placeholder="选择预约状态" clearable>
          <el-option label="未登记" value="not_checked_in"></el-option>
          <el-option label="已登记" value="checked_in"></el-option>
          <el-option label="装车中" value="loading"></el-option>
          <el-option label="已装车" value="loaded"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="履约状态" prop="fulfillmentStatus">
        <el-select v-model="queryParams.fulfillmentStatus" placeholder="选择履约状态" clearable>
          <el-option label="未履约" value="pending"></el-option>
          <el-option label="已履约" value="fulfilled"></el-option>
          <el-option label="迟到" value="late"></el-option>
          <el-option label="严重迟到" value="severely_late"></el-option>
          <el-option label="推约" value="postponed"></el-option>
          <el-option label="删约" value="cancelled"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="handleQuery"></right-toolbar>
    </el-row>

    <el-table :data="paginatedTableData" @selection-change="handleSelectionChange" style="width: 100%">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" prop="id" width="80" align="center" show-overflow-tooltip/>
      <el-table-column label="车次号" prop="trainNumber" width="120" align="center" show-overflow-tooltip/>
      <el-table-column label="供应商" prop="supplierName" width="100" show-overflow-tooltip/>
      <el-table-column label="预约日期" prop="appointmentDate" width="120" align="center"/>
      <el-table-column label="预约时间" prop="appointmentTime" width="100" align="center"/>
      <el-table-column label="司机电话" prop="driverPhone" width="120" align="center" show-overflow-tooltip/>
      <el-table-column label="货物类型" prop="cargoType" width="100" align="center"/>
      <el-table-column label="装柜类型" prop="loadType" width="100" align="center">
        
        <template #default="scope">
          <span>{{ scope.row.loadType === 'liveload' ? 'Liveload' : 'Drop' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预约状态" prop="appointmentStatus" width="100" align="center">
        <template #default="scope">
          <span>{{ formatAppointmentStatus(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="履约状态" prop="fulfillmentStatus" width="100" align="center">
        <template #default="scope">
          <span>{{ formatFulfillmentStatus(scope.row.fulfillmentStatus) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="司机check in时间" prop="checkInTime" width="160" align="center">
        <template #default="scope">
          <span>{{ formatDateTime(scope.row.checkInTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="装车开始时间" prop="loadingStartTime" width="160" align="center">
        <template #default="scope">
          <span>{{ formatDateTime(scope.row.loadingStartTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="出库时间" prop="outboundTime" width="160" align="center">
        <template #default="scope">
          <span>{{ formatDateTime(scope.row.outboundTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="交仓预约时间" prop="handoverTime" width="160" align="center">
        <template #default="scope">
          <span>{{ formatDateTime(scope.row.handoverTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createdAt" width="120" align="center">
        <template #default="scope">
          <span>{{ formatBasicDate(scope.row.createdAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width" fixed="right">
        <template #default="scope">
          <el-dropdown @command="handleCommand($event, scope.row)" :teleported="true">
            <el-button link type="primary">
              操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="update" :disabled="!isEditable(scope.row)">修改</el-dropdown-item>
                <el-dropdown-item command="history">历史记录</el-dropdown-item>
                <el-dropdown-item command="delete">删除预约</el-dropdown-item>
                <el-dropdown-item command="waive">豁免扣分</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-show="paginatedTotal > 0"
      :total="paginatedTotal"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      style="margin-top: 20px; justify-content: flex-end;"
    />

    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="loadApptRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="车次号" prop="trainNumber">
          <el-input v-model="form.trainNumber" placeholder="请输入车次号" />
        </el-form-item>
        <el-form-item label="供应商" prop="supplierName">
          <el-input v-model="form.supplierName" placeholder="请输入供应商" />
        </el-form-item>
        <el-form-item label="预约日期" prop="appointmentDate">
          <el-date-picker clearable v-model="form.appointmentDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期"/>
        </el-form-item>
        <el-form-item label="预约时间" prop="appointmentTime">
          <el-time-picker v-model="form.appointmentTime" placeholder="选择时间" format="HH:mm:ss" value-format="HH:mm:ss" clearable/>
        </el-form-item>
        <el-form-item label="司机电话" prop="driverPhone">
          <el-input v-model="form.driverPhone" placeholder="请输入司机电话" />
        </el-form-item>
        <el-form-item label="货物类型" prop="cargoType">
          <el-select v-model="form.cargoType" placeholder="请选择货物类型">
            <el-option label="地板" value="地板"></el-option>
            <el-option label="卡板" value="卡板"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="装柜类型" prop="loadType">
          <el-select v-model="form.loadType" placeholder="请选择装柜类型">
            <el-option label="Liveload" value="liveload"></el-option>
            <el-option label="Drop" value="drop"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ApptHistory">
import { ref, reactive, toRefs, getCurrentInstance, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { ArrowDown } from '@element-plus/icons-vue';

const { proxy } = getCurrentInstance();

const allLoadAppts = ref([
  { id: uuidv4(), trainNumber: 'PC101', supplierName: '供应商甲', appointmentDate: '2024-05-10', appointmentTime: '10:00:00', driverPhone: '13800138000', cargoType: '地板', loadType: 'liveload', createdAt: new Date('2024-05-01'), updatedAt: new Date('2024-05-09'), isCheckedIn: true, isLoading: false, isLoaded: true, fulfillmentStatus: 'fulfilled', checkInTime: new Date('2024-05-10 09:55:00'), loadingStartTime: new Date('2024-05-10 10:10:00'), outboundTime: new Date('2024-05-10 11:00:00'), handoverTime: new Date('2024-05-10 12:00:00') },
  { id: uuidv4(), trainNumber: 'PC102', supplierName: '供应商乙', appointmentDate: '2024-05-11', appointmentTime: '14:30:00', driverPhone: '13900139000', cargoType: '卡板', loadType: 'drop', createdAt: new Date('2024-05-02'), updatedAt: new Date('2024-05-03'), isCheckedIn: false, isLoading: false, isLoaded: false, fulfillmentStatus: 'pending', checkInTime: null, loadingStartTime: null, outboundTime: null, handoverTime: null },
  { id: uuidv4(), trainNumber: 'PC103', supplierName: '供应商丙', appointmentDate: '2024-05-10', appointmentTime: '11:00:00', driverPhone: '13700137000', cargoType: '地板', loadType: 'liveload', createdAt: new Date('2024-05-03'), updatedAt: new Date('2024-05-10'), isCheckedIn: true, isLoading: true, isLoaded: false, fulfillmentStatus: 'pending', checkInTime: new Date('2024-05-10 10:58:00'), loadingStartTime: new Date('2024-05-10 11:15:00'), outboundTime: null, handoverTime: null },
  { id: uuidv4(), trainNumber: 'PC104', supplierName: '供应商甲', appointmentDate: '2024-05-12', appointmentTime: '09:00:00', driverPhone: '13800138000', cargoType: '卡板', loadType: 'liveload', createdAt: new Date('2024-05-04'), updatedAt: new Date('2024-05-05'), isCheckedIn: true, isLoading: false, isLoaded: false, fulfillmentStatus: 'late', checkInTime: new Date('2024-05-12 09:30:00'), loadingStartTime: null, outboundTime: null, handoverTime: null },
  { id: uuidv4(), trainNumber: 'TC201', supplierName: '供应商丁', appointmentDate: '2024-05-13', appointmentTime: '16:00:00', driverPhone: '13600136000', cargoType: '地板', loadType: 'drop', createdAt: new Date('2024-05-05'), updatedAt: new Date('2024-05-05'), isCheckedIn: true, isLoading: false, isLoaded: true, fulfillmentStatus: 'fulfilled', checkInTime: new Date('2024-05-13 15:50:00'), loadingStartTime: new Date('2024-05-13 16:05:00'), outboundTime: new Date('2024-05-13 17:00:00'), handoverTime: new Date('2024-05-13 18:00:00') },
  { id: uuidv4(), trainNumber: 'PC105', supplierName: '供应商戊', appointmentDate: '2024-05-14', appointmentTime: '08:00:00', driverPhone: '13500135000', cargoType: '卡板', loadType: 'liveload', createdAt: new Date('2024-05-06'), updatedAt: new Date('2024-05-06'), isCheckedIn: false, isLoading: false, isLoaded: false, fulfillmentStatus: 'pending', checkInTime: null, loadingStartTime: null, outboundTime: null, handoverTime: null },
  { id: uuidv4(), trainNumber: 'PC106', supplierName: '供应商己', appointmentDate: '2024-05-14', appointmentTime: '10:00:00', driverPhone: '13400134000', cargoType: '地板', loadType: 'drop', createdAt: new Date('2024-05-07'), updatedAt: new Date('2024-05-07'), isCheckedIn: false, isLoading: false, isLoaded: false, fulfillmentStatus: 'cancelled', checkInTime: null, loadingStartTime: null, outboundTime: null, handoverTime: null },
  { id: uuidv4(), trainNumber: 'PC107', supplierName: '供应商庚', appointmentDate: '2024-05-15', appointmentTime: '11:00:00', driverPhone: '13300133000', cargoType: '卡板', loadType: 'liveload', createdAt: new Date('2024-05-08'), updatedAt: new Date('2024-05-08'), isCheckedIn: true, isLoading: false, isLoaded: false, fulfillmentStatus: 'severely_late', checkInTime: new Date('2024-05-15 11:45:00'), loadingStartTime: null, outboundTime: null, handoverTime: null },
  { id: uuidv4(), trainNumber: 'PC108', supplierName: '供应商辛', appointmentDate: '2024-05-15', appointmentTime: '14:00:00', driverPhone: '13200132000', cargoType: '地板', loadType: 'drop', createdAt: new Date('2024-05-09'), updatedAt: new Date('2024-05-09'), isCheckedIn: true, isLoading: false, isLoaded: false, fulfillmentStatus: 'postponed', checkInTime: new Date('2024-05-15 14:00:00'), loadingStartTime: null, outboundTime: null, handoverTime: null },
  { id: uuidv4(), trainNumber: 'PC109', supplierName: '供应商壬', appointmentDate: '2024-05-16', appointmentTime: '09:00:00', driverPhone: '13100131000', cargoType: '卡板', loadType: 'liveload', createdAt: new Date('2024-05-10'), updatedAt: new Date('2024-05-10'), isCheckedIn: false, isLoading: false, isLoaded: false, fulfillmentStatus: 'pending', checkInTime: null, loadingStartTime: null, outboundTime: null, handoverTime: null },
  { id: uuidv4(), trainNumber: 'PC110', supplierName: '供应商癸', appointmentDate: '2024-05-16', appointmentTime: '11:00:00', driverPhone: '13000130000', cargoType: '地板', loadType: 'drop', createdAt: new Date('2024-05-11'), updatedAt: new Date('2024-05-11'), isCheckedIn: false, isLoading: false, isLoaded: false, fulfillmentStatus: 'pending', checkInTime: null, loadingStartTime: null, outboundTime: null, handoverTime: null },
  { id: uuidv4(), trainNumber: 'PC111', supplierName: '供应商子', appointmentDate: '2024-05-17', appointmentTime: '13:00:00', driverPhone: '18900189000', cargoType: '卡板', loadType: 'liveload', createdAt: new Date('2024-05-12'), updatedAt: new Date('2024-05-12'), isCheckedIn: false, isLoading: false, isLoaded: false, fulfillmentStatus: 'pending', checkInTime: null, loadingStartTime: null, outboundTime: null, handoverTime: null },
  { id: uuidv4(), trainNumber: 'PC112', supplierName: '供应商丑', appointmentDate: '2024-05-17', appointmentTime: '15:00:00', driverPhone: '18800188000', cargoType: '地板', loadType: 'drop', createdAt: new Date('2024-05-13'), updatedAt: new Date('2024-05-13'), isCheckedIn: false, isLoading: false, isLoaded: false, fulfillmentStatus: 'pending', checkInTime: null, loadingStartTime: null, outboundTime: null, handoverTime: null },
  { id: uuidv4(), trainNumber: 'PC113', supplierName: '供应商寅', appointmentDate: '2024-05-18', appointmentTime: '10:00:00', driverPhone: '18700187000', cargoType: '卡板', loadType: 'liveload', createdAt: new Date('2024-05-14'), updatedAt: new Date('2024-05-14'), isCheckedIn: false, isLoading: false, isLoaded: false, fulfillmentStatus: 'pending', checkInTime: null, loadingStartTime: null, outboundTime: null, handoverTime: null },
  { id: uuidv4(), trainNumber: 'PC114', supplierName: '供应商卯', appointmentDate: '2024-05-18', appointmentTime: '16:00:00', driverPhone: '18600186000', cargoType: '地板', loadType: 'drop', createdAt: new Date('2024-05-15'), updatedAt: new Date('2024-05-15'), isCheckedIn: false, isLoading: false, isLoaded: false, fulfillmentStatus: 'pending', checkInTime: null, loadingStartTime: null, outboundTime: null, handoverTime: null },
]);

const open = ref(false);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const title = ref("");

const currentPage = ref(1);
const pageSize = ref(10);

const data = reactive({
  form: {},
  queryParams: {
    trainNumber: null,
    supplierName: null,
    appointmentDate: null,
    appointmentTime: null,
    driverPhone: null,
    cargoType: null,
    loadType: null,
    appointmentStatus: null,
    fulfillmentStatus: null,
  },
  rules: {
    trainNumber: [{ required: true, message: "车次号不能为空", trigger: "blur" }],
    supplierName: [{ required: true, message: "供应商不能为空", trigger: "blur" }],
    appointmentDate: [{ required: true, message: "预约日期不能为空", trigger: "change" }],
    appointmentTime: [{ required: true, message: "预约时间不能为空", trigger: "change" }],
    driverPhone: [{ required: true, message: "司机电话不能为空", trigger: "blur" }],
    cargoType: [{ required: true, message: "货物类型不能为空", trigger: "change" }],
    loadType: [{ required: true, message: "装柜类型不能为空", trigger: "change" }]
  }
});

const { queryParams, form, rules } = toRefs(data);

function formatAppointmentStatus(row) {
  if (row.isLoaded) return "已装车";
  if (row.isLoading) return "装车中";
  if (row.isCheckedIn) return "已登记";
  return "未登记";
}

function formatFulfillmentStatus(status) {
  const map = {
    fulfilled: "已履约",
    pending: "未履约",
    late: "迟到",
    postponed: "推约",
    cancelled: "删约",
    severely_late: "严重迟到"
  };
  return map[status] || status;
}

const filteredLoadApptList = computed(() => {
  let filtered = allLoadAppts.value;
  if (queryParams.value.trainNumber) {
    filtered = filtered.filter(item => item.trainNumber && item.trainNumber.includes(queryParams.value.trainNumber));
  }
  if (queryParams.value.supplierName) {
    filtered = filtered.filter(item => item.supplierName && item.supplierName.includes(queryParams.value.supplierName));
  }
  if (queryParams.value.appointmentDate) {
    filtered = filtered.filter(item => item.appointmentDate === queryParams.value.appointmentDate);
  }
  if (queryParams.value.appointmentTime) {
    const queryTime = queryParams.value.appointmentTime;
    filtered = filtered.filter(item => item.appointmentTime && item.appointmentTime.startsWith(queryTime));
  }
  if (queryParams.value.driverPhone) {
    filtered = filtered.filter(item => item.driverPhone && item.driverPhone.includes(queryParams.value.driverPhone));
  }
  if (queryParams.value.loadType) {
    filtered = filtered.filter(item => item.loadType === queryParams.value.loadType);
  }
  if (queryParams.value.appointmentStatus) {
    const status = queryParams.value.appointmentStatus;
    filtered = filtered.filter(item => {
      if (status === 'loaded') return item.isLoaded;
      if (status === 'loading') return item.isLoading && !item.isLoaded;
      if (status === 'checked_in') return item.isCheckedIn && !item.isLoading && !item.isLoaded;
      if (status === 'not_checked_in') return !item.isCheckedIn && !item.isLoading && !item.isLoaded;
      return true;
    });
  }
  if (queryParams.value.fulfillmentStatus) {
    filtered = filtered.filter(item => item.fulfillmentStatus === queryParams.value.fulfillmentStatus);
  }
  return filtered;
});

const paginatedTotal = computed(() => filteredLoadApptList.value.length);

const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredLoadApptList.value.slice(start, end);
});

function formatBasicDate(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return date;
  }
}

function formatDateTime(dateTime) {
  if (!dateTime) return '';
  try {
    const d = new Date(dateTime);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    console.error("Error formatting date time:", e);
    return dateTime; // Return original if formatting fails
  }
}

function cancel() {
  open.value = false;
  reset();
}

function reset() {
  form.value = {
    id: null,
    trainNumber: null,
    supplierName: null,
    appointmentDate: null,
    appointmentTime: null,
    driverPhone: null,
    cargoType: null,
    loadType: null,
    isCheckedIn: false,
    isLoading: false,
    isLoaded: false,
    fulfillmentStatus: 'pending'
  };
  if (proxy.$refs.loadApptRef) {
    proxy.$refs.loadApptRef.resetFields();
  }
}

function handleQuery() {
  currentPage.value = 1;
}

function resetQuery() {
  queryParams.value.trainNumber = null;
  queryParams.value.supplierName = null;
  queryParams.value.appointmentDate = null;
  queryParams.value.appointmentTime = null;
  queryParams.value.driverPhone = null;
  queryParams.value.loadType = null;
  queryParams.value.appointmentStatus = null;
  queryParams.value.fulfillmentStatus = null;

  if (proxy.$refs.queryRef) {
    proxy.$refs.queryRef.resetFields();
  }
  handleQuery();
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
}

function isEditable(row) {
  return !row.isLoaded && 
         row.fulfillmentStatus !== 'fulfilled' && 
         row.fulfillmentStatus !== 'cancelled';
}

function handleUpdate(row) {
  if (!isEditable(row)) {
    proxy.$message({ type: 'warning', message: '该状态的预约不可修改！' });
    return;
  }
  reset();
  const apptToEdit = allLoadAppts.value.find(item => item.id === row.id);
  if (apptToEdit) {
    form.value = { ...apptToEdit };
    open.value = true;
    title.value = "修改预约信息 (历史记录页面)";
  }
}

function submitForm() {
  if (!proxy.$refs.loadApptRef) return;
  proxy.$refs.loadApptRef.validate(valid => {
    if (valid) {
      const now = new Date();
      if (form.value.id != null) {
        const index = allLoadAppts.value.findIndex(item => item.id === form.value.id);
        if (index !== -1) {
          const originalStatus = allLoadAppts.value[index];
          allLoadAppts.value[index] = {
            ...originalStatus,
            ...form.value,
            updatedAt: now 
          };
        }
      } else {
        const newAppt = {
          ...form.value,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
          isCheckedIn: false,
          isLoading: false,
          isLoaded: false,
          fulfillmentStatus: 'pending'
        };
        allLoadAppts.value.push(newAppt);
      }
      open.value = false;
      handleQuery(); 
    }
  });
}

function handleCommand(command, row) {
  switch(command) {
    case 'update':
      handleUpdate(row);
      break;
    case 'history':
      handleHistory(row);
      break;
    case 'delete':
      handleDelete(row);
      break;
    case 'waive':
      handleWaivePenalty(row);
      break;
  }
}

function handleHistory(row) {
  console.log("Show history for:", row);
  alert(`显示预约 ${row.trainNumber} (ID: ${row.id}) 的历史记录 (功能待实现)`);
}

function handleDelete(row) {
  const _ids = row.id ? [row.id] : ids.value;
  if (!_ids || _ids.length === 0) {
    proxy.$message({ type: 'warning', message: '请选择要删除的数据！' });
    return;
  }
  proxy.$confirm(`是否确认删除预约信息编号为 "${_ids.join(', ')}" 的数据项？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    allLoadAppts.value = allLoadAppts.value.filter(item => !_ids.includes(item.id));
    proxy.$message({ type: 'success', message: '删除成功!' });
    ids.value = [];
    single.value = true;
    multiple.value = true;
    handleQuery(); 
  }).catch(() => {
    proxy.$message({ type: 'info', message: '已取消删除' });
  });
}

function handleWaivePenalty(row) {
  console.log("Waive penalty for:", row);
  alert(`豁免预约 ${row.trainNumber} (ID: ${row.id}) 的扣分 (功能待实现)`);
}

function handleSizeChange(val) {
  pageSize.value = val;
  currentPage.value = 1;
}

function handleCurrentChange(val) {
  currentPage.value = val;
}

</script>

<style scoped>
.history-container {
  padding: 20px;
}
.el-form-item {
    margin-bottom: 18px;
}
.mb8 {
  margin-bottom: 8px;
}

/* Force overflow hidden for tooltip to work */
:deep(.el-table .cell) {
    overflow: hidden; /* Necessary for ellipsis */
    text-overflow: ellipsis; /* Show ellipsis (...) */
    white-space: nowrap; /* Prevent text wrapping */
    /* line-height might need adjustment if padding causes issues, but try default first */
}

:deep(.el-dropdown) {
    vertical-align: middle;
}
.el-tooltip__popper {
    max-width: 400px;
}
</style> 