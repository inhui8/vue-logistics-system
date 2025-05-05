<template>
  <div class="appointment-list">
    <div class="header-tabs">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="已入库" name="inStock"></el-tab-pane>
        <el-tab-pane label="待入库" name="pending"></el-tab-pane>
      </el-tabs>
    </div>

    <div class="filter-container">
      <div class="filter-row top-row">
        <el-select v-model="filterForm.vehicleDelivery" placeholder="卡车派送" class="filter-item">
          <el-option label="卡车派送" value="truck"></el-option>
        </el-select>
        <el-select v-model="filterForm.warehouse" placeholder="美西二号仓" class="filter-item">
          <el-option label="美西二号仓" value="warehouse2"></el-option>
        </el-select>
        <el-select v-model="filterForm.destination" placeholder="目的地：请选择" class="filter-item">
          <el-option label="清关" value="customs"></el-option>
        </el-select>
        <el-select v-model="filterForm.courier" placeholder="快递商" class="filter-item">
          <el-option label="快递商" value="placeholder"></el-option>
        </el-select>
        <el-select v-model="filterForm.shipmentStatus" placeholder="运单状态" class="filter-item">
          <el-option label="运单状态" value="placeholder"></el-option>
        </el-select>
        <el-select v-model="filterForm.systemNoType" placeholder="系统SO号" class="filter-item">
          <el-option label="系统SO号" value="placeholder"></el-option>
        </el-select>
        <el-input v-model="filterForm.search" placeholder="搜索系统SO号/自有单号" class="filter-item filter-search-input" />
        <el-select v-model="filterForm.hasPlatformAddress" placeholder="是否包含平台地址" class="filter-item">
          <el-option label="是" value="yes"></el-option>
          <el-option label="否" value="no"></el-option>
        </el-select>
        <el-select v-model="filterForm.isSendOrder" placeholder="是否SEND订单: 全部" class="filter-item">
          <el-option label="全部" value="all"></el-option>
          <el-option label="是" value="yes"></el-option>
          <el-option label="否" value="no"></el-option>
        </el-select>
        <el-button type="primary" class="filter-item filter-button-query">查询</el-button>
         <el-icon class="filter-item settings-icon"><Setting /></el-icon>
      </div>
      <div class="filter-row bottom-row">
         <el-button class="filter-item filter-button-add" @click="handleAddItem">加入</el-button>
        <el-button class="filter-item" @click="handleCreateDispatch">创建派送</el-button>
        <el-button class="filter-item" @click="handleCreateTransfer">创建调拨</el-button>
        <el-button class="filter-item" disabled>批量添加跟进记录</el-button>
      </div>
    </div>

    <el-table
      ref="mainTableRef"
      :data="paginatedData"
      style="width: 100%; margin-top: 15px;"
      row-key="orderNo" 
      
    >
      <el-table-column type="selection" width="55" reserve-selection="true"></el-table-column>
      <el-table-column prop="orderNo" label="运单号" width="150" fixed="left"></el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="160"></el-table-column>
      <el-table-column prop="trackingRecord" label="跟进记录" width="150"></el-table-column>
      <el-table-column prop="platformCode" label="平台代码" width="100"></el-table-column>
      <el-table-column prop="productChannel" label="产品渠道" width="180"></el-table-column>
      <el-table-column prop="shipmentLabel" label="运单标签" width="100"></el-table-column>
      <el-table-column prop="expectedCartons" label="预计箱数" width="90"></el-table-column>
      <el-table-column prop="receivedCartons" label="入库箱数" width="90"></el-table-column>
      <el-table-column prop="totalWeightKg" label="总重量(kg)" width="110"></el-table-column>
      <el-table-column prop="totalVolume" label="总体积" width="90"></el-table-column>
      <el-table-column prop="location" label="库位" width="120"></el-table-column>
      <el-table-column prop="devanningCompletionTime" label="拆柜完成时间" width="160"></el-table-column>
      <el-table-column prop="warehouseAge" label="库龄" width="70"></el-table-column>
      <el-table-column prop="customerName" label="客户名称" width="200"></el-table-column>
      <el-table-column prop="containerNo" label="柜号" width="120"></el-table-column>
      <el-table-column prop="deliveryLFD" label="派送LFD" width="120"></el-table-column>
      <el-table-column prop="platform" label="平台" width="100"></el-table-column>
      <el-table-column prop="stateProvince" label="州/省" width="80"></el-table-column>
      <el-table-column prop="city" label="城市" width="120"></el-table-column>
      <el-table-column prop="postalCode" label="邮编" width="100"></el-table-column>
      <el-table-column prop="addressLine1" label="地址行1" width="250"></el-table-column>
      <el-table-column prop="addressLine2" label="地址行2" width="150"></el-table-column>
      <el-table-column prop="contactPerson" label="联系人" width="100"></el-table-column>
      <el-table-column prop="contactPhone" label="联系电话" width="150"></el-table-column>
      <el-table-column prop="email" label="邮箱" width="180"></el-table-column>
      <el-table-column prop="customerServiceRep" label="客服人员" width="100"></el-table-column>
      <el-table-column prop="lianyuChannel" label="联宇渠道" width="120"></el-table-column>
      <el-table-column prop="appointmentStatus" label="预约派送状态" width="120"></el-table-column>
      <el-table-column prop="memo" label="MEMO" width="150"></el-table-column>
      <el-table-column prop="palletCount" label="卡板数量" width="90"></el-table-column>
      <el-table-column prop="shipmentId" label="货件编号" width="150"></el-table-column>
      <el-table-column prop="routeName" label="线路名称" width="120"></el-table-column>
      <el-table-column prop="trackingCode" label="追踪编码" width="200"></el-table-column>
      <el-table-column prop="remarks" label="备注" width="200"></el-table-column>
      <el-table-column label="操作" fixed="right" width="80">
        <template #default>
          <el-button type="text">更多...</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-summary-container">
      <div class="summary-section">
        统计 卡板数量: {{ summaryData.totalPallets.toFixed(2) }} 体积: {{ summaryData.totalVolume.toFixed(2) }} 重量(kg): {{ summaryData.totalWeightKg.toFixed(2) }}
      </div>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalItems"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- Create Outbound Dialog -->
     <el-dialog
      v-model="dialogVisible"
      :title="creationType === 'dispatch' ? '创建派送' : '创建调拨'"
      width="80%"
      top="5vh" 
      :before-close="handleDialogClose"
      destroy-on-close
      append-to-body 
    >
      <CreateOutbound 
        ref="createOutboundRef" 
        @save="handleDialogSave" 
        @cancel="handleDialogClose"
      />
       <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="confirmDialogSave">确定</el-button> 
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import CreateOutbound from '@/views/Appointment/CreateOutbound.vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('inStock')

const filterForm = reactive({
  vehicleDelivery: 'truck',
  warehouse: 'warehouse2',
  destination: '',
  courier: 'placeholder',
  shipmentStatus: 'placeholder',
  systemNoType: 'placeholder',
  search: '',
  hasPlatformAddress: '',
  isSendOrder: 'all'
})

// --- Pagination State ---
const currentPage = ref(1)
const pageSize = ref(10) // Default page size

// --- Selection and Creation State ---
const mainTableRef = ref(null)
const itemsForCreation = ref([])
const dialogVisible = ref(false)
const creationType = ref('')
const createOutboundRef = ref(null)

// --- Full Table Data (Now 10 items) ---
const tableData = ref([
  {
    orderNo: 'TO25042300021',
    createTime: '2025/04/28 19:12:02',
    trackingRecord: '到达分拨中心',
    platformCode: 'SCK8',
    productChannel: '限时转-卡派/卡派',
    shipmentLabel: '需预约',
    expectedCartons: '20',
    receivedCartons: '0',
    totalWeightKg: '253',
    totalVolume: '0.93',
    location: 'P14',
    devanningCompletionTime: '2025/04/29 08:00:00',
    warehouseAge: '1',
    customerName: '广东联宇物流有限公司',
    containerNo: 'DEMU1234567',
    deliveryLFD: '2025/05/05',
    platform: 'Amazon',
    stateProvince: 'CA',
    city: 'Moreno Valley',
    postalCode: '92551',
    addressLine1: '123 Amazon Way',
    addressLine2: '',
    contactPerson: '张三',
    contactPhone: '(555) 111-2222',
    email: 'zhangsan@example.com',
    customerServiceRep: '客服小王',
    lianyuChannel: '美西快线',
    appointmentStatus: '待确认',
    memo: '客户要求优先处理',
    palletCount: '1',
    shipmentId: 'FBA17XYZ888',
    routeName: '美西专线A',
    trackingCode: '1Z999AA10123456784',
    remarks: '第一次合作'
  },
  {
    orderNo: 'LW25042800891',
    createTime: '2025/04/28 17:31:17',
    trackingRecord: '已签收',
    platformCode: 'XLX7',
    productChannel: '标准快递/快递',
    shipmentLabel: '',
    expectedCartons: '547',
    receivedCartons: '547',
    totalWeightKg: '17765.51',
    totalVolume: '85.33',
    location: 'P17,P19,P18',
    devanningCompletionTime: '2025/04/29 10:30:00',
    warehouseAge: '3',
    customerName: 'LINK TRANS LOGISTICS INC',
    containerNo: 'FCIU7654321',
    deliveryLFD: '2025/05/10',
    platform: 'Walmart',
    stateProvince: 'TX',
    city: 'Dallas',
    postalCode: '75201',
    addressLine1: '456 Commerce St',
    addressLine2: 'Suite 200',
    contactPerson: 'Li Si',
    contactPhone: '(555) 333-4444',
    email: 'lisi@linktrans.com',
    customerServiceRep: 'Agent Lee',
    lianyuChannel: '华南特惠',
    appointmentStatus: '已预约',
    memo: '',
    palletCount: '15',
    shipmentId: 'WM987DEF456',
    routeName: '内陆卡车线B',
    trackingCode: '9405511899561234567890',
    remarks: '大货量客户'
  },
  {
    orderNo: 'LW25042800875',
    createTime: '2025/04/28 09:50:58',
    trackingRecord: '派送中',
    platformCode: 'POC1',
    productChannel: 'T2/卡派',
    shipmentLabel: '加急',
    expectedCartons: '150',
    receivedCartons: '150',
    totalWeightKg: '1001',
    totalVolume: '4',
    location: 'D23',
    devanningCompletionTime: '2025/04/28 15:00:00',
    warehouseAge: '2',
    customerName: 'Happy link international group corp',
    containerNo: 'MSKU9876543',
    deliveryLFD: '2025/05/02',
    platform: 'Shopify',
    stateProvince: 'NY',
    city: 'New York',
    postalCode: '10001',
    addressLine1: '789 Fashion Ave',
    addressLine2: '',
    contactPerson: 'Wang Wu',
    contactPhone: '(555) 555-6666',
    email: 'wangwu@happylink.com',
    customerServiceRep: '客服小赵',
    lianyuChannel: '美东直送',
    appointmentStatus: '已完成',
    memo: '尽快派送',
    palletCount: '5',
    shipmentId: 'SHOP112233',
    routeName: '美东空运线',
    trackingCode: 'DT1234567890US',
    remarks: ''
  },
  {
    orderNo: 'TO25042300022',
    createTime: '2025/04/29 10:05:11',
    trackingRecord: '已揽收',
    platformCode: 'ONT8',
    productChannel: '经济卡派/卡派',
    shipmentLabel: '',
    expectedCartons: '50',
    receivedCartons: '50',
    totalWeightKg: '550.5',
    totalVolume: '3.5',
    location: 'A01',
    devanningCompletionTime: '2025/04/30 09:15:00',
    warehouseAge: '0',
    customerName: '测试客户A',
    containerNo: 'TEST1111111',
    deliveryLFD: '2025/05/08',
    platform: 'Amazon',
    stateProvince: 'CA',
    city: 'Ontario',
    postalCode: '91761',
    addressLine1: '987 Test Dr',
    addressLine2: '',
    contactPerson: 'Test A',
    contactPhone: '(555) 777-8888',
    email: 'testa@example.com',
    customerServiceRep: '客服小李',
    lianyuChannel: '美西经济',
    appointmentStatus: '无需预约',
    memo: '测试数据1',
    palletCount: '2',
    shipmentId: 'FBA18ABC999',
    routeName: '美西本地派',
    trackingCode: '1Z999AA20298765432',
    remarks: '加急'
  },
  {
    orderNo: 'TO25042300023',
    createTime: '2025/04/29 11:20:35',
    trackingRecord: '运输中',
    platformCode: 'LGB3',
    productChannel: '限时转-卡派/卡派',
    shipmentLabel: '危险品',
    expectedCartons: '5',
    receivedCartons: '5',
    totalWeightKg: '88',
    totalVolume: '0.6',
    location: 'C12',
    devanningCompletionTime: '2025/04/30 14:00:00',
    warehouseAge: '1',
    customerName: '测试客户B',
    containerNo: 'TEST2222222',
    deliveryLFD: '2025/05/06',
    platform: 'Amazon',
    stateProvince: 'CA',
    city: 'Long Beach',
    postalCode: '90806',
    addressLine1: '555 Ocean Blvd',
    addressLine2: '',
    contactPerson: 'Test B',
    contactPhone: '(555) 123-4567',
    email: 'testb@example.com',
    customerServiceRep: '客服小王',
    lianyuChannel: '美西快线',
    appointmentStatus: '已预约',
    memo: '内含电池',
    palletCount: '1',
    shipmentId: 'FBA19LMN777',
    routeName: '美西专线B',
    trackingCode: '1Z999AA30312345678',
    remarks: '小心轻放'
  },
  {
    orderNo: 'LW25042800892',
    createTime: '2025/04/29 14:55:01',
    trackingRecord: '到达派送点',
    platformCode: 'FTW1',
    productChannel: '标准快递/快递',
    shipmentLabel: '',
    expectedCartons: '200',
    receivedCartons: '198',
    totalWeightKg: '2500',
    totalVolume: '15',
    location: 'E05, E06',
    devanningCompletionTime: '2025/04/30 16:30:00',
    warehouseAge: '4',
    customerName: '测试客户C Inc.',
    containerNo: 'TEST3333333',
    deliveryLFD: '2025/05/12',
    platform: 'Walmart',
    stateProvince: 'TX',
    city: 'Fort Worth',
    postalCode: '76107',
    addressLine1: '100 Main St',
    addressLine2: '',
    contactPerson: 'Test C',
    contactPhone: '(555) 987-6543',
    email: 'testc@example.com',
    customerServiceRep: 'Agent Smith',
    lianyuChannel: '华南特惠',
    appointmentStatus: '待派送',
    memo: '少两箱，待核实',
    palletCount: '8',
    shipmentId: 'WM765GHI321',
    routeName: '内陆卡车线C',
    trackingCode: '9405511899569876543210',
    remarks: '部分破损'
  },
    {
    orderNo: 'TO25042300024',
    createTime: '2025/04/30 09:00:00',
    trackingRecord: '待入库',
    platformCode: 'MEM1',
    productChannel: '限时转-卡派/卡派',
    shipmentLabel: '',
    expectedCartons: '30',
    receivedCartons: '0',
    totalWeightKg: '400',
    totalVolume: '2.8',
    location: '',
    devanningCompletionTime: '',
    warehouseAge: '0',
    customerName: '测试客户D',
    containerNo: 'TEST4444444',
    deliveryLFD: '2025/05/09',
    platform: 'Amazon',
    stateProvince: 'TN',
    city: 'Memphis',
    postalCode: '38118',
    addressLine1: '300 Elvis Presley Blvd',
    addressLine2: '',
    contactPerson: 'Test D',
    contactPhone: '(555) 111-9999',
    email: 'testd@example.com',
    customerServiceRep: '客服小张',
    lianyuChannel: '美中专线',
    appointmentStatus: '待确认',
    memo: '',
    palletCount: '2',
    shipmentId: 'FBA20JKL666',
    routeName: '美中线路',
    trackingCode: '1Z999AA40411223344',
    remarks: '新客户'
  },
  {
    orderNo: 'LW25042800893',
    createTime: '2025/04/30 10:15:45',
    trackingRecord: '待清关',
    platformCode: 'JFK8',
    productChannel: '标准快递/快递',
    shipmentLabel: '需打托',
    expectedCartons: '100',
    receivedCartons: '100',
    totalWeightKg: '1200',
    totalVolume: '9.5',
    location: 'F10',
    devanningCompletionTime: '2025/05/01 11:00:00',
    warehouseAge: '1',
    customerName: '测试客户E LLC',
    containerNo: 'TEST5555555',
    deliveryLFD: '2025/05/15',
    platform: 'Ebay',
    stateProvince: 'NJ',
    city: 'Carteret',
    postalCode: '07008',
    addressLine1: '1 Progress Plaza',
    addressLine2: '',
    contactPerson: 'Test E',
    contactPhone: '(555) 222-8888',
    email: 'teste@example.com',
    customerServiceRep: 'Agent Jones',
    lianyuChannel: '美东经济',
    appointmentStatus: '已完成',
    memo: '打托费待确认',
    palletCount: '4',
    shipmentId: 'EBAY556677',
    routeName: '美东本地派送',
    trackingCode: '940551189956111222333',
    remarks: ''
  },
  {
    orderNo: 'TO25042300025',
    createTime: '2025/04/30 15:30:20',
    trackingRecord: '转运中',
    platformCode: 'CLT2',
    productChannel: 'T2/卡派',
    shipmentLabel: '',
    expectedCartons: '80',
    receivedCartons: '80',
    totalWeightKg: '950',
    totalVolume: '7.2',
    location: 'G01',
    devanningCompletionTime: '2025/05/01 14:45:00',
    warehouseAge: '2',
    customerName: '测试客户F',
    containerNo: 'TEST6666666',
    deliveryLFD: '2025/05/11',
    platform: 'Amazon',
    stateProvince: 'NC',
    city: 'Charlotte',
    postalCode: '28214',
    addressLine1: '800 Amazon Rd',
    addressLine2: 'Dock 5',
    contactPerson: 'Test F',
    contactPhone: '(555) 333-7777',
    email: 'testf@example.com',
    customerServiceRep: '客服小刘',
    lianyuChannel: '美东直送',
    appointmentStatus: '已预约',
    memo: '',
    palletCount: '3',
    shipmentId: 'FBA21MNO555',
    routeName: '美东南线路',
    trackingCode: '1Z999AA50544332211',
    remarks: '按时派送'
  },
  {
    orderNo: 'LW25042800894',
    createTime: '2025/04/30 16:00:55',
    trackingRecord: '清关完成',
    platformCode: 'ORD5',
    productChannel: '经济卡派/卡派',
    shipmentLabel: '超重',
    expectedCartons: '120',
    receivedCartons: '120',
    totalWeightKg: '1800',
    totalVolume: '12',
    location: 'H20',
    devanningCompletionTime: '2025/05/01 17:00:00',
    warehouseAge: '0',
    customerName: '测试客户G Solutions',
    containerNo: 'TEST7777777',
    deliveryLFD: '2025/05/14',
    platform: 'Target',
    stateProvince: 'IL',
    city: 'Joliet',
    postalCode: '60433',
    addressLine1: '1 Target Plaza',
    addressLine2: '',
    contactPerson: 'Test G',
    contactPhone: '(555) 444-6666',
    email: 'testg@example.com',
    customerServiceRep: '客服小钱',
    lianyuChannel: '美中经济',
    appointmentStatus: '待确认',
    memo: '需叉车',
    palletCount: '6',
    shipmentId: 'TGT889900',
    routeName: '美中专线',
    trackingCode: '940551189956777888999',
    remarks: '预约电话联系'
  }
])

const totalItems = computed(() => tableData.value.length)

// --- Computed Property for Paginated Data ---
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return tableData.value.slice(start, end)
})

// --- Computed Property for Summary Data ---
const summaryData = computed(() => {
  let totalPallets = 0
  let totalVolume = 0
  let totalWeightKg = 0

  tableData.value.forEach(item => {
    totalPallets += parseFloat(item.palletCount) || 0
    totalVolume += parseFloat(item.totalVolume) || 0
    totalWeightKg += parseFloat(item.totalWeightKg) || 0
  })

  return {
    totalPallets,
    totalVolume,
    totalWeightKg
  }
})

// --- Pagination Event Handlers ---
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1 // Reset to first page when size changes
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// --- Event Handlers ---
const handleAddItem = () => {
  const selection = mainTableRef.value?.getSelectionRows(); // Get current selection directly from table ref
  console.log('Add item clicked. Selection from table ref:', selection);
  if (!selection || selection.length === 0) {
    ElMessage.warning('请先在表格中选择要加入的项！')
    return
  }
  // Add selected items to itemsForCreation, avoiding duplicates based on orderNo
  const currentIds = itemsForCreation.value.map(item => item.orderNo)
  let addedCount = 0
  selection.forEach(item => {
    if (!currentIds.includes(item.orderNo)) {
      itemsForCreation.value.push(item)
      addedCount++
    }
  })
  if (addedCount > 0) {
    ElMessage.success(`${addedCount} 项已成功加入待创建列表！`)
    mainTableRef.value?.clearSelection() // Clear selection after adding
  } else {
    ElMessage.info('选中的项已在待创建列表中。')
  }
  console.log('Items for creation:', itemsForCreation.value)
}

const openCreateDialog = (type) => {
  if (itemsForCreation.value.length === 0) {
    ElMessage.warning('请先"加入"需要创建的项！')
    return
  }
  creationType.value = type
  dialogVisible.value = true

  // Use nextTick to ensure the dialog and its child component are rendered
  nextTick(() => {
    if (createOutboundRef.value) {
      // Map itemsForCreation data to the structure expected by CreateOutboundPC's stockedItems
      // Assuming CreateOutboundPC expects: { id, waybillNo, containerNo, palletNo, location, pieces, weight, volume }
      // We need to map from our tableData structure
      const mappedItems = itemsForCreation.value.map((item, index) => ({
        id: index + 1, // Or use a real ID if available
        waybillNo: item.orderNo,
        containerNo: item.containerNo, // Map container number
        palletNo: `KB-${item.orderNo.slice(-5)}`, // Example pallet number generation
        location: item.location,
        pieces: parseInt(item.expectedCartons) || 0, // Assuming pieces maps to expectedCartons
        weight: parseFloat(item.totalWeightKg) * 2.20462 || 0, // Convert kg to lbs for the component?
        volume: parseFloat(item.totalVolume) || 0 // Assuming CBM
      }))
      // Access the child component instance via ref and set its internal state
      // This is less ideal than props, but necessary given the component's structure
      createOutboundRef.value.setStockedItems(mappedItems) 
      // Also potentially set basic info based on the first item?
      // createOutboundRef.value.setBasicInfo({ ... });
       ElMessage.info(`已将 ${mappedItems.length} 项加载到创建${type === 'dispatch' ? '派送' : '调拨'}表单。`)
    } else {
      console.error('CreateOutboundPC component reference not found.')
    }
  })
}

const handleCreateDispatch = () => {
  openCreateDialog('dispatch')
}

const handleCreateTransfer = () => {
  openCreateDialog('transfer')
}

const handleDialogClose = () => {
  dialogVisible.value = false
  // Optionally clear itemsForCreation after closing?
  // itemsForCreation.value = [];
}

const handleDialogSave = (formData) => {
  console.log('Save data from dialog:', formData)
  // Here you would typically send the formData to your backend API
  ElMessage.success('创建成功！') // Placeholder success message
  itemsForCreation.value = [] // Clear items after successful save
  handleDialogClose()
}

const confirmDialogSave = () => {
  if (createOutboundRef.value) {
     // Trigger the save method inside CreateOutboundPC if it exists
     // Or get the data and call handleDialogSave here
     // Assuming CreateOutboundPC emits a 'save' event with data, 
     // or has a method like 'getFormData' or 'submit'
     
     // Let's assume it has a submit method that we call, which in turn emits 'save'
     // or handles the save itself and emits 'save' on success.
     if (typeof createOutboundRef.value.submit === 'function') {
        createOutboundRef.value.submit()
     } else {
        // If no submit method, maybe just get the data and save?
        // const formData = createOutboundRef.value.getFormData(); // Hypothetical
        // handleDialogSave(formData);
        console.warn('CreateOutboundPC does not have a submit method. Implement save logic.')
        // For now, just close the dialog as a placeholder
         handleDialogClose()
     }
  } else {
     console.error('Cannot save, CreateOutboundPC component reference not found.')
  }
}

</script>

<style scoped>
.appointment-list {
  padding: 10px 20px; /* Reduced top/bottom padding */
}

.header-tabs {
  margin-bottom: 15px; /* Reduced margin */
}

.filter-container {
  background-color: #fff;
  padding: 10px 15px; /* Reduced padding */
  border-radius: 4px;
  margin-bottom: 0; /* Removed margin bottom */
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px; /* Reduced gap */
  align-items: center;
}

.top-row {
  margin-bottom: 8px; /* Add some space between the two rows */
}

.filter-item {
  margin-bottom: 5px; /* Reduced margin */
}

.filter-search-input {
  width: 180px; /* Slightly adjusted width */
}

.filter-button-query {
  background-color: #E6A23C; /* Adjusted orange */
  border-color: #E6A23C;
  color: #fff;
}

.filter-button-query:hover,
.filter-button-query:focus {
  background-color: #ebb563;
  border-color: #ebb563;
}

.filter-button-add {
 /* Style for the add button if needed */
}

.settings-icon {
  font-size: 18px; /* Slightly smaller icon */
  cursor: pointer;
  color: #909399; /* Grey color */
}

.pagination-summary-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding: 10px 0;
  background-color: #f8f8f8; /* Light background for the footer */
  border-top: 1px solid #ebeef5; /* Separator line */
}

.summary-section {
  font-size: 14px;
  color: #606266;
  margin-left: 10px;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-select.filter-item),
:deep(.el-input.filter-item .el-input__inner) {
    /* height: 32px; Example: Adjust height if needed */
}

:deep(.el-select.filter-item) {
    width: 140px; /* Adjusted width */
}
:deep(.el-button.filter-item) {
    /* padding: 8px 15px; Example: Adjust padding if needed */
}

:deep(.el-dialog__body) {
    padding: 10px 20px; /* Adjust dialog body padding */
}

</style> 