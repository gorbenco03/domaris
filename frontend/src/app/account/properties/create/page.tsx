"use client";

import { PropertyWizard } from "@/components/PropertyWizard";

export default function CreatePropertyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Create New Listing</h1>
      <PropertyWizard />
    </div>
  );
}
