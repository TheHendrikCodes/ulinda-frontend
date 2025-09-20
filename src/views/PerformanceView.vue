<template>
  <div class="performance">
    <AppNavigation />
    
    <PageHeader
      title="Performance Monitor"
      description="Monitor system performance metrics and resource usage."
    />

    <div class="content">
      <div class="placeholder">
        <p>Performance monitoring functionality will be implemented here.</p>
        <ul class="feature-list">
          <li>CPU and memory usage metrics</li>
          <li>Database performance monitoring</li>
          <li>API response time tracking</li>
          <li>Server load analytics</li>
          <li>Performance alerts and notifications</li>
          <li>Historical performance data</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppNavigation from '@/components/AppNavigation.vue'
import PageHeader from '@/components/PageHeader.vue'
</script>

<style scoped>
.performance {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  background-color: #f5f5f5;
  margin: 0;
  padding: 0;
}

.content {
  padding-top: calc(195px + 2rem); /* 60px nav + 85px title + 50px description + padding */
  padding-left: 2rem;
  padding-right: 2rem;
  padding-bottom: 2rem;
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .content {
    padding-top: calc(195px + 1rem);
    padding-left: 1rem;
    padding-right: 1rem;
    padding-bottom: 1rem;
  }
}

.placeholder {
  background-color: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
  text-align: center;
}

.placeholder p {
  color: #6c757d;
  font-style: italic;
  margin-bottom: 1rem;
}

.feature-list {
  text-align: left;
  max-width: 400px;
  margin: 0 auto;
  color: #6c757d;
}

.feature-list li {
  margin-bottom: 0.5rem;
}
</style>