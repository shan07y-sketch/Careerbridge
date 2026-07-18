import React, { useState, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  acceptedTypes?: string;
  description?: string;
  onUploadSuccess?: (fileName: string) => void;
  /**
   * When provided, the modal performs a real upload against this handler
   * instead of the local timeout-based simulation. Should reject on failure
   * so the modal can surface a real error state instead of always showing
   * "Upload Successful."
   */
  onUpload?: (file: File) => Promise<void>;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  title = 'Upload File',
  acceptedTypes = '.pdf,.doc,.docx',
  description = 'Upload your document. Supported formats: PDF, DOC, DOCX.',
  onUploadSuccess,
  onUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploaded(false);
    setUploadError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      if (onUpload) {
        await onUpload(selectedFile);
      } else {
        // Local-only demo path (no real backend endpoint wired for this modal usage).
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      setIsUploading(false);
      setUploaded(true);
      onUploadSuccess?.(selectedFile.name);
    } catch (err) {
      setIsUploading(false);
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploaded(false);
    setIsUploading(false);
    setUploadError(null);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <div className="space-y-6">
        <p className="text-sm text-on-surface-variant">{description}</p>

        {/* Drop Zone */}
        {!uploaded ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-primary bg-primary/5'
                : selectedFile
                ? 'border-primary/40 bg-primary/5'
                : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container-low'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            {selectedFile ? (
              <div className="space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-primary text-2xl">description</span>
                </div>
                <p className="font-bold text-primary text-sm">{selectedFile.name}</p>
                <p className="text-xs text-on-surface-variant">{formatFileSize(selectedFile.size)}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  className="text-xs text-error hover:underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-on-surface-variant text-2xl">cloud_upload</span>
                </div>
                <p className="font-bold text-sm text-on-surface">
                  Drag & drop or <span className="text-primary">browse files</span>
                </p>
                <p className="text-xs text-on-surface-variant">{acceptedTypes.split(',').join(', ')} accepted</p>
              </div>
            )}
          </div>
        ) : (
          <div className="border-2 border-primary rounded-xl p-8 text-center bg-primary/5">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-white text-2xl">check</span>
            </div>
            <p className="font-bold text-primary text-sm">Upload Successful!</p>
            <p className="text-xs text-on-surface-variant mt-1">{selectedFile?.name} has been uploaded.</p>
          </div>
        )}

        {uploadError && (
          <div className="flex items-start gap-2 bg-error/10 text-error rounded-lg p-3 text-sm">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{uploadError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
          >
            {uploaded ? 'Close' : 'Cancel'}
          </button>
          {!uploaded && (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile}
              isLoading={isUploading}
              leftIcon={<span className="material-symbols-outlined text-sm">upload</span>}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UploadModal;
