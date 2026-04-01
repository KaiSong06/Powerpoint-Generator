"use client";

import { useState } from "react";
import Link from "next/link";
import StepWizard from "@/components/create/StepWizard";
import BriefGenerateForm from "@/components/create/BriefGenerateForm";

type Tab = "brief" | "manual";

export default function CreatePage() {
  const [activeTab, setActiveTab] = useState<Tab>("brief");

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/"
        className="text-envirotech-red font-medium hover:underline mb-6 inline-block"
      >
        &larr; Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-envirotech-charcoal mb-6">
        Create New Presentation
      </h1>

      {/* Tab toggle */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("brief")}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "brief"
              ? "border-envirotech-red text-envirotech-red"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Auto-generate from brief
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "manual"
              ? "border-envirotech-red text-envirotech-red"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Select products manually
        </button>
      </div>

      {activeTab === "brief" ? <BriefGenerateForm /> : <StepWizard />}
    </div>
  );
}
