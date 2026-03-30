"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import {
  getConsultants,
  getProducts,
  getCategories,
} from "@/lib/api";
import type { Product, Consultant } from "@/lib/types";
import ClientInfoStep from "./ClientInfoStep";
import ProductSelectStep from "./ProductSelectStep";
import FloorPlanUpload from "./FloorPlanUpload";
import ReviewStep from "./ReviewStep";

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

  // Reference data
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

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
    getConsultants().then(setConsultants).catch(console.error);
    getProducts().then(setProducts).catch(console.error);
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const updateData = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
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
      return;
    }
    setValidationErrors([]);
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setValidationErrors([]);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex items-center mb-8">
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
              >
                {i < currentStep ? "\u2713" : i + 1}
              </div>
              <span
                className={`text-xs mt-1 whitespace-nowrap ${
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
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          <ul className="list-disc list-inside">
            {validationErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step content */}
      {currentStep === 0 && (
        <ClientInfoStep
          data={data}
          updateData={updateData}
          consultants={consultants}
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
        <ReviewStep
          data={data}
          consultants={consultants}
        />
      )}

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
