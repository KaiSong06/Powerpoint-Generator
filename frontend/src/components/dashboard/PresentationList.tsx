"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Presentation } from "@/lib/types";

interface PresentationListProps {
  presentations: Presentation[];
}

type SortOrder = "newest" | "oldest";

export default function PresentationList({
  presentations,
}: PresentationListProps) {
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const filtered = useMemo(() => {
    let result = presentations;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.client_name?.toLowerCase().includes(q) ||
          p.office_address?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const dateA = a.generated_at ? new Date(a.generated_at).getTime() : 0;
      const dateB = b.generated_at ? new Date(b.generated_at).getTime() : 0;
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [presentations, search, sortOrder]);

  if (presentations.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg mb-4">
          No presentations yet. Create your first one.
        </p>
        <Link
          href="/create"
          className="inline-block bg-envirotech-red text-white px-6 py-2 rounded-md font-medium hover:bg-red-700 transition-colors"
        >
          Create New
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by client name or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-envirotech-red focus:border-transparent"
        />
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-envirotech-red focus:border-transparent"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No presentations match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PresentationCard key={p.id} presentation={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PresentationCard({ presentation }: { presentation: Presentation }) {
  const date = presentation.generated_at
    ? new Date(presentation.generated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <div className="bg-white rounded-lg shadow-sm border-l-4 border-l-envirotech-red border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="mb-3">
        <h3 className="font-bold text-envirotech-charcoal text-lg truncate">
          {presentation.client_name || "Untitled"}
        </h3>
        <p className="text-gray-500 text-sm truncate">
          {presentation.office_address || "No address"}
          {presentation.suite_number && `, Suite ${presentation.suite_number}`}
        </p>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <span>{date}</span>
        {presentation.product_count != null && (
          <span>
            {presentation.product_count} product
            {presentation.product_count !== 1 ? "s" : ""}
          </span>
        )}
        {presentation.sq_ft != null && (
          <span>{presentation.sq_ft.toLocaleString()} sq ft</span>
        )}
      </div>

      <div className="flex gap-2">
        <Link
          href={`/presentations/${presentation.id}`}
          className="text-sm text-envirotech-red font-medium hover:underline"
        >
          View Details
        </Link>
        {presentation.file_url && (
          <a
            href={presentation.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 font-medium hover:underline ml-auto"
          >
            Download
          </a>
        )}
      </div>
    </div>
  );
}
