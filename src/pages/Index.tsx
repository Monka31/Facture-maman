import { useState } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { Settings } from "@/components/settings/Settings";

const Index = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'create' | 'settings'>('dashboard');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | undefined>();

  const handleEditInvoice = (invoiceId: string) => {
    setEditingInvoiceId(invoiceId);
    setActiveView('create');
  };

  const handleCreateNew = () => {
    setEditingInvoiceId(undefined);
    setActiveView('create');
  };

  const handleSaveInvoice = () => {
    setEditingInvoiceId(undefined);
    setActiveView('dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeView={activeView} onViewChange={setActiveView} />
      
      <main className="container mx-auto px-4 py-8">
        {activeView === 'dashboard' && (
          <Dashboard 
            onEditInvoice={handleEditInvoice}
            onCreateNew={handleCreateNew}
          />
        )}
        
        {activeView === 'create' && (
          <InvoiceForm 
            invoiceId={editingInvoiceId}
            onSave={handleSaveInvoice}
          />
        )}
        
        {activeView === 'settings' && <Settings />}
      </main>
    </div>
  );
};

export default Index;
