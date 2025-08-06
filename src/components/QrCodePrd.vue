<template>
  <div class="qr-generator-container">
    <el-card class="qr-generator" shadow="hover">
      <div class="card-header">
        <h2 class="title">二维码生成器</h2>
        <div class="subtitle">快速生成并下载二维码</div>
      </div>

      <el-form @submit.prevent class="qr-form">
        <el-form-item label="二维码内容" class="form-item">
          <el-input v-model="text" placeholder="请输入文本或网址" class="custom-input" clearable>
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item class="actions">
          <el-button type="primary" @click="generateQRCode" class="generate-btn" :disabled="!text">
            <el-icon class="icon"><MagicStick /></el-icon>
            生成二维码
          </el-button>
          <el-button v-if="qrCodeUrl" @click="downloadQRCode" class="download-btn">
            <el-icon class="icon"><Download /></el-icon>
            下载二维码
          </el-button>
        </el-form-item>
      </el-form>

      <div v-if="qrCodeUrl" class="qr-preview">
        <div class="preview-card">
          <div class="preview-header">
            <span>二维码预览</span>
            <el-tag type="success" effect="dark" size="small">已生成</el-tag>
          </div>
          <div class="qr-image-container">
            <img :src="qrCodeUrl" alt="二维码" ref="qrImg" class="qr-image" />
            <div class="qr-overlay">
              <el-icon class="zoom-icon"><ZoomIn /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as QRCode from 'qrcode'
import { ElMessage } from 'element-plus'
import { Link, MagicStick, Download, ZoomIn } from '@element-plus/icons-vue'

// 输入内容
const text = ref<string>('')

// base64 二维码图片
const qrCodeUrl = ref<string>('')

// 引用图片 DOM 元素
const qrImg = ref<HTMLImageElement | null>(null)

// 生成二维码
const generateQRCode = async () => {
  if (!text.value) {
    ElMessage.warning('请输入内容')
    return
  }
  try {
    qrCodeUrl.value = await QRCode.toDataURL(text.value, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#1a2a6c',
        light: '#ffffff',
      },
    })
  } catch (error) {
    console.error('二维码生成失败', error)
    ElMessage.error('二维码生成失败')
  }
}

// 下载二维码
const downloadQRCode = () => {
  if (!qrCodeUrl.value) return
  const link = document.createElement('a')
  link.href = qrCodeUrl.value
  link.download = `qrcode-${new Date().getTime()}.png`
  link.click()
}
</script>

<style scoped lang="scss">
.qr-generator-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7f1 100%);
  padding: 20px;
  padding-top: 0;
}

.qr-generator {
  max-width: 500px;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border: none;

  .card-header {
    text-align: center;
    padding: 20px 0;
    background: linear-gradient(90deg, #3498db, #2c3e50);
    color: white;
    margin: -20px -20px 20px;

    .title {
      font-size: 1.8rem;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .subtitle {
      opacity: 0.9;
      font-size: 1rem;
    }
  }
}

.qr-form {
  padding: 0 20px;

  .form-item {
    margin-bottom: 25px;

    :deep(.el-form-item__label) {
      font-weight: 600;
      color: #2c3e50;
      padding-bottom: 8px;
      display: block;
    }
  }

  .custom-input {
    :deep(.el-input__inner) {
      height: 50px;
      border-radius: 12px;
      padding-left: 40px;
      font-size: 16px;
      border: 2px solid #dcdfe6;
      transition: all 0.3s;

      &:focus {
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
      }
    }

    :deep(.el-input__prefix) {
      display: flex;
      align-items: center;
      left: 12px;
      font-size: 18px;
      color: #7f8c8d;
    }
  }

  .actions {
    display: flex;
    justify-content: center;
    margin-top: 25px;

    .generate-btn,
    .download-btn {
      height: 45px;
      padding: 0 25px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s;
      display: flex;
      align-items: center;

      .icon {
        margin-right: 8px;
        font-size: 18px;
      }
    }

    .generate-btn {
      background: linear-gradient(90deg, #3498db, #2980b9);
      border: none;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
      }

      &:disabled {
        background: #bdc3c7;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
    }

    .download-btn {
      background: #ecf0f1;
      color: #2c3e50;
      border: none;

      &:hover {
        background: #d5dbdb;
      }
    }
  }
}

.qr-preview {
  margin-top: 30px;
  padding: 0 20px 20px;

  .preview-card {
    background: #f8fafc;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #eaeef5;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: #f1f5f9;
      border-bottom: 1px solid #eaeef5;
      font-weight: 600;
      color: #2c3e50;
    }

    .qr-image-container {
      padding: 25px;
      position: relative;
      display: flex;
      justify-content: center;

      .qr-image {
        width: 220px;
        height: 220px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s;
      }

      .qr-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(0, 0, 0, 0.3);
        opacity: 0;
        border-radius: 8px;
        transition: opacity 0.3s;

        .zoom-icon {
          color: white;
          font-size: 40px;
        }
      }

      &:hover {
        .qr-overlay {
          opacity: 1;
        }

        .qr-image {
          transform: scale(1.05);
        }
      }
    }
  }
}

@media (max-width: 600px) {
  .qr-generator {
    max-width: 100%;

    .card-header {
      padding: 15px 0;

      .title {
        font-size: 1.5rem;
      }
    }

    .qr-form {
      padding: 0 15px;

      .actions {
        flex-direction: column;
        gap: 12px;

        .generate-btn,
        .download-btn {
          width: 100%;
        }
      }
    }

    .qr-preview {
      .qr-image-container {
        padding: 15px;

        .qr-image {
          width: 180px;
          height: 180px;
        }
      }
    }
  }
}
</style>
