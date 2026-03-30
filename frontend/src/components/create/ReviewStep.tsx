"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generatePresentation } from "@/lib/api";
import { CATEGORY_LABELS, type ProductCategory, type Consultant } from "@/lib/types";
import type { WizardData } from "./StepWizard";

interface ReviewStepProps {
  data: WizardData;
  consultants: Consultant[];
}

export default function ReviewStep({ data, consultants }: ReviewStepProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedConsultant = consultants.find(
    (c) => c.id === data.consultantId
  );

  const totalCost = data.selectedProducts.reduce((sum, sp) => {
    const markup = sp.product.markup_percent || 0;
    const markedUp = sp.product.price * (1 + markup / 100);
    return sum + markedUp * sp.quantity;
  }, 0);

  const sqFt = Number(data.sqFt) || 1;
  const costPerSqFt = totalCost / sqFt;

  async function handleGenerate() {
    if (!data.consultantId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generatePresentation({
        client_name: data.clientName,
        office_address: data.officeAddress,
        suite_number: data.suiteNumber || undefined,
        sq_ft: sqFt,
        consultant_id: data.consultantId,
        products: data.selectedProducts.map((sp) => ({
          product_code: sp.product_code,
          quantity: sp.quantity,
        })),
        floor_plan: data.floorPlanFile,
      });
      router.push(`/presentations/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-envirotech-charcoal mb-3">
          Client Details
        </h2>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-gray-500">Client:</span>
          <span className="font-medium">{data.clientName}</span>
          <span className="text-gray-500">Address:</span>
          <span className="font-medium">{data.officeAddress}</span>
          {data.suiteNumber && (
            <>
              <span className="text-gray-500">Suite:</span>
              <span className="font-medium">{data.suiteNumber}</span>
            </>
          )}
          <span className="text-gray-500">Sq Ft:</span>
          <span className="font-medium">
            {sqFt.toLocaleString()}
          </span>
          <span className="text-gray-500">Consultant:</span>
          <span className="font-medium">
            {selectedConsultant?.name || "—"}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-envirotech-charcoal mb-3">
          Pricing Summary
        </h2>
        <div className="flex gap-8 mb-4">
          <div>
            <p className="text-xs text-envirotech-red font-bold uppercase">
              Project Cost
            </p>
            <p className="text-2xl font-bold">
              $
              {totalCost.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-envirotech-red font-bold uppercase">
              Cost Per Sq Ft
            </p>
            <p className="text-2xl font-bold">
              $
              {costPerSqFt.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-envirotech-red text-white">
              <th className="text-left px-3 py-2 rounded-tl">Product</th>
              <th className="text-center px-3 py-2">Qty</th>
              <th className="text-right px-3 py-2">Unit Price</th>
              <th className="text-right px-3 py-2 rounded-tr">Extended</th>
            </tr>
          </thead>
          <tbody>
            {data.selectedProducts.map((sp, i) => {
              const markup = sp.product.markup_percent || 0;
              const unitPrice = sp.product.price * (1 + markup / 100);
              const extended = unitPrice * sp.quantity;
              return (
                <tr
                  key={sp.product_code}
                  className={i % 2 === 1 ? "bg-gray-50" : ""}
                >
                  <td className="px-3 py-2">{sp.product.name}</td>
                  <td className="px-3 py-2 text-center">{sp.quantity}</td>
                  <td className="px-3 py-2 text-right">
                    ${unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    ${extended.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200">
              <td colSpan={3} className="px-3 py-2 font-bold text-right">
                Total
              </td>
              <td className="px-3 py-2 text-right font-bold">
                ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {data.floorPlanFile && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-envirotech-charcoal mb-3">
            Floor Plan
          </h2>
          {data.floorPlanPreview ? (
            <img
              src={data.floorPlanPreview}
              alt="Floor plan"
              className="max-h-48 rounded border border-gray-100"
            />
          ) : (
            <p className="text-sm text-gray-600">{data.floorPlanFile.name}</p>
          )}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full bg-envirotech-red text-white px-8 py-3 rounded-md font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating your presentation...
          </span>
        ) : (
          "Generate Presentation"
        )}
      </button>
    </div>
  );
}
