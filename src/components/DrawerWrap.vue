<template>
  <el-drawer :title="title" v-model="show" size="50%" direction="rtl" @close="handleClose">
    <template v-for="item in componentList" :key="item.name">
      <component :is="item.component" v-if="item.name === type"></component>
    </template>
  </el-drawer>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import ImageCompression from './ImageCompression.vue'
import qRCode from './QrCodePrd.vue'

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
        default:
          return ''
      }
    })
    const handleClose = () => {
      emit('close')
    }

    const componentList = [
      { component: ImageCompression, name: 'ImageCompression' },
      { component: qRCode, name: 'qRCode' },
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
