import { Link } from "wouter";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#0D0D0D] text-white p-6 text-center">
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
        <FileQuestion className="w-10 h-10 text-muted-foreground" />
      </div>
      
      <h1 className="text-4xl font-display font-bold mb-2 text-white">404</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        We couldn't find the page you're looking for. It might have been moved or deleted.
      </p>
      
      <Link href="/">
        <Button className="font-semibold tracking-wide">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to App
        </Button>
      </Link>
    </div>
  );
}
