<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <h2 class="page-title">数据分析</h2>
      <el-button type="primary" @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <el-card class="shadow-md dark:bg-gray-800 dark:border-gray-700">
        <div class="flex items-center">
          <div class="text-4xl text-blue-500 mr-4">
            <el-icon><User /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">总用户数</p>
            <p class="text-2xl font-bold">{{ stats.totalUsers }}</p>
          </div>
        </div>
      </el-card>

      <el-card class="shadow-md dark:bg-gray-800 dark:border-gray-700">
        <div class="flex items-center">
          <div class="text-4xl text-green-500 mr-4">
            <el-icon><FolderOpened /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">总项目数</p>
            <p class="text-2xl font-bold">{{ stats.totalProjects }}</p>
          </div>
        </div>
      </el-card>

      <el-card class="shadow-md">
        <div class="flex items-center">
          <div class="text-4xl text-yellow-500 mr-4">
            <el-icon><Clock /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500">平均完成时间</p>
            <p class="text-2xl font-bold">{{ stats.averageCompletionTime }}天</p>
          </div>
        </div>
      </el-card>

      <el-card class="shadow-md">
        <div class="flex items-center">
          <div class="text-4xl text-red-500 mr-4">
            <el-icon><Check /></el-icon>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">项目完成率</p>
            <p class="text-2xl font-bold dark:text-white">{{ stats.completionRate }}%</p>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <el-card class="shadow-md">
        <template #header>
          <div class="flex justify-between items-center">
            <span>项目类型分布</span>
            <el-select v-model="projectTypeFilter" placeholder="筛选类型" size="small">
              <el-option label="全部" value="" />
              <el-option label="智慧城市" value="smart-city" />
              <el-option label="智慧交通" value="smart-traffic" />
              <el-option label="智慧环保" value="smart-environment" />
              <el-option label="智慧安防" value="smart-security" />
            </el-select>
          </div>
        </template>
        <div class="h-64 flex items-center justify-center">
          <div class="text-center">
            <el-icon class="text-6xl text-gray-300"><PieChart /></el-icon>
            <p class="mt-2 text-gray-500">项目类型分布图表</p>
          </div>
        </div>
      </el-card>

      <el-card class="shadow-md dark:bg-gray-800 dark:border-gray-700">
        <template #header>
          <span class="dark:text-white">项目进度趋势</span>
        </template>
        <div class="h-64 flex items-center justify-center">
          <div class="text-center">
            <!-- <el-icon class="text-6xl text-gray-300"><LineChart /></el-icon> -->
            <p class="mt-2 text-gray-500">项目进度趋势图表</p>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 数据表格 -->
    <el-card class="shadow-md">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="dark:text-white">项目数据分析</span>
          <el-input v-model="searchKeyword" placeholder="搜索项目" size="small" class="w-64">
            <template #append>
              <el-button @click="searchProjects">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
      </template>
      <el-table :data="filteredProjects" border stripe>
        <el-table-column prop="id" label="项目ID" width="100" />
        <el-table-column prop="name" label="项目名称" />
        <el-table-column prop="type" label="项目类型">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column prop="startDate" label="开始日期" />
        <el-table-column prop="endDate" label="结束日期" />
        <el-table-column prop="manager" label="项目经理" />
        <el-table-column prop="budget" label="预算" />
      </el-table>

      <!-- 分页 -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredProjects.length"
          layout="total, prev, pager, next, jumper"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { User, FolderOpened, Clock, Check, Refresh, PieChart,  Search } from '@element-plus/icons-vue';

// 统计数据
const stats = ref({
  totalUsers: 128,
  totalProjects: 36,
  averageCompletionTime: 45,
  completionRate: 78
});

// 筛选条件
const projectTypeFilter = ref('');
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

// 项目数据
const projects = ref([
  { id: 1, name: '熊猫智慧城市一期', type: 'smart-city', progress: 85, startDate: '2024-01-01', endDate: '2024-06-30', manager: '张三', budget: '¥12,000,000' },
  { id: 2, name: '熊猫智慧交通系统', type: 'smart-traffic', progress: 60, startDate: '2024-02-15', endDate: '2024-09-15', manager: '李四', budget: '¥8,500,000' },
  { id: 3, name: '熊猫智慧环保监测', type: 'smart-environment', progress: 90, startDate: '2024-03-01', endDate: '2024-07-31', manager: '王五', budget: '¥5,200,000' },
  { id: 4, name: '熊猫智慧安防系统', type: 'smart-security', progress: 45, startDate: '2024-04-10', endDate: '2024-10-10', manager: '赵六', budget: '¥7,800,000' },
  { id: 5, name: '熊猫智慧城市二期', type: 'smart-city', progress: 30, startDate: '2024-05-01', endDate: '2024-12-31', manager: '孙七', budget: '¥15,000,000' },
  { id: 6, name: '熊猫智慧停车系统', type: 'smart-traffic', progress: 75, startDate: '2024-06-15', endDate: '2024-11-15', manager: '周八', budget: '¥4,200,000' },
  { id: 7, name: '熊猫智慧垃圾分类', type: 'smart-environment', progress: 55, startDate: '2024-07-01', endDate: '2024-12-01', manager: '吴九', budget: '¥3,800,000' },
  { id: 8, name: '熊猫智慧消防系统', type: 'smart-security', progress: 20, startDate: '2024-08-01', endDate: '2025-02-01', manager: '郑十', budget: '¥6,500,000' }
]);

// 筛选后的项目数据
const filteredProjects = computed(() => {
  let result = projects.value;

  if (projectTypeFilter.value) {
    result = result.filter(project => project.type === projectTypeFilter.value);
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(project => 
      project.name.toLowerCase().includes(keyword) || 
      project.manager.toLowerCase().includes(keyword)
    );
  }

  return result;
});

// 获取项目类型标签
const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    'smart-city': 'primary',
    'smart-traffic': 'success',
    'smart-environment': 'warning',
    'smart-security': 'danger'
  };
  return typeMap[type] || 'info';
};

// 获取项目类型标签
const getTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    'smart-city': '智慧城市',
    'smart-traffic': '智慧交通',
    'smart-environment': '智慧环保',
    'smart-security': '智慧安防'
  };
  return typeMap[type] || '其他';
};

// 刷新数据
const refreshData = () => {
  ElMessage.success('数据已刷新');
};

// 搜索项目
const searchProjects = () => {
  ElMessage.info('搜索完成');
};
</script>

<style scoped>
/* 自定义样式 */
</style>
