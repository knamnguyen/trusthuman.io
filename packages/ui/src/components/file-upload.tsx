"use client";

import * as React from "react";
import { File, Trash, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { Button } from "@sassy/ui/button";
import { Card, CardContent } from "@sassy/ui/card";
import { Label } from "@sassy/ui/label";
import { cn } from "@sassy/ui/utils";

export interface FileUploadProps {
  multiple?: boolean;
  accept?: string; // e.g., ".csv"
  onFilesChange?: (files: File[]) => void;
  className?: string;
  description?: string;
  maxSizeText?: string;
}

/**
 * FileUpload
 * Controlled file uploader built on react-dropzone. Defaults to CSV-only single file.
 */
export default function FileUpload({
  multiple = false,
  accept = ".csv",
  onFilesChange,
  className,
  description = "Drag and drop or choose file to upload",
  maxSizeText = "Max. size per file: 50MB",
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([]);

  const handleSetFiles = React.useCallback(
    (next: File[]) => {
      setFiles(next);
      onFilesChange?.(next);
    },
    [onFilesChange],
  );

  // Map simple accept string to react-dropzone's accept object when possible
  const acceptObj = React.useMemo(() => {
    if (!accept) return undefined;
    // Default for csv
    if (accept.includes(".csv")) {
      return { "text/csv": [".csv"] } as const;
    }
    return undefined;
  }, [accept]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple,
    accept: acceptObj,
    onDrop: (acceptedFiles) => handleSetFiles(acceptedFiles),
  });

  const removeFile = (name: string) => {
    const next = files.filter((f) => f.name !== name);
    handleSetFiles(next);
  };

  return (
    <div className={cn("flex items-center justify-center p-4", className)}>
      <div className="w-full max-w-xl">
        <div
          {...getRootProps()}
          className={cn(
            isDragActive
              ? "border-primary bg-primary/10 ring-primary/20 ring-2"
              : "border-border",
            "border-input flex justify-center rounded-md border border-dashed px-6 py-12 transition-colors duration-200",
          )}
        >
          <div className="text-center">
            <Upload className="text-muted-foreground mx-auto h-8 w-8" />
            <div className="text-muted-foreground mt-3 flex items-center justify-center text-sm">
              <p>{description.split("choose")[0] ?? "Drag and drop or"}</p>
              <Label
                htmlFor="file-upload"
                className="text-primary relative cursor-pointer rounded-sm pl-1 font-medium hover:underline hover:underline-offset-4"
              >
                <span>choose file</span>
                <input
                  {...getInputProps()}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                />
              </Label>
              <p className="pl-1">to upload</p>
            </div>
            <p className="text-muted-foreground mt-2 text-xs leading-5">
              {maxSizeText} {accept ? ` • Accepted: ${accept}` : null}
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-6">
            <h4 className="text-foreground mb-2 text-sm font-medium">
              File to upload
            </h4>
            <ul className="space-y-3">
              {files.map((file) => (
                <li key={file.name} className="relative">
                  <Card className="relative p-4">
                    <div className="absolute top-1/2 right-4 -translate-y-1/2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove file"
                        onClick={() => removeFile(file.name)}
                        className="rounded-sm"
                      >
                        <Trash className="h-5 w-5" aria-hidden={true} />
                      </Button>
                    </div>
                    <CardContent className="flex items-center space-x-3 p-0">
                      <span className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
                        <File
                          className="text-foreground h-5 w-5"
                          aria-hidden={true}
                        />
                      </span>
                      <div>
                        <p className="text-foreground text-sm font-medium">
                          {file.name}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {file.size} bytes
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
