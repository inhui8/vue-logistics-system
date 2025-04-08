<template>
  <div class="layout-container">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'BaseLayout'
}
</script>

<style scoped>
.layout-container {
  height: 100%;
  width: 100%;
  padding: 0;
  margin: 0;
}
</style>