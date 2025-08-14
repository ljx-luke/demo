<template>
  <el-card class="pdf-to-word">
    <el-upload :auto-upload="false" :on-change="onFileChange" accept=".pdf">
      <el-button type="primary">选择 PDF 文件</el-button>
    </el-upload>

    <el-radio-group v-model="mode" class="mt-3">
      <el-radio label="image">模式1：图片保真版（转化为图片无法编辑）</el-radio>
      <el-radio label="api">模式2：API转化可编辑版</el-radio>
    </el-radio-group>

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
              description="文件转换完成，正在准备预览..."
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
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url'
import { Document, Packer, Paragraph, ImageRun, type ISectionOptions } from 'docx'
import { saveAs } from 'file-saver'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { renderAsync } from 'docx-preview'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const file = ref<File | null>(null)
const mode = ref<'image' | 'api'>('image')
const loading = ref(false)
const progress = ref(0)
const progressStatus = ref<'success' | 'exception' | undefined>(undefined)

// 新增用于预览和下载的响应式变量
const convertedBlob = ref<Blob | null>(null)
const convertedFileName = ref<string>('')
const previewVisible = ref(false)
const previewUrl = ref<string>('')
const previewMode = ref<'info' | 'loading' | 'online' | 'local'>('info')
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
  previewUrl.value = ''
  previewMode.value = 'info'
}

const handleConvert = async () => {
  if (!file.value) return ElMessage.warning('请先选择文件')
  loading.value = true
  progress.value = 0
  progressStatus.value = undefined

  try {
    if (mode.value === 'image') {
      await convertByImageParallel(file.value)
    } else {
      await convertByApi(file.value)
    }
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

// 模式1：并行渲染 PDF 页面（纯前端）
const convertByImageParallel = async (pdfFile: File) => {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const sections: ISectionOptions[] = []

  const totalPages = pdf.numPages
  if (totalPages > 30) {
    ElMessage.info(`PDF 页数为 ${totalPages}，转换时间可能较长，请耐心等待`)
  }

  let processed = 0

  // 分批渲染
  const renderPage = async (pageNum: number) => {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = viewport.width
    canvas.height = viewport.height

    // 修复：添加 canvas 参数
    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise

    const imageData = canvas.toDataURL('image/png')
    processed++
    progress.value = Math.floor((processed / totalPages) * 100)

    // 释放内存
    canvas.width = 0
    canvas.height = 0

    return { order: pageNum, imageData, width: viewport.width, height: viewport.height }
  }

  // 并行处理所有页
  const tasks: Promise<{ order: number; imageData: string; width: number; height: number }>[] = []
  for (let i = 1; i <= totalPages; i++) {
    tasks.push(renderPage(i))
  }

  const results = await Promise.all(tasks)

  // 按顺序插入 Word
  results
    .sort((a, b) => a.order - b.order)
    .forEach(({ imageData, width, height }) => {
      const image = new ImageRun({
        data: imageData,
        transformation: {
          width: 600,
          height: Math.round((height / width) * 600),
        },
        type: 'png',
      })

      const paragraph = new Paragraph({
        children: [image],
      })

      sections.push({
        children: [paragraph],
      })
    })

  const doc = new Document({
    sections: sections,
  })

  const blob = await Packer.toBlob(doc)
  convertedBlob.value = blob
  convertedFileName.value = pdfFile.name.replace('.pdf', '.docx')
  ElMessage.success('转换完成（图片版，优化版）')
}

// 模式2：调用免费 API
const convertByApi = async (pdfFile: File) => {
  const apiSecret = import.meta.env.VITE_CONVERT_API_SECRET

  if (!apiSecret) {
    ElMessage.error('未配置 ConvertAPI 密钥')
    return
  }
  const formData = new FormData()
  formData.append('file', pdfFile)

  progress.value = 10

  const res = await axios.post(
    `https://v2.convertapi.com/convert/pdf/to/docx?Secret=${apiSecret}`,
    formData,
    {
      responseType: 'json', // 改为json以正确解析响应
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
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })

  convertedBlob.value = blob
  convertedFileName.value = pdfFile.name.replace('.pdf', '.docx')
  ElMessage.success('转换完成（API版）')
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

    // 使用docx-preview渲染文档
    renderAsync(convertedBlob.value, localPreviewContainer.value, localPreviewContainer.value, {
      className: 'docx-preview', // 默认和文档样式类的类名/前缀
      inWrapper: true, // 启用围绕文档内容渲染包装器
      ignoreWidth: false, // 禁用页面渲染宽度
      ignoreHeight: false, // 禁用页面渲染高度
      ignoreFonts: false, // 禁用字体渲染
      breakPages: true, // 在分页符上启用分页
      ignoreLastRenderedPageBreak: true,
      experimental: false, // 启用实验性功能
      trimXmlDeclaration: true, // 如果为真，xml声明将在解析之前从xml文档中删除
    })
      .then(() => {
        previewMode.value = 'local'
      })
      .catch((error: Error) => {
        console.error('本地预览失败:', error)
        previewMode.value = 'info'
        ElMessage.error('本地预览失败: ' + (error.message || '未知错误'))
      })
  }, 200) // 增加延迟时间确保DOM完全加载
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
  previewUrl.value = ''

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
.pdf-to-word {
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
.preview-iframe {
  width: 100%;
  height: 100%;
  flex: 1;
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
}
.docx-preview {
  width: 100%;
  height: fit-content;
}
.docx-wrapper {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  margin: 20px auto;
  padding: 10px;
}
</style>
