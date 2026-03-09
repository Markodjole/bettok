"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitPrediction } from "@/actions/predictions";
import { useToast } from "@/components/ui/toast";
import { Sparkles, Loader2 } from "lucide-react";

interface AddPredictionProps {
  clipNodeId: string;
  onPredictionAdded: () => void;
}

export function AddPrediction({
  clipNodeId,
  onPredictionAdded,
}: AddPredictionProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);

    const result = await submitPrediction({
      clip_node_id: clipNodeId,
      raw_text: text.trim(),
    });

    if (result.error) {
      toast({
        title: "Failed to submit",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: result.merged ? "Merged with existing" : "Prediction created!",
        description: result.merged
          ? "Your prediction matched an existing market"
          : "Others can now bet on your prediction",
        variant: "success",
      });
      setText("");
      onPredictionAdded();
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What happens next?"
          className="pl-9"
          maxLength={300}
          disabled={loading}
        />
      </div>
      <Button type="submit" size="default" disabled={loading || !text.trim()}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Submit"
        )}
      </Button>
    </form>
  );
}
