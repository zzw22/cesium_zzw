import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    common: {
      login: 'Login',
      logout: 'Logout',
      confirm: 'Confirm',
      cancel: 'Cancel',
      search: 'Search',
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      status: 'Status',
      operation: 'Operation',
      success: 'Success',
      error: 'Error',
      username: 'Username',
      password: 'Password',
      captcha: 'Captcha',
      refresh: 'Refresh'
    },
    menu: {
      home: 'Home',
      system: 'System Management',
      user: 'User Management',
      role: 'Role Management',
      menu: 'Menu Management',
      project: 'Project Management',
      analysis: 'Data Analysis'
    },
    login: {
      title: 'Vue3 Admin',
      welcome: 'Welcome Back',
      usernamePlaceholder: 'Admin',
      passwordPlaceholder: 'Password',
      captchaPlaceholder: 'Captcha',
      captchaError: 'Captcha Error',
      loginSuccess: 'Login Success',
      loginError: 'Username or Password Error'
    },
    home: {
      welcome: 'Welcome to Panda Smart City Monitoring System',
      totalUsers: 'Total Users',
      totalProjects: 'Total Projects',
      todayVisits: 'Today Visits',
      systemStatus: 'System Status',
      projectProgress: 'Project Progress',
      recentProjects: 'Recent Projects',
      normal: 'Normal'
    }
  },
  zh: {
    common: {
      login: '登录',
      logout: '退出登录',
      confirm: '确定',
      cancel: '取消',
      search: '搜索',
      add: '添加',
      edit: '编辑',
      delete: '删除',
      status: '状态',
      operation: '操作',
      success: '成功',
      error: '错误',
      username: '用户名',
      password: '密码',
      captcha: '验证码',
      refresh: '刷新'
    },
    menu: {
      home: '首页',
      system: '系统管理',
      user: '用户管理',
      role: '角色管理',
      menu: '菜单管理',
      project: '项目管理',
      analysis: '数据分析'
    },
    login: {
      title: 'Vue3 Admin',
      welcome: '欢迎回来',
      usernamePlaceholder: '用户名',
      passwordPlaceholder: '密码',
      captchaPlaceholder: '请输入验证码',
      captchaError: '验证码错误',
      loginSuccess: '登录成功',
      loginError: '用户名或密码错误'
    },
    home: {
      welcome: '欢迎使用熊猫智慧城市监控管理系统',
      totalUsers: '总用户数',
      totalProjects: '总项目数',
      todayVisits: '今日访问量',
      systemStatus: '系统状态',
      projectProgress: '项目进度统计',
      recentProjects: '最近项目',
      normal: '正常'
    }
  }
}

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('language') || 'zh',
  fallbackLocale: 'en',
  messages
})

export default i18n
