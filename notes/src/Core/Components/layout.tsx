interface LayoutProps {
  children: React.ReactNode;
}

/**
 *
 * @param root0
 * @param root0.children
 */
export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen md:pt-16">
      {/* pt-16 adds padding equal to navbar height on medium and larger screens */}
      {children}
    </div>
  );
} 