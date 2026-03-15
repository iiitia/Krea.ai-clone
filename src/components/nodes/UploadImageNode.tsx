'use client';

import { memo, useRef, useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { Image, Upload, X, CheckCircle } from 'lucide-react';
import type { UploadImageNodeData } from '@/types';
import { NodeWrapper } from './NodeWrapper';
import { useWorkflowStore } from '@/lib/store/workflowStore';

type Props = NodeProps & { data: UploadImageNodeData; selected: boolean };

function UploadImageNodeComponent({ id, data, selected }: Props) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const [isDragging,   setIsDragging]   = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [progressMsg,  setProgressMsg]  = useState('');

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      updateNodeData(id, { status: 'failed', error: 'File must be an image (JPG, PNG, WEBP, GIF)' } as Partial<UploadImageNodeData>);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      updateNodeData(id, { status: 'failed', error: 'File too large (max 20MB)' } as Partial<UploadImageNodeData>);
      return;
    }

    // Show local preview immediately while uploading
    const localUrl = URL.createObjectURL(file);
    updateNodeData(id, {
      imageUrl:    localUrl,
      isUploading: true,
      status:      'running',
      error:       undefined,
    } as Partial<UploadImageNodeData>);

    setProgress(10);
    setProgressMsg('Uploading to Transloadit…');

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress(30);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body:   formData,
      });

      setProgress(70);
      setProgressMsg('Processing image…');

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error ?? 'Upload failed');
      }

      const result = await response.json();

      setProgress(100);
      setProgressMsg('Done!');

      // Replace local blob URL with permanent Transloadit CDN URL
      URL.revokeObjectURL(localUrl);

      updateNodeData(id, {
        imageUrl:    result.url,
        isUploading: false,
        status:      'success',
        error:       undefined,
      } as Partial<UploadImageNodeData>);

    } catch (error) {
      URL.revokeObjectURL(localUrl);
      updateNodeData(id, {
        imageUrl:    null,
        isUploading: false,
        status:      'failed',
        error:       error instanceof Error ? error.message : 'Upload failed',
      } as Partial<UploadImageNodeData>);
    } finally {
      setTimeout(() => { setProgress(0); setProgressMsg(''); }, 1000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const clearImage = () => {
    updateNodeData(id, {
      imageUrl: null,
      status:   'idle',
      error:    undefined,
    } as Partial<UploadImageNodeData>);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <NodeWrapper
      title="Upload Image"
      icon={<Image size={15} />}
      status={data.status}
      error={data.error}
      showSourceHandle
      showTargetHandles={false}
     sourceHandleType="image_url"
      selected={selected}
    >
      {data.imageUrl ? (
        <div className="space-y-1.5">
          <div className="relative">
            <img
              src={data.imageUrl}
              alt="Uploaded"
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              onClick={clearImage}
              className="absolute top-1.5 right-1.5 p-1 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
            >
              <X size={11} />
            </button>
            {data.status === 'success' && (
              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
                <CheckCircle size={10} className="text-green-400" />
                <span className="text-[10px] text-green-400">Uploaded</span>
              </div>
            )}
          </div>

          {/* Progress bar during upload */}
          {data.isUploading && progress > 0 && (
            <div className="space-y-1">
              <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 text-center">{progressMsg}</p>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={[
            'flex flex-col items-center justify-center gap-2 p-5',
            'border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200',
            isDragging
              ? 'border-purple-500 bg-purple-500/10 scale-[1.02]'
              : 'border-gray-600 hover:border-purple-400 hover:bg-gray-800/50',
          ].join(' ')}
        >
          {data.isUploading ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[11px] text-gray-400">{progressMsg || 'Uploading…'}</p>
              {progress > 0 && (
                <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <Upload size={22} className="text-gray-400" />
              <span className="text-xs text-gray-400 text-center">
                Click or drag image here
              </span>
              <span className="text-[10px] text-gray-500">JPG, PNG, WEBP, GIF · max 20MB</span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        className="hidden"
      />
    </NodeWrapper>
  );
}

export const UploadImageNode = memo(UploadImageNodeComponent);