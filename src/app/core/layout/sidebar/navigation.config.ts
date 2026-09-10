import { NavModule } from './navigation.models';

export const NAVIGATION_MODULES: NavModule[] = [
  {
    label: 'Inicio',
    icon: 'home',
    permission: ['reports.dashboard'],
    children: [
      { label: 'Inicio', route: '/dashboard', permission: 'reports.dashboard', exact: true },
    ],
  },
  {
    label: 'Reportes',
    icon: 'bar_chart',
    permission: [
      'reports.read',
    ],
    children: [
      { label: 'General', route: '/reports', permission: 'reports.read', exact: true },
    ],
  },
  {
    label: 'Administración',
    icon: 'settings',
    permission: [
      'users.read',
      'roles.read',
      'parameters.read',
    ],
    children: [
      { label: 'Usuarios', route: '/admin/users', permission: 'users.read', exact: true },
      { label: 'Roles', route: '/admin/roles', permission: 'roles.read', exact: true },
      {
        label: 'Parámetros',
        route: '/admin/parameters',
        permission: 'parameters.read',
        exact: true,
      },
  },
];
