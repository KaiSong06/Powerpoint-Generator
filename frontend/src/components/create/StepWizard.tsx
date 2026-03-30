"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { getConsultants, getProducts, getCategories } from "@/lib/api";
import type { Product, Consultant } from "@/lib/types";
import ClientInfoStep from "./ClientInfoStep";
import ProductSelectStep from "./ProductSelectStep";
import FloorPlanUpload from "./FloorPlanUpload";
import ReviewStep from "./ReviewStep";
import { Skeleton } from "@/components/ui/Skeleton";

export interface SelectedProduct {
  product_code: string;
  quantity: number;
  product: Product;
}

export interface WizardData {
  clientName: string;
  officeAddress: string;
  suiteNumber: string;
  sqFt: string;
  consultantId: number | null;
  selectedProducts: SelectedProduct[];
  floorPlanFile: File | null;
  floorPlanPreview: string | null;
}

const STEPS = ["Client Info", "Products", "Floor Plan", "Review"];

export default function StepWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const stepContentRef = useRef<HTMLDivElement>(null);

  // Reference data
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [data, setData] = useState<WizardData>({
    clientName: "",
    officeAddress: "",
    suiteNumber: "",
    sqFt: "",
    consultantId: null,
    selectedProducts: [],
    floorPlanFile: null,
    floorPlanPreview: null,
  });

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);

    Promise.all([getConsultants(), getProducts(), getCategories()])
      .then(([c, p, cats]) => {
        if (cancelled) return;
        setConsultants(c);
        setProducts(p);
        setCategories(cats);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.message || "Failed to load data");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingData(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateData = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validateStep = (step: number): string[] => {
    const errors: string[] = [];
    switch (step) {
      case 0:
        if (!data.clientName.trim()) errors.push("Client name is required");
        if (!data.officeAddress.trim())
          errors.push("Office address is required");
        if (
          !data.sqFt.trim() ||
          isNaN(Number(data.sqFt)) ||
          Number(data.sqFt) <= 0
        )
          errors.push("Valid square footage is required");
        if (!data.consultantId) errors.push("Consultant is required");
        break;
      case 1:
        if (data.selectedProducts.length === 0)
          errors.push("At least one product must be selected");
        break;
    }
    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      setValidationErrors(errors);
      // Mark all required fields as touched on failed Next
      if (currentStep === 0) {
        setTouched({
          clientName: true,
          officeAddress: true,
          sqFt: true,
          consultantId: true,
        });
      }
      return;
    }
    setValidationErrors([]);
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setValidationErrors([]);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Focus management: scroll step content into view when step changes
  useEffect(() => {
    stepContentRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input/textarea/select is focused
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (isLoadingData) {
    return (
      <div>
        <div className="flex items-center mb-8 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Fragment key={i}>
              <div className="flex flex-col items-center">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-3 w-14 mt-1" />
              </div>
              {i < 3 && <Skeleton className="flex-1 h-0.5 mx-2" />}
            </Fragment>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
        <p>Failed to load data: {loadError}</p>
        <button
          onClick={() => {
            setIsLoadingData(true);
            setLoadError(null);
            Promise.all([getConsultants(), getProducts(), getCategories()])
              .then(([c, p, cats]) => {
                setConsultants(c);
                setProducts(p);
                setCategories(cats);
              })
              .catch((err) => setLoadError(err.message || "Failed to load data"))
              .finally(() => setIsLoadingData(false));
          }}
          className="mt-2 text-red-800 font-medium underline text-xs"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress indicator */}
      <nav aria-label="Wizard steps" className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <Fragment key={label}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < currentStep
                    ? "bg-green-500 text-white"
                    : i === currentStep
                    ? "bg-envirotech-red text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
                aria-current={i === currentStep ? "step" : undefined}
              >
                {i < currentStep ? "\u2713" : i + 1}
              </div>
              <span
                className={`text-xs mt-1 whitespace-nowrap hidden sm:block ${
                  i <= currentStep
                    ? "text-envirotech-charcoal font-medium"
                    : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  i < currentStep ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </Fragment>
        ))}
      </nav>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm"
        >
          <ul className="list-disc list-inside">
            {validationErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step content */}
      <div ref={stepContentRef}>
        {currentStep === 0 && (
          <ClientInfoStep
            data={data}
            updateData={updateData}
            consultants={consultants}
            touched={touched}
            onBlur={handleBlur}
          />
        )}
        {currentStep === 1 && (
          <ProductSelectStep
            data={data}
            updateData={updateData}
            products={products}
            categories={categories}
          />
        )}
        {currentStep === 2 && (
          <FloorPlanUpload data={data} updateData={updateData} />
        )}
        {currentStep === 3 && (
          <ReviewStep data={data} consultants={consultants} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-6 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        {currentStep < STEPS.length - 1 && (
          <button
            onClick={handleNext}
            className="bg-envirotech-red text-white px-6 py-2 rounded-md font-medium hover:bg-red-700 transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
