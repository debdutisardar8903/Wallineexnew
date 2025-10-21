'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { uploadImageToS3, formatFileSize } from '@/lib/s3-upload';

interface MultipleImageUploadProps {
  currentImages?: string[];
  currentImageKeys?: string[];
  onImagesUpload: (urls: string[], keys: string[]) => void;
  onImageRemove: (index: number) => void;
  label?: string;
  maxImages?: number;
  required?: boolean;
}

export default function MultipleImageUpload({
  currentImages = [],
  currentImageKeys = [],
  onImagesUpload,
  onImageRemove,
  label = "Product Images",
  maxImages = 5,
  required = false
}: MultipleImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const filesToUpload = Array.from(files).slice(0, maxImages - currentImages.length);
      
      if (filesToUpload.length === 0) {
        setError(`Maximum ${maxImages} images allowed`);
        setIsUploading(false);
        return;
      }

      const newUrls: string[] = [];
      const newKeys: string[] = [];

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload files sequentially
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const result = await uploadImageToS3(file);

        if (result.success && result.url) {
          newUrls.push(result.url);
          if (result.key) {
            newKeys.push(result.key);
          }
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Combine with existing images
      const allUrls = [...currentImages, ...newUrls];
      const allKeys = [...currentImageKeys, ...newKeys];
      
      onImagesUpload(allUrls, allKeys);
      
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);

    } catch (error) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleRemoveImage = (index: number) => {
    onImageRemove(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canAddMore = currentImages.length < maxImages;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
        <span className="text-xs text-gray-500 ml-2">
          ({currentImages.length}/{maxImages} images)
        </span>
      </label>

      {/* Current Images Grid */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentImages.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {index === 0 && (
                  <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />

          <div className="text-center">
            {isUploading ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Uploading images...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">{uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                    Click to upload
                  </span>{' '}
                  or drag and drop multiple images
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF, WebP up to 5MB each • Max {maxImages - currentImages.length} more images
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Add More Images Button */}
      {canAddMore && currentImages.length > 0 && !isUploading && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Add More Images ({maxImages - currentImages.length} remaining)
        </button>
      )}

      {/* Info Text */}
      <div className="text-xs text-gray-500">
        <p>• First image will be used as the primary product image</p>
        <p>• You can upload up to {maxImages} images per product</p>
        <p>• Drag images to reorder them (coming soon)</p>
      </div>
    </div>
  );
}
