"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { generateFromBrief } from "@/lib/api";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const PROGRESS_MESSAGES = [
  "Analyzing your brief...",
  "Identifying space types...",
  "Matching products to spaces...",
  "Building slides...",
  "Almost there...",
];

const PLACEHOLDER_BRIEF = `Example:
20 open workstations
4 private offices
1 executive office
2 conference rooms (12 person)
3 huddle rooms (4 person)
1 reception area
1 break room
2 phone booths`;

export default function BriefGenerateForm() {
  const router = useRouter();

  // Form state
  const [brief, setBrief] = useState("");
  const [clientName, setClientName] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [suiteNumber, setSuiteNumber] = useState("");
  const [sqFt, setSqFt] = useState("");
  const [budget, setBudget] = useState("");
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const [floorPlanPreview, setFloorPlanPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [progressIdx, setProgressIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Progress message rotation
  useEffect(() => {
    if (isGenerating) {
      setProgressIdx(0);
      intervalRef.current = setInterval(() => {
        setProgressIdx((prev) =>
          prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev
        );
      }, 4000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isGenerating]);

  const validateAndSetFile = useCallback(
    (file: File) => {
      setFileError(null);
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setFileError("Invalid file type. Please upload a PNG, JPG, or PDF file.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setFileError(`File is too large. Maximum size is ${MAX_SIZE_MB}MB.`);
        return;
      }
      if (floorPlanPreview) URL.revokeObjectURL(floorPlanPreview);
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      setFloorPlanFile(file);
      setFloorPlanPreview(preview);
    },
    [floorPlanPreview]
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
    if (floorPlanPreview) URL.revokeObjectURL(floorPlanPreview);
    setFloorPlanFile(null);
    setFloorPlanPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  function validate(): string[] {
    const errors: string[] = [];
    if (!brief.trim() || brief.trim().length < 10)
      errors.push("Please describe your space breakdown (at least 10 characters)");
    if (!clientName.trim()) errors.push("Client name is required");
    if (!officeAddress.trim()) errors.push("Office address is required");
    if (!sqFt.trim() || isNaN(Number(sqFt)) || Number(sqFt) <= 0)
      errors.push("Valid square footage is required");
    return errors;
  }

  async function handleGenerate() {
    const errors = validate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    setValidationErrors([]);
    setError(null);
    setIsGenerating(true);

    try {
      const result = await generateFromBrief({
        brief: brief.trim(),
        client_name: clientName.trim(),
        office_address: officeAddress.trim(),
        suite_number: suiteNumber.trim() || undefined,
        sq_ft: Number(sqFt),
        budget: budget.trim() ? Number(budget) : undefined,
        floor_plan: floorPlanFile,
      });
      router.push(`/presentations/${result.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      setError(message);
      setIsGenerating(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red focus:border-transparent ${
      hasError ? "border-red-400" : "border-gray-300"
    }`;

  return (
    <>
      {/* Full-screen generation overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-12 h-12 border-4 border-envirotech-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-bold text-envirotech-charcoal mb-1">
              Generating Presentation
            </p>
            <p className="text-sm text-gray-500">
              {PROGRESS_MESSAGES[progressIdx]}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4 max-w-3xl">
        {validationErrors.length > 0 && (
          <div
            ref={errorRef}
            role="alert"
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm"
          >
            <ul className="list-disc list-inside">
              {validationErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm"
          >
            <p>{error}</p>
            <button
              onClick={handleGenerate}
              className="mt-2 text-red-800 font-medium underline text-xs"
            >
              Try again
            </button>
          </div>
        )}

        {/* Brief text area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-envirotech-charcoal mb-1">
            Space Breakdown
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Describe the rooms and quantities in plain English. The AI will
            parse your brief and automatically select the right products.
          </p>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder={PLACEHOLDER_BRIEF}
            rows={8}
            className={`${inputClass(
              validationErrors.some((e) => e.includes("space breakdown"))
            )} resize-y font-mono text-sm`}
          />
        </div>

        {/* Client info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-envirotech-charcoal mb-4">
            Client Information
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="brief-clientName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                id="brief-clientName"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Acme Corporation"
                className={inputClass(
                  validationErrors.some((e) => e.includes("Client name"))
                )}
              />
            </div>
            <div>
              <label
                htmlFor="brief-officeAddress"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Office Address <span className="text-red-500">*</span>
              </label>
              <input
                id="brief-officeAddress"
                type="text"
                value={officeAddress}
                onChange={(e) => setOfficeAddress(e.target.value)}
                placeholder="123 Main Street, Suite 400, Dallas TX 75201"
                className={inputClass(
                  validationErrors.some((e) => e.includes("Office address"))
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="brief-suiteNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Suite Number
                </label>
                <input
                  id="brief-suiteNumber"
                  type="text"
                  value={suiteNumber}
                  onChange={(e) => setSuiteNumber(e.target.value)}
                  placeholder="Suite 400"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="brief-sqFt"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Square Footage <span className="text-red-500">*</span>
                </label>
                <input
                  id="brief-sqFt"
                  type="number"
                  value={sqFt}
                  onChange={(e) => setSqFt(e.target.value)}
                  placeholder="5000"
                  min="1"
                  className={inputClass(
                    validationErrors.some((e) => e.includes("square footage"))
                  )}
                />
              </div>
              <div>
                <label
                  htmlFor="brief-budget"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Budget
                </label>
                <input
                  id="brief-budget"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="50000"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Floor plan upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-envirotech-charcoal mb-2">
            Floor Plan
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload a floor plan image to include in the presentation. This step
            is optional.
          </p>

          {fileError && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm"
            >
              {fileError}
            </div>
          )}

          {floorPlanFile ? (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-4">
                {floorPlanPreview ? (
                  <img
                    src={floorPlanPreview}
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
                    {floorPlanFile.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(floorPlanFile.size / 1024 / 1024).toFixed(2)} MB
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
                aria-label="Upload floor plan"
                className="hidden"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-envirotech-red text-white px-8 py-3 rounded-md font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          Generate Presentation
        </button>
      </div>
    </>
  );
}
