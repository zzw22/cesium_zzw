<template>
  <div class="page-card">
    <h2 class="page-title">{{ t('home.welcome') }}</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <el-card class="shadow-sm dark:bg-gray-700 dark:border-gray-600">
        <template #header>
          <div class="flex justify-between items-center dark:text-gray-200">
            <span>{{ t('home.totalUsers') }}</span>
            <el-icon class="text-blue-500"><User /></el-icon>
          </div>
        </template>
        <div class="text-3xl font-bold text-gray-800 dark:text-white">1,234</div>
        <div class="text-sm text-green-500 mt-2">
          <el-icon><ArrowUp /></el-icon>
          <span>12.5% 较上月</span>
        </div>
      </el-card>

      <el-card class="shadow-sm dark:bg-gray-700 dark:border-gray-600">
        <template #header>
          <div class="flex justify-between items-center dark:text-gray-200">
            <span>{{ t('home.totalProjects') }}</span>
            <el-icon class="text-green-500"><Document /></el-icon>
          </div>
        </template>
        <div class="text-3xl font-bold text-gray-800 dark:text-white">567</div>
        <div class="text-sm text-green-500 mt-2">
          <el-icon><ArrowUp /></el-icon>
          <span>8.2% 较上月</span>
        </div>
      </el-card>

      <el-card class="shadow-sm dark:bg-gray-700 dark:border-gray-600">
        <template #header>
          <div class="flex justify-between items-center dark:text-gray-200">
            <span>{{ t('home.todayVisits') }}</span>
            <el-icon class="text-purple-500"><View /></el-icon>
          </div>
        </template>
        <div class="text-3xl font-bold text-gray-800 dark:text-white">8,901</div>
        <div class="text-sm text-red-500 mt-2">
          <el-icon><ArrowDown /></el-icon>
          <span>3.1% 较昨日</span>
        </div>
      </el-card>

      <el-card class="shadow-sm dark:bg-gray-700 dark:border-gray-600">
        <template #header>
          <div class="flex justify-between items-center dark:text-gray-200">
            <span>{{ t('home.systemStatus') }}</span>
            <el-icon class="text-yellow-500"><Setting /></el-icon>
          </div>
        </template>
        <div class="text-3xl font-bold text-gray-800 dark:text-white">
          <el-tag type="success">{{ t('home.normal') }}</el-tag>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-2">
          <span>运行时间: 30天</span>
        </div>
      </el-card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <el-card class="shadow-sm dark:bg-gray-700 dark:border-gray-600">
        <template #header>
          <span class="dark:text-gray-200">{{ t('home.projectProgress') }}</span>
        </template>
        <div class="h-64 flex items-center justify-center">
          <div class="text-center">
            <el-icon class="text-4xl text-gray-300"><DataBoard /></el-icon>
            <p class="text-gray-500 dark:text-gray-400 mt-2">图表占位符</p>
          </div>
        </div>
      </el-card>

      <el-card class="shadow-sm dark:bg-gray-700 dark:border-gray-600">
        <template #header>
          <span class="dark:text-gray-200">{{ t('home.recentProjects') }}</span>
        </template>
        <el-table :data="recentProjects" border class="dark:bg-gray-700" style="width: 100%">
          <el-table-column prop="name" label="项目名称" />
          <el-table-column prop="progress" label="进度">
            <template #default="{ row }">
              <el-progress :percentage="row.progress" :stroke-width="10" />
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="row.status === '进行中' ? 'success' : 'warning'">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { User, Document, View, Setting, ArrowUp, ArrowDown, DataBoard } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const recentProjects = [
  { name: '智慧交通系统', progress: 75, status: '进行中' },
  { name: '智能安防监控', progress: 45, status: '进行中' },
  { name: '环境监测平台', progress: 90, status: '进行中' },
  { name: '智慧医疗系统', progress: 20, status: '进行中' }
]
</script>