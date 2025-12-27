<template>
  <div class="page-card">
    <div class="flex justify-between items-center mb-4">
      <h2 class="page-title">角色管理</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加角色
      </el-button>
    </div>

    <el-table :data="roles" border stripe>
      <el-table-column type="selection" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="角色名称" />
      <el-table-column prop="code" label="角色编码" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="userCount" label="用户数" width="80" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="editRole(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button size="small" @click="assignPermissions(row)">
            <el-icon><Key /></el-icon>
            权限分配
          </el-button>
          <el-button size="small" type="danger" @click="deleteRole(row)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add Role Dialog -->
    <el-dialog v-model="showAddDialog" title="添加角色" width="500px">
      <el-form ref="formRef" :model="formData" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="formData.code" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="formData.status" active-value="active" inactive-value="disabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addRole">确定</el-button>
      </template>
    </el-dialog>

    <!-- Permission Assignment Dialog -->
    <el-dialog v-model="showPermissionDialog" title="权限分配" width="700px">
      <el-tree
        :data="permissionTree"
        :props="treeProps"
        show-checkbox
        default-expand-all
        node-key="id"
        ref="treeRef"
      />
      <template #footer>
        <el-button @click="showPermissionDialog = false">取消</el-button>
        <el-button type="primary" @click="savePermissions">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Plus, Edit, Key, Delete } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const showAddDialog = ref(false)
const showPermissionDialog = ref(false)
const treeRef = ref()
const formRef = ref(null)

const formData = ref({
  name: '',
  code: '',
  description: '',
  status: 'active'
})

const roles = ref([
  { id: 1, name: '超级管理员', code: 'admin', description: '系统最高权限', userCount: 1, status: 'active' },
  { id: 2, name: '系统管理员', code: 'system', description: '系统管理权限', userCount: 5, status: 'active' },
  { id: 3, name: '普通用户', code: 'user', description: '普通操作权限', userCount: 120, status: 'active' },
  { id: 4, name: '访客', code: 'guest', description: '只读权限', userCount: 20, status: 'disabled' }
])

const treeProps = {
  children: 'children',
  label: 'name'
}

const permissionTree = ref([
  {
    id: 1,
    name: '系统管理',
    children: [
      { id: 11, name: '用户管理' },
      { id: 12, name: '角色管理' },
      { id: 13, name: '菜单管理' }
    ]
  },
  {
    id: 2,
    name: '项目管理',
    children: [
      { id: 21, name: '项目列表' },
      { id: 22, name: '项目创建' },
      { id: 23, name: '项目编辑' }
    ]
  },
  {
    id: 3,
    name: '数据分析',
    children: [
      { id: 31, name: '数据统计' },
      { id: 32, name: '图表展示' }
    ]
  }
])

const addRole = async () => {
  try {
    await formRef.value.validateFields()
    ElMessage.success('角色添加成功')
    showAddDialog.value = false
  } catch (error) {
    ElMessage.error('表单验证失败')
  }
}

const editRole = (row) => {
  ElMessage.info('编辑角色功能待实现')
}

const assignPermissions = (row) => {
  showPermissionDialog.value = true
}

const savePermissions = () => {
  const selectedKeys = treeRef.value.getCheckedKeys()
  ElMessage.success(`已选择 ${selectedKeys.length} 个权限`)
  showPermissionDialog.value = false
}

const deleteRole = (row) => {
  ElMessageBox.confirm(
    '此操作将永久删除该角色, 是否继续?',
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
</script>