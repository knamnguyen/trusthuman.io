"use client";

import React from "react";

import { Button } from "@sassy/ui/button";
import FileUpload from "@sassy/ui/components/file-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@sassy/ui/dialog";
import { Input } from "@sassy/ui/input";
import { Label } from "@sassy/ui/label";

import { parseCsv } from "./csv-parser";
import { normalizeListName, upsertFromCsv } from "./import-helpers";

interface ImportCsvModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

export function ImportCsvModal({ open, onOpenChange }: ImportCsvModalProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [listNameInput, setListNameInput] = React.useState("");
  const [splitInto, setSplitInto] = React.useState<number>(1);
  const [status, setStatus] = React.useState<
    "idle" | "parsing" | "ready" | "importing" | "done"
  >("idle");
  const [headerValid, setHeaderValid] = React.useState<boolean>(false);
  const [rowErrors, setRowErrors] = React.useState<
    { row: number; reason: string }[]
  >([]);
  const [parsedCount, setParsedCount] = React.useState<number>(0);
  const [summary, setSummary] = React.useState<null | {
    parsed: number;
    valid: number;
    created: number;
    updated: number;
    skipped: number;
    errors: { row: number; reason: string }[];
  }>(null);

  const reset = () => {
    setFiles([]);
    setListNameInput("");
    setStatus("idle");
    setHeaderValid(false);
    setRowErrors([]);
    setParsedCount(0);
    setSummary(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    // keep summary visible if reopened? For now, reset.
    reset();
  };

  const selectedFile = files[0];
  const disableImport =
    !selectedFile ||
    !headerValid ||
    parsedCount === 0 ||
    parsedCount > 1000 ||
    status === "importing";

  const handleFilesChange = (next: File[]) => {
    setFiles(next);
    setRowErrors([]);
    setParsedCount(0);
    setHeaderValid(false);
    setSummary(null);
    if (next.length === 0) {
      setStatus("idle");
      return;
    }
    const file = next[0]!;
    setStatus("parsing");
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const res = parseCsv(text);
      setHeaderValid(res.headerValid);
      setRowErrors(res.errors);
      setParsedCount(res.rows.length);
      setStatus(res.headerValid && res.rows.length > 0 ? "ready" : "idle");
    };
    reader.onerror = () => {
      setRowErrors([{ row: 0, reason: "Failed to read file" }]);
      setStatus("idle");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setStatus("importing");
    try {
      const text = await selectedFile.text();
      const parsed = parseCsv(text);
      const targetList = normalizeListName(listNameInput, selectedFile.name);
      const result = await upsertFromCsv({
        rows: parsed.rows,
        listName: targetList,
        splitInto:
          Number.isFinite(splitInto) && splitInto > 1 ? splitInto : undefined,
      });
      setSummary(result);
      setStatus("done");
    } catch (e) {
      setRowErrors([
        { row: 0, reason: (e as Error)?.message || "Import failed" },
      ]);
      setStatus("idle");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Import Profiles from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="list-name">List name (optional)</Label>
            <Input
              id="list-name"
              value={listNameInput}
              onChange={(e) => setListNameInput(e.target.value)}
              placeholder="If empty, filename will be used"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="split-into">
              Split into how many lists? (optional)
            </Label>
            <Input
              id="split-into"
              type="number"
              min={1}
              max={100}
              value={splitInto}
              onChange={(e) => setSplitInto(Number(e.target.value) || 1)}
              placeholder="1"
            />
            <p className="text-muted-foreground text-xs">
              Rows will be evenly distributed into N lists. Lists will be named
              "{listNameInput || "<filename>"} 1", "
              {listNameInput || "<filename>"} 2", ...
            </p>
          </div>

          <FileUpload
            accept=".csv"
            multiple={false}
            onFilesChange={handleFilesChange}
          />

          {selectedFile && (
            <div className="text-muted-foreground text-sm">
              <div>Selected: {selectedFile.name}</div>
              <div>
                Parsed rows: {parsedCount}
                {parsedCount > 1000 && (
                  <span className="text-destructive">
                    {" "}
                    (exceeds 1000 limit)
                  </span>
                )}
              </div>
              <div>Header valid: {headerValid ? "Yes" : "No"}</div>
            </div>
          )}

          {rowErrors.length > 0 && (
            <div className="rounded-md border p-3 text-sm">
              <div className="mb-2 font-medium">Validation Errors</div>
              <ul className="list-disc pl-5">
                {rowErrors.slice(0, 20).map((e, i) => (
                  <li key={`${e.row}-${i}`}>
                    Row {e.row}: {e.reason}
                  </li>
                ))}
                {rowErrors.length > 20 && (
                  <li>And {rowErrors.length - 20} more...</li>
                )}
              </ul>
            </div>
          )}

          {summary && (
            <div className="rounded-md border p-3 text-sm">
              <div className="mb-2 font-medium">Import Summary</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                <span>Parsed:</span>
                <span>{summary.parsed}</span>
                <span>Valid:</span>
                <span>{summary.valid}</span>
                <span>Created:</span>
                <span>{summary.created}</span>
                <span>Updated:</span>
                <span>{summary.updated}</span>
                <span>Skipped:</span>
                <span>{summary.skipped}</span>
              </div>
              {summary.errors.length > 0 && (
                <div className="mt-3">
                  <div className="font-medium">Row Errors</div>
                  <ul className="list-disc pl-5">
                    {summary.errors.slice(0, 20).map((e, i) => (
                      <li key={`${e.row}-${i}`}>
                        Row {e.row}: {e.reason}
                      </li>
                    ))}
                    {summary.errors.length > 20 && (
                      <li>And {summary.errors.length - 20} more...</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={status === "importing"}
            >
              {status === "done" ? "Close" : "Cancel"}
            </Button>
            <Button onClick={handleImport} disabled={disableImport}>
              {status === "importing" ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
