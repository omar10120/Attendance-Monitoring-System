import './globals.css';
import { Noto_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { LanguageProvider } from '@/components/providers/LanguageProvider';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  // Include Arabic and Latin weights
  weight: ['400', '500', '600', '700'],
  // Add Arabic script support
  variable: '--font-noto-sans',
});

export const metadata = {
  title: 'Attendance Monitoring System',
  description: 'Modern employee attendance and management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${notoSans.className} antialiased`}>
        <ThemeProvider>
          <LanguageProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
              {children}
            </div>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
