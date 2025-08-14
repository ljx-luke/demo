<script setup lang="ts">
import { ref } from 'vue'
import WelcomeItem from '../WelcomeItem.vue'
import DocumentationIcon from '../icons/IconDocumentation.vue'
import Drawer from '../DrawerRight.vue'

const dialogVisible = ref(false)
const drawerType = ref('')
const showDrawer = (type: string) => {
  drawerType.value = type
  dialogVisible.value = true
}
</script>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'customIndex',
})
</script>

<template>
  <WelcomeItem>
    <template #icon>
      <DocumentationIcon />
    </template>
    <template #heading>列表拖拽</template>
    <el-link type="primary" @click="showDrawer('SortableBoard')">拖拽列表 · 看板拖拽</el-link>
  </WelcomeItem>
  <Drawer
    v-model:visible="dialogVisible"
    @close="dialogVisible = false"
    :type="drawerType"
    transition="el-fade-in-linear"
  />
</template>
