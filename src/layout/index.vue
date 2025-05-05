<template>
  <div class="app-wrapper">
    <!-- 侧边栏 -->
    <div class="sidebar-container">
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        :collapse="isCollapse"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <sidebar-item
          v-for="route in routes"
          :key="route.path"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </div>

    <!-- 主内容区 -->
    <div class="main-container">
      <div class="navbar">
        <hamburger
          :is-active="!isCollapse"
          @toggleClick="toggleSideBar"
        />
        <breadcrumb />
      </div>
      <div class="app-main">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useRoute } from 'vue-router'
import SidebarItem from './components/SidebarItem.vue'
import Hamburger from './components/Hamburger.vue'
import Breadcrumb from './components/Breadcrumb.vue'

export default defineComponent({
  name: 'Layout',
  components: {
    SidebarItem,
    Hamburger,
    Breadcrumb
  },
  setup() {
    const route = useRoute()
    const isCollapse = ref(false)
    const routes = computed(() => {
      return route.matched[0].children || []
    })
    const activeMenu = computed(() => {
      return route.path
    })

    const toggleSideBar = () => {
      isCollapse.value = !isCollapse.value
    }

    return {
      isCollapse,
      routes,
      activeMenu,
      toggleSideBar
    }
  }
})
</script>

<style lang="scss" scoped>
.app-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;

  .sidebar-container {
    width: 210px;
    height: 100%;
    background-color: #304156;
    transition: width 0.28s;
    flex-shrink: 0;

    &.is-collapse {
      width: 64px;
    }
  }

  .main-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .navbar {
      height: 50px;
      overflow: hidden;
      position: relative;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0,21,41,.08);
      display: flex;
      align-items: center;
      padding: 0 20px;
    }

    .app-main {
      flex: 1;
      padding: 20px;
      overflow: auto;
      background-color: #f0f2f5;
    }
  }
}
</style> 