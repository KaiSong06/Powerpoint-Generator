"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getConsultants,
  getProducts,
  getCategories,
  generatePresentation,
} from "@/lib/api";
import type { Product, Consultant, ProductCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

type Step = "client" | "products" | "floorplan" | "review";
const STEPS: { key: Step; label: string }[] = [
  { key: "client", label: "Client Info" },
  { key: "products", label: "Products" },
  { key: "floorplan", label: "Floor Plan" },
  { key: "review", label: "Review & Generate" },
];

interface SelectedProduct {
  product_code: string;
  quantity: number;
  product: Product;
}

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("client");

  // Data
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Form state
  const [clientName, setClientName] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [suiteNumber, setSuiteNumber] = useState("");
  const [sqFt, setSqFt] = useState("");
  const [consultantId, setConsultantId] = useState<number | null>(null);

  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const [floorPlanPreview, setFloorPlanPreview] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load reference data
  useEffect(() => {
    getConsultants().then(setConsultants).catch(console.error);
    getProducts().then(setProducts).catch(console.error);
    getCategories().then(setCategories).catch(console.error);
  }, []);

  // Filtered products for selection
  const filteredProducts = products.filter((p) => {
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.product_code.toLowerCase().includes(q) ||
        (p.specifications || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const isProductSelected = (code: string) =>
    selectedProducts.some((sp) => sp.product_code === code);

  function toggleProduct(product: Product) {
    if (isProductSelected(product.product_code)) {
      setSelectedProducts((prev) =>
        prev.filter((sp) => sp.product_code !== product.product_code)
      );
    } else {
      setSelectedProducts((prev) => [
        ...prev,
        { product_code: product.product_code, quantity: 1, product },
      ]);
    }
  }

  function updateQuantity(code: string, qty: number) {
    setSelectedProducts((prev) =>
      prev.map((sp) =>
        sp.product_code === code ? { ...sp, quantity: Math.max(1, qty) } : sp
      )
    );
  }

  function handleFloorPlan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Floor plan must be under 10MB");
        return;
      }
      setFloorPlanFile(file);
      setFloorPlanPreview(URL.createObjectURL(file));
    }
  }

  // Pricing computations
  const totalCost = selectedProducts.reduce((sum, sp) => {
    const markup = sp.product.markup_percent || 0;
    const markedUp = sp.product.price * (1 + markup / 100);
    return sum + markedUp * sp.quantity;
  }, 0);

  const costPerSqFt = sqFt && Number(sqFt) > 0 ? totalCost / Number(sqFt) : 0;

  const selectedConsultant = consultants.find((c) => c.id === consultantId);

  // Validation
  const clientValid =
    clientName.trim() !== "" &&
    officeAddress.trim() !== "" &&
    Number(sqFt) > 0 &&
    consultantId !== null;
  const productsValid = selectedProducts.length > 0;

  async function handleGenerate() {
    if (!clientValid || !productsValid || !consultantId) return;
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generatePresentation({
        client_name: clientName,
        office_address: officeAddress,
        suite_number: suiteNumber || undefined,
        sq_ft: Number(sqFt),
        consultant_id: consultantId,
        products: selectedProducts.map((sp) => ({
          product_code: sp.product_code,
          quantity: sp.quantity,
        })),
        floor_plan: floorPlanFile,
      });
      router.push(`/presentations/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setIsGenerating(false);
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <button
              onClick={() => setStep(s.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                step === s.key
                  ? "bg-envirotech-red text-white"
                  : i < stepIndex
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                {i < stepIndex ? "\u2713" : i + 1}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-gray-300 mx-1" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {/* ── STEP 1: Client Info ──────────────────────────────────────────── */}
      {step === "client" && (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-envirotech-charcoal mb-4">
            Client Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Acme Corporation"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Office Address *
              </label>
              <input
                type="text"
                value={officeAddress}
                onChange={(e) => setOfficeAddress(e.target.value)}
                placeholder="123 Main Street, Suite 400, Dallas TX 75201"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Suite Number
                </label>
                <input
                  type="text"
                  value={suiteNumber}
                  onChange={(e) => setSuiteNumber(e.target.value)}
                  placeholder="Suite 400"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Square Footage *
                </label>
                <input
                  type="number"
                  value={sqFt}
                  onChange={(e) => setSqFt(e.target.value)}
                  placeholder="5000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consultant *
              </label>
              <select
                value={consultantId ?? ""}
                onChange={(e) =>
                  setConsultantId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red"
              >
                <option value="">Select a consultant...</option>
                {consultants.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep("products")}
              disabled={!clientValid}
              className="bg-envirotech-red text-white px-6 py-2 rounded-md font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Next: Select Products
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Product Selection ────────────────────────────────────── */}
      {step === "products" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red"
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c as ProductCategory] || c}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500 pb-2">
              {selectedProducts.length} selected
            </div>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((p) => {
              const selected = isProductSelected(p.product_code);
              const sp = selectedProducts.find(
                (s) => s.product_code === p.product_code
              );
              return (
                <div
                  key={p.product_code}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 transition-colors ${
                    selected
                      ? "border-envirotech-red"
                      : "border-transparent hover:border-gray-200"
                  }`}
                  onClick={() => toggleProduct(p)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-envirotech-charcoal truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.product_code} &middot;{" "}
                        {CATEGORY_LABELS[p.category as ProductCategory] ||
                          p.category}
                      </p>
                      <p className="text-sm font-semibold text-envirotech-red mt-1">
                        ${p.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ml-2 ${
                        selected
                          ? "bg-envirotech-red border-envirotech-red text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {selected && <span className="text-xs">{"\u2713"}</span>}
                    </div>
                  </div>
                  {selected && sp && (
                    <div
                      className="mt-2 flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className="text-xs text-gray-500">Qty:</label>
                      <input
                        type="number"
                        min={1}
                        value={sp.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            p.product_code,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep("client")}
              className="text-gray-600 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep("floorplan")}
              disabled={!productsValid}
              className="bg-envirotech-red text-white px-6 py-2 rounded-md font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Next: Floor Plan
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Floor Plan Upload ────────────────────────────────────── */}
      {step === "floorplan" && (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-envirotech-charcoal mb-4">
            Floor Plan (Optional)
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload a floor plan image to include in the presentation. Supported
            formats: PNG, JPG. Max 10MB.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {floorPlanPreview ? (
              <div>
                <img
                  src={floorPlanPreview}
                  alt="Floor plan preview"
                  className="max-h-64 mx-auto mb-4 rounded"
                />
                <button
                  onClick={() => {
                    setFloorPlanFile(null);
                    setFloorPlanPreview(null);
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-400 mb-2">
                  Drag & drop or click to upload
                </p>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleFloorPlan}
                  className="text-sm"
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep("products")}
              className="text-gray-600 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep("review")}
              className="bg-envirotech-red text-white px-6 py-2 rounded-md font-medium hover:bg-red-700 transition-colors"
            >
              Next: Review
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Review & Generate ────────────────────────────────────── */}
      {step === "review" && (
        <div className="space-y-4 max-w-3xl">
          {/* Client summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-envirotech-charcoal mb-3">
              Client Details
            </h2>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-gray-500">Client:</span>
              <span className="font-medium">{clientName}</span>
              <span className="text-gray-500">Address:</span>
              <span className="font-medium">{officeAddress}</span>
              {suiteNumber && (
                <>
                  <span className="text-gray-500">Suite:</span>
                  <span className="font-medium">{suiteNumber}</span>
                </>
              )}
              <span className="text-gray-500">Square Footage:</span>
              <span className="font-medium">
                {Number(sqFt).toLocaleString()} sq ft
              </span>
              <span className="text-gray-500">Consultant:</span>
              <span className="font-medium">
                {selectedConsultant?.name || "—"}
              </span>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-envirotech-charcoal mb-3">
              Pricing Summary
            </h2>
            <div className="flex gap-8 mb-4">
              <div>
                <p className="text-xs text-envirotech-red font-bold uppercase">
                  Project Cost
                </p>
                <p className="text-2xl font-bold">
                  ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-envirotech-red font-bold uppercase">
                  Cost Per Sq Ft
                </p>
                <p className="text-2xl font-bold">
                  ${costPerSqFt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Product table */}
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
                {selectedProducts.map((sp, i) => {
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

          {floorPlanPreview && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-envirotech-charcoal mb-3">
                Floor Plan
              </h2>
              <img
                src={floorPlanPreview}
                alt="Floor plan"
                className="max-h-48 rounded"
              />
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep("floorplan")}
              className="text-gray-600 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !clientValid || !productsValid}
              className="bg-envirotech-red text-white px-8 py-3 rounded-md font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate Presentation"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
