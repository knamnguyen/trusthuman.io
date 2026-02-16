import React, { useEffect, useRef, useState } from "react";

import {
  addListToProfile,
  deleteListEverywhere,
  ensureListExists,
  loadListsWithErrorHandling,
  removeListFromProfile,
} from "../utils/storage";

interface ProfileListButtonProps {
  profileUrl: string;
  listsForProfile: string[];
  onListsChange: (next: string[]) => void;
}

export function ProfileListButton({
  profileUrl,
  listsForProfile,
  onListsChange,
}: ProfileListButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hoverTimer = useRef<number | null>(null);

  const open = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);
  const delayedClose = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setIsOpen(false), 180);
  };

  useEffect(() => {
    loadListsWithErrorHandling().then((res) => setLists(res.lists));
  }, []);

  useEffect(() => {
    const handler = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area !== "local") return;
      if ("engagekit-profile-lists" in changes) {
        const next = changes["engagekit-profile-lists"].newValue;
        setLists(Array.isArray(next) ? next : []);
      }
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  // Keep the menu open unless the user hovers out (match content script UX)

  const filtered = lists.filter((l) =>
    l.toLowerCase().includes(search.toLowerCase()),
  );

  const handleToggle = async (listName: string, checked: boolean) => {
    if (!profileUrl) return;
    if (checked) {
      await addListToProfile(profileUrl, listName);
      if (!listsForProfile.includes(listName))
        onListsChange([...listsForProfile, listName]);
    } else {
      await removeListFromProfile(profileUrl, listName);
      onListsChange(listsForProfile.filter((l) => l !== listName));
    }
  };

  const saveNewList = async () => {
    const name = newListName.trim();
    setIsCreating(false);
    if (!name) {
      setNewListName("");
      return;
    }
    await ensureListExists(name);
    setLists((prev) => Array.from(new Set([...prev, name])).sort());
    setNewListName("");
  };

  const handleDeleteList = async (listName: string) => {
    await deleteListEverywhere(listName);
    const nextListsForProfile = listsForProfile.filter((l) => l !== listName);
    onListsChange(nextListsForProfile);
    const res = await loadListsWithErrorHandling();
    setLists(res.lists);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={open}
      onMouseLeave={delayedClose}
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center rounded-full bg-[#e6007a] px-4 py-1.5 text-sm font-semibold text-white shadow-[2px_2px_0px_#000] hover:bg-[#b8005a] focus:outline-none"
      >
        List
      </button>
      {isOpen && (
        <div className="absolute left-0 z-20 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
          {/* Search */}
          <div className="sticky top-0 border-b border-gray-200 bg-gray-50 p-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lists..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#e6007a] focus:ring-1 focus:ring-[#e6007a]"
            />
          </div>
          {/* New list */}
          <div className="border-b border-gray-200 bg-white p-2">
            {isCreating ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveNewList();
                    if (e.key === "Escape") {
                      setIsCreating(false);
                      setNewListName("");
                    }
                  }}
                  onBlur={saveNewList}
                  placeholder="Enter list name..."
                  className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-[#e6007a] focus:ring-1 focus:ring-[#e6007a]"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <span className="text-[#e6007a]">+ New List</span>
              </button>
            )}
          </div>
          {/* Items */}
          <div className="max-h-72 overflow-y-auto p-2">
            {filtered.map((name) => {
              const checked = listsForProfile.includes(name);
              return (
                <div
                  key={name}
                  className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={checked}
                    onChange={(e) => handleToggle(name, e.target.checked)}
                  />
                  <span className="flex-1 truncate text-sm text-gray-900">
                    {name}
                  </span>
                  <button
                    type="button"
                    title={`Delete "${name}"`}
                    onClick={() => handleDeleteList(name)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <span role="img" aria-label="trash">
                      🗑️
                    </span>
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-6 text-center text-sm text-gray-500">
                No lists found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
