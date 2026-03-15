'use client';

import { memo, useRef, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Video, Upload, X, CheckCircle, Clock } from 'lucide-react';
import type { UploadVideoNode as UploadVideoNodeType } from '@/types';
import { NodeWrapper } from './NodeWrapper';
import { useWorkflowStore } from '@/lib/store/workflowStore';

type Props = NodeProps<UploadVideoNodeType>;
const ALLOWED_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

function UploadVideoNodeComponent({ id, data, selected }: Props) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');

  const handleFileSelect = async (file: File) => {
    /* ---------------- VALIDATION ---------------- */

    if (!ALLOWED_TYPES.includes(file.type)) {
      updateNodeData(id, {
        status: 'failed',
        error: 'Invalid video format (MP4, MOV, WEBM, M4V only)',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      updateNodeData(id, {
        status: 'failed',
        error: 'File too large (max 500MB)',
      });
      return;
    }

    /* ---------------- LOCAL PREVIEW ---------------- */

    const localUrl = URL.createObjectURL(file);

    updateNodeData(id, {
      videoUrl: localUrl,
      isUploading: true,
      status: 'running',
      error: undefined,
    });

    setProgress(15);
    setProgressMsg('Uploading to Transloadit…');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      });

      setProgress(60);
      setProgressMsg('Encoding video…');

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error ?? 'Upload failed');
      }

      const result = await response.json();

      setProgress(100);
      setProgressMsg('Done!');

      if (localUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localUrl);
      }

      updateNodeData(id, {
        videoUrl: result.url,
        isUploading: false,
        status: 'success',
        error: undefined,
      });

    } catch (error) {
      if (localUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localUrl);
      }

      updateNodeData(id, {
        videoUrl: null,
        isUploading: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setTimeout(() => {
        setProgress(0);
        setProgressMsg('');
      }, 1200);
    }
  };

  /* ---------------- DRAG EVENTS ---------------- */

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  /* ---------------- CLEAR VIDEO ---------------- */

  const clearVideo = () => {
    updateNodeData(id, {
      videoUrl: null,
      status: 'idle',
      error: undefined,
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <NodeWrapper
      title="Upload Video"
      icon={<Video size={16} />}
      status={data.status}
      error={data.error}
      showSourceHandle
      showTargetHandles={false}
      sourceHandleType="video_url"
      selected={selected}
    >
      {data.videoUrl ? (
        <div className="space-y-1.5">
          <div className="relative">
            <video
              src={data.videoUrl}
              className="w-full h-32 object-cover rounded"
              controls
              playsInline
            />

            <button
              onClick={clearVideo}
              className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
            >
              <X size={12} />
            </button>

            {data.status === 'success' && (
              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
                <CheckCircle size={10} className="text-green-400" />
                <span className="text-[10px] text-green-400">Uploaded</span>
              </div>
            )}
          </div>

          {data.isUploading && progress > 0 && (
            <div className="space-y-1">
              <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-400">{progressMsg}</p>
                <p className="text-[10px] text-gray-500">{progress}%</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded cursor-pointer transition-colors duration-200 ${
            isDragging
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          {data.isUploading ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />

              <p className="text-[11px] text-gray-400">
                {progressMsg || 'Uploading…'}
              </p>

              {progress > 0 && (
                <>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Clock size={10} />
                    <span>Videos may take a moment to encode</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Upload size={24} className="text-gray-400" />
              <span className="text-xs text-gray-400 text-center">
                Click or drag video
              </span>
              <span className="text-[10px] text-gray-500">
                MP4, MOV, WEBM, M4V · max 500MB
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
        onChange={(e) =>
          e.target.files?.[0] && handleFileSelect(e.target.files[0])
        }
        className="hidden"
      />
    </NodeWrapper>
  );
}

export const UploadVideoNode = memo(UploadVideoNodeComponent);