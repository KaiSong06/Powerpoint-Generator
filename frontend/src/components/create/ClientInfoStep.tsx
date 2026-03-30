"use client";

import type { Consultant } from "@/lib/types";
import type { WizardData } from "./StepWizard";

interface ClientInfoStepProps {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  consultants: Consultant[];
}

export default function ClientInfoStep({
  data,
  updateData,
  consultants,
}: ClientInfoStepProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
      <h2 className="text-lg font-bold text-envirotech-charcoal mb-4">
        Client Information
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.clientName}
            onChange={(e) => updateData({ clientName: e.target.value })}
            placeholder="Acme Corporation"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Office Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.officeAddress}
            onChange={(e) => updateData({ officeAddress: e.target.value })}
            placeholder="123 Main Street, Suite 400, Dallas TX 75201"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Suite Number
            </label>
            <input
              type="text"
              value={data.suiteNumber}
              onChange={(e) => updateData({ suiteNumber: e.target.value })}
              placeholder="Suite 400"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Square Footage <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={data.sqFt}
              onChange={(e) => updateData({ sqFt: e.target.value })}
              placeholder="5000"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Consultant <span className="text-red-500">*</span>
          </label>
          <select
            value={data.consultantId ?? ""}
            onChange={(e) =>
              updateData({
                consultantId: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-envirotech-red focus:border-transparent"
          >
            <option value="">Select a consultant...</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.email ? ` (${c.email})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
