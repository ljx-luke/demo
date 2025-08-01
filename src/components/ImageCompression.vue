<template>
  <el-drawer title="图片压缩" v-model="show" size="50%" direction="rtl" @close="handleClose">
    <div class="main-container">
      <div class="upload-section">
        <h2 class="section-title">上传图片</h2>

        <div
          class="upload-card"
          @click="openFilePicker"
          @dragover.prevent="handleDragOver"
          @drop.prevent="handleDrop"
        >
          <i class="fas fa-cloud-upload-alt upload-icon"></i>
          <p class="upload-text">点击或拖拽图片到此处上传</p>
          <p class="upload-hint">支持 JPG, PNG, GIF, WEBP 格式</p>
          <input
            type="file"
            class="file-input"
            accept="image/*"
            @change="handleFileChange"
            ref="fileInput"
          />
        </div>

        <div class="controls-card">
          <div class="control-group">
            <label class="control-label">压缩质量: {{ quality }}%</label>
            <el-slider v-model="quality" :min="10" :max="100" :step="5" show-stops></el-slider>
            <div class="quality-display">
              <span>低质量</span>
              <span class="quality-value">{{ quality }}%</span>
              <span>高质量</span>
            </div>
          </div>

          <div class="control-group">
            <label class="control-label">输出格式</label>
            <el-radio-group v-model="outputFormat">
              <el-radio label="image/jpeg">JPEG</el-radio>
              <el-radio label="image/png">PNG</el-radio>
              <el-radio label="image/webp">WEBP</el-radio>
            </el-radio-group>
          </div>

          <div class="control-group">
            <label class="control-label">调整尺寸</label>
            <el-checkbox v-model="resizeEnabled">启用尺寸调整</el-checkbox>

            <div v-if="resizeEnabled" style="margin-top: 15px">
              <div style="display: flex; gap: 15px; margin-bottom: 10px">
                <el-input
                  v-model="resizeWidth"
                  placeholder="宽度"
                  type="number"
                  min="100"
                  :max="originalWidth"
                >
                  <template #append>px</template>
                </el-input>
                <el-input
                  v-model="resizeHeight"
                  placeholder="高度"
                  type="number"
                  min="100"
                  :max="originalHeight"
                >
                  <template #append>px</template>
                </el-input>
              </div>
              <el-checkbox v-model="maintainAspectRatio">保持宽高比</el-checkbox>
            </div>
          </div>

          <div class="compression-info" v-if="originalImage">
            <span>原始大小: {{ formatFileSize(originalSize) }}</span>
            <i class="fas fa-arrow-right"></i>
            <span class="success-text">压缩后: {{ formatFileSize(compressedSize) }}</span>
            <span class="success-text">(节省 {{ compressionRatio }}%)</span>
          </div>
        </div>
      </div>

      <div class="preview-section">
        <h2 class="section-title">预览结果</h2>

        <div class="preview-tabs">
          <div
            class="preview-tab"
            :class="{ active: activeTab === 'original' }"
            @click="activeTab = 'original'"
          >
            原始图片
          </div>
          <div
            class="preview-tab"
            :class="{ active: activeTab === 'compressed' }"
            @click="activeTab = 'compressed'"
          >
            压缩结果
          </div>
        </div>

        <div class="preview-container">
          <div class="image-preview">
            <img
              v-if="activeTab === 'original' && originalImage"
              :src="originalImage"
              alt="原始图片"
            />
            <img
              v-else-if="activeTab === 'compressed' && previewImage"
              :src="previewImage"
              alt="压缩图片"
            />
            <div v-else class="preview-placeholder">
              <i class="fas fa-image"></i>
              <p>请上传图片查看预览</p>
            </div>

            <div class="dimension-info" v-if="activeTab === 'original' && originalImage">
              {{ originalWidth }} × {{ originalHeight }} px
            </div>
            <div class="dimension-info" v-else-if="activeTab === 'compressed' && previewImage">
              {{ compressedWidth }} × {{ compressedHeight }} px
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">原始大小</div>
              <div class="stat-value">{{ formatFileSize(originalSize) }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">压缩后大小</div>
              <div class="stat-value">{{ formatFileSize(compressedSize) }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">节省空间</div>
              <div class="stat-value stat-highlight">{{ compressionRatio }}%</div>
            </div>
          </div>

          <div class="actions">
            <div class="action-btn reset-btn" @click="reset"><i class="fas fa-redo"></i> 重置</div>
            <div class="action-btn download-btn" @click="downloadImage" :disabled="!previewImage">
              <i class="fas fa-download"></i> 下载图片
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="app-footer">
      <p>Vue 3 + Element Plus 图片压缩工具 | 使用 Canvas API 实现无损压缩</p>
    </div>
  </el-drawer>
</template>
<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  dialogVisible: {
    type: Boolean,
    default: false,
  },
})
const show = computed(() => props.dialogVisible)

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}

const fileInput = ref(null)
const originalImage = ref(null)
const previewImage = ref(null)
const quality = ref(80)
const outputFormat = ref('image/jpeg')
const resizeEnabled = ref(false)
const resizeWidth = ref(null)
const resizeHeight = ref(null)
const maintainAspectRatio = ref(true)
const activeTab = ref('original')

// 图片尺寸信息
const originalWidth = ref(0)
const originalHeight = ref(0)
const compressedWidth = ref(0)
const compressedHeight = ref(0)

// 文件大小信息
const originalSize = ref(0)
const compressedSize = ref(0)
const compressionRatio = ref(0)

// 打开文件选择器
const openFilePicker = () => {
  fileInput.value.click()
}

// 处理文件选择
const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file && file.type.startsWith('image/')) {
    processImage(file)
  }
}

// 处理拖拽事件
const handleDragOver = (e) => {
  e.dataTransfer.dropEffect = 'copy'
}

const handleDrop = (e) => {
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processImage(file)
  }
}

// 处理图片
const processImage = (file) => {
  const reader = new FileReader()

  reader.onload = (e) => {
    originalImage.value = e.target.result
    originalSize.value = file.size

    // 获取原始图片尺寸
    const img = new Image()
    img.onload = () => {
      originalWidth.value = img.width
      originalHeight.value = img.height

      // 如果启用了尺寸调整且保持宽高比
      if (resizeEnabled.value && maintainAspectRatio.value) {
        // 自动计算高度
        if (resizeWidth.value && !resizeHeight.value) {
          resizeHeight.value = Math.round((resizeWidth.value / img.width) * img.height)
        }
        // 自动计算宽度
        else if (resizeHeight.value && !resizeWidth.value) {
          resizeWidth.value = Math.round((resizeHeight.value / img.height) * img.width)
        }
      }

      compressImage(img)
    }
    img.src = e.target.result
  }

  reader.readAsDataURL(file)
}

// 压缩图片
const compressImage = (img) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // 设置画布尺寸
  if (resizeEnabled.value && (resizeWidth.value || resizeHeight.value)) {
    const width = resizeWidth.value || Math.round((resizeHeight.value / img.height) * img.width)
    const height = resizeHeight.value || Math.round((resizeWidth.value / img.width) * img.height)

    canvas.width = width
    canvas.height = height
  } else {
    canvas.width = img.width
    canvas.height = img.height
  }

  // 绘制图片到画布
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  // 压缩图片
  previewImage.value = canvas.toDataURL(outputFormat.value, quality.value / 100)

  // 计算压缩后文件大小
  compressedSize.value = Math.floor(
    (previewImage.value.length - previewImage.value.indexOf(',') - 1) * 0.75,
  )

  // 计算压缩率
  compressionRatio.value = Math.round((1 - compressedSize.value / originalSize.value) * 100)

  // 记录压缩后尺寸
  compressedWidth.value = canvas.width
  compressedHeight.value = canvas.height
}

// 下载图片
const downloadImage = () => {
  if (!previewImage.value) return

  const link = document.createElement('a')
  link.href = previewImage.value

  // 生成文件名
  const timestamp = new Date().getTime()
  let extension = 'jpg'

  if (outputFormat.value === 'image/png') {
    extension = 'png'
  } else if (outputFormat.value === 'image/webp') {
    extension = 'webp'
  }

  link.download = `compressed-image-${timestamp}.${extension}`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 重置所有状态
const reset = () => {
  originalImage.value = null
  previewImage.value = null
  originalSize.value = 0
  compressedSize.value = 0
  compressionRatio.value = 0
  originalWidth.value = 0
  originalHeight.value = 0
  compressedWidth.value = 0
  compressedHeight.value = 0
  resizeWidth.value = null
  resizeHeight.value = null
  activeTab.value = 'original'

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 监听变化，重新压缩
watch([quality, outputFormat, resizeEnabled, resizeWidth, resizeHeight], () => {
  if (originalImage.value) {
    const img = new Image()
    img.onload = () => compressImage(img)
    img.src = originalImage.value
  }
})
</script>
<style scoped>
.upload-section {
  flex: 1;
  background: #f8fafc;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.preview-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #eaeef5;
  font-weight: 600;
}

.upload-card {
  border: 2px dashed #c0c4cc;
  border-radius: 8px;
  background: #fbfdff;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.upload-card:hover {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 15px;
}

.upload-text {
  color: #606266;
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.upload-hint {
  color: #909399;
  font-size: 0.9rem;
}

.file-input {
  display: none;
}

.controls-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-top: 25px;
}

.control-group {
  margin-bottom: 25px;
}

.control-label {
  display: block;
  margin-bottom: 12px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 1rem;
}

.quality-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.quality-value {
  font-weight: bold;
  color: #409eff;
  font-size: 1.1rem;
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
}

.image-preview {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8fafc;
  min-height: 300px;
  position: relative;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.preview-placeholder {
  color: #909399;
  text-align: center;
  padding: 20px;
}

.preview-placeholder i {
  font-size: 48px;
  margin-bottom: 15px;
  color: #c0c4cc;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: 15px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-weight: bold;
  font-size: 1.2rem;
  color: #2c3e50;
}

.stat-highlight {
  color: #67c23a;
}

.actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.action-btn {
  flex: 1;
  height: 48px;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-btn {
  background: #f0f2f5;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.reset-btn:hover {
  background: #e4e7ed;
  transform: translateY(-2px);
}

.download-btn {
  background: linear-gradient(90deg, #409eff, #337ecc);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.download-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.app-footer {
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  color: #909399;
  font-size: 0.9rem;
  border-top: 1px solid #eaeef5;
}

.compression-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
  color: #2c3e50;
  font-weight: 500;
}

.success-text {
  color: #67c23a;
  font-weight: 600;
}

.preview-tabs {
  display: flex;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 15px;
}

.preview-tab {
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 500;
  color: #606266;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.preview-tab.active {
  color: #409eff;
  border-bottom: 2px solid #409eff;
}

.dimension-info {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}
</style>
