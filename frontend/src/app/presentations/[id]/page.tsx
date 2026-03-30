"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPresentation, deletePresentation } from "@/lib/api";
import type { Presentation } from "@/lib/types";
import { CATEGORY_LABELS, type ProductCategory } from "@/lib/types";

export default function PresentationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isLoading: authLoading, user } = useAuth();

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    const numId = Number(id);
    if (isNaN(numId)) {
      setError("Invalid presentation ID");
      setIsLoading(false);
      return;
    }

    getPresentation(numId)
      .then(setPresentation)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id, authLoading, user]);

  const handleDelete = async () => {
    if (!presentation) return;
    setIsDeleting(true);
    try {
      await deletePresentation(presentation.id);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-envirotech-red font-medium hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!presentation) return null;

  const date = presentation.generated_at
    ? new Date(presentation.generated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const products = presentation.products || [];

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.push("/")}
        className="text-envirotech-red font-medium hover:underline mb-6 inline-block"
      >
        &larr; Back to Dashboard
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-envirotech-charcoal text-white px-6 py-4">
          <h1 className="text-xl font-bold">
            {presentation.client_name || "Untitled Presentation"}
          </h1>
          <p className="text-gray-300 text-sm mt-1">{date}</p>
        </div>

        {/* Client Details */}
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Client Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Detail label="Address" value={presentation.office_address} />
            <Detail label="Suite" value={presentation.suite_number} />
            <Detail
              label="Square Footage"
              value={
                presentation.sq_ft
                  ? `${presentation.sq_ft.toLocaleString()} sq ft`
                  : null
              }
            />
            <Detail
              label="Products"
              value={presentation.product_count?.toString()}
            />
            {presentation.consultant && (
              <Detail
                label="Consultant"
                value={`${presentation.consultant.name} (${presentation.consultant.email})`}
              />
            )}
          </div>
        </div>

        {/* Products Table */}
        {products.length > 0 && (
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Products
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-semibold text-gray-700">
                    Product
                  </th>
                  <th className="text-left py-2 font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="text-right py-2 font-semibold text-gray-700">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, i) => (
                  <tr
                    key={product.product_code}
                    className={i % 2 === 1 ? "bg-gray-50" : ""}
                  >
                    <td className="py-2 text-gray-800">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-gray-400">
                        {product.product_code}
                      </div>
                    </td>
                    <td className="py-2 text-gray-600">
                      {CATEGORY_LABELS[product.category as ProductCategory] ||
                        product.category ||
                        "—"}
                    </td>
                    <td className="py-2 text-right text-gray-800">
                      ${product.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Floor Plan */}
        {presentation.floor_plan_url && (
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Floor Plan
            </h2>
            <img
              src={presentation.floor_plan_url}
              alt="Floor plan"
              className="max-h-48 rounded"
            />
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3">
          {presentation.file_url && (
            <a
              href={presentation.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-envirotech-red text-white px-5 py-2 rounded-md font-medium hover:bg-red-700 transition-colors text-sm"
            >
              Download PPTX
            </a>
          )}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-white border border-red-300 text-red-600 px-5 py-2 rounded-md font-medium hover:bg-red-50 transition-colors text-sm ml-auto"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-envirotech-charcoal mb-2">
              Delete Presentation?
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              This will permanently delete the presentation for{" "}
              <strong>{presentation.client_name || "this client"}</strong>. This
              action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span>{" "}
      <span className="text-gray-800 font-medium">{value || "—"}</span>
    </div>
  );
}
