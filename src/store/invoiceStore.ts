import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface InvoiceItem {
  id: string;
  designation: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discount: number;
  discountType: 'percentage' | 'amount';
}

export interface Client {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  siret?: string;
  vatNumber?: string;
}

export interface Company {
  name: string;
  address: string;
  phone: string;
  email: string;
  vatNumber?: string;
  siret?: string;
  logo?: string;
}

export interface Invoice {
  id: string;
  type: 'invoice' | 'quote' | 'proforma';
  number: string;
  date: string;
  dueDate?: string;
  client: Client;
  company: Company;
  items: InvoiceItem[];
  signature?: string;
  notes?: string;
  terms?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'split' | 'complet' | 'incomplet' | 'cancelled';
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubInvoice extends Omit<Invoice, 'id'> {
  id: string;
  parentId: string;
  splitPercentage: number;
}

interface InvoiceStore {
  // Data
  invoices: Invoice[];
  subInvoices: SubInvoice[];
  clients: Client[];
  company: Company;
  
  // Current editing state
  currentInvoice: Invoice | null;
  
  // Actions
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  setCurrentInvoice: (invoice: Invoice | null) => void;
  
  // Client management
  addClient: (client: Client) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  // Company management
  updateCompany: (company: Partial<Company>) => void;
  
  // Sub-invoices
  createSubInvoices: (parentId: string, splits: Array<{percentage: number, amount: number}>) => void;
  
  // Utility functions
  generateInvoiceNumber: (type: Invoice['type']) => string;
  calculateTotals: (items: InvoiceItem[]) => { totalHT: number; totalVAT: number; totalTTC: number };
}

const defaultCompany: Company = {
  name: 'Mon Entreprise',
  address: '123 Rue de la Paix\n75001 Paris, France',
  phone: '+33 1 23 45 67 89',
  email: 'contact@monentreprise.fr',
  vatNumber: 'FR12345678901',
  siret: '12345678901234',
};

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      invoices: [],
      subInvoices: [],
      clients: [
        {
          id: '1',
          name: 'Client Exemple SARL',
          address: '456 Avenue des Entreprises\n69000 Lyon, France',
          email: 'contact@clientexemple.fr',
          phone: '+33 4 78 90 12 34',
          siret: '98765432109876',
          vatNumber: 'FR98765432109',
        }
      ],
      company: defaultCompany,
      currentInvoice: null,

      // Invoice actions
      addInvoice: (invoice) => set((state) => ({
        invoices: [...state.invoices, invoice]
      })),

      updateInvoice: (id, updatedInvoice) => set((state) => {
        const isSubInvoice = state.subInvoices.some(sub => sub.id === id);

        if (isSubInvoice) {
          return {
            subInvoices: state.subInvoices.map(sub =>
              sub.id === id ? { ...sub, ...updatedInvoice, updatedAt: new Date().toISOString() } : sub
            )
          };
        } else {
          return {
            invoices: state.invoices.map(inv =>
              inv.id === id ? { ...inv, ...updatedInvoice, updatedAt: new Date().toISOString() } : inv
            )
          };
        }
      }),


      deleteInvoice: (id) => set((state) => ({
        invoices: state.invoices.filter(inv => inv.id !== id),
        subInvoices: state.subInvoices.filter(sub => sub.parentId !== id)
      })),

      setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),

      // Client actions
      addClient: (client) => set((state) => ({
        clients: [...state.clients, client]
      })),

      updateClient: (id, updatedClient) => set((state) => ({
        clients: state.clients.map(client => 
          client.id === id ? { ...client, ...updatedClient } : client
        )
      })),

      deleteClient: (id) => set((state) => ({
        clients: state.clients.filter(client => client.id !== id)
      })),

      // Company actions
      updateCompany: (updatedCompany) => set((state) => ({
        company: { ...state.company, ...updatedCompany }
      })),

      // Sub-invoices
      createSubInvoices: (parentId, splits) => {
        const parentInvoice = get().invoices.find(inv => inv.id === parentId);
        if (!parentInvoice) return;

        const subInvoices = splits.map((split, index) => ({
          ...parentInvoice,
          id: `${parentId}-sub-${index + 1}`,
          parentId,
          number: `${parentInvoice.number}-${index + 1}`,
          splitPercentage: split.percentage,
          totalHT: split.amount / 1.2, // Approximation sans TVA
          totalVAT: split.amount * 0.2 / 1.2,
          totalTTC: split.amount,
          items: parentInvoice.items.map(item => ({
            ...item,
            quantity: item.quantity * (split.percentage / 100),
          })),
        }));

        set((state) => ({
          subInvoices: [...state.subInvoices, ...subInvoices]
        }));
      },

      // Utility functions
      generateInvoiceNumber: (type) => {
        const state = get();
        const prefix = type === 'invoice' ? 'FA' : type === 'quote' ? 'DE' : 'PR';
        const existingNumbers = state.invoices
          .filter(inv => inv.type === type)
          .map(inv => parseInt(inv.number.replace(prefix, '')))
          .filter(num => !isNaN(num));
        
        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
      },

      calculateTotals: (items) => {
        const totalHT = items.reduce((sum, item) => {
          const lineTotal = item.quantity * item.unitPrice;
          const discount = item.discountType === 'percentage' 
            ? lineTotal * (item.discount / 100)
            : item.discount;
          return sum + (lineTotal - discount);
        }, 0);

        const totalVAT = items.reduce((sum, item) => {
          const lineTotal = item.quantity * item.unitPrice;
          const discount = item.discountType === 'percentage' 
            ? lineTotal * (item.discount / 100)
            : item.discount;
          const lineTotalHT = lineTotal - discount;
          return sum + (lineTotalHT * item.vatRate / 100);
        }, 0);

        const totalTTC = totalHT + totalVAT;

        return { totalHT, totalVAT, totalTTC };
      },
    }),
    {
      name: 'invoice-storage',
    }
  )
);