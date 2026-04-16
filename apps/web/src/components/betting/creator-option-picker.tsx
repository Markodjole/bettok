"use client";

import { useState, useCallback, useRef } from "react";
import type { FrameOptionCandidate, NormalizedBox } from "@/lib/frame-options/types";
import { validateSelectedOptions } from "@/lib/frame-options/types";
import {
  VideoOptionOverlay,
  type OverlayOption,
} from "@/components/betting/video-option-overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Plus,
  RotateCcw,
  Check,
  Pencil,
  X,
  Hand,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PickerOption extends FrameOptionCandidate {
  isSelected: boolean;
}

interface CreatorOptionPickerProps {
  freezeFrameUrl: string;
  initialCandidates: FrameOptionCandidate[];
  onSave: (
    selected: Array<
      FrameOptionCandidate & { isSelected: boolean }
    >,
  ) => void | Promise<void>;
  saving?: boolean;
  characterName?: string;
}

export function CreatorOptionPicker({
  freezeFrameUrl,
  initialCandidates,
  onSave,
  saving = false,
  characterName,
}: CreatorOptionPickerProps) {
  const [options, setOptions] = useState<PickerOption[]>(() =>
    initialCandidates.map((c, i) => ({
      ...c,
      isSelected: i < 3 && (c.confidence ?? 0) >= 0.4,
    })),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [drawMode, setDrawMode] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [drawCurrent, setDrawCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const drawContainerRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [newManualLabel, setNewManualLabel] = useState("");

  const selectedCount = options.filter((o) => o.isSelected).length;
  const validation = validateSelectedOptions(
    options.filter((o) => o.isSelected),
  );

  const toggleOption = useCallback((id: string) => {
    setOptions((prev) =>
      prev.map((o) => {
        if (o.tempId !== id) return o;
        const newSelected = !o.isSelected;
        const currentSelected = prev.filter(
          (p) => p.isSelected && p.tempId !== id,
        ).length;
        if (newSelected && currentSelected >= 4) return o;
        return { ...o, isSelected: newSelected };
      }),
    );
  }, []);

  const startEdit = useCallback((id: string, currentLabel: string) => {
    setEditingId(id);
    setEditLabel(currentLabel);
  }, []);

  const confirmEdit = useCallback(() => {
    if (!editingId || !editLabel.trim()) return;
    setOptions((prev) =>
      prev.map((o) =>
        o.tempId === editingId
          ? { ...o, label: editLabel.trim().slice(0, 80) }
          : o,
      ),
    );
    setEditingId(null);
    setEditLabel("");
  }, [editingId, editLabel]);

  const handleSave = useCallback(() => {
    if (!validation.valid) return;
    void onSave(options.map((o) => ({ ...o })));
  }, [options, validation.valid, onSave]);

  const resetAll = useCallback(() => {
    setOptions(
      initialCandidates.map((c, i) => ({
        ...c,
        isSelected: i < 3 && (c.confidence ?? 0) >= 0.4,
      })),
    );
    setEditingId(null);
    setDrawMode(false);
  }, [initialCandidates]);

  // ─── Manual draw helpers ──────────────────────────────────
  const getRelativePos = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const rect = drawContainerRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const clientX =
        "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const clientY =
        "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
      return {
        x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
      };
    },
    [],
  );

  const handleDrawStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!drawMode) return;
      const pos = getRelativePos(e);
      if (!pos) return;
      setDrawStart(pos);
      setDrawCurrent(pos);
    },
    [drawMode, getRelativePos],
  );

  const handleDrawMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!drawMode || !drawStart) return;
      const pos = getRelativePos(e);
      if (pos) setDrawCurrent(pos);
    },
    [drawMode, drawStart, getRelativePos],
  );

  const handleDrawEnd = useCallback(() => {
    if (!drawMode || !drawStart || !drawCurrent) return;
    const box = makeBox(drawStart, drawCurrent);
    if (box.width >= 0.03 && box.height >= 0.03) {
      setNewManualLabel("");
      const newOpt: PickerOption = {
        tempId: `manual_${Date.now()}`,
        label: "",
        shortLabel: null,
        objectType: "other",
        confidence: null,
        normalizedBox: box,
        source: "manual",
        isSelected: true,
      };
      setOptions((prev) => [...prev, newOpt]);
      setEditingId(newOpt.tempId);
      setEditLabel("");
      setTimeout(() => labelInputRef.current?.focus(), 50);
    }
    setDrawStart(null);
    setDrawCurrent(null);
    setDrawMode(false);
  }, [drawMode, drawStart, drawCurrent]);

  const drawBox =
    drawStart && drawCurrent ? makeBox(drawStart, drawCurrent) : null;

  const overlayOptions: OverlayOption[] = options.map((o) => ({
    id: o.tempId,
    label: o.label || "New option",
    shortLabel: o.shortLabel,
    normalizedBox: o.normalizedBox,
    isSelected: o.isSelected,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          Tap objects {characterName ? `${characterName} ` : ""}viewers should
          bet on
        </p>
        <span className="text-xs text-muted-foreground">
          {selectedCount}/4 selected
        </span>
      </div>

      {/* Freeze frame with hotspots */}
      <div
        ref={drawContainerRef}
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-black",
          drawMode && "cursor-crosshair",
        )}
        onMouseDown={handleDrawStart}
        onMouseMove={handleDrawMove}
        onMouseUp={handleDrawEnd}
        onTouchStart={handleDrawStart}
        onTouchMove={handleDrawMove}
        onTouchEnd={handleDrawEnd}
      >
        <VideoOptionOverlay
          src={freezeFrameUrl}
          options={overlayOptions}
          mode="picker"
          onOptionTap={toggleOption}
          className="aspect-[9/16] w-full"
        />

        {/* Draw preview */}
        {drawBox && drawBox.width > 0.01 && drawBox.height > 0.01 && (
          <div
            className="pointer-events-none absolute rounded-lg border-2 border-dashed border-primary bg-primary/10"
            style={{
              left: `${drawBox.x * 100}%`,
              top: `${drawBox.y * 100}%`,
              width: `${drawBox.width * 100}%`,
              height: `${drawBox.height * 100}%`,
            }}
          />
        )}
      </div>

      {/* Selected option labels (editable) */}
      {options.some((o) => o.isSelected) && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Selected options
          </p>
          <div className="flex flex-wrap gap-1.5">
            {options
              .filter((o) => o.isSelected)
              .map((opt) => (
                <div
                  key={opt.tempId}
                  className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1"
                >
                  {editingId === opt.tempId ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        confirmEdit();
                      }}
                      className="flex items-center gap-1"
                    >
                      <Input
                        ref={labelInputRef}
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        maxLength={80}
                        className="h-5 w-28 border-0 bg-transparent px-0 text-xs focus-visible:ring-0"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="text-primary touch-manipulation"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-muted-foreground touch-manipulation"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="text-xs font-medium text-foreground">
                        {opt.label || "Untitled"}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(opt.tempId, opt.label)}
                        className="text-muted-foreground hover:text-foreground touch-manipulation"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleOption(opt.tempId)}
                        className="text-muted-foreground hover:text-destructive touch-manipulation"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Validation errors */}
      {!validation.valid && selectedCount > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
          {validation.errors.map((err, i) => (
            <p key={i} className="text-xs text-destructive">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDrawMode(!drawMode)}
          className="gap-1.5"
        >
          {drawMode ? (
            <>
              <X className="h-3.5 w-3.5" />
              Cancel draw
            </>
          ) : (
            <>
              <Hand className="h-3.5 w-3.5" />
              Draw box
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetAll}
          className="gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          size="sm"
          disabled={!validation.valid || saving}
          onClick={handleSave}
          className="gap-1.5"
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              Confirm {selectedCount} options
            </>
          )}
        </Button>
      </div>

      {options.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          No objects detected. Use &ldquo;Draw box&rdquo; to manually mark
          betting options on the frame.
        </p>
      )}
    </div>
  );
}

function makeBox(
  start: { x: number; y: number },
  end: { x: number; y: number },
): NormalizedBox {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.min(1 - x, Math.abs(end.x - start.x)),
    height: Math.min(1 - y, Math.abs(end.y - start.y)),
  };
}
