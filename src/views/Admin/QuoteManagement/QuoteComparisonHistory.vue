<template>
  <div class="quote-compare-container">
    <el-card>
       <template #header>
        <div class="card-header">
          <span>供应商报价对比</span> 
        </div>
      </template>

      <el-tabs v-model="activeTab" class="quote-tabs">
          <el-tab-pane label="固定报价对比" name="fixed">
              <!-- 1. 固定报价筛选与列表 -->
              <div v-show="!showComparisonResult">
                  <el-form :inline="true" :model="fixedQuoteFilter" class="filter-form">
                     <el-form-item label="供应商">
                        <el-select v-model="fixedQuoteFilter.supplierId" placeholder="选择供应商" clearable filterable style="width: 250px;">
                           <el-option
                             v-for="supplier in mockSuppliers"
                             :key="supplier.id"
                             :label="supplier.name"
                             :value="supplier.id"
                           />
                        </el-select>
                     </el-form-item>
                     <el-form-item label="供应商类型">
                        <el-select v-model="fixedQuoteFilter.supplierType" placeholder="选择供应商类型" clearable style="width: 150px;">
                            <el-option label="提柜" value="pickup" />
                            <el-option label="派送" value="delivery" />
                        </el-select>
                     </el-form-item>
                     <el-form-item label="报价类型">
                        <el-select v-model="fixedQuoteFilter.quoteType" placeholder="选择报价类型" clearable style="width: 150px;">
                            <el-option label="FBA" value="FBA" />
                            <el-option label="FBX" value="FBX" />
                            <el-option label="直送" value="直送" />
                            <el-option label="拆柜" value="拆柜" />
                            <el-option label="提柜" value="pickup" />
                        </el-select>
                     </el-form-item>
                    <el-form-item label="服务描述">
                      <el-input v-model="fixedQuoteFilter.serviceDescription" placeholder="输入服务/线路关键字" clearable style="width: 250px;"/>
                    </el-form-item>
                    <el-form-item label="状态">
                       <el-select v-model="fixedQuoteFilter.status" placeholder="选择状态" clearable style="width: 150px;">
                           <el-option label="生效中" value="active" />
                           <el-option label="待生效" value="pending" />
                           <el-option label="已过期/结束" value="expired" />
                       </el-select>
            </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="fetchFixedQuotes">查询</el-button>
                      <el-button @click="resetFixedQuoteFilter">重置</el-button>
            </el-form-item>
      </el-form>

                   <div style="margin-bottom: 10px; display: flex; justify-content: flex-end;">
                     <el-button type="primary" :disabled="selectedFixedQuotes.length < 2" @click="handleCompareSelected">
                         对比选中报价 ({{ selectedFixedQuotes.length }})
                     </el-button>
                   </div>

                  <el-table 
                      :data="fixedQuoteList" 
                      style="width: 100%" 
                      border
                      size="small"
                      @selection-change="handleFixedQuoteSelectionChange"
                      ref="fixedQuoteTableRef"
                  >
                    <el-table-column type="selection" width="55" />
                    <el-table-column prop="supplierName" label="供应商" width="200" show-overflow-tooltip />
                    <el-table-column prop="supplierType" label="供应商类型" width="100">
                        <template #default="scope">
                            <el-tag size="small" :type="scope.row.supplierType === 'delivery' ? 'success' : 'warning'">
                                {{ formatSupplierType(scope.row.supplierType) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="quoteType" label="报价类型" width="100">
                        <template #default="scope">
                            <el-tag size="small" :type="getQuoteTypeTagType(scope.row.quoteType)">
                                {{ scope.row.quoteType }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="serviceDescription" label="服务/线路描述" min-width="200" show-overflow-tooltip/>
                     <el-table-column prop="validFrom" label="生效开始日期" width="120" />
                     <el-table-column prop="validTo" label="生效结束日期" width="120" />
                     <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                           <el-tag size="small" :type="getStatusTagType(scope.row.status)">
                             {{ formatStatus(scope.row.status) }}
                    </el-tag>
                </template>
             </el-table-column>
                     <el-table-column prop="detailsCount" label="仓库数" width="80">
                         <template #default="scope">{{ scope.row.details?.length || 0 }}</template>
                     </el-table-column>
                    <!-- Add other relevant columns if needed -->
          </el-table>
                   <!-- TODO: Add pagination if needed -->
              </div>

              <!-- 2. 对比结果显示 -->
              <div v-show="showComparisonResult">
                  <div style="margin-bottom: 15px;">
                       <el-button type="primary" link @click="backToList"><el-icon><ArrowLeft /></el-icon> 返回列表</el-button>
                       <span style="margin-left: 15px; font-weight: bold;">固定报价对比结果</span>
                   </div>

                   <!-- 显示供应商及其评分 -->
                  <div class="compared-suppliers-info" style="margin-bottom: 20px; padding: 15px; background-color: #f4f4f5; border-radius: 4px;">
                      <h4 style="margin-top: 0; margin-bottom: 10px;">参与对比的供应商：</h4>
                      <el-row :gutter="20">
                          <el-col :span="6" v-for="supplier in comparisonResult.comparedSuppliers" :key="supplier.id">
                             <span>{{ supplier.name }}</span> 
                             <el-rate 
                                v-model="supplier.rating" 
                                disabled 
                                show-score 
                                text-color="#ff9900" 
                                score-template="{value} 分"
                                size="small"
                                style="margin-left: 10px;"
                             />
                          </el-col>
                      </el-row>
          </div>
          
                   <h4 style="margin-bottom: 10px;">仓库报价对比明细：</h4>
                   <el-table :data="comparisonResult.comparisonTableData" border stripe style="width: 100%" size="small">
                      <el-table-column prop="platform" label="平台名称" width="100" fixed="left"/>
                      <el-table-column prop="warehouseCode" label="仓库代码" width="120" fixed="left"/>
                      
                      <!-- Dynamic Supplier Columns -->
                       <el-table-column 
                         v-for="supplier in comparisonResult.comparedSuppliers" 
                         :key="supplier.id" 
                         :label="supplier.name + ' (USD)'" 
                         :prop="'supplierPrices.' + supplier.id" 
                         align="right" 
                         width="150"
                         sortable
                         :sort-method="(a, b) => customSort(a, b, supplier.id)"
                         >
                     <template #default="scope">
                             <span :style="{ color: isLowestPrice(scope.row, supplier.id) ? 'red' : 'inherit', fontWeight: isLowestPrice(scope.row, supplier.id) ? 'bold' : 'normal' }">
                               {{ scope.row.supplierPrices[supplier.id] !== undefined ? scope.row.supplierPrices[supplier.id].toFixed(2) : '-' }}
                             </span>
                     </template>
                 </el-table-column>
            </el-table>
                   <div v-if="comparisonResult.comparisonTableData.length === 0" style="text-align: center; padding: 20px; color: #909399;">
                       选中的报价中没有共同包含的仓库明细可供对比。
      </div>
      </div>

          </el-tab-pane>

          <el-tab-pane label="询价对比" name="inquiry" disabled>
               <el-empty description="询价对比功能待开发" />
          </el-tab-pane>
          <el-tab-pane label="竞价对比" name="bidding" disabled>
               <el-empty description="竞价对比功能待开发" />
          </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue'; // Import icon

// --- 模拟数据 ---
const mockSuppliers = ref([]);
const mockFixedQuoteDatabase = ref([]); 
const mockSupplierRatings = {}; // { supplierId: rating }

// 供应商类型和报价类型相关常量
const supplierTypeOptions = [
    { value: 'pickup', label: '提柜' },
    { value: 'delivery', label: '派送' }
];

const quoteTypeOptions = [
    { value: 'FBA', label: 'FBA', tag: 'success' },
    { value: 'FBX', label: 'FBX', tag: 'primary' },
    { value: '直送', label: '直送', tag: 'warning' },
    { value: '拆柜', label: '拆柜', tag: 'info' },
    { value: '提柜', label: '提柜', tag: 'danger' }
];

const generateMockData = (quoteCount = 50, supplierCount = 5) => {
  // Suppliers
  const suppliers = [];
  for (let i = 1; i <= supplierCount; i++) {
    const supplierId = `supplier_${String.fromCharCode(64 + i)}`;
    // 随机分配供应商类型
    const supplierType = i % 2 === 0 ? 'pickup' : 'delivery'; 
    suppliers.push({ 
      id: supplierId, 
      name: `供应商${String.fromCharCode(64 + i)}`,
      type: supplierType
    });
    mockSupplierRatings[supplierId] = parseFloat((Math.random() * 2 + 3).toFixed(1)); // 3.0 - 5.0 rating
  }
  mockSuppliers.value = suppliers;

  // Fixed Quotes
  const services = ['LAX-FBA', 'LGB-FBA', 'EWR-FBA', 'SAV-FBA', 'DAL-FBA'];
  const statuses = ['active', 'pending', 'expired'];
  const quoteTypes = ['FBA', 'FBX', '直送', '拆柜', '提柜']; // 添加所有报价类型
  const quotes = [];
  const now = new Date();

  for (let i = 0; i < quoteCount; i++) {
    const supplier = suppliers[i % suppliers.length];
    const serviceBase = services[i % services.length];
    const quoteType = quoteTypes[i % quoteTypes.length]; // 循环分配报价类型
    const serviceDescription = `${serviceBase} ${quoteType} ${supplier.type === 'pickup' ? '提柜' : '派送'} (${i % 3 === 0 ? '含燃油' : '不含燃油'})`;
    const status = statuses[i % statuses.length];
    
    const submitTime = new Date(now.getTime() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)); // Past 90 days
    let validFrom, validTo;
    validFrom = new Date(submitTime.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
    validTo = new Date(validFrom.getFullYear() + 1, validFrom.getMonth(), validFrom.getDate()); // 1 year validity

    if (status === 'expired') {
        validTo = new Date(now.getTime() - Math.floor(Math.random() * 30 + 1) * 24 * 60 * 60 * 1000); // Expired in last 30 days
         if (validFrom > validTo) validFrom = new Date(validTo.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else if (status === 'pending') {
         validFrom = new Date(now.getTime() + Math.floor(Math.random() * 14 + 1) * 24 * 60 * 60 * 1000); // Starts in next 14 days
         validTo = new Date(validFrom.getFullYear() + 1, validFrom.getMonth(), validFrom.getDate());
    } else { // active
         validFrom = new Date(now.getTime() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000); // Started in last 60 days
         validTo = new Date(validFrom.getFullYear() + 1, validFrom.getMonth(), validFrom.getDate());
    }

    // Generate details (FBA warehouse details)
    let details = [];
    const detailCount = Math.floor(Math.random() * 8) + 5; // 5-12 warehouses
    const warehouseCodes = ['ONT9', 'HOU2', 'XUS8', 'FTW1', 'FTW2', 'RIC1', 'RIC2', 'RIC3', 'BFI1', 'BFI3', 'XUSD', 'BF14', 'BF15', 'PHX3', 'BFI7', 'SEA6', 'SEA8', 'MKE1'];
    const platform = 'Amazon';
    let basePrice = 500 + (i % supplierCount) * 50 + (Math.random() - 0.5) * 200; // Base price varies per supplier

    const usedWarehouseCodes = new Set();
    for (let j = 0; j < detailCount; j++) {
        let warehouseCode = warehouseCodes[Math.floor(Math.random() * warehouseCodes.length)];
        // Ensure unique warehouses per quote for simplicity in mock data
        while(usedWarehouseCodes.has(warehouseCode)) {
             warehouseCode = warehouseCodes[Math.floor(Math.random() * warehouseCodes.length)];
        }
        usedWarehouseCodes.add(warehouseCode);

        details.push({
            id: `detail_${i + 1}_${j + 1}`,
            platform: platform,
            warehouseCode: warehouseCode,
            // Remove unnecessary fields for comparison view
            // country: 'US', state: 'XX', city: 'SomeCity', address: '123 Main St', zipcode: '12345', 
            price: parseFloat((basePrice + (Math.random() - 0.4) * 150).toFixed(2)), // Add variance per warehouse
            // palletRule: '96inch'
        });
    }

    quotes.push({
      id: `fq_${i + 1}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierType: supplier.type,
      serviceDescription: serviceDescription,
      quoteType: quoteType,
      validFrom: validFrom.toISOString().split('T')[0],
      validTo: validTo.toISOString().split('T')[0],
      submittedAt: submitTime.toLocaleString(),
      status: status,
      details: details,
    });
  }
  mockFixedQuoteDatabase.value = quotes;
};

// --- Component State ---
const activeTab = ref('fixed');
const fixedQuoteTableRef = ref(null);

// Fixed Quote List State
const fixedQuoteFilter = reactive({
    supplierId: null,
    serviceDescription: '',
    status: 'active', // Default to active
    supplierType: '', // 新增：供应商类型（提柜，派送）
    quoteType: '', // 新增：报价类型（FBA，FBX，直送，拆柜，提柜）
});
const fixedQuoteList = ref([]);
const selectedFixedQuotes = ref([]);

// Comparison Result State
const showComparisonResult = ref(false);
const comparisonResult = reactive({
    comparedSuppliers: [], // [{ id, name, rating }] 
    comparisonTableData: [], // [{ platform, warehouseCode, supplierPrices: { supId: price }, lowestPrice: XXX, lowestSupplierId: XXX }] 
});

// --- Methods ---

// Fetch/Filter Fixed Quotes (Simulated)
const fetchFixedQuotes = () => {
    console.log('Fetching fixed quotes with filter:', fixedQuoteFilter);
    let result = mockFixedQuoteDatabase.value;
    if (fixedQuoteFilter.supplierId) {
        result = result.filter(q => q.supplierId === fixedQuoteFilter.supplierId);
    }
    if (fixedQuoteFilter.serviceDescription) {
        result = result.filter(q => q.serviceDescription.toLowerCase().includes(fixedQuoteFilter.serviceDescription.toLowerCase()));
    }
    if (fixedQuoteFilter.status) {
        if (fixedQuoteFilter.status === 'expired') {
            result = result.filter(q => q.status === 'expired' || q.status === 'ended'); // Assuming ended is similar
        } else {
            result = result.filter(q => q.status === fixedQuoteFilter.status);
        }
    }
    // 添加新的筛选条件
    if (fixedQuoteFilter.supplierType) {
        result = result.filter(q => q.supplierType === fixedQuoteFilter.supplierType);
    }
    if (fixedQuoteFilter.quoteType) {
        result = result.filter(q => q.quoteType === fixedQuoteFilter.quoteType);
    }
    fixedQuoteList.value = result;
    // Clear selection when refetching
    selectedFixedQuotes.value = [];
    if (fixedQuoteTableRef.value) {
        fixedQuoteTableRef.value.clearSelection();
    }
};

const resetFixedQuoteFilter = () => {
    fixedQuoteFilter.supplierId = null;
    fixedQuoteFilter.serviceDescription = '';
    fixedQuoteFilter.status = 'active';
    fixedQuoteFilter.supplierType = ''; // 重置供应商类型
    fixedQuoteFilter.quoteType = ''; // 重置报价类型
    fetchFixedQuotes();
};

const handleFixedQuoteSelectionChange = (selection) => {
  selectedFixedQuotes.value = selection;
};

// Comparison Logic
const handleCompareSelected = () => {
    if (selectedFixedQuotes.value.length < 2) {
        ElMessage.warning('请至少选择两个报价进行对比');
    return;
  }

    console.log('Comparing selected quotes:', selectedFixedQuotes.value);
    const quotesToCompare = selectedFixedQuotes.value;
    const supplierIds = [...new Set(quotesToCompare.map(q => q.supplierId))];
    
    comparisonResult.comparedSuppliers = supplierIds.map(id => ({
         id: id,
         name: mockSuppliers.value.find(s => s.id === id)?.name || id,
         rating: mockSupplierRatings[id] || 0
    })).sort((a, b) => a.name.localeCompare(b.name)); // Sort suppliers by name for consistent column order

    // Find all unique warehouses across selected quotes
    const allWarehouses = new Map(); // Key: platform-warehouseCode, Value: { platform, warehouseCode }
    quotesToCompare.forEach(quote => {
        quote.details?.forEach(detail => {
            const key = `${detail.platform}-${detail.warehouseCode}`;
            if (!allWarehouses.has(key)) {
                allWarehouses.set(key, { platform: detail.platform, warehouseCode: detail.warehouseCode });
            }
        });
    });

    // Build comparison table data
    const tableData = [];
    allWarehouses.forEach(warehouse => {
        const row = {
            platform: warehouse.platform,
            warehouseCode: warehouse.warehouseCode,
            supplierPrices: {}, // { supplierId: price }
            lowestPrice: Infinity,
            lowestSupplierId: null,
        };
        let hasPriceInRow = false;
        let suppliersInRow = 0;

        quotesToCompare.forEach(quote => {
            const detail = quote.details?.find(d => d.platform === warehouse.platform && d.warehouseCode === warehouse.warehouseCode);
            if (detail?.price !== undefined) {
                row.supplierPrices[quote.supplierId] = detail.price;
                hasPriceInRow = true;
                suppliersInRow++;
                if (detail.price < row.lowestPrice) {
                    row.lowestPrice = detail.price;
                    row.lowestSupplierId = quote.supplierId;
                }
            }
        });

        // Only include rows where at least two suppliers have a price for this warehouse
        if (hasPriceInRow && suppliersInRow >= 2) { 
             // If lowestPrice is still Infinity, means no prices were found (shouldn't happen if hasPriceInRow is true, but safety check)
            if (row.lowestPrice === Infinity) row.lowestPrice = null;
            tableData.push(row);
        }
    });

    comparisonResult.comparisonTableData = tableData.sort((a, b) => {
        // Sort by platform then warehouse code
        if (a.platform !== b.platform) return a.platform.localeCompare(b.platform);
        return a.warehouseCode.localeCompare(b.warehouseCode);
    });
    showComparisonResult.value = true;
    console.log('Comparison Result:', comparisonResult);
};

const backToList = () => {
    showComparisonResult.value = false;
    // Optionally clear selection or reset completely
    // selectedFixedQuotes.value = [];
    // if (fixedQuoteTableRef.value) {
    //     fixedQuoteTableRef.value.clearSelection();
    // }
};

// Helper for dynamic column sorting
const customSort = (a, b, supplierId) => {
    const priceA = a.supplierPrices[supplierId];
    const priceB = b.supplierPrices[supplierId];
    // Handle cases where price might be missing
    if (priceA === undefined && priceB === undefined) return 0;
    if (priceA === undefined) return 1; // Put undefined values at the end
    if (priceB === undefined) return -1;
    return priceA - priceB;
};

// Helper for highlighting lowest price
const isLowestPrice = (row, supplierId) => {
    return row.lowestSupplierId === supplierId && row.supplierPrices[supplierId] !== undefined;
};

// Formatting helpers (can be reused or adapted)
const getStatusTagType = (status) => {
  switch (status) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'expired':
    case 'ended': return 'info';
    case 'rejected': return 'danger';
    default: return 'info';
  }
};

const formatStatus = (status) => {
  switch (status) {
    case 'active': return '生效中';
    case 'pending': return '待生效';
    case 'expired': return '已过期';
    case 'ended': return '已结束';
    case 'rejected': return '已拒绝'; // Added for completeness
    default: return status;
  }
};

// 添加新的格式化帮助函数
const formatSupplierType = (type) => {
    return supplierTypeOptions.find(opt => opt.value === type)?.label || type;
};

const getQuoteTypeTagType = (type) => {
    return quoteTypeOptions.find(opt => opt.value === type)?.tag || 'info';
};

// --- Lifecycle ---
onMounted(() => {
  generateMockData();
  fetchFixedQuotes(); // Load initial list
});

</script>

<style scoped>
.quote-compare-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-form .el-form-item {
  margin-bottom: 10px;
  margin-right: 15px;
}
.quote-tabs .el-tabs__header {
    margin-bottom: 20px;
}
.compared-suppliers-info .el-col {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
}
/* Add specific styles if needed */
</style> 