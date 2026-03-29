/**
 * Allow long-running server actions for /create (Kling + LLM can exceed default limits).
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
 */
export const maxDuration = 900;

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
