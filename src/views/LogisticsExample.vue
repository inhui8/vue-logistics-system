<!-- eslint-disable -->
<template>
  <div class="logistics-example">
    <h1>物流系统组件示例</h1>
    
    <logistics-table
      tableId="logistics-example-table"
      :columns="columns"
      :filterFields="filterFields"
      :statusOptions="statusOptions"
      :batchActions="batchActions"
      :operationActions="operationActions"
      @search="handleSearch"
      @add="handleAdd"
      @export="handleExport"
      @operation-command="handleOperationCommand"
      @cell-edit-confirm="handleCellEditConfirm"
    />
    
    <!-- 添加数据的对话框 -->
    <el-dialog
      title="添加数据"
      v-model:visible="addDialogVisible"
      width="50%"
    >
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="柜号">
          <el-input v-model="addForm.containerNo" />
        </el-form-item>
        <el-form-item label="运单号">
          <el-input v-model="addForm.waybillNo" />
        </el-form-item>
        <el-form-item label="客服">
          <el-select v-model="addForm.customerService" placeholder="请选择">
            <el-option
              v-for="item in customerServiceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="原地址信息">
          <el-input v-model="addForm.originalAddress" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="addForm.address" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="addForm.status" placeholder="请选择">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template v-slot:footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAddForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { LogisticsTable } from '../components/logistics';
import { ref, reactive, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'LogisticsExample',
  components: {
    LogisticsTable
  },
  setup() {
    const store = useStore();
    
    // 添加对话框
    const addDialogVisible = ref(false);
    const addForm = reactive({
      containerNo: '',
      waybillNo: '',
      customerService: '',
      originalAddress: '',
      address: '',
      status: ''
    });
    
    // 客服选项
    const customerServiceOptions = [
      { value: '张三', label: '张三' },
      { value: '李四', label: '李四' },
      { value: '王五', label: '王五' }
    ];
    
    // 状态选项
    const statusOptions = [
      { value: 'created', label: '已创建' },
      { value: 'processing', label: '处理中' },
      { value: 'shipped', label: '已发货' },
      { value: 'delivered', label: '已送达' },
      { value: 'completed', label: '已完成' },
      { value: 'cancelled', label: '已取消' }
    ];
    
    // 批量操作
    const batchActions = [
      { label: '批量删除', command: 'batch-delete', icon: 'el-icon-delete' },
      { label: '批量导出', command: 'batch-export', icon: 'el-icon-download' },
      { label: '批量更新状态', command: 'batch-update-status', icon: 'el-icon-edit' }
    ];
    
    // 操作菜单
    const operationActions = [
      { label: '编辑', command: 'edit', icon: 'el-icon-edit' },
      { label: '删除', command: 'delete', icon: 'el-icon-delete' },
      { label: '查看详情', command: 'view', icon: 'el-icon-view' },
      { label: '导出', command: 'export', icon: 'el-icon-download' }
    ];
    
    // 表格列配置
    const columns = [
      { 
        prop: 'containerNo', 
        label: '柜号', 
        width: 150, 
        required: true, 
        sortable: true, 
        groupable: true,
        showSummary: true,
        summaryProperty: 'containerNoSummary'
      },
      { 
        prop: 'waybillNo', 
        label: '运单号', 
        width: 180, 
        required: true, 
        sortable: true, 
        groupable: true,
        showSummary: true,
        summaryProperty: 'waybillNoSummary'
      },
      { 
        prop: 'customerService', 
        label: '客服', 
        width: 120, 
        sortable: true, 
        groupable: true 
      },
      { 
        prop: 'originalAddress', 
        label: '原地址信息', 
        width: 200 
      },
      { 
        prop: 'address', 
        label: '地址', 
        width: 200, 
        editable: true, 
        type: 'text' 
      },
      { 
        prop: 'status', 
        label: '状态', 
        width: 120, 
        editable: true, 
        type: 'select', 
        options: statusOptions,
        sortable: true,
        groupable: true,
        formatter: (row, column, cellValue) => {
          const status = statusOptions.find(item => item.value === cellValue);
          return status ? status.label : cellValue;
        }
      },
      { 
        prop: 'tags', 
        label: '标签', 
        width: 150, 
        editable: true, 
        type: 'tags', 
        options: ['重要', '紧急', '特殊处理', '已确认', '待跟进'],
        getTagType: (tag) => {
          const typeMap = {
            '重要': 'danger',
            '紧急': 'warning',
            '特殊处理': 'info',
            '已确认': 'success',
            '待跟进': ''
          };
          return typeMap[tag] || '';
        }
      },
      { 
        prop: 'followUpRecord', 
        label: '跟进记录', 
        width: 200, 
        editable: true, 
        type: 'textarea' 
      },
      { 
        prop: 'memo', 
        label: '备注', 
        width: 200, 
        editable: true, 
        type: 'textarea' 
      },
      { 
        prop: 'internalNote', 
        label: '内部备注', 
        width: 200 
      },
      { 
        prop: 'boxCount', 
        label: '箱数', 
        width: 100, 
        sortable: true,
        showSummary: true,
        summaryProperty: 'totalBoxCount'
      },
      { 
        prop: 'weight', 
        label: '重量', 
        width: 100, 
        sortable: true,
        showSummary: true,
        summaryProperty: 'totalWeight'
      },
      { 
        prop: 'volume', 
        label: '方数', 
        width: 100, 
        sortable: true,
        showSummary: true,
        summaryProperty: 'totalVolume'
      },
      { 
        prop: 'createdAt', 
        label: '创建时间', 
        width: 180, 
        sortable: true,
        formatter: (row, column, cellValue) => {
          if (!cellValue) return '';
          return new Date(cellValue).toLocaleString();
        }
      }
    ];
    
    // 筛选字段
    const filterFields = [
      { label: '柜号', prop: 'containerNo', type: 'text' },
      { label: '运单号', prop: 'waybillNo', type: 'text' },
      { label: '客服', prop: 'customerService', type: 'select', options: customerServiceOptions },
      { label: '原地址信息', prop: 'originalAddress', type: 'text' },
      { label: '地址', prop: 'address', type: 'text' },
      { label: 'City', prop: 'city', type: 'text' },
      { label: 'State', prop: 'state', type: 'text' },
      { label: 'Zip_Code', prop: 'zipCode', type: 'text' },
      { label: '派送区域', prop: 'deliveryArea', type: 'text' },
      { label: '仓库代码', prop: 'warehouseCode', type: 'text' },
      { label: '渠道', prop: 'channel', type: 'select', options: [
        { value: '空运', label: '空运' },
        { value: '海运', label: '海运' },
        { value: '陆运', label: '陆运' }
      ]},
      { label: '箱数', prop: 'boxCount', type: 'number' },
      { label: '重量', prop: 'weight', type: 'number' },
      { label: '方数', prop: 'volume', type: 'number' },
      { label: '板数', prop: 'palletCount', type: 'number' },
      { label: '库位', prop: 'location', type: 'text' },
      { label: 'ETA', prop: 'eta', type: 'date' },
      { label: '提柜时间', prop: 'pickupTime', type: 'datetime' },
      { label: '抵仓时间', prop: 'arrivalTime', type: 'datetime' },
      { label: '预计拆柜时间', prop: 'expectedUnloadingTime', type: 'datetime' },
      { label: '拆柜完成时间', prop: 'unloadingTime', type: 'datetime' },
      { label: '预约号', prop: 'appointmentNo', type: 'text' },
      { label: '派送预约时间', prop: 'deliveryAppointmentTime', type: 'datetime' },
      { label: '送货时间', prop: 'deliveryTime', type: 'datetime' },
      { label: '送货公司', prop: 'deliveryCompany', type: 'text' },
      { label: '送货司机', prop: 'deliveryDriver', type: 'text' },
      { label: '司机电话', prop: 'deliveryPhone', type: 'text' },
      { label: 'PC号', prop: 'pcNo', type: 'text' },
      { label: '预约状态', prop: 'status', type: 'select', options: statusOptions },
      { label: '标签', prop: 'tags', type: 'multiselect', options: [
        { value: '重要', label: '重要' },
        { value: '紧急', label: '紧急' },
        { value: '特殊处理', label: '特殊处理' },
        { value: '已确认', label: '已确认' },
        { value: '待跟进', label: '待跟进' }
      ]},
      { label: '跟进记录', prop: 'followUpRecord', type: 'text' },
      { label: '备注', prop: 'memo', type: 'text' },
      { label: '内部备注', prop: 'internalNote', type: 'text' },
      { label: '唛头', prop: 'shippingMark', type: 'text' },
      { label: '询价平台报价', prop: 'inquiryPrice', type: 'number' },
      { label: '创建时间', prop: 'createdAt', type: 'daterange' }
    ];
    
    // 处理搜索
    const handleSearch = (params) => {
      console.log('搜索参数:', params);
      // 实际应用中应该调用API或Vuex action进行数据过滤
    };
    
    // 处理添加
    const handleAdd = () => {
      addDialogVisible.value = true;
    };
    
    // 提交添加表单
    const submitAddForm = () => {
      // 这里应该调用API或Vuex action添加数据
      console.log('添加数据:', addForm);
      
      // 关闭对话框
      addDialogVisible.value = false;
      
      // 重置表单
      Object.keys(addForm).forEach(key => {
        addForm[key] = '';
      });
    };
    
    // 处理导出
    const handleExport = (params) => {
      console.log('导出参数:', params);
      // 实际应用中应该调用导出功能
    };
    
    // 处理操作命令
    const handleOperationCommand = (params) => {
      console.log('操作命令:', params);
      const { command } = params;
      
      switch (command) {
        case 'edit':
          // 跳转到编辑页面或打开编辑对话框
          break;
        case 'delete':
          // 显示删除确认对话框
          break;
        case 'view':
          // 跳转到详情页面或打开详情对话框
          break;
        case 'export':
          // 导出单条数据
          break;
        default:
          break;
      }
    };
    
    // 处理单元格编辑确认
    const handleCellEditConfirm = (row, field) => {
      console.log('单元格编辑确认:', row, field);
      // 实际应用中应该调用API或Vuex action更新数据
    };
    
    // 页面加载时获取数据
    onMounted(async () => {
      // 模拟数据
      const mockData = [
        {
          id: 1,
          containerNo: 'C-001',
          waybillNo: 'W-00101',
          customerService: '张三',
          originalAddress: '上海市浦东新区张江高科',
          address: '上海市浦东新区张江高科1号',
          status: 'processing',
          tags: ['重要', '紧急'],
          followUpRecord: '',
          memo: '',
          internalNote: '内部备注1',
          boxCount: 10,
          weight: 100.5,
          volume: 5.2,
          createdAt: new Date('2023-05-01').getTime()
        },
        {
          id: 2,
          containerNo: 'C-002',
          waybillNo: 'W-00201',
          customerService: '李四',
          originalAddress: '北京市海淀区中关村',
          address: '北京市海淀区中关村软件园',
          status: 'delivered',
          tags: ['已确认'],
          followUpRecord: '客户已确认收货',
          memo: '客户要求周末送货',
          internalNote: '内部备注2',
          boxCount: 5,
          weight: 50.8,
          volume: 2.1,
          createdAt: new Date('2023-05-02').getTime()
        },
        {
          id: 3,
          containerNo: 'C-003',
          waybillNo: 'W-00301',
          customerService: '王五',
          originalAddress: '广州市天河区天河路',
          address: '广州市天河区天河路1号',
          status: 'completed',
          tags: ['特殊处理', '已确认'],
          followUpRecord: '已完成，客户满意',
          memo: '需要提前通知',
          internalNote: '内部备注3',
          boxCount: 8,
          weight: 80.3,
          volume: 4.5,
          createdAt: new Date('2023-05-03').getTime()
        }
      ];
      
      // 将模拟数据保存到Vuex
      store.commit('SET_TABLE_DATA', mockData);
    });
    
    return {
      columns,
      filterFields,
      statusOptions,
      batchActions,
      operationActions,
      addDialogVisible,
      addForm,
      customerServiceOptions,
      handleSearch,
      handleAdd,
      submitAddForm,
      handleExport,
      handleOperationCommand,
      handleCellEditConfirm
    };
  }
}
</script>

<style scoped>
.logistics-example {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #303133;
}
</style> 