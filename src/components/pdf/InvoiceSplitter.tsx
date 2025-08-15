import { useState } from "react";
import { type Invoice, useInvoiceStore } from "@/store/invoiceStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Split } from "lucide-react";
import { toast } from "sonner";

interface InvoiceSplitterProps {
  invoice: Invoice;
  onClose: () => void;
  onSplitComplete: () => void;
}

interface Split {
  id: string;
  percentage: number;
  amount: number;
}

export const InvoiceSplitter = ({ invoice, onClose, onSplitComplete }: InvoiceSplitterProps) => {
  const { createSubInvoices } = useInvoiceStore();
  const [splits, setSplits] = useState<Split[]>([
    { id: '1', percentage: 50, amount: invoice.totalTTC * 0.5 },
    { id: '2', percentage: 50, amount: invoice.totalTTC * 0.5 }
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const addSplit = () => {
    const remainingPercentage = Math.max(0, 100 - splits.reduce((sum, split) => sum + split.percentage, 0));
    const remainingAmount = Math.max(0, invoice.totalTTC - splits.reduce((sum, split) => sum + split.amount, 0));
    
    const newSplit: Split = {
      id: Date.now().toString(),
      percentage: remainingPercentage,
      amount: remainingAmount
    };
    
    setSplits([...splits, newSplit]);
  };

  const removeSplit = (id: string) => {
    if (splits.length > 2) {
      setSplits(splits.filter(split => split.id !== id));
    }
  };

  const updateSplitPercentage = (id: string, percentage: number) => {
    setSplits(splits.map(split => 
      split.id === id 
        ? { ...split, percentage, amount: (invoice.totalTTC * percentage) / 100 }
        : split
    ));
  };

  const updateSplitAmount = (id: string, amount: number) => {
    setSplits(splits.map(split => 
      split.id === id 
        ? { ...split, amount, percentage: (amount / invoice.totalTTC) * 100 }
        : split
    ));
  };

  const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0);
  const totalAmount = splits.reduce((sum, split) => sum + split.amount, 0);
  const isValid = Math.abs(totalPercentage - 100) < 0.01 && Math.abs(totalAmount - invoice.totalTTC) < 0.01;

  const handleSplit = () => {
    if (!isValid) {
      toast.error("Les pourcentages doivent totaliser 100% et les montants doivent correspondre au total de la facture");
      return;
    }

    try {
      createSubInvoices(invoice.id, splits.map(split => ({
        percentage: split.percentage,
        amount: split.amount
      })));
      
      toast.success(`Facture divisée en ${splits.length} sous-factures`);
      onSplitComplete();
      onClose();
    } catch (error) {
      toast.error("Erreur lors de la division de la facture");
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Split className="h-5 w-5" />
            <span>Diviser la facture {invoice.number}</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Montant total à diviser: <span className="font-semibold">{formatCurrency(invoice.totalTTC)}</span>
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Splits */}
          <div className="space-y-4">
            {splits.map((split, index) => (
              <Card key={split.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Sous-facture {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSplit(split.id)}
                    disabled={splits.length <= 2}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pourcentage (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={split.percentage.toFixed(2)}
                      onChange={(e) => updateSplitPercentage(split.id, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Montant (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={split.amount.toFixed(2)}
                      onChange={(e) => updateSplitAmount(split.id, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Add Split Button */}
          <Button
            variant="outline"
            onClick={addSplit}
            className="w-full flex items-center space-x-2"
            disabled={splits.length >= 10}
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une sous-facture</span>
          </Button>

          <Separator />

          {/* Summary */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total pourcentages:</span>
              <span className={totalPercentage === 100 ? "text-success" : "text-destructive"}>
                {totalPercentage.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total montants:</span>
              <span className={Math.abs(totalAmount - invoice.totalTTC) < 0.01 ? "text-success" : "text-destructive"}>
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Différence:</span>
              <span className={Math.abs(totalAmount - invoice.totalTTC) < 0.01 ? "text-success" : "text-destructive"}>
                {formatCurrency(totalAmount - invoice.totalTTC)}
              </span>
            </div>
          </div>

          {!isValid && (
            <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
              <p className="text-destructive text-sm">
                ⚠️ Les pourcentages doivent totaliser 100% et les montants doivent correspondre exactement au total de la facture.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleSplit}
              disabled={!isValid}
              className="flex items-center space-x-2"
            >
              <Split className="h-4 w-4" />
              <span>Diviser la facture</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};