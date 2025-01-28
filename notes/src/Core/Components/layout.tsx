interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen md:pt-16">
      {/* pt-16 adds padding equal to navbar height on medium and larger screens */}
      {children}
    </div>
  );
} 