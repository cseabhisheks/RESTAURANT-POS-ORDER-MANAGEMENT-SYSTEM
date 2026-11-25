import './globals.css';

export const metadata = {
  title: 'BistroPOS — Restaurant Order & Billing System',
  description: 'Simple Restaurant POS & Order Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
