"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronRight,
  Code,
  Columns3,
  Copy,
  Image,
  Linkedin,
  Loader2,
  Rows3,
  Settings,
  User,
  X,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@sassy/ui/button";
import { Input } from "@sassy/ui/input";
import { Label } from "@sassy/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sassy/ui/select";
import { Textarea } from "@sassy/ui/textarea";
import { toast } from "@sassy/ui/toast";
import { cn } from "@sassy/ui/utils";

import { useTRPC } from "~/trpc/react";

// Layout types
type ProfileLayout = "horizontal" | "vertical";
type BadgeImageStyle = "logo" | "avatar";

// X icon component
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function ToggleButton({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      onClick={onToggle}
      variant="primary"
      size="icon"
      className="z-10"
      aria-label={isOpen ? "Close settings" : "Open settings"}
      title={isOpen ? "Close settings" : "Open settings"}
    >
      {isOpen ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <Settings className="h-4 w-4" />
      )}
    </Button>
  );
}

const profileFormSchema = z.object({
  displayName: z.string().max(50, "Name is too long").optional(),
  bio: z.string().max(160, "Bio is too long (max 160 characters)").optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface PlatformLink {
  platform: string;
  profileHandle: string;
  profileUrl: string | null;
}

interface ProfileSettingsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  profile: {
    humanNumber: number;
    totalVerifications: number;
    displayName: string | null;
    bio: string | null;
    isPublic: boolean;
    defaultLayout: ProfileLayout;
    badgeImageStyle: BadgeImageStyle;
    platformLinks: PlatformLink[];
  };
  /** Callback for live preview of layout changes */
  onLayoutPreview: (layout: ProfileLayout) => void;
  /** Callback for live preview of badge image style changes */
  onBadgeImageStylePreview: (style: BadgeImageStyle) => void;
  onClose: () => void;
  username: string;
  /** Callback for live preview of form changes */
  onPreviewChange?: (values: { displayName?: string; bio?: string }) => void;
}

export function ProfileSettingsSidebar({
  isOpen,
  onToggle,
  profile,
  onLayoutPreview,
  onBadgeImageStylePreview,
  onClose,
  username,
  onPreviewChange,
}: ProfileSettingsSidebarProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Track the selected layout locally for the save
  const [selectedLayout, setSelectedLayout] = useState<ProfileLayout>(profile.defaultLayout);
  const [selectedBadgeImageStyle, setSelectedBadgeImageStyle] = useState<BadgeImageStyle>(profile.badgeImageStyle || "logo");

  // Reset selected layout and badge image style when profile data changes
  useEffect(() => {
    setSelectedLayout(profile.defaultLayout);
    setSelectedBadgeImageStyle(profile.badgeImageStyle || "logo");
  }, [profile.defaultLayout, profile.badgeImageStyle]);

  // Handle layout selection - preview + track for save
  const handleLayoutSelect = (newLayout: ProfileLayout) => {
    setSelectedLayout(newLayout);
    onLayoutPreview(newLayout);
  };

  const { control, handleSubmit, reset, watch } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: profile.displayName || "",
      bio: profile.bio || "",
    },
  });

  // Watch form values for live preview
  const watchedValues = watch();

  // Track if we've initialized the form
  const initializedRef = useRef(false);
  const lastProfileRef = useRef({ displayName: profile.displayName, bio: profile.bio });

  // Only reset form when sidebar first opens or when server data actually changes
  useEffect(() => {
    const serverDataChanged =
      lastProfileRef.current.displayName !== profile.displayName ||
      lastProfileRef.current.bio !== profile.bio;

    if (!initializedRef.current || serverDataChanged) {
      reset({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
      });
      lastProfileRef.current = { displayName: profile.displayName, bio: profile.bio };
      initializedRef.current = true;
    }
  }, [profile.displayName, profile.bio, reset]);

  // Reset initialized flag when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false;
    }
  }, [isOpen]);

  // Send preview changes to parent (no debounce needed with stable updates)
  const onPreviewChangeRef = useRef(onPreviewChange);
  onPreviewChangeRef.current = onPreviewChange;

  useEffect(() => {
    onPreviewChangeRef.current?.({
      displayName: watchedValues.displayName,
      bio: watchedValues.bio,
    });
  }, [watchedValues.displayName, watchedValues.bio]);

  const updateProfile = useMutation({
    ...trpc.trustProfile.update.mutationOptions(),
    onSuccess: async () => {
      toast.success("Profile updated successfully");
      // Refetch all trustProfile queries and wait for completion
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && Array.isArray(key[0]) && key[0][0] === "trustProfile";
        },
      });
      // Update the lastProfileRef so the form doesn't reset incorrectly
      lastProfileRef.current = {
        displayName: watchedValues.displayName || null,
        bio: watchedValues.bio || null,
      };
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfile.mutate({
      displayName: data.displayName || undefined,
      bio: data.bio || undefined,
      defaultLayout: selectedLayout,
      badgeImageStyle: selectedBadgeImageStyle,
    });
  };

  const bioLength = watchedValues.bio?.length || 0;

  // Embed badge state
  const [embedTheme, setEmbedTheme] = useState<"light" | "dark">("light");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  // Update preview key when settings change to force image reload
  useEffect(() => {
    setPreviewKey((k) => k + 1);
  }, [embedTheme, selectedBadgeImageStyle]);

  // Generate embed URLs and codes
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://trusthuman.io";
  const profileUrl = `${baseUrl}/${username}`;
  const badgeUrl = `${baseUrl}/api/badge/${username}?theme=${embedTheme}&image=${selectedBadgeImageStyle}`;

  const htmlCode = `<a href="${profileUrl}" target="_blank" rel="noopener noreferrer">
  <img src="${badgeUrl}" alt="Verified Human on TrustHuman.io" width="320" height="80" />
</a>`;

  const markdownCode = `[![Verified Human on TrustHuman.io](${badgeUrl})](${profileUrl})`;

  const handleCopyCode = async (code: string, type: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(type);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div
      className={cn(
        "bg-card fixed right-0 top-16 bottom-0 flex shrink-0 flex-col border-l transition-all duration-200 z-40",
        isOpen ? "w-[360px]" : "w-0"
      )}
    >
      {/* Toggle button attached to left edge - vertically centered */}
      <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2">
        <ToggleButton isOpen={isOpen} onToggle={onToggle} />
      </div>

      {/* Sidebar content - only visible when open */}
      {isOpen && (
        <>
          {/* Header - fixed at top */}
          <div className="shrink-0 flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Profile Settings</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form - scrollable content with fixed footer */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 space-y-6 overflow-y-auto p-4">
              {/* Layout Selection */}
              <div className="space-y-3">
                <Label>Default Layout</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleLayoutSelect("horizontal")}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors",
                      selectedLayout === "horizontal"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Rows3 className="h-6 w-6" />
                    <span className="text-xs font-medium">Horizontal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLayoutSelect("vertical")}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors",
                      selectedLayout === "vertical"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Columns3 className="h-6 w-6" />
                    <span className="text-xs font-medium">Vertical</span>
                  </button>
                </div>
                <p className="text-muted-foreground text-xs">
                  Choose how your profile is displayed to visitors
                </p>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Controller
                  control={control}
                  name="displayName"
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="displayName"
                        placeholder="Your display name"
                        maxLength={50}
                      />
                      {fieldState.error && (
                        <p className="text-destructive text-xs">
                          {fieldState.error.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bio">Bio</Label>
                  <span className="text-muted-foreground text-xs">
                    {bioLength}/160
                  </span>
                </div>
                <Controller
                  control={control}
                  name="bio"
                  render={({ field, fieldState }) => (
                    <>
                      <Textarea
                        {...field}
                        id="bio"
                        rows={3}
                        placeholder="Write a short bio about yourself..."
                        maxLength={160}
                      />
                      {fieldState.error && (
                        <p className="text-destructive text-xs">
                          {fieldState.error.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              {/* Connected Accounts Section */}
              <div className="border-t pt-4 space-y-3">
                <Label>Connected Accounts</Label>
                {profile.platformLinks.length > 0 ? (
                  <div className="space-y-2">
                    {profile.platformLinks.map((link) => (
                      <div
                        key={`${link.platform}-${link.profileHandle}`}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          {link.platform === "linkedin" ? (
                            <Linkedin className="h-4 w-4 text-[#0a66c2]" />
                          ) : (
                            <XIcon className="h-4 w-4" />
                          )}
                          <span className="text-sm">@{link.profileHandle}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {link.platform === "linkedin" ? "LinkedIn" : "X"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No accounts connected yet. Install the browser extension to connect accounts.
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Connected accounts are managed through the browser extension
                </p>
              </div>

              {/* Embed Badge Section */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <Label>Embed Badge</Label>
                </div>
                <p className="text-muted-foreground text-xs">
                  Add your verified human badge to your website, blog, or README
                </p>

                {/* Badge Image Style */}
                <div className="space-y-3">
                  <Label className="text-xs">Badge Image</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBadgeImageStyle("logo");
                        onBadgeImageStylePreview("logo");
                      }}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors",
                        selectedBadgeImageStyle === "logo"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Image className="h-5 w-5" />
                      <span className="text-xs font-medium">Logo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBadgeImageStyle("avatar");
                        onBadgeImageStylePreview("avatar");
                      }}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors",
                        selectedBadgeImageStyle === "avatar"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <User className="h-5 w-5" />
                      <span className="text-xs font-medium">Avatar</span>
                    </button>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Choose the image shown on the left side of your badge
                  </p>
                </div>

                {/* Theme selector */}
                <div className="space-y-2">
                  <Label className="text-xs">Theme</Label>
                  <Select
                    value={embedTheme}
                    onValueChange={(v) => setEmbedTheme(v as "light" | "dark")}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Badge Preview */}
                <div className="space-y-2">
                  <Label className="text-xs">Preview</Label>
                  <div className={cn(
                    "rounded-lg p-4 flex justify-center overflow-hidden",
                    embedTheme === "dark" ? "bg-zinc-900" : "bg-zinc-100"
                  )}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={previewKey}
                      src={`${badgeUrl}&v=${previewKey}`}
                      alt="Badge preview"
                      width={320}
                      height={80}
                      className="rounded max-w-full h-auto"
                    />
                  </div>
                </div>

                {/* HTML Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">HTML</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleCopyCode(htmlCode, "html")}
                    >
                      {copiedCode === "html" ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      {copiedCode === "html" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <pre className="bg-muted/50 rounded-lg p-3 text-[10px] overflow-x-auto whitespace-pre-wrap break-all font-mono">
                    {htmlCode}
                  </pre>
                </div>

                {/* Markdown Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Markdown</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleCopyCode(markdownCode, "markdown")}
                    >
                      {copiedCode === "markdown" ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      {copiedCode === "markdown" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <pre className="bg-muted/50 rounded-lg p-3 text-[10px] overflow-x-auto whitespace-pre-wrap break-all font-mono">
                    {markdownCode}
                  </pre>
                </div>

                {/* Direct Image URL */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Image URL</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleCopyCode(badgeUrl, "url")}
                    >
                      {copiedCode === "url" ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      {copiedCode === "url" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <pre className="bg-muted/50 rounded-lg p-3 text-[10px] overflow-x-auto whitespace-pre-wrap break-all font-mono">
                    {badgeUrl}
                  </pre>
                </div>
              </div>
            </div>

            {/* Footer - fixed at bottom */}
            <div className="shrink-0 border-t p-4 bg-card">
              <Button
                type="submit"
                className="w-full"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
