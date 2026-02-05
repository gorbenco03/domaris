import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
      <p className="mb-8 text-xl text-muted-foreground">Pagina nu a fost găsită</p>
      <Button asChild>
        <Link href="/">Înapoi acasă</Link>
      </Button>
    </div>
  );
}
