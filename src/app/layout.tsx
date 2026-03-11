import "./globals.css";
import { ThemeProvider } from "@/src/components/theme/ThemeProvider";

export const metadata = {
  title: "EuroSpares",
  description: "Spare parts management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}                                 

