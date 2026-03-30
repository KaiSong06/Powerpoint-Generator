"use client";

import { useRef, useState, useCallback } from "react";
import type { WizardData } from "./StepWizard";

interface FloorPlanUploadProps {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
}

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function FloorPlanUpload({
  data,
  updateData,
}: FloorPlanUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSetFile = useCallback(
    (file: File) => {
      setError(null);
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Invalid file type. Please upload a PNG, JPG, or PDF file.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`File is too large. Maximum size is ${MAX_SIZE_MB}MB.`);
        return;
      }

      if (data.floorPlanPreview) {
        URL.revokeObjectURL(data.floorPlanPreview);
      }

      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null;

      updateData({ floorPlanFile: file, floorPlanPreview: preview });
    },
    [data.floorPlanPreview, updateData]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSetFile(file);
    },
    [validateAndSetFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSetFile(file);
    },
    [validateAndSetFile]
  );

  const removeFile = () => {
    if (data.floorPlanPreview) {
      URL.revokeObjectURL(data.floorPlanPreview);
    }
    updateData({ floorPlanFile: null, floorPlanPreview: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
      <h2 className="text-lg font-bold text-envirotech-charcoal mb-2">
        Floor Plan
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Upload a floor plan image to include in the presentation. This step is
        optional.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {data.floorPlanFile ? (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-4">
            {data.floorPlanPreview ? (
              <img
                src={data.floorPlanPreview}
                alt="Floor plan preview"
                className="max-h-48 rounded border border-gray-100"
              />
            ) : (
              <div className="w-48 h-36 bg-gray-50 border border-gray-100 rounded flex items-center justify-center">
                <span className="text-gray-400 text-sm">PDF File</span>
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-sm text-envirotech-charcoal">
                {data.floorPlanFile.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(data.floorPlanFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={removeFile}
                className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-envirotech-red bg-red-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <svg
            className="mx-auto w-12 h-12 text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm font-medium text-gray-700">
            Drag and drop your floor plan here
          </p>
          <p className="text-xs text-gray-500 mt-1">or click to browse</p>
          <p className="text-xs text-gray-400 mt-3">
            PNG, JPG, or PDF up to {MAX_SIZE_MB}MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
