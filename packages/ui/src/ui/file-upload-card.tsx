"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  File as FileIcon,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { cn } from "@sassy/ui/utils";

import { Button } from "./button";
import { Progress } from "./progress";

// Define the structure for a file being uploaded
export interface UploadedFile {
  id: string;
  file: File;
  progress: number; // 0-100
  status: "uploading" | "completed" | "error";
}

// Define the props for the component
interface FileUploadCardProps extends React.HTMLAttributes<HTMLDivElement> {
  files: UploadedFile[];
  onFilesChange: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  onClose?: () => void;
  accept?: string;
  title?: string;
  description?: string;
  formatHint?: string;
}

export const FileUploadCard = React.forwardRef<
  HTMLDivElement,
  FileUploadCardProps
>(
  (
    {
      className,
      files = [],
      onFilesChange,
      onFileRemove,
      onClose,
      accept,
      title = "Upload files",
      description = "Select and upload the files of your choice",
      formatHint = "JPEG, PNG, PDF, and MP4 formats, up to 50 MB.",
      ...props
    },
    ref,
  ) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Handler for drag enter event
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    // Handler for drag leave event
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    // Handler for drag over event
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Handler for drop event
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles && droppedFiles.length > 0) {
        onFilesChange(droppedFiles);
      }
    };

    // Handler for file input change
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        onFilesChange(selectedFiles);
      }
      // Reset input to allow selecting same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    // Trigger file input click
    const triggerFileSelect = () => fileInputRef.current?.click();

    // Format file size for display
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 KB";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Animation variants for Framer Motion
    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    };

    const fileItemVariants = {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 },
    };

    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3 }}
        className={cn(
          "bg-background w-full max-w-lg rounded-xl border shadow-sm",
          className,
        )}
        {...props}
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                <UploadCloud className="text-muted-foreground h-6 w-6" />
              </div>
              <div>
                <h3 className="text-foreground text-lg font-semibold">
                  {title}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {description}
                </p>
              </div>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={cn(
              "mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-200",
              isDragging
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/30 hover:border-primary/50",
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={accept}
              className="hidden"
              onChange={handleFileSelect}
            />
            <UploadCloud className="text-muted-foreground mb-4 h-10 w-10" />
            <p className="text-foreground font-semibold">
              Choose a file or drag & drop it here.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">{formatHint}</p>
            <Button
              variant="outline"
              size="sm"
              className="pointer-events-none mt-4"
            >
              Browse File
            </Button>
          </div>
        </div>

        {files.length > 0 && (
          <div className="border-t p-6">
            <ul className="space-y-4">
              <AnimatePresence>
                {files.map((file) => (
                  <motion.li
                    key={file.id}
                    variants={fileItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    layout
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold">
                        {file.file.type
                          .split("/")[1]
                          ?.toUpperCase()
                          .substring(0, 3) || "FILE"}
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground max-w-[150px] truncate text-sm font-medium sm:max-w-xs">
                          {file.file.name}
                        </p>
                        <div className="text-muted-foreground text-xs">
                          {file.status === "uploading" && (
                            <span>
                              {formatFileSize(
                                (file.file.size * file.progress) / 100,
                              )}{" "}
                              of {formatFileSize(file.file.size)}
                            </span>
                          )}
                          {file.status === "completed" && (
                            <span>{formatFileSize(file.file.size)}</span>
                          )}
                          <span className="mx-1">&bull;</span>
                          <span
                            className={cn({
                              "text-primary": file.status === "uploading",
                              "text-green-500": file.status === "completed",
                            })}
                          >
                            {file.status === "uploading"
                              ? `Uploading...`
                              : "Completed"}
                          </span>
                        </div>
                        {file.status === "uploading" && (
                          <Progress value={file.progress} className="mt-1 h-1.5" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {file.status === "completed" && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => onFileRemove(file.id)}
                      >
                        {file.status === "completed" ? (
                          <Trash2 className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        )}
      </motion.div>
    );
  },
);
FileUploadCard.displayName = "FileUploadCard";
