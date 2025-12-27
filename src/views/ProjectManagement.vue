<template>
  <div class="page-card">
    <div class="flex justify-between items-center mb-4">
      <h2 class="page-title">项目管理</h2>
      <div class="space-x-2">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          新建项目
        </el-button>
        <el-button type="success" @click="exportProjects">
          <el-icon><Download /></el-icon>
          导出项目
        </el-button>
      </div>
    </div>

    <div class="flex space-x-4 mb-4">
      <el-input v-model="searchQuery" placeholder="搜索项目" clearable class="w-64">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable class="w-32">
        <el-option label="全部" value="" />
        <el-option label="进行中" value="in_progress" />
        <el-option label="已完成" value="completed" />
        <el-option label="已暂停" value="paused" />
      </el-select>
      <el-select v-model="typeFilter" placeholder="项目类型" clearable class="w-32">
        <el-option label="全部" value="" />
        <el-option label="智慧交通" value="traffic" />
        <el-option label="智能安防" value="security" />
        <el-option label="环境监测" value="environment" />
        <el-option label="智慧医疗" value="medical" />
      </el-select>
    </div>

    <el-table :data="filteredProjects" border stripe>
      <el-table-column type="selection" />
      <el-table-column prop="id" label="ID" width="80" />
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
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="manager" label="项目经理" />
      <el-table-column prop="startDate" label="开始时间" />
      <el-table-column prop="endDate" label="结束时间" />
      <el-table-column prop="budget" label="预算" />
      <el-table-column label="操作" width="250">
        <template #default="{ row }">
          <el-button size="small" @click="viewProject(row)">
            <el-icon><View /></el-icon>
            查看
          </el-button>
          <el-button size="small" @click="editProject(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button size="small" @click="viewProgress(row)">
            <el-icon><DataBoard /></el-icon>
            进度
          </el-button>
          <el-button size="small" type="danger" @click="deleteProject(row)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="flex justify-between items-center mt-4">
      <el-button @click="deleteSelected">批量删除</el-button>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalProjects"
        layout="total, prev, pager, next, jumper"
      />
    </div>

    <!-- Add Project Dialog -->
    <el-dialog v-model="showAddDialog" title="新建项目" width="600px">
      <el-form ref="formRef" :model="formData" label-width="120px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="项目类型" prop="type">
          <el-select v-model="formData.type">
            <el-option label="智慧交通" value="traffic" />
            <el-option label="智能安防" value="security" />
            <el-option label="环境监测" value="environment" />
            <el-option label="智慧医疗" value="medical" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目经理" prop="manager">
          <el-input v-model="formData.manager" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startDate">
          <el-date-picker v-model="formData.startDate" type="date" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endDate">
          <el-date-picker v-model="formData.endDate" type="date" />
        </el-form-item>
        <el-form-item label="预算" prop="budget">
          <el-input v-model="formData.budget" prefix="¥" />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addProject">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Search, Download, View, Edit, Delete, DataBoard } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const showAddDialog = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalProjects = ref(100)
const formRef = ref(null)

const formData = ref({
  name: '',
  type: '',
  manager: '',
  startDate: '',
  endDate: '',
  budget: '',
  description: ''
})

const projects = ref([
  { id: 1, name: '智慧交通系统', type: 'traffic', status: 'in_progress', progress: 75, manager: '张三', startDate: '2024-01-01', endDate: '2024-12-31', budget: '¥10,000,000' },
  { id: 2, name: '智能安防监控', type: 'security', status: 'in_progress', progress: 45, manager: '李四', startDate: '2024-02-01', endDate: '2024-10-31', budget: '¥8,000,000' },
  { id: 3, name: '环境监测平台', type: 'environment', status: 'completed', progress: 100, manager: '王五', startDate: '2023-06-01', endDate: '2024-01-15', budget: '¥5,000,000' },
  { id: 4, name: '智慧医疗系统', type: 'medical', status: 'paused', progress: 20, manager: '赵六', startDate: '2024-03-01', endDate: '2024-11-30', budget: '¥12,000,000' }
])

const filteredProjects = computed(() => {
  return projects.value.filter(project => {
    const matchesSearch = project.name.includes(searchQuery.value) || project.manager.includes(searchQuery.value)
    const matchesStatus = !statusFilter.value || project.status === statusFilter.value
    const matchesType = !typeFilter.value || project.type === typeFilter.value
    return matchesSearch && matchesStatus && matchesType
  })
})

const getStatusLabel = (status) => {
  const labels = {
    in_progress: '进行中',
    completed: '已完成',
    paused: '已暂停'
  }
  return labels[status] || status
}

const getStatusTagType = (status) => {
  const types = {
    in_progress: 'warning',
    completed: 'success',
    paused: 'danger'
  }
  return types[status] || 'info'
}

const getTypeLabel = (type) => {
  const labels = {
    traffic: '智慧交通',
    security: '智能安防',
    environment: '环境监测',
    medical: '智慧医疗'
  }
  return labels[type] || type
}

const getTypeTagType = (type) => {
  const types = {
    traffic: 'primary',
    security: 'success',
    environment: 'warning',
    medical: 'info'
  }
  return types[type] || 'info'
}

const addProject = async () => {
  try {
    await formRef.value.validateFields()
    ElMessage.success('项目创建成功')
    showAddDialog.value = false
  } catch (error) {
    ElMessage.error('表单验证失败')
  }
}

const editProject = (row) => {
  ElMessage.info('编辑项目功能待实现')
}

const viewProject = (row) => {
  ElMessage.info('查看项目详情功能待实现')
}

const viewProgress = (row) => {
  ElMessage.info('查看项目进度功能待实现')
}

const deleteProject = (row) => {
  ElMessageBox.confirm(
    '此操作将永久删除该项目, 是否继续?',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('删除成功!')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const deleteSelected = () => {
  ElMessage.info('批量删除功能待实现')
}

const exportProjects = () => {
  ElMessage.success('项目导出成功')
}
</script>