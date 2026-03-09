import { readFileSync } from "fs";
import { join } from "path";

export type PromptTemplateName =
  | "odds"
  | "normalize"
  | "director"
  | "settlement";

const TEMPLATE_NAMES: Record<PromptTemplateName, string> = {
  odds: "odds.system.md",
  normalize: "normalize.system.md",
  director: "director.system.md",
  settlement: "settlement.system.md",
};

export function loadPromptTemplate(name: PromptTemplateName): string {
  const filename = TEMPLATE_NAMES[name];
  const filepath = join(__dirname, "..", "src", filename);
  return readFileSync(filepath, "utf-8");
}
