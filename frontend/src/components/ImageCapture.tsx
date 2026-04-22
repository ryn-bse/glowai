import { useRef, useState, useCallback, type ChangeEvent } from 'react'
import apiClient from '../apiClient'

interface ImageCaptureProps {
  onAnalysisComplete: (result: unknown) => void
}

type Mode = 'idle' | 'webcam' | 'preview' | 'analyzing'

export default function ImageCapture({ onAnalysisComplete }: ImageCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [mode, setMode] = useState<Mode>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop())
    streamRef.current = null
  }, [])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null); stopStream()
    setPreviewUrl(URL.createObjectURL(file))
    setPreviewBlob(file)
    setMode('preview')
  }

  const startWebcam = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      setMode('webcam')
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      }, 50)
    } catch {
      setError('Camera permission denied. Please allow camera access and try again.')
    }
  }

  const captureFromWebcam = () => {
    if (!videoRef.current || !canvasRef.current) return
    const v = videoRef.current; const c = canvasRef.current
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d')?.drawImage(v, 0, 0)
    c.toBlob((blob: Blob | null) => {
      if (!blob) return
      stopStream()
      setPreviewUrl(URL.createObjectURL(blob))
      setPreviewBlob(blob)
      setMode('preview')
    }, 'image/jpeg', 0.92)
  }

  const reset = () => {
    stopStream(); setPreviewUrl(null); setPreviewBlob(null)
    setMode('idle'); setError(null); setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const submitImage = async () => {
    if (!previewBlob) return
    setMode('analyzing'); setError(null); setProgress(10)

    const formData = new FormData()
    formData.append('image', previewBlob, 'capture.jpg')

    // Simulate progress
    const timer = setInterval(() => setProgress(p => Math.min(p + 8, 85)), 400)

    try {
      const res = await apiClient.post('/analysis/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      clearInterval(timer); setProgress(100)
      setTimeout(() => { onAnalysisComplete(res.data); reset() }, 500)
    } catch (err: unknown) {
      clearInterval(timer); setProgress(0)
      const axiosErr = err as { response?: { data?: { error?: string; reason?: string } } }
      const data = axiosErr.response?.data
      const msgs: Record<string, string> = {
        file_too_large: 'Image is too large. Maximum size is 100 MB.',
        invalid_format: 'Invalid format. Please upload a JPEG, PNG, or WebP image.',
        resolution_too_low: 'Image resolution is too low. Minimum is 224×224 pixels.',
        no_face_detected: 'No face detected. Please upload a clear frontal photo.',
        multiple_faces_detected: 'Multiple faces detected. Please use a photo with only your face.',
        image_quality: `Image quality issue: ${data?.reason ?? 'blurred or low contrast'}. Try a clearer photo.`,
      }
      setError(msgs[data?.error ?? ''] ?? 'Something went wrong. Please try again.')
      setMode('preview')
    }
  }

  const TIPS = ['Face the camera directly', 'Use good lighting', 'Remove glasses if possible', 'Keep a neutral expression']

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="card">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>AI Skin Analysis</h2>
          <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Upload a selfie or use your webcam for an instant skin analysis</p>
        </div>

        <div className="card-body">
          {/* Tips */}
          {mode === 'idle' && (
            <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8 }}>📸 Tips for best results</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {TIPS.map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                    <span style={{ color: 'var(--success)' }}>✓</span> {t}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Idle state */}
          {mode === 'idle' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" style={{ padding: '20px', flexDirection: 'column', gap: 8, height: 'auto' }}>
                <span style={{ fontSize: 32 }}>📁</span>
                <span style={{ fontWeight: 600 }}>Upload Photo</span>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 400 }}>JPEG, PNG, WebP · up to 100MB</span>
              </button>
              <button onClick={startWebcam} className="btn btn-secondary" style={{ padding: '20px', flexDirection: 'column', gap: 8, height: 'auto' }}>
                <span style={{ fontSize: 32 }}>📷</span>
                <span style={{ fontWeight: 600 }}>Use Webcam</span>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 400 }}>Take a live photo</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          )}

          {/* Webcam */}
          {mode === 'webcam' && (
            <div>
              <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#000', marginBottom: 16, position: 'relative' }}>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video ref={videoRef} style={{ width: '100%', display: 'block', maxHeight: 360, objectFit: 'cover' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(192,57,43,0.5)', borderRadius: 'var(--radius-lg)', pointerEvents: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={captureFromWebcam} className="btn btn-primary" style={{ flex: 2 }}>📸 Capture Photo</button>
                <button onClick={reset} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          {/* Preview */}
          {(mode === 'preview' || mode === 'analyzing') && previewUrl && (
            <div>
              <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 16, position: 'relative' }}>
                <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block' }} />
                {mode === 'analyzing' && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Analyzing your skin…</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>This may take a few seconds</p>
                  </div>
                )}
              </div>

              {mode === 'analyzing' && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>
                    <span>Processing image…</span><span>{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {mode === 'preview' && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={submitImage} className="btn btn-primary" style={{ flex: 2 }}>✨ Analyze My Skin</button>
                  <button onClick={reset} className="btn btn-secondary">Retake</button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ marginTop: 16 }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
