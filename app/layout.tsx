import "./globals.css";

export const metadata = {
  title: "GripTimer",
  description: "Competition timer for boulder events",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0b0f14] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
