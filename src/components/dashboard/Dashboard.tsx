import { useState } from "react";
import { useInvoiceStore } from "@/store/invoiceStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit, Eye, Trash2, Download, Split } from "lucide-react";
import { PDFPreview } from "@/components/pdf/PDFPreview";
import { InvoiceSplitter } from "@/components/pdf/InvoiceSplitter";
import { generatePDF } from "@/lib/pdfGenerator";
import { toast } from "sonner";

interface DashboardProps {
  onEditInvoice: (invoiceId: string) => void;
  onCreateNew: () => void;
}

export const Dashboard = ({ onEditInvoice, onCreateNew }: DashboardProps) => {
  const { invoices, subInvoices, deleteInvoice, updateInvoice } = useInvoiceStore();
  const [previewInvoice, setPreviewInvoice] = useState<string | null>(null);
  const [splitterInvoice, setSplitterInvoice] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-500 text-white rounded-full px-3 py-1 text-sm font-semibold";
    case "sent":
      return "bg-yellow-400 text-black rounded-full px-3 py-1 text-sm font-semibold";
    case "overdue":
      return "bg-red-500 text-white rounded-full px-3 py-1 text-sm font-semibold";
    case "cancelled":
      return "bg-red-600 text-white rounded-full px-3 py-1 text-sm font-semibold";
    default:
      return "bg-gray-300 text-gray-800 rounded-full px-3 py-1 text-sm font-semibold";
  }
};


  const getTypeLabel = (type: string) => {
    switch (type) {
      case "invoice":
        return "Facture";
      case "quote":
        return "Devis";
      case "proforma":
        return "Proforma";
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);

  const handleDownloadPDF = async (invoice: any) => {
    try {
      await generatePDF(invoice);
      toast.success("PDF téléchargé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la génération du PDF");
      console.error(error);
    }
  };

  const togglePaidStatus = (invoice: any) => {
  const newStatus = invoice.status === "paid" ? "sent" : "paid";
  updateInvoice(invoice.id, { status: newStatus });
  toast.success(
    `Facture ${invoice.number} marquée comme ${newStatus === "paid" ? "payée" : "non payée"}`
  );

  


  // Si c'est une sous-facture, vérifier la facture mère
  if (invoice.parentId) {
    const parentInvoice = invoices.find((inv) => inv.id === invoice.parentId);
    if (parentInvoice) {
      const siblings = subInvoices.filter((sub) => sub.parentId === parentInvoice.id);
      const allPaid = siblings.every((sub) => 
        sub.id === invoice.id ? newStatus === "paid" : sub.status === "paid"
      );
      if (allPaid && parentInvoice.status !== "paid") {
        updateInvoice(parentInvoice.id, { status: "complet" });
        toast.success(`Facture mère ${parentInvoice.number} marquée comme payée`);
      } else if (!allPaid && parentInvoice.status === "complet") {
        updateInvoice(parentInvoice.id, { status: "incomplet" });
        toast.success(`Facture mère ${parentInvoice.number} marquée comme non payée`);
      }
    }
  }
};
const toggleSubInvoiceStatus = (subId: string) => {
  const sub = subInvoices.find((s) => s.id === subId);
  if (!sub) return;

  const newStatus = sub.status === "cancelled" ? "sent" : "cancelled";
  updateInvoice(subId, { status: newStatus });

  toast.success(
    `Sous-facture ${sub.number} ${newStatus === "cancelled" ? "annulée" : "réactivée"}`
  );
};


  const allDocuments = [...invoices, ...subInvoices];

  if (allDocuments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Aucun document</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Vous n'avez pas encore créé de devis ou de facture. Commencez par créer votre premier document.
        </p>
        <Button onClick={onCreateNew} className="mt-4">
          Créer un nouveau document
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Mes Documents</h2>
        <Button onClick={onCreateNew}>Nouveau document</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Total Factures payé/en attente
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex space-x-4 text-foreground font-bold text-2xl">
      <div>
        {
          [...invoices, ...subInvoices].filter(
            (inv) => inv.type === "invoice" && inv.status === "paid"
          ).length
        }
      </div>
      <div>
        /   {
          [...invoices, ...subInvoices].filter(
            (inv) => inv.type === "invoice" && inv.status === "sent"
          ).length
        }
      </div>
    </div>
  </CardContent>
</Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Devis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {invoices.filter((inv) => inv.type === "quote").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chiffre d'affaires</CardTitle>
          </CardHeader>
          <CardContent>
  <div className="text-2xl font-bold text-foreground">
    {formatCurrency(
      // Factures mères payées
      invoices
        .filter((inv) => inv.type === "invoice" && inv.status === "paid")
        .reduce((sum, inv) => sum + inv.totalTTC, 0) +
      // Sous-factures payées
      subInvoices
        .filter((sub) => sub.status === "paid")
        .reduce((sum, sub) => sum + sub.totalTTC, 0)
    )}
  </div>
</CardContent>

        </Card>
      </div>

      {/* Documents List */}
      <div className="grid gap-4">
        {[...invoices].reverse().map((invoice) => {
          const relatedSubInvoices = subInvoices.filter(
            (sub) => sub.parentId === invoice.id
          );

          return (
            <div key={invoice.id}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{getTypeLabel(invoice.type)}</Badge>
                      <span className="font-semibold text-foreground">{invoice.number}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {invoice.client.name} • {new Date(invoice.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(invoice.totalTTC)}</p>
                      <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => onEditInvoice(invoice.id)} title="Modifier">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setPreviewInvoice(invoice.id)} title="Aperçu PDF">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(invoice)} title="Télécharger PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                      {/* Bouton "Marquer comme payé" uniquement si c'est une facture et qu'elle n'a pas de sous-factures */}
                      {invoice.type === "invoice" && relatedSubInvoices.length === 0 && (
                        <Button variant="outline" size="sm" onClick={() => togglePaidStatus(invoice)}>
                          {invoice.status === "paid" ? "Annuler payé" : "Marquer comme payé"}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const confirmed = window.confirm(
                            `Êtes-vous sûr de vouloir supprimer la facture/devis ${invoice.number} ?`
                          );
                          if (confirmed) {
                            deleteInvoice(invoice.id);
                            toast.success("Document supprimé avec succès");
                          }
                        }}
                        className="text-destructive hover:text-destructive"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      {!relatedSubInvoices.length && invoice.type === "invoice" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSplitterInvoice(invoice.id)}
                          title="Diviser la facture"
                        >
                          <Split className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sous-factures */}
{relatedSubInvoices.length > 0 && (
  <div className="ml-6 mt-2 space-y-2">
    {relatedSubInvoices.map((sub) => (
      <Card key={sub.id} className="bg-gray-50 hover:shadow-sm transition-shadow">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{getTypeLabel(sub.type)}</Badge>
              <span className="font-semibold text-foreground">{sub.number}</span>
              <Badge variant="secondary" className="text-xs">
                Sous-facture
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {sub.client.name} • {new Date(sub.date).toLocaleDateString("fr-FR")}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-semibold text-foreground">{formatCurrency(sub.totalTTC)}</p>
              <Badge className={getStatusColor(sub.status)}>{sub.status}</Badge>
            </div>

            <div className="flex items-center space-x-2">
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewInvoice(sub.id)}
                title="Aperçu PDF"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownloadPDF(sub)}
                title="Télécharger PDF"
              >
                <Download className="h-4 w-4" />
              </Button>

              {/* Toggle payé / non payé */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => togglePaidStatus(sub)}
              >
                {sub.status === "paid" ? "Annuler payé" : "Marquer comme payé"}
              </Button>

              {/* Toggle annulé / réactiver */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSubInvoiceStatus(sub.id)}
                className={
                  sub.status === "cancelled"
                    ? "text-yellow-600 hover:text-yellow-800"
                    : "text-destructive hover:text-destructive"
                }
              >
                {sub.status === "cancelled" ? "Réactiver" : "Annuler"}
              </Button>

            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)}

            </div>
          );
        })}
      </div>

      {/* PDF Preview Modal */}
      {previewInvoice && (
        <PDFPreview
          invoice={allDocuments.find((inv) => inv.id === previewInvoice)!}
          onClose={() => setPreviewInvoice(null)}
        />
      )}

      {/* Invoice Splitter Modal */}
      {splitterInvoice && (
        <InvoiceSplitter
          invoice={invoices.find((inv) => inv.id === splitterInvoice)!}
          onClose={() => setSplitterInvoice(null)}
          onSplitComplete={() => {}}
        />
      )}
    </div>
  );
};
