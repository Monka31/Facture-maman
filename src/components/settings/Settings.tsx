import { useState } from "react";
import { useInvoiceStore } from "@/store/invoiceStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Building, Users, Save } from "lucide-react";
import { toast } from "sonner";

export const Settings = () => {
  const { company, updateCompany, clients, addClient, updateClient, deleteClient } = useInvoiceStore();
  const [companyData, setCompanyData] = useState(company);
  const [newClient, setNewClient] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    siret: '',
    vatNumber: '',
  });

  const handleSaveCompany = () => {
    updateCompany(companyData);
    toast.success("Informations de l'entreprise mises à jour");
  };

  const handleAddClient = () => {
    if (!newClient.name || !newClient.email) {
      toast.error("Le nom et l'email du client sont obligatoires");
      return;
    }

    addClient({
      id: Date.now().toString(),
      ...newClient,
    });

    setNewClient({
      name: '',
      address: '',
      email: '',
      phone: '',
      siret: '',
      vatNumber: '',
    });

    toast.success("Client ajouté avec succès");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground">Paramètres</h2>

      {/* Company Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Informations de l'entreprise</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Nom de l'entreprise</Label>
              <Input
                id="companyName"
                value={companyData.name}
                onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={companyData.email}
                onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="companyPhone">Téléphone</Label>
              <Input
                id="companyPhone"
                value={companyData.phone}
                onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="companySiret">SIRET</Label>
              <Input
                id="companySiret"
                value={companyData.siret || ''}
                onChange={(e) => setCompanyData(prev => ({ ...prev, siret: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="companyVat">Numéro de TVA</Label>
              <Input
                id="companyVat"
                value={companyData.vatNumber || ''}
                onChange={(e) => setCompanyData(prev => ({ ...prev, vatNumber: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="companyAddress">Adresse</Label>
            <Textarea
              id="companyAddress"
              value={companyData.address}
              onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Adresse complète de l'entreprise..."
            />
          </div>
          <Button onClick={handleSaveCompany} className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Enregistrer</span>
          </Button>
        </CardContent>
      </Card>

      {/* Client Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Gestion des clients</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Client */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-semibold text-foreground">Ajouter un nouveau client</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Nom du client *</Label>
                <Input
                  id="clientName"
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom ou raison sociale"
                />
              </div>
              <div>
                <Label htmlFor="clientEmail">Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@client.fr"
                />
              </div>
              <div>
                <Label htmlFor="clientPhone">Téléphone</Label>
                <Input
                  id="clientPhone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
              <div>
                <Label htmlFor="clientSiret">SIRET</Label>
                <Input
                  id="clientSiret"
                  value={newClient.siret}
                  onChange={(e) => setNewClient(prev => ({ ...prev, siret: e.target.value }))}
                  placeholder="12345678901234"
                />
              </div>
              <div>
                <Label htmlFor="clientVat">Numéro de TVA</Label>
                <Input
                  id="clientVat"
                  value={newClient.vatNumber}
                  onChange={(e) => setNewClient(prev => ({ ...prev, vatNumber: e.target.value }))}
                  placeholder="FR12345678901"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="clientAddress">Adresse</Label>
              <Textarea
                id="clientAddress"
                value={newClient.address}
                onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Adresse complète du client..."
              />
            </div>
            <Button onClick={handleAddClient}>Ajouter le client</Button>
          </div>

          {/* Existing Clients */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Clients existants</h4>
            {clients.length === 0 ? (
              <p className="text-muted-foreground">Aucun client enregistré.</p>
            ) : (
              <div className="grid gap-4">
                {clients.map((client) => (
                  <Card key={client.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold text-foreground">{client.name}</h5>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                          {client.phone && (
                            <p className="text-sm text-muted-foreground">{client.phone}</p>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteClient(client.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
