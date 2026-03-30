/**
 * Allow long-running server actions for /create.
 * NOTE: Vercel Hobby plan supports max 300 seconds.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
 */
export const maxDuration = 300;

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
