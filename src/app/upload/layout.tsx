import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Virtual Staging",
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
