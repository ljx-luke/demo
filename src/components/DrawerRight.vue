<template>
  <el-drawer :title="title" v-model="show" size="50%" direction="rtl" @close="handleClose">
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
        case 'SortableBoard':
          return '拖拽列表'
        default:
          return ''
      }
    })
    const handleClose = () => {
      emit('close')
    }

    const componentList = [
      {
        component: defineAsyncComponent(() => import('./custom/SortableBoard.vue')),
        name: 'SortableBoard',
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
