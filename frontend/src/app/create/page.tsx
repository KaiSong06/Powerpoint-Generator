"use client";

import Link from "next/link";
import StepWizard from "@/components/create/StepWizard";

export default function CreatePage() {
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
      <StepWizard />
    </div>
  );
}
