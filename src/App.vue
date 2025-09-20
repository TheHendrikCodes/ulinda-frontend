<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
  overflow-x: hidden;
}

#app {
  width: 100%;
  min-height: 100vh;
  position: relative;
}

/* Reset any default responsive behavior that might interfere */
@media screen and (min-width: 1024px) {
  body {
    font-size: 1rem;
  }
}

@media screen and (max-width: 1023px) {
  body {
    font-size: 1rem;
  }
}
</style>
