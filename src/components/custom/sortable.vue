<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
    <div class="max-w-6xl mx-auto">
      <h3 class="text-3xl font-bold text-gray-800 text-center mb-8">多列表拖拽看板</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- 待办事项列 -->
        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h4
            class="text-lg font-semibold text-gray-700 text-center mb-4 pb-2 border-b border-gray-200"
          >
            📝 待办事项
          </h4>
          <ul ref="todoList" class="space-y-3 min-h-[300px]" data-group="shared">
            <li
              v-for="item in todoItems"
              :key="item.id"
              class="bg-gray-50 border border-gray-200 rounded-lg p-3 cursor-move hover:shadow-md transition-all duration-200 hover:bg-gray-100"
            >
              <div class="flex items-center">
                <div class="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                <span class="text-gray-700">{{ item.text }}</span>
              </div>
            </li>
          </ul>
        </div>

        <!-- 进行中列 -->
        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h4
            class="text-lg font-semibold text-gray-700 text-center mb-4 pb-2 border-b border-gray-200"
          >
            🚀 进行中
          </h4>
          <ul ref="doingList" class="space-y-3 min-h-[300px]" data-group="shared">
            <li
              v-for="item in doingItems"
              :key="item.id"
              class="bg-orange-50 border border-orange-200 border-l-4 border-l-orange-400 rounded-lg p-3 cursor-move hover:shadow-md transition-all duration-200 hover:bg-orange-100"
            >
              <div class="flex items-center">
                <div class="w-3 h-3 bg-orange-400 rounded-full mr-3"></div>
                <span class="text-gray-700">{{ item.text }}</span>
              </div>
            </li>
          </ul>
        </div>

        <!-- 已完成列 -->
        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h4
            class="text-lg font-semibold text-gray-700 text-center mb-4 pb-2 border-b border-gray-200"
          >
            ✅ 已完成
          </h4>
          <ul ref="doneList" class="space-y-3 min-h-[300px]" data-group="shared">
            <li
              v-for="item in doneItems"
              :key="item.id"
              class="bg-green-50 border border-green-200 border-l-4 border-l-green-500 rounded-lg p-3 cursor-move hover:shadow-md transition-all duration-200 hover:bg-green-100 opacity-80"
            >
              <div class="flex items-center">
                <div class="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span class="text-gray-700 line-through">{{ item.text }}</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import Sortable from 'sortablejs'

const todoList = ref(null)
const doingList = ref(null)
const doneList = ref(null)

const todoItems = ref([
  { id: 1, text: '学习 Vue 3' },
  { id: 2, text: '完成项目文档' },
])

const doingItems = ref([{ id: 3, text: '开发新功能' }])

const doneItems = ref([
  { id: 4, text: '修复 Bug' },
  { id: 5, text: '代码审查' },
])

onMounted(() => {
  nextTick(() => {
    const sortableOptions = {
      group: 'shared',
      animation: 150,
      ghostClass: 'ghost',
      chosenClass: 'chosen',
      dragClass: 'drag',
      onEnd: (evt) => {
        const { from, to, oldIndex, newIndex } = evt

        // 获取对应的数据数组
        const fromList = getListByElement(from)
        const toList = getListByElement(to)

        if (fromList && toList) {
          const item = fromList.value.splice(oldIndex, 1)[0]
          toList.value.splice(newIndex, 0, item)
        }
      },
    }

    new Sortable(todoList.value, sortableOptions)
    new Sortable(doingList.value, sortableOptions)
    new Sortable(doneList.value, sortableOptions)
  })
})

function getListByElement(element) {
  if (element === todoList.value) return todoItems
  if (element === doingList.value) return doingItems
  if (element === doneList.value) return doneItems
  return null
}
</script>

<style scoped>
.ghost {
  opacity: 0.5;
  background-color: #dbeafe;
  border-color: #93c5fd;
  transform: rotate(2deg);
}

.chosen {
  transform: scale(1.02);
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  z-index: 10;
}

.drag {
  transform: rotate(3deg) scale(1.05);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  z-index: 20;
}
</style>
