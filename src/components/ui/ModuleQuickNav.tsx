import React from 'react';
import { useHashRouter } from '@/hooks/useHashRouter';
import { Button } from '@/components/ui/Button';
import { MODULE_NAV_ITEMS, navigateToModule } from '@/utils/moduleNavigation';

interface ModuleQuickNavProps {
    className?: string;
}

export const ModuleQuickNav: React.FC<ModuleQuickNavProps> = ({ className }) => {
    const { currentView } = useHashRouter();

    return (
        <div className={`hidden xl:flex items-center gap-2 ${className || ''}`}>
            {MODULE_NAV_ITEMS.map((item) => {
                const isActive = currentView === item.id || (item.id === 'dashboard' && currentView === 'detail');
                return (
                    <Button
                        key={item.id}
                        variant={isActive ? 'soft' : 'ghost'}
                        size="sm"
                        onClick={() => navigateToModule(item.path)}
                        className={isActive ? 'border border-sky-200 !text-sky-700' : '!text-slate-500 hover:!text-sky-700'}
                    >
                        {item.label}
                    </Button>
                );
            })}
        </div>
    );
};
