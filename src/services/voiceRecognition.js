// 语音识别服务 - 使用 Web Speech API

// 检测浏览器是否支持语音识别
export const isSpeechRecognitionSupported = () => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

// 创建语音识别器实例
const createSpeechRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'zh-CN';
  return recognition;
};

// 语音识别类
export class VoiceRecognition {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResult = null;
    this.onEnd = null;
    this.onError = null;

    if (isSpeechRecognitionSupported()) {
      this.recognition = createSpeechRecognition();
      this.setupEventHandlers();
    }
  }

  setupEventHandlers() {
    if (!this.recognition) return;

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (this.onResult) {
        this.onResult(finalTranscript, interimTranscript);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) {
        this.onEnd();
      }
    };

    this.recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error);
      this.isListening = false;
      if (this.onError) {
        this.onError(event.error);
      }
    };
  }

  start(onResult, onEnd, onError) {
    if (!this.recognition) {
      if (onError) {
        onError('您的浏览器不支持语音识别功能');
      }
      return;
    }

    this.onResult = onResult;
    this.onEnd = onEnd;
    this.onError = onError;

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.error('启动语音识别失败:', e);
      this.isListening = false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

export default VoiceRecognition;
