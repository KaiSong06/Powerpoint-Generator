"use client";

import type { Consultant } from "@/lib/types";
import type { WizardData } from "./StepWizard";

interface ClientInfoStepProps {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  consultants: Consultant[];
  touched: Record<string, boolean>;
  onBlur: (field: string) => void;
}

function getFieldError(
  field: string,
  data: WizardData,
  touched: Record<string, boolean>
): string | null {
  if (!touched[field]) return null;
  switch (field) {
    case "clientName":
      return data.clientName.trim() ? null : "Client name is required";
    case "officeAddress":
      return data.officeAddress.trim() ? null : "Office address is required";
    case "sqFt":
      if (!data.sqFt.trim()) return "Square footage is required";
      if (isNaN(Number(data.sqFt)) || Number(data.sqFt) <= 0)
        return "Enter a valid number";
      return null;
    case "consultantId":
      return data.consultantId ? null : "Please select a consultant";
    default:
      return null;
  }
}

export default function ClientInfoStep({
  data,
  updateData,
  consultants,
  touched,
  onBlur,
}: ClientInfoStepProps) {
  const err = (field: string) => getFieldError(field, data, touched);
  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red focus:border-transparent ${
      err(field) ? "border-red-400" : "border-gray-300"
    }`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
      <h2 className="text-lg font-bold text-envirotech-charcoal mb-4">
        Client Information
      </h2>

      {consultants.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4 text-sm">
          No consultants available. Please add consultants before creating a
          presentation.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="clientName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Client Name <span className="text-red-500">*</span>
          </label>
          <input
            id="clientName"
            type="text"
            value={data.clientName}
            onChange={(e) => updateData({ clientName: e.target.value })}
            onBlur={() => onBlur("clientName")}
            placeholder="Acme Corporation"
            aria-invalid={!!err("clientName")}
            aria-describedby={err("clientName") ? "clientName-error" : undefined}
            className={inputClass("clientName")}
          />
          {err("clientName") && (
            <p id="clientName-error" className="text-red-500 text-xs mt-1">
              {err("clientName")}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="officeAddress"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Office Address <span className="text-red-500">*</span>
          </label>
          <input
            id="officeAddress"
            type="text"
            value={data.officeAddress}
            onChange={(e) => updateData({ officeAddress: e.target.value })}
            onBlur={() => onBlur("officeAddress")}
            placeholder="123 Main Street, Suite 400, Dallas TX 75201"
            aria-invalid={!!err("officeAddress")}
            aria-describedby={
              err("officeAddress") ? "officeAddress-error" : undefined
            }
            className={inputClass("officeAddress")}
          />
          {err("officeAddress") && (
            <p id="officeAddress-error" className="text-red-500 text-xs mt-1">
              {err("officeAddress")}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="suiteNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Suite Number
            </label>
            <input
              id="suiteNumber"
              type="text"
              value={data.suiteNumber}
              onChange={(e) => updateData({ suiteNumber: e.target.value })}
              placeholder="Suite 400"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="sqFt"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Square Footage <span className="text-red-500">*</span>
            </label>
            <input
              id="sqFt"
              type="number"
              value={data.sqFt}
              onChange={(e) => updateData({ sqFt: e.target.value })}
              onBlur={() => onBlur("sqFt")}
              placeholder="5000"
              min="1"
              aria-invalid={!!err("sqFt")}
              aria-describedby={err("sqFt") ? "sqFt-error" : undefined}
              className={inputClass("sqFt")}
            />
            {err("sqFt") && (
              <p id="sqFt-error" className="text-red-500 text-xs mt-1">
                {err("sqFt")}
              </p>
            )}
          </div>
        </div>
        <div>
          <label
            htmlFor="consultantId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Consultant <span className="text-red-500">*</span>
          </label>
          <select
            id="consultantId"
            value={data.consultantId ?? ""}
            onChange={(e) =>
              updateData({
                consultantId: e.target.value ? Number(e.target.value) : null,
              })
            }
            onBlur={() => onBlur("consultantId")}
            aria-invalid={!!err("consultantId")}
            aria-describedby={
              err("consultantId") ? "consultantId-error" : undefined
            }
            className={`${inputClass("consultantId")} bg-white`}
          >
            <option value="">Select a consultant...</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.email ? ` (${c.email})` : ""}
              </option>
            ))}
          </select>
          {err("consultantId") && (
            <p id="consultantId-error" className="text-red-500 text-xs mt-1">
              {err("consultantId")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
