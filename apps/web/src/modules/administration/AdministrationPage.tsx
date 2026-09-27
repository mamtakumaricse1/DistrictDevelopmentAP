import { Paper, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { AgenciesPanel } from './panels/AgenciesPanel';
import { DepartmentsPanel } from './panels/DepartmentsPanel';
import { DistrictsPanel } from './panels/DistrictsPanel';
import { MasterDataPanel } from './panels/MasterDataPanel';
import { RolesPanel } from './panels/RolesPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { UsersPanel } from './panels/UsersPanel';
import { LocationsPanel } from './panels/LocationsPanel';

type TabId = 'districts' | 'departments' | 'agencies' | 'locations' | 'users' | 'roles' | 'master' | 'settings';

export function AdministrationPage() {
  const { hasPermission } = useAuth();
  const tabs: Array<{ id: TabId; label: string; show: boolean }> = [
    { id: 'districts', label: 'Districts', show: hasPermission('district:read') },
    { id: 'departments', label: 'Departments', show: hasPermission('district:read') },
    { id: 'agencies', label: 'Agencies', show: hasPermission('district:read') },
    { id: 'locations', label: 'Locations', show: hasPermission('district:read') },
    { id: 'users', label: 'Users', show: hasPermission('user:manage') },
    { id: 'roles', label: 'Roles', show: hasPermission('user:manage') },
    { id: 'master', label: 'Master data', show: hasPermission('master:manage') },
    { id: 'settings', label: 'Settings', show: hasPermission('master:manage') },
  ];
  const visible = tabs.filter((tab) => tab.show);
  const [current, setCurrent] = useState<TabId>(visible[0]?.id ?? 'districts');

  return (
    <>
      <PageHeader
        title="Administration"
        description="Districts, departments, agencies, users, roles, master data, and settings. District names come from data — they are not compiled into the application."
      />
      <Paper sx={{ p: 2 }}>
        <Tabs
          value={visible.some((tab) => tab.id === current) ? current : visible[0]?.id}
          onChange={(_, value: TabId) => setCurrent(value)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ mb: 2 }}
        >
          {visible.map((tab) => (
            <Tab key={tab.id} value={tab.id} label={tab.label} />
          ))}
        </Tabs>
        {current === 'districts' ? <DistrictsPanel /> : null}
        {current === 'departments' ? <DepartmentsPanel /> : null}
        {current === 'agencies' ? <AgenciesPanel /> : null}
        {current === 'locations' ? <LocationsPanel /> : null}
        {current === 'users' ? <UsersPanel /> : null}
        {current === 'roles' ? <RolesPanel /> : null}
        {current === 'master' ? <MasterDataPanel /> : null}
        {current === 'settings' ? <SettingsPanel /> : null}
      </Paper>
    </>
  );
}
