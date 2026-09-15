import { Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import AppProvider from '@/app/redux/AppProvider';
import { Toaster } from 'react-hot-toast';

const outfit = Outfit({ subsets: ['latin'], weight: ["300", "400", "500"] });

export const metadata = {
  title: "QuickCart",
  description: "E-Commerce platform for quick and easy shopping",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${outfit.className} antialiased text-gray-700`} suppressHydrationWarning>
           <AppProvider>{children}</AppProvider>
            <Toaster position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}

