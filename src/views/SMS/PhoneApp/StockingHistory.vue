<template>
  <div class="stocking-history-container-el">
    <!-- 包裹层，用于居中显示手机模型 -->
    <div class="stocking-view-wrapper">
      <div class="phone-mockup">
        <div class="phone-screen">
          <!-- 页面实际内容 -->
          <div class="history-content-wrapper">
            <el-page-header @back="goBack" content="备货历史">
            </el-page-header>
            
            <div class="history-list-area">
              <!-- 历史记录列表将显示在这里 -->
              <p class="placeholder-text">备货历史记录功能待实现...</p>
              <!-- 示例：可以添加搜索、筛选、列表等 -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ElPageHeader } from 'element-plus'; // 引入需要的 Element Plus 组件

const router = useRouter();

const goBack = () => {
  router.back();
};

// TODO: 添加获取和显示备货历史记录的逻辑

</script>

<style scoped lang="scss">
/* 重用 Stocking.vue 的外层包裹和手机样式 */
.stocking-view-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 104px); // Adjust based on your layout
}

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

/* 页面具体内容样式 */
.history-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 38px; 
  overflow: hidden; 
}

.el-page-header {
  background-color: #fff;
  padding: 10px 20px;
  flex-shrink: 0;
  border-bottom: 1px solid #eee;
}

.history-list-area {
  flex-grow: 1;
  padding: 15px;
  overflow-y: auto;
}

.placeholder-text {
  color: #909399;
  text-align: center;
  margin-top: 30px;
}

/* 响应式调整 */
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
   .history-content-wrapper {
       border-radius: 30px;
   }
}
</style> 