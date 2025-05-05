/* eslint-disable vue/multi-word-component-names */
<template>
  <!-- 包裹层，用于居中显示手机模型 -->
  <div class="stocking-view-wrapper">
    <div class="phone-mockup">
      <div class="phone-screen">
        <!-- 原 Stocking.vue 的内容放在这里 -->
        <div class="stocking-container-el">
          <el-page-header @back="goBack" content="备货">
          </el-page-header>

          <div class="search-bar-el">
            <div style="display: flex; gap: 10px; align-items: center;">
              <el-input
                v-model="searchQuery"
                placeholder="搜索车次号"
                clearable
                @keyup.enter="onSearch"
                @clear="onClear"
                style="flex-grow: 1;"
              >
                <template #append>
                  <el-button @click="onSearch">搜索</el-button>
                </template>
              </el-input>
              <el-button @click="goToHistory" type="info" plain>备货历史</el-button>
            </div>
          </div>

          <div class="train-list-el">
            <el-card 
              shadow="never" 
              v-for="item in filteredList" 
              :key="item.id" 
              class="train-card-el" 
              @click="selectTrain(item)"
            >
              <div class="card-content-el">
                <div class="train-number-el">车次号: {{ item.trainNumber }}</div>
                <div class="arrival-time-el">计划到达时间: {{ item.plannedArrivalTime || 'N/A' }}</div>
              </div>
            </el-card>
            <p v-if="!filteredList.length && !isLoading" class="no-data-el">没有找到匹配的车次</p>
             <p v-if="isLoading" class="loading-el">加载中...</p> 
          </div>

        </div>
        <!-- 原内容结束 -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'; // 引入 computed 和 onMounted
import { useRouter } from 'vue-router';
// 移除 Vant 引入
// import { NavBar as VanNavBar, Search as VanSearch, List as VanList, Cell as VanCell, Toast } from 'vant';
// 引入 Element Plus 组件 和 ElMessage
import { ElPageHeader, ElInput, ElCard, ElButton, ElMessage } from 'element-plus';

const router = useRouter();
const searchQuery = ref('');
const allList = reactive([]); // 存储所有车次数据
const isLoading = ref(false); // 加载状态
// 移除 Vant List 相关状态
// const loading = ref(false);
// const finished = ref(false);
// const currentPage = ref(0);

const goBack = () => {
  router.back();
};

// 计算属性，根据搜索词过滤列表
const filteredList = computed(() => {
  if (!searchQuery.value) {
    return allList;
  }
  return allList.filter(item => 
    item.trainNumber.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 模拟获取所有车次列表数据 (一次性加载)
const fetchAllTrainList = async () => {
  isLoading.value = true;
  console.log('Fetching all train list...');
  try {
    // 模拟 API 请求延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 模拟数据 - 实际应从 API 获取
    const mockData = [
      { id: 1, trainNumber: 'T20240726001', plannedArrivalTime: '2024-07-26 10:00' },
      { id: 2, trainNumber: 'T20240726002', plannedArrivalTime: '2024-07-26 11:30' },
      { id: 3, trainNumber: 'T20240727001' },
      { id: 4, trainNumber: 'G20240727002', plannedArrivalTime: '2024-07-27 09:00' },
      { id: 5, trainNumber: 'K20240728001', plannedArrivalTime: '2024-07-28 15:00' },
       // Add more mock data if needed
      { id: 6, trainNumber: 'Z20240729001', plannedArrivalTime: '2024-07-29 18:00' },
    ];

    allList.length = 0; // 清空旧数据
    allList.push(...mockData);
    console.log('Train list loaded:', allList);
  } catch (error) {
    console.error('Failed to fetch train list:', error);
    // 替换 Toast.fail
    ElMessage.error('加载车次列表失败');
  } finally {
    isLoading.value = false;
  }
};

// 移除 onLoad 方法，改为在 onMounted 中调用 fetchAllTrainList
// const onLoad = async () => { ... };
onMounted(() => {
  fetchAllTrainList();
});

// onSearch 只需确保计算属性重新计算，无需手动加载
const onSearch = () => {
  // 搜索逻辑由计算属性 filteredList 处理
  console.log('Search triggered with query:', searchQuery.value);
};

// onClear 清空搜索词，计算属性会自动更新
const onClear = () => {
  searchQuery.value = '';
  console.log('Search cleared');
};

const selectTrain = (train) => {
  console.log('Selected Train:', train);
  router.push({ name: 'StockingConfirm', params: { trainId: train.id, trainNumber: train.trainNumber } });
};

// 新增：跳转到备货历史页面的方法
const goToHistory = () => {
  // 假设历史页面的路由名称是 'StockingHistory'
  router.push({ name: 'StockingHistory' });
};

</script>

<style scoped lang="scss">
/* 新增：外层包裹样式 */
.stocking-view-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 104px);
}

/* 手机外壳样式 */
.phone-mockup {
  width: 390px;
  height: 844px;
  border: 12px solid black;
  border-radius: 50px;
  background-color: #f9f9f9;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  position: relative;
  padding: 15px;
  box-sizing: border-box;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 150px;
    height: 25px;
    background-color: black;
    border-bottom-left-radius: 15px;
    border-bottom-right-radius: 15px;
    z-index: 2;
  }
}

.phone-screen {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  border-radius: 38px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

/* 原 Stocking.vue 的样式，现在作用于手机屏幕内部 */
.stocking-container-el {
  display: flex;
  flex-direction: column;
  height: 100%; /* 填满手机屏幕 */
  /* background-color: #f0f2f5; */ /* 手机屏幕背景是白色，不需要这个了 */
  border-radius: 38px; // 适应手机屏幕圆角
  overflow: hidden; // 防止内部内容溢出圆角
}

.el-page-header {
  background-color: #fff;
  padding: 10px 20px;
  /* box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08); */ /* 内部不需要阴影 */
   flex-shrink: 0; // 防止被压缩
   border-bottom: 1px solid #eee; // 简单的分割线
}

.search-bar-el {
  padding: 10px;
  background-color: #fff;
   flex-shrink: 0;
}

.train-list-el {
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px; /* 统一内边距 */
}

.train-card-el {
  margin-bottom: 8px; // 减少间距
  cursor: pointer;
  transition: box-shadow 0.2s ease-in-out;

  &:hover {
     box-shadow: var(--el-box-shadow-lighter);
  }
}

:deep(.el-card__body) {
  padding: 0; 
}

.card-content-el {
   padding: 12px 15px; // 调整卡片内边距
}

.train-number-el {
  font-weight: bold;
  margin-bottom: 4px; // 减少间距
  font-size: 15px; // 调整字体大小
}

.arrival-time-el {
  font-size: 12px; // 调整字体大小
  color: #606266;
}

.no-data-el, .loading-el {
  text-align: center;
  color: #909399;
  margin-top: 15px; // 调整间距
  font-size: 14px;
}

/* 手机外壳的响应式样式 */
@media (max-height: 900px) {
  .phone-mockup {
    transform: scale(0.9);
  }
}
@media (max-width: 450px) {
  .stocking-view-wrapper {
      padding: 10px 0;
  }
   .phone-mockup {
    width: 95%;
    height: auto;
    min-height: 600px;
    max-height: 85vh;
    padding: 10px;
    border-width: 10px;
    border-radius: 40px;
     &::before {
       width: 120px;
       height: 20px;
       border-bottom-left-radius: 12px;
       border-bottom-right-radius: 12px;
    }
  }
   .phone-screen {
      border-radius: 30px;
   }
   .stocking-container-el {
       border-radius: 30px; // 保持一致
   }
}

</style> 