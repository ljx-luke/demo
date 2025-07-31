<script setup lang="ts">
import { ref } from 'vue'
import WelcomeItem from './WelcomeItem.vue'
import DocumentationIcon from './icons/IconDocumentation.vue'
import ImageCompression from './ImageCompression.vue'

const dialogVisible = ref(false)
</script>

<template>
  <WelcomeItem>
    <template #icon>
      <DocumentationIcon />
    </template>
    <template #heading>图片压缩</template>
    <el-link type="primary" @click="dialogVisible = true"
      >上传图片 · 调整质量 · 下载压缩结果</el-link
    >
  </WelcomeItem>

  <ImageCompression
    :dialogVisible="dialogVisible"
    @close="dialogVisible = false"
  ></ImageCompression>
</template>
