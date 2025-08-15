import { Button } from "@/components/ui/button";
import { FileText, Plus, Settings, Home } from "lucide-react";

interface NavigationProps {
  activeView: 'dashboard' | 'create' | 'settings';
  onViewChange: (view: 'dashboard' | 'create' | 'settings') => void;
}

export const Navigation = ({ activeView, onViewChange }: NavigationProps) => {
  return (
    <nav className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-primary">InvoiceApp</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={activeView === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => onViewChange('dashboard')}
              className="flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Tableau de bord</span>
            </Button>
            
            <Button
              variant={activeView === 'create' ? 'default' : 'ghost'}
              onClick={() => onViewChange('create')}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau</span>
            </Button>
            
            <Button
              variant={activeView === 'settings' ? 'default' : 'ghost'}
              onClick={() => onViewChange('settings')}
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Paramètres</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};