import React from "react";

import { useProfileLists } from "../hooks/useProfileLists";

interface ListPanelProps {
  selectedList: string | null;
  onListSelect: (listName: string | null) => void;
  className?: string;
}

/**
 * ListPanel Component
 *
 * Displays the list of available profile lists in a 20% width panel
 */
export function ListPanel({
  selectedList,
  onListSelect,
  className = "",
}: ListPanelProps) {
  const { lists, isLoading, error } = useProfileLists();

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000]">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Profile Lists
          </h2>
          <div className="animate-pulse">
            <div className="mb-2 h-4 rounded bg-gray-200"></div>
            <div className="mb-2 h-4 rounded bg-gray-200"></div>
            <div className="h-4 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000]">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Profile Lists
          </h2>
          <div className="text-sm text-red-600">
            <p>Error loading lists:</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000]">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Profile Lists
          </h2>
          <div className="py-8 text-center">
            <div className="mb-2 text-gray-400">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600">
              No list created yet
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Create lists by using the profile extraction button on LinkedIn
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000]">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Profile Lists</h2>

        {/* Clear Selection Option */}
        <button
          onClick={() => onListSelect(null)}
          className={`mb-2 w-full rounded-lg border-2 p-3 text-left transition-all ${
            selectedList === null
              ? "border-black bg-gray-900 text-white shadow-[2px_2px_0px_#000]"
              : "border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400 hover:bg-gray-100"
          }`}
        >
          <span className="font-medium">All Lists</span>
          <span className="mt-1 block text-xs opacity-75">
            View all available lists
          </span>
        </button>

        {/* List Items */}
        <div className="space-y-2">
          {lists.map((listName) => (
            <button
              key={listName}
              onClick={() => onListSelect(listName)}
              className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                selectedList === listName
                  ? "border-black bg-gray-900 text-white shadow-[2px_2px_0px_#000]"
                  : "border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400 hover:bg-gray-100"
              }`}
            >
              <span className="font-medium">{listName}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
