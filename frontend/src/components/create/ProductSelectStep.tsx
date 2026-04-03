"use client";

import { useState, useMemo } from "react";
import type { Product, ProductCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import type { WizardData, SelectedProduct } from "./StepWizard";

interface ProductSelectStepProps {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  products: Product[];
  categories: string[];
}

function getDisplayPrice(product: Product): number {
  const markup = product.markup_percent ?? 0;
  return Math.round(product.price * (1 + markup / 100) * 100) / 100;
}

export default function ProductSelectStep({
  data,
  updateData,
  products,
  categories,
}: ProductSelectStepProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const filteredProducts = useMemo(() => {
    let result = products;
    if (categoryFilter) {
      result = result.filter((p) => p.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.product_code.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, categoryFilter, search]);

  const isSelected = (code: string) =>
    data.selectedProducts.some((sp) => sp.product_code === code);

  const addProduct = (product: Product) => {
    if (isSelected(product.product_code)) return;
    updateData({
      selectedProducts: [
        ...data.selectedProducts,
        { product_code: product.product_code, quantity: 1, product },
      ],
    });
  };

  const removeProduct = (code: string) => {
    updateData({
      selectedProducts: data.selectedProducts.filter(
        (sp) => sp.product_code !== code
      ),
    });
  };

  const updateQuantity = (code: string, qty: number) => {
    if (qty < 1 || qty > 99) return;
    updateData({
      selectedProducts: data.selectedProducts.map((sp) =>
        sp.product_code === code ? { ...sp, quantity: qty } : sp
      ),
    });
  };

  const runningTotal = data.selectedProducts.reduce(
    (sum, sp) => sum + getDisplayPrice(sp.product) * sp.quantity,
    0
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: Product Catalog */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-bold text-envirotech-charcoal mb-3">
            Product Catalog
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-envirotech-red focus:border-transparent"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-envirotech-red focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c as ProductCategory] || c}
                </option>
              ))}
            </select>
          </div>

          {products.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4 text-sm">
              No products in catalog. Please add products before creating a
              presentation.
            </div>
          )}

          <div className="max-h-[28rem] overflow-y-auto space-y-2">
            {filteredProducts.length === 0 && products.length > 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  No products match your search.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("");
                  }}
                  className="mt-2 text-envirotech-red text-xs font-medium hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">
                No products available.
              </p>
            ) : (
              filteredProducts.map((product) => {
                const selected = isSelected(product.product_code);
                return (
                  <div
                    key={product.product_code}
                    className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                      selected
                        ? "border-envirotech-red bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 object-contain rounded bg-gray-50"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-400 text-center leading-tight px-1">
                        {product.product_code}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-envirotech-charcoal truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.category
                          ? CATEGORY_LABELS[product.category] || product.category
                          : "Uncategorized"}
                        {" \u00b7 "}$
                        {getDisplayPrice(product).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => addProduct(product)}
                      disabled={selected}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-shrink-0 ${
                        selected
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-envirotech-red text-white hover:bg-red-700"
                      }`}
                    >
                      {selected ? "Added" : "Add"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right: Selected Products */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:sticky lg:top-4">
          <h2 className="text-lg font-bold text-envirotech-charcoal mb-3">
            Selected ({data.selectedProducts.length})
          </h2>

          {data.selectedProducts.length === 0 ? (
            <p className="text-gray-500 text-sm py-6 text-center">
              Add products from the catalog.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {data.selectedProducts.map((sp) => (
                <div
                  key={sp.product_code}
                  className="flex items-center gap-2 p-2 rounded border border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-envirotech-charcoal truncate">
                      {sp.product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      $
                      {getDisplayPrice(sp.product).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      each
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        updateQuantity(sp.product_code, sp.quantity - 1)
                      }
                      aria-label={`Decrease quantity of ${sp.product.name}`}
                      className="w-8 h-8 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {sp.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(sp.product_code, sp.quantity + 1)
                      }
                      aria-label={`Increase quantity of ${sp.product.name}`}
                      className="w-8 h-8 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeProduct(sp.product_code)}
                    className="text-red-400 hover:text-red-600 text-sm ml-1 flex-shrink-0"
                    aria-label={`Remove ${sp.product.name}`}
                  >
                    {"\u2715"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {data.selectedProducts.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Total</span>
                <span className="font-bold text-envirotech-charcoal">
                  $
                  {runningTotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
