import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Sidebar from '@/components/Sidebar'
import FloatingCoach from '@/components/FloatingCoach'
import { TaskProvider } from '@/context/TaskContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Daily 3 - High Leverage Tasks',
  description: 'Focus on what matters. Execute with high-leverage speed.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} style={{ display: 'flex' }}>
        <TaskProvider>
          <div style={{ display: 'flex', width: '100%' }}>
             <Sidebar />
             <div style={{ flex: 1, height: '100vh', overflowY: 'auto', position: 'relative' }}>
               {children}
               <FloatingCoach />
             </div>
          </div>
        </TaskProvider>
      </body>
    </html>
  );
}
