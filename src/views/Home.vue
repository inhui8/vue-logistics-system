<template>
  <div class="home-container">
    <h1>联宇物流系统</h1>
    <div class="dashboard">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="dashboard-card">
            <div class="card-header">
              <h3>FBX预约管理</h3>
            </div>
            <div class="card-content">
              <div class="stat-item">
                <div class="stat-label">今日预约</div>
                <div class="stat-value">12</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">待处理</div>
                <div class="stat-value">35</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">已完成</div>
                <div class="stat-value">128</div>
              </div>
            </div>
            <div class="card-footer">
              <router-link to="/fbx" class="view-more">查看更多</router-link>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="dashboard-card">
            <div class="card-header">
              <h3>海柜停车图</h3>
            </div>
            <div class="card-content">
              <div class="stat-item">
                <div class="stat-label">当前停靠</div>
                <div class="stat-value">8</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">今日到达</div>
                <div class="stat-value">3</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">明日预计</div>
                <div class="stat-value">5</div>
              </div>
            </div>
            <div class="card-footer">
              <router-link to="/ockyard" class="view-more">查看更多</router-link>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="dashboard-card">
            <div class="card-header">
              <h3>系统概览</h3>
            </div>
            <div class="card-content">
              <div class="stat-item">
                <div class="stat-label">用户数</div>
                <div class="stat-value">24</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">今日操作</div>
                <div class="stat-value">156</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">系统消息</div>
                <div class="stat-value">3</div>
              </div>
            </div>
            <div class="card-footer">
              <a href="#" class="view-more">查看更多</a>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView'
}
</script>

<style scoped>
.home-container {
  padding: 20px;
}

h1 {
  margin-bottom: 30px;
  font-size: 24px;
  color: #303133;
}

.dashboard {
  margin-top: 20px;
}

.dashboard-card {
  height: 100%;
  transition: all 0.3s;
}

.dashboard-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.card-header {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.card-content {
  padding: 10px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.stat-label {
  color: #606266;
}

.stat-value {
  font-weight: bold;
  color: #409EFF;
  font-size: 18px;
}

.card-footer {
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
  text-align: right;
}

.view-more {
  color: #409EFF;
  text-decoration: none;
}

.view-more:hover {
  text-decoration: underline;
}
</style> 