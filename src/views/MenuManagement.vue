<template>
  <div class="page-card">
    <div class="flex justify-between items-center mb-4">
      <h2 class="page-title">菜单管理</h2>
      <div class="space-x-2">
        <el-button type="primary" @click="addMenu">
          <el-icon><Plus /></el-icon>
          添加菜单
        </el-button>
        <el-button @click="expandAll">
          <el-icon><Expand /></el-icon>
          全部展开
        </el-button>
        <el-button @click="collapseAll">
          <el-icon><Fold /></el-icon>
          全部折叠
        </el-button>
      </div>
    </div>

    <div class="border dark:border-gray-700 rounded-lg p-4 mb-4">
      <el-tree
        :data="menuTree"
        :props="treeProps"
        show-checkbox
        node-key="id"
        ref="treeRef"
        default-expand-all
      >
        <template #default="{ data }">
          <span class="flex items-center space-x-2">
            <el-icon v-if="data.icon"><component :is="data.icon" /></el-icon>
            <span>{{ data.name }}</span>
          </span>
        </template>
        <template #append="{ data }">
          <div class="flex space-x-1">
            <el-button size="mini" @click="editMenu(data)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button size="mini" type="danger" @click="deleteMenu(data)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </template>
      </el-tree>
    </div>

    <div class="flex space-x-4">
      <el-button type="success" @click="saveMenu">
        <el-icon><Check /></el-icon>
        保存菜单
      </el-button>
      <el-button type="warning" @click="refreshMenu">
        <el-icon><Refresh /></el-icon>
        刷新菜单
      </el-button>
    </div>

    <!-- Add/Edit Menu Dialog -->
    <el-dialog v-model="showDialog" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="formData" label-width="100px">
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="菜单路径" prop="path">
          <el-input v-model="formData.path" />
        </el-form-item>
        <el-form-item label="组件路径" prop="component">
          <el-input v-model="formData.component" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="formData.icon" placeholder="如: House" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input v-model.number="formData.sort" type="number" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="formData.status" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item label="是否隐藏" prop="hidden">
          <el-switch v-model="formData.hidden" active-value="1" inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="submitMenu">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Edit, Delete, Check, Refresh, Expand, Fold, House, Setting, Document, DataBoard } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const treeRef = ref()
const showDialog = ref(false)
const dialogTitle = ref('添加菜单')
const formRef = ref(null)

const formData = ref({
  id: '',
  name: '',
  path: '',
  component: '',
  icon: '',
  sort: 0,
  status: 1,
  hidden: 0
})

const treeProps = {
  children: 'children',
  label: 'name'
}

const menuTree = ref([
  {
    id: 1,
    name: '首页',
    path: '/',
    component: 'Home',
    icon: 'House',
    sort: 1,
    status: 1,
    hidden: 0
  },
  {
    id: 2,
    name: '系统管理',
    path: '/system',
    component: '',
    icon: 'Setting',
    sort: 2,
    status: 1,
    hidden: 0,
    children: [
      { id: 21, name: '用户管理', path: '/user-management', component: 'UserManagement', icon: 'User', sort: 1, status: 1, hidden: 0 },
      { id: 22, name: '角色管理', path: '/role-management', component: 'RoleManagement', icon: 'Key', sort: 2, status: 1, hidden: 0 },
      { id: 23, name: '菜单管理', path: '/menu-management', component: 'MenuManagement', icon: 'Menu', sort: 3, status: 1, hidden: 0 }
    ]
  },
  {
    id: 3,
    name: '项目管理',
    path: '/project',
    component: 'ProjectManagement',
    icon: 'Document',
    sort: 3,
    status: 1,
    hidden: 0
  },
  {
    id: 4,
    name: '数据分析',
    path: '/analysis',
    component: 'DataAnalysis',
    icon: 'DataBoard',
    sort: 4,
    status: 1,
    hidden: 0
  }
])

const addMenu = () => {
  dialogTitle.value = '添加菜单'
  formData.value = {
    id: '',
    name: '',
    path: '',
    component: '',
    icon: '',
    sort: 0,
    status: 1,
    hidden: 0
  }
  showDialog.value = true
}

const editMenu = (data) => {
  dialogTitle.value = '编辑菜单'
  formData.value = { ...data }
  showDialog.value = true
}

const deleteMenu = (data) => {
  ElMessageBox.confirm(
    '此操作将永久删除该菜单, 是否继续?',
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

const saveMenu = () => {
  ElMessage.success('菜单保存成功')
}

const refreshMenu = () => {
  ElMessage.info('菜单已刷新')
}

const expandAll = () => {
  treeRef.value.expandAll()
}

const collapseAll = () => {
  treeRef.value.collapseAll()
}

const submitMenu = async () => {
  try {
    await formRef.value.validateFields()
    ElMessage.success('菜单操作成功')
    showDialog.value = false
  } catch (error) {
    ElMessage.error('表单验证失败')
  }
}
</script>