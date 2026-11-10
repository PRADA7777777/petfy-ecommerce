// app/(public)/layout.tsx
import { ModalProvider } from "./_context/ModalContext";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      {children}
    </ModalProvider>
  );
}