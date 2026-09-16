import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import GroupsIcon from '@mui/icons-material/Groups';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import SummarizeIcon from '@mui/icons-material/Summarize';
import NotificationsIcon from '@mui/icons-material/Notifications';
import {
  AppBar,
  Badge,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { notificationsApi } from '../services/api/notifications';

const DRAWER_WIDTH = 260;

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, permission: 'dashboard:read' },
  { label: 'Projects', path: '/projects', icon: <FolderIcon />, permission: 'project:read' },
  { label: 'Action tracker', path: '/actions', icon: <AssignmentIcon />, anyOf: ['action:update', 'action:manage'] },
  { label: 'Review meetings', path: '/meetings', icon: <GroupsIcon />, permission: 'meeting:manage' },
  { label: 'Reports', path: '/reports', icon: <SummarizeIcon />, permission: 'report:export' },
  { label: 'Administration', path: '/administration', icon: <SettingsIcon />, anyOf: ['user:manage', 'master:manage', 'district:manage'] },
  { label: 'System health', path: '/health', icon: <HealthAndSafetyIcon />, permission: 'dashboard:read' },
] as const;

export function AppShell() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, hasPermission, logout } = useAuth();
  const client = useQueryClient();
  const [notifyAnchor, setNotifyAnchor] = useState<null | HTMLElement>(null);
  const unread = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationsApi.unreadCount,
    enabled: hasPermission('notification:read'),
    refetchInterval: 60_000,
  });
  const notes = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    enabled: Boolean(notifyAnchor) && hasPermission('notification:read'),
  });
  const title = import.meta.env.VITE_APP_TITLE ?? 'District Development Works Monitoring';
  const visibleNav = NAV_ITEMS.filter((item) => {
    if ('permission' in item) {
      return hasPermission(item.permission);
    }
    return item.anyOf.some((permission) => hasPermission(permission));
  });

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.5, px: 2 }}>
        <AccountBalanceIcon />
        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.25}>
          Works Monitoring
        </Typography>
      </Toolbar>
      <List sx={{ px: 1, flex: 1 }}>
        {visibleNav.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="caption" color="rgba(255,255,255,0.7)">
          Multi-district platform. District name and logo come from configuration, not source
          code.
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          {!isDesktop && (
            <IconButton
              color="inherit"
              edge="start"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }} noWrap>
            {profile?.displayName}
          </Typography>
          {hasPermission('notification:read') ? (
            <>
              <IconButton color="inherit" aria-label="Notifications" onClick={(event) => setNotifyAnchor(event.currentTarget)}>
                <Badge badgeContent={unread.data?.unread ?? 0} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <Menu
                anchorEl={notifyAnchor}
                open={Boolean(notifyAnchor)}
                onClose={() => setNotifyAnchor(null)}
                slotProps={{ paper: { sx: { width: 360, maxHeight: 400 } } }}
              >
                {(notes.data ?? []).length === 0 ? (
                  <MenuItem disabled>No notifications</MenuItem>
                ) : (
                  (notes.data ?? []).map((note) => (
                    <MenuItem
                      key={note.id}
                      onClick={async () => {
                        if (!note.read) {
                          await notificationsApi.markRead(note.id);
                          await client.invalidateQueries({ queryKey: ['notifications'] });
                        }
                      }}
                      sx={{ whiteSpace: 'normal', alignItems: 'flex-start', opacity: note.read ? 0.7 : 1 }}
                    >
                      <Box>
                        <Typography variant="subtitle2">{note.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {note.body}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Menu>
            </>
          ) : null}
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={() => void logout()}>
            Sign out
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isDesktop ? (
          <Drawer
            variant="permanent"
            open
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderRight: 0,
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              },
            }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
