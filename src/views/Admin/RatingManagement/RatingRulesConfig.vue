<template>
  <div class="rating-rules-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>评分规则配置 (基于指标)</span>
           <el-button type="primary" @click="saveRules" :loading="saving">保存规则</el-button>
        </div>
      </template>

       <el-alert title="配置说明" type="info" show-icon :closable="false" style="margin-bottom: 20px;">
        在此为评分指标设定具体的得分标准、奖励和惩罚规则。这些规则将用于计算每个供应商在每个评分周期的实际得分。
      </el-alert>

      <el-tabs v-model="activeDimensionId" class="dimension-tabs">
        <el-tab-pane 
          v-for="dimension in config.dimensions" 
          :key="dimension.id" 
          :label="dimension.name || '未命名维度'" 
          :name="dimension.id"
         >
          <div v-if="dimension.indicators && dimension.indicators.length > 0">
              <h4>指标 "{{ dimension.name }}" 的评分规则</h4>
             <div v-for="indicator in dimension.indicators" :key="indicator.id" class="indicator-rules-block">
                <h5>{{ indicator.name }} ({{ indicator.weight }}%)</h5>
                 <p class="indicator-desc">{{ indicator.description }}</p>

                 <!-- 规则配置区域 (根据指标类型不同，可能需要不同配置方式) -->
                <div v-if="isPercentageBased(indicator)" class="rule-section">
                    <h6>评分标准 (百分比型)</h6>
                     <div v-for="(level, levelIndex) in getRuleLevels(indicator.id)" :key="levelIndex" class="rule-level">
                        当指标值 <span v-if="isPositivePercentage(indicator)">&gt;=</span><span v-else>&lt;=</span> <el-input-number v-model="level.threshold" size="small" :min="0" :max="100" :step="1" controls-position="right" style="width: 100px; margin: 0 5px;"/> % 时，得 <el-input-number v-model="level.score" size="small" :min="0" :max="100" :step="5" controls-position="right" style="width: 100px; margin: 0 5px;"/> 分
                        <el-button type="danger" :icon="Delete" plain circle size="small" @click="removeRuleLevel(indicator.id, levelIndex)" style="margin-left: 10px;"/>
                     </div>
                      <el-button type="primary" link :icon="Plus" @click="addRuleLevel(indicator.id)">添加评分档位</el-button>
                </div>
                 <div v-else-if="isCountBased(indicator)" class="rule-section">
                     <h6>评分标准 (计数型/频率型)</h6>
                      <div v-for="(level, levelIndex) in getRuleLevels(indicator.id)" :key="levelIndex" class="rule-level">
                        当指标值 &lt;= <el-input-number v-model="level.threshold" size="small" :min="0" :step="1" controls-position="right" style="width: 100px; margin: 0 5px;"/> 次/个 时，得 <el-input-number v-model="level.score" size="small" :min="0" :max="100" :step="5" controls-position="right" style="width: 100px; margin: 0 5px;"/> 分
                        <el-button type="danger" :icon="Delete" plain circle size="small" @click="removeRuleLevel(indicator.id, levelIndex)" style="margin-left: 10px;"/>
                     </div>
                      <el-button type="primary" link :icon="Plus" @click="addRuleLevel(indicator.id)">添加评分档位</el-button>
                 </div>
                  <div v-else class="rule-section">
                     <h6>评分标准 (其他类型 - 待实现具体配置方式)</h6>
                     <p style="color: #909399;">例如：布尔型 (是/否)，或需要更复杂逻辑的指标。</p>
                 </div>

                 <!-- 奖惩规则 -->
                  <div class="rule-section bonus-penalty">
                     <h6>附加奖惩规则 (可选)</h6>
                      <div v-for="(rule, ruleIndex) in getBonusPenaltyRules(indicator.id)" :key="ruleIndex" class="bonus-penalty-rule">
                          当 <el-input v-model="rule.condition" placeholder="触发条件描述" size="small" style="width: 250px; margin-right: 10px;"/> 时，
                          <el-select v-model="rule.type" placeholder="类型" size="small" style="width: 100px; margin: 0 5px;">
                             <el-option label="加分" value="bonus" />
                             <el-option label="扣分" value="penalty" />
                           </el-select>
                           <el-input-number v-model="rule.value" size="small" :min="0" :step="1" controls-position="right" style="width: 100px; margin: 0 5px;"/> 分
                          <el-button type="danger" :icon="Delete" plain circle size="small" @click="removeBonusPenaltyRule(indicator.id, ruleIndex)" style="margin-left: 10px;"/>
                     </div>
                      <el-button type="primary" link :icon="Plus" @click="addBonusPenaltyRule(indicator.id)">添加奖惩规则</el-button>
                  </div>
                 <el-divider v-if="indicator !== dimension.indicators[dimension.indicators.length - 1]" />
             </div>
          </div>
           <div v-else style="text-align: center; color: #909399; padding: 20px;">
              请先在"指标配置"页面为该维度添加指标。
           </div>
        </el-tab-pane>
      </el-tabs>

    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';

// --- 模拟配置数据 ---
// 沿用指标配置的数据结构 (实际应从 API 获取)
const config = reactive({
  dimensions: []
});

// 存储规则的数据结构，以 indicatorId 为 key
const rules = reactive({});

const saving = ref(false);
const activeDimensionId = ref(null);

// 加载模拟的指标配置和规则
const loadMockData = () => {
  // 加载指标配置 (与 RatingIndicatorConfig.vue 相同，实际应共享或 API 获取)
   config.dimensions = [
        {
            id: `dim_mock_1`, name: '时效性', weight: 40,
            indicators: [
                { id: `ind_mock_1_1`, name: '准时提货率', description: '按约定时间完成提货的比例', weight: 50, type: 'percentage' },
                { id: `ind_mock_1_2`, name: '准时送达率', description: '按约定时间完成送达的比例', weight: 50, type: 'percentage' },
            ]
        },
        {
            id: `dim_mock_2`, name: '服务质量', weight: 30,
            indicators: [
                { id: `ind_mock_2_1`, name: '货损率', description: '运输过程中货物损坏的比例', weight: 40, type: 'percentage' },
                { id: `ind_mock_2_2`, name: '客户投诉次数', description: '因服务问题导致客户投诉的次数', weight: 30, type: 'count' },
                { id: `ind_mock_2_3`, name: 'POD返回及时率', description: '签收单按时返回的比例', weight: 30, type: 'percentage' },
            ]
        },
         {
            id: `dim_mock_4`, name: '合规与配合度', weight: 10,
            indicators: [
                { id: `ind_mock_4_1`, name: '证照过期次数', description: '车辆、司机证照过期的次数', weight: 50, type: 'count' },
                { id: `ind_mock_4_2`, name: '系统操作出错次数', description: '供应商门户系统操作错误的次数', weight: 50, type: 'count' },
            ]
        }
    ];
    // 设置默认激活第一个维度
    if (config.dimensions.length > 0) {
        activeDimensionId.value = config.dimensions[0].id;
    }

    // 加载模拟规则 (为每个指标生成一些默认规则)
    config.dimensions.forEach(dim => {
        dim.indicators.forEach(ind => {
            if (!rules[ind.id]) {
                rules[ind.id] = { levels: [], bonusPenalties: [] };
            }
            // 添加默认评分档位规则
             if (ind.type === 'percentage') {
                if (ind.name.includes('率') && !ind.name.includes('货损')) { // 正向指标
                     rules[ind.id].levels = [
                         { threshold: 98, score: 100 },
                         { threshold: 95, score: 90 },
                         { threshold: 90, score: 80 },
                         { threshold: 80, score: 60 },
                     ];
                } else { // 反向指标 (如货损率)
                     rules[ind.id].levels = [
                         { threshold: 1, score: 80 },
                         { threshold: 3, score: 60 },
                         { threshold: 5, score: 40 },
                     ];
                }
            } else if (ind.type === 'count') { // 计数型，通常是越少越好
                 rules[ind.id].levels = [
                     { threshold: 0, score: 100 },
                     { threshold: 1, score: 80 },
                     { threshold: 3, score: 60 },
                 ];
            }
            // 确保档位按正确顺序排序以供显示和计算
             ensureLevelSort(ind.id);
            
            // 添加默认奖惩规则 (示例)
             if (ind.name.includes('送达率')) {
                 rules[ind.id].bonusPenalties = [
                    { condition: '连续3个周期达标', type: 'bonus', value: 5 }
                 ];
             }
             if (ind.name.includes('投诉')) {
                  rules[ind.id].bonusPenalties = [
                    { condition: '发生重大投诉事件', type: 'penalty', value: 20 }
                 ];
             }
        });
    });
};

// --- 方法 ---
// 判断指标类型 (简化)
const isPercentageBased = (indicator) => indicator.type === 'percentage' || indicator.name.includes('率');
const isCountBased = (indicator) => indicator.type === 'count' || indicator.name.includes('次数');
// 判断是否是正向百分比指标 (越高越好)
const isPositivePercentage = (indicator) => isPercentageBased(indicator) && !indicator.name.includes('货损');

// 确保评分档位按正确的顺序排序
const ensureLevelSort = (indicatorId) => {
    if (!rules[indicatorId] || !rules[indicatorId].levels) return;
    const indicator = findIndicatorById(indicatorId);
    if (indicator && isPositivePercentage(indicator)) {
        // 正向百分比，阈值降序
        rules[indicatorId].levels.sort((a, b) => b.threshold - a.threshold);
    } else {
        // 反向百分比或计数型，阈值升序
        rules[indicatorId].levels.sort((a, b) => a.threshold - b.threshold);
    }
};

// 获取特定指标的规则等级 (已排序)
const getRuleLevels = (indicatorId) => {
  if (!rules[indicatorId]) {
    rules[indicatorId] = { levels: [], bonusPenalties: [] };
  }
  // 确保每次获取时都是排序的
  ensureLevelSort(indicatorId);
  return rules[indicatorId].levels;
};

// 获取特定指标的奖惩规则
const getBonusPenaltyRules = (indicatorId) => {
  if (!rules[indicatorId]) {
    rules[indicatorId] = { levels: [], bonusPenalties: [] };
  }
  return rules[indicatorId].bonusPenalties;
};

// 添加评分档位
const addRuleLevel = (indicatorId/*, type*/) => {
   if (!rules[indicatorId]) {
    rules[indicatorId] = { levels: [], bonusPenalties: [] };
  }
  // 根据类型决定初始阈值方向，避免混乱
  const indicator = findIndicatorById(indicatorId);
  let initialThreshold = 0;
  if (indicator && isPositivePercentage(indicator)) initialThreshold = 70; // 正向给个低点的
  
  rules[indicatorId].levels.push({ threshold: initialThreshold, score: 0 });
  // 添加后需要重新排序以正确显示
   ensureLevelSort(indicatorId); 
};

// 移除评分档位
const removeRuleLevel = (indicatorId, levelIndex) => {
   // 因为 getRuleLevels 返回的是排序后的数组，index 是可靠的
   if (rules[indicatorId] && rules[indicatorId].levels) {
     rules[indicatorId].levels.splice(levelIndex, 1);
   }
};

// 添加奖惩规则
const addBonusPenaltyRule = (indicatorId) => {
   if (!rules[indicatorId]) {
    rules[indicatorId] = { levels: [], bonusPenalties: [] };
  }
  rules[indicatorId].bonusPenalties.push({ condition: '', type: 'bonus', value: 0 });
};

// 移除奖惩规则
const removeBonusPenaltyRule = (indicatorId, ruleIndex) => {
   if (rules[indicatorId] && rules[indicatorId].bonusPenalties) {
     rules[indicatorId].bonusPenalties.splice(ruleIndex, 1);
   }
};

// 根据 ID 查找指标 (辅助函数)
const findIndicatorById = (indicatorId) => {
    for (const dim of config.dimensions) {
        const found = dim.indicators.find(ind => ind.id === indicatorId);
        if (found) return found;
    }
    return null;
};

// 保存规则 (模拟)
const saveRules = () => {
  // 可以添加规则校验逻辑，例如档位是否有序，分数是否合理等
  saving.value = true;
  console.log('保存评分规则:', JSON.parse(JSON.stringify(rules)));
  // 模拟 API 调用
  setTimeout(() => {
    saving.value = false;
    ElMessage.success('评分规则已保存');
  }, 1000);
};

// --- 生命周期 ---
onMounted(() => {
  loadMockData();
});

</script>

<style scoped>
.rating-rules-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dimension-tabs {
    margin-top: 10px;
}
.indicator-rules-block {
    border: 1px solid #f2f6fc;
    background-color: #fff;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 15px;
}
h5 {
    margin-bottom: 5px;
    font-size: 1.1em;
}
.indicator-desc {
    color: #909399;
    font-size: 0.9em;
    margin-bottom: 15px;
}
.rule-section {
    margin-bottom: 15px;
    padding-left: 10px;
}
h6 {
    margin-bottom: 10px;
    font-size: 1em;
    color: #303133;
}
.rule-level,
.bonus-penalty-rule {
    margin-bottom: 8px;
    display: flex;
    align-items: center;
}
.bonus-penalty {
    margin-top: 20px;
    border-top: 1px dashed #e4e7ed;
    padding-top: 15px;
}

/* Element Plus overrides (optional) */
:deep(.el-tabs__header) {
    margin-bottom: 20px;
}
:deep(.el-tabs__nav-wrap::after) {
    height: 1px;
}
</style> 