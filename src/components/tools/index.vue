<script setup lang="ts">
import { ref } from 'vue'
import WelcomeItem from '../WelcomeItem.vue'
import DocumentationIcon from '../icons/IconDocumentation.vue'
import Drawer from '../DrawerLeft.vue'

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
  name: 'toolsIndex',
})
</script>

<template>
  <WelcomeItem>
    <template #icon>
      <DocumentationIcon />
    </template>
    <template #heading>图片压缩</template>
    <el-link type="primary" @click="showDrawer('ImageCompression')"
      >上传图片 · 调整质量 · 下载压缩结果</el-link
    >
  </WelcomeItem>
  <WelcomeItem>
    <template #icon>
      <DocumentationIcon />
    </template>
    <template #heading>二维码生成</template>
    <el-link type="primary" @click="showDrawer('qRCode')">一键生成二维码</el-link>
  </WelcomeItem>
  <WelcomeItem>
    <template #icon>
      <DocumentationIcon />
    </template>
    <template #heading>在线转换</template>
    <el-link type="primary" @click="showDrawer('PdfToWord')">PDF转Word</el-link>
    <el-link type="primary" @click="showDrawer('WordToPdf')"> · Word转PDF</el-link>
  </WelcomeItem>
  <Drawer
    v-model:visible="dialogVisible"
    @close="dialogVisible = false"
    :type="drawerType"
    transition="el-fade-in-linear"
  />
</template>

<style scoped></style>
