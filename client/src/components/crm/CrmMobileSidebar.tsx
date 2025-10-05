import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Menu } from "lucide-react";
import CrmSidebar from "./CrmSidebar";

export default function CrmMobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          data-testid="mobile-menu-trigger"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="py-4">
          <SheetTitle className="px-6 text-lg font-semibold">CRM Navigation</SheetTitle>
        </div>
        <Separator />
        <CrmSidebar />
      </SheetContent>
    </Sheet>
  );
}
