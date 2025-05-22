import Header from "@/app/components/common/header/Header";
import Footer from "@/app/components/common/footer/Footer";

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap">
      <Header />
      <main className="main">{children}</main>
      <Footer />
    </div>
  );
}
