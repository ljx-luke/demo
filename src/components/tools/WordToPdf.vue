<template>
  <el-card class="word-to-pdf">
    <el-upload :auto-upload="false" :on-change="onFileChange" accept=".doc,.docx">
      <el-button type="primary">选择 Word 文件</el-button>
    </el-upload>

    <el-button type="success" class="mt-3" :disabled="!file || loading" @click="handleConvert">
      <span v-if="!loading">开始转换</span>
      <span v-else>正在转换...</span>
    </el-button>

    <div v-if="loading" class="mt-3">
      <el-progress :percentage="progress" :status="progressStatus" />
    </div>

    <!-- 添加下载区域 -->
    <div v-if="convertedBlob && convertedFileName" class="mt-3 preview-section">
      <el-divider />
      <h3>转换完成</h3>
      <p>文件名: {{ convertedFileName }}</p>
      <div class="preview-actions">
        <el-button type="primary" @click="previewDocument"> 预览文件 </el-button>
        <el-button type="success" @click="downloadDocument"> 下载文件 </el-button>
      </div>

      <!-- 新增预览区域 -->
      <el-dialog v-model="previewVisible" title="文档预览" class="preview-dialog" fullscreen>
        <div class="preview-container">
          <div v-show="previewMode === 'loading'" class="preview-loading">
            <el-spin size="large">文档加载中...</el-spin>
          </div>

          <div v-show="previewMode === 'info'" class="preview-info">
            <el-alert
              title="预览说明"
              type="info"
              description="PDF文件已生成，正在准备预览..."
              show-icon
              closable
            />
          </div>

          <div v-show="previewMode === 'local'" class="preview-local" ref="localPreviewContainer">
            <!-- 本地预览内容将渲染到这里 -->
          </div>
        </div>
      </el-dialog>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { saveAs } from 'file-saver'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url'

// 设置PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const file = ref<File | null>(null)
const loading = ref(false)
const progress = ref(0)
const progressStatus = ref<'success' | 'exception' | undefined>(undefined)

// 新增用于预览和下载的响应式变量
const convertedBlob = ref<Blob | null>(null)
const convertedFileName = ref<string>('')
const previewVisible = ref(false)
const previewMode = ref<'info' | 'loading' | 'local'>('info')
// 添加本地预览容器的引用
const localPreviewContainer = ref<HTMLDivElement | null>(null)

const onFileChange = (uploadFile: UploadFile) => {
  file.value = uploadFile.raw || null
  progress.value = 0
  progressStatus.value = undefined
  // 清除之前的转换结果
  convertedBlob.value = null
  convertedFileName.value = ''
  previewVisible.value = false
  previewMode.value = 'info'
}

const handleConvert = async () => {
  if (!file.value) return ElMessage.warning('请先选择文件')
  loading.value = true
  progress.value = 0
  progressStatus.value = undefined

  try {
    await convertToPdf(file.value)
    progress.value = 100
    progressStatus.value = 'success'
  } catch (err) {
    console.error(err)
    progressStatus.value = 'exception'
    ElMessage.error('转换失败')
  } finally {
    loading.value = false
  }
}

const convertToPdf = async (wordFile: File) => {
  const apiSecret = import.meta.env.VITE_CONVERT_API_SECRET

  if (!apiSecret) {
    ElMessage.error('未配置 ConvertAPI 密钥')
    return
  }
  
  const formData = new FormData()
  formData.append('file', wordFile)

  progress.value = 10

  const res = await axios.post(
    `https://v2.convertapi.com/convert/docx/to/pdf?Secret=${apiSecret}`,
    formData,
    {
      responseType: 'json',
      onUploadProgress: (e) => {
        if (e.total) {
          progress.value = Math.min(90, Math.floor((e.loaded / e.total) * 100))
        }
      },
    },
  )

  // 解析API响应并提取文件数据
  const responseData = res.data
  if (!responseData || !responseData.Files || !responseData.Files[0]) {
    throw new Error('API响应格式不正确')
  }

  const fileData = responseData.Files[0]
  const base64Data = fileData.FileData

  // 将base64数据转换为Blob
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], {
    type: 'application/pdf',
  })

  convertedBlob.value = blob
  convertedFileName.value = wordFile.name.replace(/\.(docx?)$/, '.pdf')
  ElMessage.success('转换完成')
}

// 本地预览
const previewLocal = () => {
  if (!convertedBlob.value) {
    ElMessage.error('没有可预览的文件内容')
    return
  }

  previewMode.value = 'loading'

  // 使用setTimeout确保DOM更新后再访问ref
  setTimeout(() => {
    // 检查容器是否存在
    if (!localPreviewContainer.value) {
      // 如果容器不存在，尝试再次查找
      const container = document.querySelector('.preview-local')
      if (!container) {
        ElMessage.error('预览容器未找到')
        previewMode.value = 'info'
        return
      }
      // 手动设置ref
      localPreviewContainer.value = container as HTMLDivElement
    }

    // 清空容器
    localPreviewContainer.value.innerHTML = ''

    // 将Blob转换为URL
    const url = URL.createObjectURL(convertedBlob.value)

    // 使用PDF.js渲染PDF
    pdfjsLib.getDocument(url).promise
      .then(pdf => {
        // 渲染第一页作为示例
        return pdf.getPage(1).then(page => {
          const scale = 1.5
          const viewport = page.getViewport({ scale })

          // 创建canvas元素
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.height = viewport.height
          canvas.width = viewport.width

          // 渲染页面
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          }
          
          return page.render(renderContext).promise.then(() => {
            // 将canvas添加到预览容器
            localPreviewContainer.value?.appendChild(canvas)
            previewMode.value = 'local'
            
            // 释放URL对象
            URL.revokeObjectURL(url)
          })
        })
      })
      .catch(error => {
        console.error('本地预览失败:', error)
        previewMode.value = 'info'
        ElMessage.error('本地预览失败: ' + (error.message || '未知错误'))
        // 释放URL对象
        URL.revokeObjectURL(url)
      })
  }, 200)
}

// 新增下载功能
const downloadDocument = () => {
  if (!convertedBlob.value || !convertedFileName.value) {
    ElMessage.warning('请先转换文件')
    return
  }

  saveAs(convertedBlob.value, convertedFileName.value)
}

// 新增预览功能
const previewDocument = () => {
  if (!convertedBlob.value || !convertedFileName.value) {
    ElMessage.warning('请先转换文件')
    return
  }

  // 显示预览弹窗
  previewVisible.value = true
  previewMode.value = 'info'

  // 确保在DOM更新后重置本地预览容器并触发预览
  setTimeout(() => {
    if (localPreviewContainer.value) {
      localPreviewContainer.value.innerHTML = ''
    }
    // 延迟触发本地预览，确保弹窗完全渲染
    setTimeout(() => {
      previewLocal()
    }, 100)
  }, 100)
}
</script>

<style scoped>
.word-to-pdf {
  max-width: 500px;
  margin: auto;
}
.mt-3 {
  margin-top: 1rem;
}
.preview-section {
  text-align: center;
}
.preview-actions {
  margin-top: 1rem;
}
.preview-actions .el-button {
  margin: 0 0.5rem;
}
.preview-dialog {
  height: 80%;
}
.preview-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.preview-loading,
.preview-info,
.preview-error {
  text-align: center;
  padding: 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.preview-error-content {
  margin-top: 1rem;
}
.preview-buttons {
  margin-top: 1rem;
}
.preview-buttons .el-button {
  margin: 0 0.5rem;
}
/* 添加本地预览样式 */
.preview-local {
  width: 100%;
  height: 100%;
  min-height: 400px;
  overflow: auto;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}
.preview-local canvas {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  margin: 20px auto;
  padding: 10px;
  max-width: 100%;
}
</style>