<template>
  <div class="page-card">
    <div class="flex justify-between items-center mb-4">
      <h2 class="page-title">用户管理</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加用户
      </el-button>
    </div>

    <div class="flex space-x-4 mb-4">
      <el-input v-model="searchQuery" placeholder="搜索用户" clearable class="w-64">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable class="w-32">
        <el-option label="全部" value="" />
        <el-option label="启用" value="active" />
        <el-option label="禁用" value="disabled" />
      </el-select>
    </div>

    <el-table :data="filteredUsers" border stripe>
      <el-table-column type="selection" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="realName" label="真实姓名" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="role" label="角色" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="editUser(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button size="small" type="danger" @click="deleteUser(row)">
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
        :total="totalUsers"
        layout="total, prev, pager, next, jumper"
      />
    </div>

    <!-- Add User Dialog -->
    <el-dialog v-model="showAddDialog" title="添加用户" width="500px">
      <el-form ref="formRef" :model="formData" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="formData.realName" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" type="email" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
            <el-option label="访客" value="guest" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="formData.status" active-value="active" inactive-value="disabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addUser">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Search, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const searchQuery = ref('')
const statusFilter = ref('')
const showAddDialog = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalUsers = ref(100)

const formRef = ref(null)

const formData = ref({
  username: '',
  realName: '',
  email: '',
  role: 'user',
  status: 'active'
})

const users = ref([
  { id: 1, username: 'admin', realName: '管理员', email: 'admin@example.com', role: 'admin', status: 'active', createTime: '2024-01-01' },
  { id: 2, username: 'user1', realName: '张三', email: 'user1@example.com', role: 'user', status: 'active', createTime: '2024-01-02' },
  { id: 3, username: 'user2', realName: '李四', email: 'user2@example.com', role: 'user', status: 'disabled', createTime: '2024-01-03' },
  { id: 4, username: 'user3', realName: '王五', email: 'user3@example.com', role: 'guest', status: 'active', createTime: '2024-01-04' }
])

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchesSearch = user.username.includes(searchQuery.value) || user.realName.includes(searchQuery.value) || user.email.includes(searchQuery.value)
    const matchesStatus = !statusFilter.value || user.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const addUser = async () => {
  try {
    await formRef.value.validateFields()
    ElMessage.success('用户添加成功')
    showAddDialog.value = false
  } catch (error) {
    ElMessage.error('表单验证失败')
  }
}

const editUser = (row) => {
  ElMessage.info('编辑用户功能待实现')
}

const deleteUser = (row) => {
  ElMessageBox.confirm(
    '此操作将永久删除该用户, 是否继续?',
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
</script>