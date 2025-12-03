import { useState } from "react";

import { Button } from "@sassy/ui/button";

import { ListPanel } from "../components/ListPanel";
import { ProfilePanel } from "../components/ProfilePanel";
import { ImportCsvModal } from "../import-list/import-csv-modal";

/**
 * Profile Management Options Page
 *
 * Provides interface to view and manage extracted LinkedIn profiles and lists
 */
export function ProfileOptionsPage() {
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Header */}
      <div className="border-b-2 border-black bg-white">
        <div className="container mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                🔧 EngageKit Profile Manager
              </h1>
              <p className="text-gray-600">
                Manage your collected LinkedIn profiles and lists
              </p>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div className="inline-flex items-center rounded-full border-2 border-black bg-yellow-400 px-4 py-2 text-sm font-bold text-black shadow-[2px_2px_0px_#000]">
                Profile Manager
              </div>
              <Button onClick={() => setShowImport(true)}>Import CSV</Button>
            </div>
          </div>
        </div>
      </div>
      <ImportCsvModal open={showImport} onOpenChange={setShowImport} />
      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-5 gap-6">
          {/* Left Panel - Lists (20% width - 1 column) */}
          <ListPanel
            selectedList={selectedList}
            onListSelect={setSelectedList}
            className="col-span-1"
          />

          {/* Right Panel - Profiles (80% width - 4 columns) */}
          <ProfilePanel selectedList={selectedList} className="col-span-4" />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 border-t-2 border-black bg-white">
        <div className="container mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <p className="font-medium">📋 Current Features</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Profile extraction button on LinkedIn profile pages</li>
                <li>• AI-powered comment generation with Engage button</li>
                <li>• Profile list management and organization</li>
              </ul>
            </div>
            <div className="text-right">
              <p className="mb-2 font-medium">🚀 Getting Started</p>
              <p className="max-w-sm text-xs">
                Visit any LinkedIn profile page to see the profile extraction
                button. Look for the "List" button next to the profile overflow
                menu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
