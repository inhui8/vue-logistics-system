<template>
  <div class="work-order-analysis-container">
     <el-page-header @back="goBack" content="工单分析看板"></el-page-header>

    <!-- 筛选区域 -->
     <el-card class="filter-card" shadow="never">
        <el-form :inline="true" :model="filterParams">
             <el-form-item label="时间范围">
                <el-date-picker
                    v-model="filterParams.dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期">
                </el-date-picker>
            </el-form-item>
             <el-form-item label="工单类型">
                <el-select v-model="filterParams.type" placeholder="按类型查看" clearable>
                    <el-option label="异常订单处理" value="exception"></el-option>
                    <el-option label="指令执行" value="command"></el-option>
                    <el-option label="订单预警响应" value="warning"></el-option>
                    <el-option label="增值服务请求" value="value_added"></el-option>
                    <el-option label="其他问题" value="other"></el-option>
                </el-select>
            </el-form-item>
             <el-form-item label="异常原因" v-if="filterParams.type === 'exception' || !filterParams.type"> <!-- 仅在选择异常或全部类型时显示 -->
                <el-select v-model="filterParams.exceptionReason" placeholder="按异常原因筛选" clearable>
                    <el-option label="缺货" value="out_of_stock"></el-option>
                    <el-option label="地址错误" value="address_error"></el-option>
                    <!-- 添加更多原因 -->
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="loadAnalysisData">查询</el-button>
            </el-form-item>
        </el-form>
     </el-card>

     <!-- 图表展示区域 -->
     <el-row :gutter="20">
        <el-col :span="8">
            <el-card shadow="hover">
                <div class="chart-title">工单类型分布</div>
                <div class="chart-placeholder">饼图/柱状图占位符</div>
                 <!-- 实际应集成 ECharts 或其他图表库 -->
            </el-card>
        </el-col>
        <el-col :span="8">
             <el-card shadow="hover">
                <div class="chart-title">异常订单原因分析</div>
                <div class="chart-placeholder">柱状图/柏拉图占位符</div>
            </el-card>
        </el-col>
         <el-col :span="8">
             <el-card shadow="hover">
                <div class="chart-title">工单状态趋势</div>
                <div class="chart-placeholder">折线图占位符</div>
            </el-card>
        </el-col>
     </el-row>

     <el-row :gutter="20" style="margin-top: 20px;">
         <el-col :span="8">
             <el-card shadow="hover">
                <div class="chart-title">平均解决时长 (按类型/优先级)</div>
                <div class="chart-placeholder">指标卡/条形图占位符</div>
            </el-card>
        </el-col>
        <el-col :span="8">
             <el-card shadow="hover">
                <div class="chart-title">超时工单统计</div>
                <div class="chart-placeholder">指标卡/列表占位符</div>
            </el-card>
        </el-col>
        <el-col :span="8">
             <el-card shadow="hover">
                <div class="chart-title">处理人绩效排行</div>
                <div class="chart-placeholder">表格/条形图占位符</div>
            </el-card>
        </el-col>
     </el-row>

  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const filterParams = reactive({
    dateRange: [],
    type: '',
    exceptionReason: ''
});

const goBack = () => {
    router.back();
};

const loadAnalysisData = () => {
    console.log("Loading analysis data with filters:", filterParams);
    // 在这里调用API加载图表数据
    ElMessage.info("正在加载分析数据..."); // 需要引入 ElMessage
    // 示例：更新图表（需要集成图表库）
};

onMounted(() => {
    // 页面加载时可以加载默认时间范围的数据
    loadAnalysisData();
});

// 引入 Element Plus 提示（如果需要的话）
import { ElMessage } from 'element-plus';

</script>

<style scoped>
.work-order-analysis-container {
  padding: 20px;
}

.el-page-header {
  margin-bottom: 20px;
}

.filter-card {
    margin-bottom: 20px;
}

.chart-title {
    font-weight: bold;
    margin-bottom: 15px;
    text-align: center;
}

.chart-placeholder {
    height: 250px; /* 给图表区域一个固定高度 */
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f7fa;
    color: #909399;
    border: 1px dashed #dcdfe6;
    border-radius: 4px;
}
</style> 