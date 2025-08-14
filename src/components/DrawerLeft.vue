<template>
  <el-drawer :title="title" v-model="show" size="50%" direction="ltr" @close="handleClose">
    <template v-for="item in componentList" :key="item.name">
      <component :is="item.component" v-if="item.name === type"></component>
    </template>
  </el-drawer>
</template>

<script lang="ts">
import { computed, defineComponent, defineAsyncComponent } from 'vue'

export default defineComponent({
  name: 'AppDrawer',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: '',
    },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const show = computed(() => props.visible)
    const title = computed(() => {
      switch (props.type) {
        case 'ImageCompression':
          return '图片压缩'
        case 'qRCode':
          return '二维码生成'
        case 'PdfToWord':
          return 'PDF转Word'
        case 'WordToPdf':
          return 'Word转PDF'
        default:
          return ''
      }
    })
    const handleClose = () => {
      emit('close')
    }

    const componentList = [
      {
        component: defineAsyncComponent(() => import('./tools/ImageCompression.vue')),
        name: 'ImageCompression',
      },
      {
        component: defineAsyncComponent(() => import('./tools/QrCodePrd.vue')),
        name: 'qRCode',
      },
      {
        component: defineAsyncComponent(() => import('./tools/PdfToWord.vue')),
        name: 'PdfToWord',
      },
      {
        component: defineAsyncComponent(() => import('./tools/WordToPdf.vue')),
        name: 'WordToPdf',
      },
    ]

    return {
      show,
      title,
      handleClose,
      componentList,
    }
  },
})
</script>

<style></style>