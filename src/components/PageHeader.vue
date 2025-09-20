<template>
  <div class="page-header">
    <!-- Page Title Bar -->
    <div class="page-title-bar">
      <div class="page-title-content">
        <h1>{{ title }}</h1>
      </div>
    </div>

    <!-- Page Description Bar -->
    <div class="page-description-bar">
      <div class="page-description-content">
        <p>{{ description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
}

defineProps<Props>()
</script>

<style scoped>
.page-header {
  position: fixed;
  top: 60px; /* Below the main navigation bar */
  left: 0;
  right: 0;
  z-index: 900; /* Below navigation (z-index: 1000) but above content */
  background-color: #fff;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.page-title-bar {
  height: 70px; /* Back to original height */
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 15px; /* Add top padding for spacing */
}

.page-title-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  box-sizing: border-box;
  text-align: center;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-title-content h1 {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.page-description-bar {
  height: 50px;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-description-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  box-sizing: border-box;
  text-align: center;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-description-content p {
  color: #6c757d;
  font-size: 1rem;
  line-height: 1.4;
  margin: 0;
}

@media (max-width: 768px) {
  .page-title-content,
  .page-description-content {
    padding: 0 1rem;
  }

  .page-title-content h1 {
    font-size: 1.25rem;
  }

  .page-description-content p {
    font-size: 0.9rem;
  }
}
</style>