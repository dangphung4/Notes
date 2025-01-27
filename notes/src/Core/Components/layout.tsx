interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen pt-16 md:pt-16">
      {/* pt-16 adds padding equal to navbar height */}
      {children}
    </div>
  );
} 