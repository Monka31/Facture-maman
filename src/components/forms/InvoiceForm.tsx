import { useState, useEffect } from "react";
import { useInvoiceStore, type Invoice, type InvoiceItem } from "@/store/invoiceStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Save, FileDown, Split, Eye } from "lucide-react";
import { toast } from "sonner";
import { PDFPreview } from "@/components/pdf/PDFPreview";
import { InvoiceSplitter } from "@/components/pdf/InvoiceSplitter";

interface InvoiceFormProps {
  invoiceId?: string;
  onSave: () => void;
}

export const InvoiceForm = ({ invoiceId, onSave }: InvoiceFormProps) => {
  const { 
    clients, 
    company, 
    addInvoice, 
    updateInvoice, 
    generateInvoiceNumber, 
    calculateTotals,
    invoices 
  } = useInvoiceStore();

  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showSplitter, setShowSplitter] = useState(false);

  const [formData, setFormData] = useState<Partial<Invoice>>({
    type: 'invoice',
    date: new Date().toISOString().split('T')[0],
    status: 'draft',
    items: [
      {
        id: '1',
        designation: '',
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
        discount: 0,
        discountType: 'percentage' as const,
      }
    ],
    notes: '',
    terms: 'Paiement à 30 jours. Pénalités de retard : 3 fois le taux légal.',
  });

  useEffect(() => {
    if (invoiceId) {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        setFormData(invoice);
      }
    } else {
      // Generate new invoice number
      setFormData(prev => ({
        ...prev,
        number: generateInvoiceNumber(prev.type || 'invoice'),
      }));
    }
  }, [invoiceId, invoices, generateInvoiceNumber]);

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      designation: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: 20,
      discount: 0,
      discountType: 'percentage',
    };
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter(item => item.id !== itemId) || [],
    }));
  };

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      ) || [],
    }));
  };

  const handleSave = () => {
    if (!formData.client) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    if (!formData.items?.length || formData.items.some(item => !item.designation)) {
      toast.error("Veuillez ajouter au moins un article avec une désignation");
      return;
    }

    const totals = calculateTotals(formData.items);
    const now = new Date().toISOString();

    const invoice: Invoice = {
      id: invoiceId || Date.now().toString(),
      type: formData.type || 'invoice',
      number: formData.number || generateInvoiceNumber(formData.type || 'invoice'),
      date: formData.date || new Date().toISOString().split('T')[0],
      dueDate: formData.dueDate,
      client: formData.client,
      company,
      items: formData.items,
      signature: formData.signature,
      notes: formData.notes,
      terms: formData.terms,
      status: formData.status || 'draft',
      ...totals,
      createdAt: formData.createdAt || now,
      updatedAt: now,
    };

    if (invoiceId) {
      updateInvoice(invoiceId, invoice);
      toast.success("Document mis à jour avec succès");
    } else {
      addInvoice(invoice);
      toast.success("Document créé avec succès");
    }

    onSave();
  };

  const totals = formData.items ? calculateTotals(formData.items) : { totalHT: 0, totalVAT: 0, totalTTC: 0 };

  const canShowPreview = formData.client && formData.items?.length && formData.items.some(item => item.designation);
  const currentInvoice = invoiceId ? invoices.find(inv => inv.id === invoiceId) : null;

  const handleShowPreview = () => {
    if (!canShowPreview) {
      toast.error("Veuillez d'abord sauvegarder le document");
      return;
    }
    
    if (currentInvoice) {
      setShowPDFPreview(true);
    } else {
      toast.error("Veuillez d'abord sauvegarder le document");
    }
  };

  const handleShowSplitter = () => {
    if (!currentInvoice) {
      toast.error("Veuillez d'abord sauvegarder le document");
      return;
    }
    setShowSplitter(true);
  };

  return (
    <>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">
          {invoiceId ? 'Modifier' : 'Créer'} un document
        </h2>
        <div className="flex space-x-2">
          <Button onClick={handleSave} className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Enregistrer</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={handleShowPreview}
            className="flex items-center space-x-2"
            disabled={!currentInvoice}
          >
            <Eye className="h-4 w-4" />
            <span>Aperçu PDF</span>
          </Button>
          {currentInvoice && (
            <Button 
              variant="secondary" 
              onClick={handleShowSplitter}
              className="flex items-center space-x-2"
            >
              <Split className="h-4 w-4" />
              <span>Diviser</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type de document</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => setFormData(prev => ({ 
                    ...prev, 
                    type: value,
                    number: generateInvoiceNumber(value)
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Facture</SelectItem>
                    <SelectItem value="quote">Devis</SelectItem>
                    <SelectItem value="proforma">Proforma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="number">Numéro</Label>
                <Input
                  id="number"
                  value={formData.number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Date d'échéance</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="client">Client</Label>
              <Select 
                value={formData.client?.id} 
                onValueChange={(value) => {
                  const client = clients.find(c => c.id === value);
                  setFormData(prev => ({ ...prev, client }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes et conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes supplémentaires..."
              />
            </div>
            <div>
              <Label htmlFor="terms">Conditions de paiement</Label>
              <Textarea
                id="terms"
                value={formData.terms || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                placeholder="Conditions de paiement..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Articles / Prestations</CardTitle>
            <Button onClick={addItem} size="sm" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Ajouter</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.items?.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  {index === 0 && <Label className="text-xs">Désignation</Label>}
                  <Input
                    placeholder="Désignation"
                    value={item.designation}
                    onChange={(e) => updateItem(item.id, 'designation', e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  {index === 0 && <Label className="text-xs">Qté</Label>}
                  <Input
                    type="number"
                    placeholder="Qté"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  {index === 0 && <Label className="text-xs">Prix unitaire HT</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Prix HT"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1">
                  {index === 0 && <Label className="text-xs">TVA %</Label>}
                  <Input
                    type="number"
                    placeholder="TVA"
                    value={item.vatRate}
                    onChange={(e) => updateItem(item.id, 'vatRate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1">
                  {index === 0 && <Label className="text-xs">Remise</Label>}
                  <Input
                    type="number"
                    placeholder="Remise"
                    value={item.discount}
                    onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  {index === 0 && <Label className="text-xs">Total HT</Label>}
                  <Input
                    readOnly
                    value={(item.quantity * item.unitPrice - (item.discountType === 'percentage' 
                      ? item.quantity * item.unitPrice * item.discount / 100 
                      : item.discount)).toFixed(2)}
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    disabled={formData.items?.length === 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total HT:</span>
                  <span className="font-medium">{totals.totalHT.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total TVA:</span>
                  <span className="font-medium">{totals.totalVAT.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Total TTC:</span>
                  <span className="font-bold text-lg">{totals.totalTTC.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* PDF Preview Modal */}
      {showPDFPreview && currentInvoice && (
        <PDFPreview
          invoice={currentInvoice}
          onClose={() => setShowPDFPreview(false)}
        />
      )}

      {/* Invoice Splitter Modal */}
      {showSplitter && currentInvoice && (
        <InvoiceSplitter
          invoice={currentInvoice}
          onClose={() => setShowSplitter(false)}
          onSplitComplete={() => {
            // Refresh the view
            onSave();
          }}
        />
      )}
    </>
  );
};