import { useRef } from "react";
import { type Invoice } from "@/store/invoiceStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { generatePDF } from "@/lib/pdfGenerator";
import { toast } from "sonner";

interface PDFPreviewProps {
  invoice: Invoice;
  onClose: () => void;
}

export const PDFPreview = ({ invoice, onClose }: PDFPreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    try {
      await generatePDF(invoice);
      toast.success("PDF téléchargé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la génération du PDF");
      console.error(error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getDocumentTitle = (type: string) => {
    switch (type) {
      case 'invoice': return 'FACTURE';
      case 'quote': return 'DEVIS';
      case 'proforma': return 'FACTURE PROFORMA';
      default: return 'DOCUMENT';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background max-w-4xl w-full max-h-[90vh] overflow-auto rounded-lg">
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Aperçu PDF - {invoice.number}</h2>
          <div className="flex space-x-2">
            <Button onClick={handleDownloadPDF} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Télécharger PDF</span>
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>

        <div className="p-8">
          <div 
            ref={previewRef}
            className="bg-white shadow-lg max-w-[210mm] mx-auto p-8 min-h-[297mm]"
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[#680000] mb-2">
                  {getDocumentTitle(invoice.type)}
                </h1>
                <p className="text-lg text-gray-600">N° {invoice.number}</p>
                <p className="text-gray-600">Date: {new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
                {invoice.dueDate && (
                  <p className="text-gray-600">Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</p>
                )}
              </div>
              
              <div className="text-right">
                <div className="text-[#680000] font-bold text-xl mb-2">{invoice.company.name}</div>
                <div className="text-gray-600 whitespace-pre-line">{invoice.company.address}</div>
                <div className="text-gray-600 mt-2">
                  <p>Tél: {invoice.company.phone}</p>
                  <p>Email: {invoice.company.email}</p>
                  {invoice.company.siret && <p>SIRET: {invoice.company.siret}</p>}
                  {invoice.company.vatNumber && <p>N° TVA: {invoice.company.vatNumber}</p>}
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#680000] mb-3">Facturé à:</h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="font-semibold text-gray-800">{invoice.client.name}</div>
                <div className="text-gray-600 whitespace-pre-line mt-1">{invoice.client.address}</div>
                <div className="text-gray-600 mt-2">
                  <p>Email: {invoice.client.email}</p>
                  <p>Tél: {invoice.client.phone}</p>
                  {invoice.client.siret && <p>SIRET: {invoice.client.siret}</p>}
                  {invoice.client.vatNumber && <p>N° TVA: {invoice.client.vatNumber}</p>}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#680000] text-white">
                    <th className="border border-gray-300 p-3 text-left">Désignation</th>
                    <th className="border border-gray-300 p-3 text-center">Qté</th>
                    <th className="border border-gray-300 p-3 text-right">Prix unit. HT</th>
                    <th className="border border-gray-300 p-3 text-center">TVA</th>
                    <th className="border border-gray-300 p-3 text-right">Remise</th>
                    <th className="border border-gray-300 p-3 text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => {
                    const lineTotal = item.quantity * item.unitPrice;
                    const discount = item.discountType === 'percentage' 
                      ? lineTotal * (item.discount / 100)
                      : item.discount;
                    const totalHT = lineTotal - discount;

                    return (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="border border-gray-300 p-3">{item.designation}</td>
                        <td className="border border-gray-300 p-3 text-center">{item.quantity}</td>
                        <td className="border border-gray-300 p-3 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="border border-gray-300 p-3 text-center">{item.vatRate}%</td>
                        <td className="border border-gray-300 p-3 text-right">
                          {item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}
                        </td>
                        <td className="border border-gray-300 p-3 text-right font-semibold">{formatCurrency(totalHT)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-80">
                <div className="bg-gray-50 p-4 rounded">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Total HT:</span>
                    <span className="font-semibold">{formatCurrency(invoice.totalHT)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Total TVA:</span>
                    <span className="font-semibold">{formatCurrency(invoice.totalVAT)}</span>
                  </div>
                  <div className="border-t border-gray-300 mt-2 pt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-[#680000]">Total TTC:</span>
                      <span className="text-lg font-bold text-[#680000]">{formatCurrency(invoice.totalTTC)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="space-y-4">
                {invoice.notes && (
                  <div>
                    <h4 className="font-semibold text-[#680000] mb-2">Notes:</h4>
                    <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h4 className="font-semibold text-[#680000] mb-2">Conditions de paiement:</h4>
                    <p className="text-gray-600 whitespace-pre-line">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}

            {/* Signature */}
            {invoice.signature && (
              <div className="mt-8 text-right">
                <p className="text-gray-600 mb-2">Signature:</p>
                <img 
                  src={invoice.signature} 
                  alt="Signature" 
                  className="max-w-48 max-h-24 ml-auto border"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};