/* eslint-disable @typescript-eslint/no-explicit-any */
<template>
  <div class="tag-management-container">
    <!-- 左侧树形结构 -->
    <div class="tag-sidebar">
      <div class="sidebar-header">
        <h3>标签分类</h3>
        <el-button type="primary" link @click="handleAddCategory">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
      <el-tree
        :data="categoryTree"
        :props="defaultProps"
        @node-click="handleNodeClick"
        default-expand-all
      />
    </div>

    <!-- 右侧内容区 -->
    <div class="tag-content">
      <!-- 顶部数据看板 -->
      <div class="dashboard-section">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>标签覆盖率</span>
                  <el-tag type="success">实时</el-tag>
                </div>
              </template>
              <div class="card-content">
                <div class="percentage">85.6%</div>
                <div class="chart-container">
                  <div ref="coverageChart" style="height: 50px;"></div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>使用热度</span>
                  <el-tag type="warning">本周</el-tag>
                </div>
              </template>
              <div class="card-content">
                <div ref="heatMapChart" style="height: 80px;"></div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>价值标签TOP5</span>
                  <el-tag type="danger">热门</el-tag>
                </div>
              </template>
              <div class="card-content">
                <div class="top-tags">
                  <div v-for="(tag, index) in topTags" :key="index" class="top-tag-item">
                    <span class="rank">{{ index + 1 }}</span>
                    <span class="name">{{ tag.name }}</span>
                    <span class="value">{{ tag.value }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 搜索和操作栏 -->
      <div class="operation-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="关键词">
            <el-input v-model="searchForm.keyword" placeholder="标签名称/描述" clearable />
          </el-form-item>
          <el-form-item label="权限等级">
            <el-select v-model="searchForm.permissionLevel" placeholder="选择权限等级" clearable>
              <el-option label="一级" value="1" />
              <el-option label="二级" value="2" />
              <el-option label="三级" value="3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearchForm">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="operation-bar">
          <el-button type="primary" @click="handleAddTag">新建标签</el-button>
          <el-button type="success" @click="handleConfigRules">规则配置</el-button>
          <el-button type="warning" @click="handleImport">导入</el-button>
          <el-button type="info" @click="handleExport">导出</el-button>
        </div>
      </div>

      <!-- 标签表格 -->
      <el-table :data="tagTableData" v-loading="loading" border style="width: 100%">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="tagName" label="标签名称" min-width="120" />
        <el-table-column prop="tagCode" label="标签编码" min-width="120" />
        <el-table-column prop="type" label="数据类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="valueRange" label="取值范围" min-width="150" show-overflow-tooltip />
        <el-table-column prop="permissionLevel" label="权限等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPermissionTagType(row.permissionLevel)">
              {{ `${row.permissionLevel}级` }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="160" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEditTag(row)">编辑</el-button>
            <el-button link type="success" @click="handleConfigRules(row)">规则</el-button>
            <el-button link type="warning" @click="handleToggleStatus(row)">
              {{ row.status === '启用' ? '停用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="handleDeleteTag(row)">删除</el-button>
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
    </div>

    <!-- 标签表单对话框 -->
    <el-dialog
      v-model="tagFormDialogVisible"
      :title="dialogTitle"
      width="650px"
      :close-on-click-modal="false"
      @close="handleCloseDialog"
    >
      <el-form
        ref="tagFormRef"
        :model="tagForm"
        :rules="tagFormRules"
        label-width="100px"
      >
        <el-form-item label="标签名称" prop="tagName">
          <el-input v-model="tagForm.tagName" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="标签编码" prop="tagCode">
          <el-input v-model="tagForm.tagCode" placeholder="请输入标签编码" />
        </el-form-item>
        <el-form-item label="数据类型" prop="type">
          <el-select v-model="tagForm.type" placeholder="请选择数据类型">
            <el-option label="字符串" value="STRING" />
            <el-option label="数值" value="NUMBER" />
            <el-option label="日期" value="DATE" />
            <el-option label="布尔" value="BOOLEAN" />
            <el-option label="枚举" value="ENUM" />
          </el-select>
        </el-form-item>
        <el-form-item label="取值范围" prop="valueRange">
          <el-input
            v-model="tagForm.valueRange"
            placeholder="请输入取值范围，如：0-100"
            v-if="tagForm.type === 'NUMBER'"
          />
          <el-select
            v-model="tagForm.valueRange"
            multiple
            placeholder="请输入可选值，按回车确认"
            v-else-if="tagForm.type === 'ENUM'"
            allow-create
            filterable
          />
          <el-input v-else disabled placeholder="该类型无需设置取值范围" />
        </el-form-item>
        <el-form-item label="权限等级" prop="permissionLevel">
          <el-select v-model="tagForm.permissionLevel" placeholder="请选择权限等级">
            <el-option label="一级" value="1" />
            <el-option label="二级" value="2" />
            <el-option label="三级" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="tagForm.description"
            type="textarea"
            placeholder="请输入标签描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 规则配置对话框 -->
    <el-dialog
      v-model="ruleDialogVisible"
      title="智能规则配置"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="rule-config">
        <div class="condition-group">
          <div class="group-header">
            <span>条件组合</span>
            <el-radio-group v-model="ruleForm.logic" size="small">
              <el-radio-button label="AND">且</el-radio-button>
              <el-radio-button label="OR">或</el-radio-button>
            </el-radio-group>
          </div>
          <div class="conditions">
            <div v-for="(condition, index) in ruleForm.conditions" :key="index" class="condition-item">
              <el-select v-model="condition.field" placeholder="选择字段">
                <el-option label="用户年龄" value="age" />
                <el-option label="消费金额" value="amount" />
                <el-option label="访问次数" value="visits" />
              </el-select>
              <el-select v-model="condition.operator" placeholder="运算符">
                <el-option label="大于" value=">" />
                <el-option label="小于" value="<" />
                <el-option label="等于" value="=" />
              </el-select>
              <el-input v-model="condition.value" placeholder="值" />
              <el-button type="danger" link @click="removeCondition(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <el-button type="primary" link @click="addCondition">
            <el-icon><Plus /></el-icon> 添加条件
          </el-button>
        </div>
        
        <div class="time-window">
          <div class="window-header">时间窗口</div>
          <el-form :model="ruleForm.timeWindow" label-width="100px">
            <el-form-item label="统计周期">
              <el-select v-model="ruleForm.timeWindow.period">
                <el-option label="最近1天" value="1d" />
                <el-option label="最近7天" value="7d" />
                <el-option label="最近30天" value="30d" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
            <el-form-item label="统计方式">
              <el-select v-model="ruleForm.timeWindow.aggregation">
                <el-option label="求和" value="sum" />
                <el-option label="平均值" value="avg" />
                <el-option label="最大值" value="max" />
                <el-option label="最小值" value="min" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="ruleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveRuleConfig">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts/core'
import { LineChart, HeatmapChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  VisualMapComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必要的组件
echarts.use([
  LineChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer
])

// 状态定义
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tagTableData = ref([])
const searchForm = reactive({
  keyword: '',
  permissionLevel: ''
})

// 图表引用
const coverageChart = ref(null)
const heatMapChart = ref(null)

// 图表实例
let coverageChartInstance = null
let heatMapChartInstance = null

// 分类树数据
const categoryTree = ref([
  {
    id: 1,
    label: '用户属性',
    children: [
      { id: 11, label: '基础信息' },
      { id: 12, label: '行为特征' }
    ]
  },
  {
    id: 2,
    label: '消费特征',
    children: [
      { id: 21, label: '消费能力' },
      { id: 22, label: '消费偏好' }
    ]
  }
])

const defaultProps = {
  children: 'children',
  label: 'label'
}

// TOP标签数据
const topTags = ref([
  { name: 'VIP用户', value: '覆盖率98%' },
  { name: '高消费', value: '覆盖率85%' },
  { name: '活跃用户', value: '覆盖率82%' },
  { name: '潜在流失', value: '覆盖率78%' },
  { name: '新客户', value: '覆盖率75%' }
])

// 表单相关
const tagFormDialogVisible = ref(false)
const ruleDialogVisible = ref(false)
const dialogMode = ref('add')
const tagFormRef = ref(null)
const tagForm = reactive({
  tagName: '',
  tagCode: '',
  type: '',
  valueRange: '',
  permissionLevel: '',
  description: ''
})

const ruleForm = reactive({
  logic: 'AND',
  conditions: [
    { field: '', operator: '', value: '' }
  ],
  timeWindow: {
    period: '7d',
    aggregation: 'sum'
  }
})

const tagFormRules = {
  tagName: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  tagCode: [{ required: true, message: '请输入标签编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择数据类型', trigger: 'change' }],
  valueRange: [{ required: true, message: '请输入取值范围', trigger: 'blur' }],
  permissionLevel: [{ required: true, message: '请选择权限等级', trigger: 'change' }]
}

// 计算属性
const dialogTitle = computed(() => {
  return dialogMode.value === 'add' ? '新建标签' : '编辑标签'
})

// 工具方法
const getTypeTagType = (type) => {
  const typeMap = {
    'STRING': '',
    'NUMBER': 'success',
    'DATE': 'warning',
    'BOOLEAN': 'info',
    'ENUM': 'danger'
  }
  return typeMap[type] || ''
}

const getPermissionTagType = (level) => {
  const levelMap = {
    '1': 'danger',
    '2': 'warning',
    '3': 'info'
  }
  return levelMap[level] || ''
}

// 图表初始化
const initCharts = () => {
  // 覆盖率趋势图
  coverageChartInstance = echarts.init(coverageChart.value)
  coverageChartInstance.setOption({
    grid: { top: 0, right: 0, bottom: 0, left: 0 },
    xAxis: {
      type: 'category',
      show: false,
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: { type: 'value', show: false },
    series: [{
      data: [82, 83, 84, 84, 85, 85, 85.6],
      type: 'line',
      smooth: true,
      symbol: 'none',
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64,158,255,0.3)' },
            { offset: 1, color: 'rgba(64,158,255,0.1)' }
          ]
        }
      },
      lineStyle: { color: '#409EFF' }
    }]
  })

  // 使用热力图
  heatMapChartInstance = echarts.init(heatMapChart.value)
  heatMapChartInstance.setOption({
    grid: { top: 0, right: 0, bottom: 0, left: 0 },
    xAxis: {
      type: 'category',
      show: false,
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
      type: 'category',
      show: false,
      data: ['使用量']
    },
    visualMap: {
      show: false,
      min: 0,
      max: 10,
      calculable: true,
      orient: 'horizontal',
      inRange: {
        color: ['#e6f3ff', '#409EFF']
      }
    },
    series: [{
      type: 'heatmap',
      data: [[0, 0, 5], [1, 0, 7], [2, 0, 3], [3, 0, 8], [4, 0, 6], [5, 0, 4], [6, 0, 9]],
      label: { show: false }
    }]
  })
}

// 监听窗口大小变化
const handleResize = () => {
  coverageChartInstance?.resize()
  heatMapChartInstance?.resize()
}

// 方法定义
const fetchTags = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    tagTableData.value = [
      {
        id: 1,
        tagName: 'VIP用户',
        tagCode: 'VIP_USER',
        type: 'BOOLEAN',
        valueRange: 'true/false',
        permissionLevel: '1',
        status: '启用',
        updatedAt: '2024-03-20 10:00:00'
      },
      {
        id: 2,
        tagName: '消费金额',
        tagCode: 'CONSUMPTION_AMOUNT',
        type: 'NUMBER',
        valueRange: '0-999999',
        permissionLevel: '2',
        status: '启用',
        updatedAt: '2024-03-20 11:00:00'
      }
    ]
    total.value = tagTableData.value.length
  } catch (error) {
    ElMessage.error('获取标签列表失败')
    console.error('Failed to fetch tags:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchTags()
}

const resetSearchForm = () => {
  searchForm.keyword = ''
  searchForm.permissionLevel = ''
  currentPage.value = 1
  fetchTags()
}

const handleNodeClick = (data) => {
  console.log(data)
  // 处理分类树节点点击
}

const handleAddCategory = () => {
  // 处理添加分类
  ElMessage.info('分类添加功能开发中')
}

const handleAddTag = () => {
  dialogMode.value = 'add'
  Object.keys(tagForm).forEach(key => {
    tagForm[key] = ''
  })
  tagFormDialogVisible.value = true
}

const handleEditTag = (row) => {
  dialogMode.value = 'edit'
  Object.assign(tagForm, row)
  tagFormDialogVisible.value = true
}

const handleConfigRules = (row) => {
  ruleDialogVisible.value = true
  // 如果传入了row，加载该标签的已有规则配置
  if (row) {
    console.log('Loading rules for tag:', row)
  }
}

const handleDeleteTag = (row) => {
  ElMessageBox.confirm(
    `确定要删除标签"${row.tagName}"吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      tagTableData.value = tagTableData.value.filter(item => item.id !== row.id)
      total.value = tagTableData.value.length
      ElMessage.success('删除成功')
    } catch (error) {
      ElMessage.error('删除失败')
      console.error('Failed to delete tag:', error)
    }
  })
}

const handleToggleStatus = async (row) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    row.status = row.status === '启用' ? '停用' : '启用'
    ElMessage.success(`${row.status === '启用' ? '启用' : '停用'}成功`)
  } catch (error) {
    ElMessage.error(`${row.status === '启用' ? '启用' : '停用'}失败`)
    console.error('Failed to toggle status:', error)
  }
}

const handleCloseDialog = () => {
  tagFormDialogVisible.value = false
  tagFormRef.value?.resetFields()
}

const handleSubmitForm = () => {
  tagFormRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        if (dialogMode.value === 'add') {
          const newTag = {
            id: Date.now(),
            ...tagForm,
            status: '启用',
            updatedAt: new Date().toLocaleString()
          }
          tagTableData.value.unshift(newTag)
        } else {
          const index = tagTableData.value.findIndex(item => item.id === tagForm.id)
          if (index !== -1) {
            tagTableData.value[index] = {
              ...tagTableData.value[index],
              ...tagForm,
              updatedAt: new Date().toLocaleString()
            }
          }
        }
        total.value = tagTableData.value.length
        ElMessage.success(`${dialogMode.value === 'add' ? '创建' : '更新'}成功`)
        handleCloseDialog()
      } catch (error) {
        ElMessage.error(`${dialogMode.value === 'add' ? '创建' : '更新'}失败`)
        console.error('Failed to save tag:', error)
      }
    }
  })
}

const addCondition = () => {
  ruleForm.conditions.push({ field: '', operator: '', value: '' })
}

const removeCondition = (index) => {
  ruleForm.conditions.splice(index, 1)
}

const saveRuleConfig = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('规则配置保存成功')
    ruleDialogVisible.value = false
  } catch (error) {
    ElMessage.error('规则配置保存失败')
    console.error('Failed to save rule config:', error)
  }
}

const handleImport = () => {
  ElMessage.info('导入功能开发中')
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchTags()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchTags()
}

// 生命周期钩子
onMounted(() => {
  fetchTags()
  initCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  coverageChartInstance?.dispose()
  heatMapChartInstance?.dispose()
})
</script>

<style scoped>
.tag-management-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  min-height: calc(100vh - 120px);
  display: flex;
}

.tag-sidebar {
  width: 250px;
  margin-right: 20px;
  border-right: 1px solid #e4e7ed;
  padding-right: 20px;
}

.sidebar-header {
  padding: 10px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.tag-content {
  flex: 1;
}

.dashboard-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  position: relative;
}

.percentage {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 10px;
}

.top-tags .top-tag-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.top-tags .top-tag-item .rank {
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background-color: #f5f7fa;
  border-radius: 50%;
  margin-right: 8px;
}

.top-tags .top-tag-item .name {
  flex: 1;
  margin-right: 8px;
}

.top-tags .top-tag-item .value {
  color: #909399;
}

.operation-section {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.operation-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.rule-config {
  margin-bottom: 20px;
}

.rule-config .condition-group {
  margin-bottom: 20px;
}

.rule-config .condition-group .group-header {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.rule-config .condition-group .conditions {
  margin-bottom: 10px;
}

.rule-config .condition-group .conditions .condition-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.rule-config .condition-group .conditions .condition-item .el-select {
  width: 150px;
}

.rule-config .condition-group .conditions .condition-item .el-input {
  width: 150px;
}

.rule-config .time-window {
  border-top: 1px solid #e4e7ed;
  padding-top: 20px;
}

.rule-config .time-window .window-header {
  margin-bottom: 15px;
  font-weight: bold;
}

:deep(.el-table) {
  margin-top: 10px;
}

:deep(.el-tag) {
  margin-right: 8px;
}
</style> 