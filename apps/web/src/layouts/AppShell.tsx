import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import GroupsIcon from '@mui/icons-material/Groups';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import LogoutIcon from '@mui/icons-material/Logout';
import MapIcon from '@mui/icons-material/Map';
import MenuIcon from '@mui/icons-material/Menu';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import SchoolIcon from '@mui/icons-material/School';
import SettingsIcon from '@mui/icons-material/Settings';
import SummarizeIcon from '@mui/icons-material/Summarize';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DomainIcon from '@mui/icons-material/Domain';
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
import { govColors } from '../app/theme';
import { useAuth } from '../auth/AuthProvider';
import { GovSeal } from '../components/GovSeal';
import { TricolorStrip } from '../components/TricolorStrip';
import { adminApi } from '../services/api/admin';
import { notificationsApi } from '../services/api/notifications';

const DRAWER_WIDTH = 260;

const NAV_ITEMS = [
  { label: 'Home', deptLabel: 'My department', citizenLabel: 'Public home', path: '/dashboard', icon: <DashboardIcon />, permission: 'dashboard:read' },
  { label: 'Schemes', path: '/schemes', icon: <AccountTreeIcon />, permission: 'project:read' },
  { label: 'Blocks', path: '/blocks', icon: <MapIcon />, permission: 'dashboard:read' },
  { label: 'Infrastructure', path: '/infrastructure', icon: <DomainIcon />, permission: 'dashboard:read' },
  { label: 'Human development', path: '/human-development', icon: <SchoolIcon />, permission: 'dashboard:read' },
  { label: 'DC priorities', deptLabel: 'My priorities', citizenLabel: 'Progress & delays', path: '/exceptions', icon: <PriorityHighIcon />, permission: 'dashboard:read' },
  { label: 'DC review', path: '/meetings', icon: <GroupsIcon />, permission: 'meeting:manage', officerOnly: true },
  { label: 'Reports', path: '/reports', icon: <SummarizeIcon />, permission: 'report:export' },
  { label: 'Projects', path: '/projects', icon: <FolderIcon />, permission: 'project:read' },
  { label: 'Action tracker', path: '/actions', icon: <AssignmentIcon />, anyOf: ['action:update', 'action:manage'] },
  { label: 'Administration', path: '/administration', icon: <SettingsIcon />, anyOf: ['user:manage', 'master:manage', 'district:manage'], officerOnly: true },
  { label: 'System health', path: '/health', icon: <HealthAndSafetyIcon />, permission: 'dashboard:read', officerOnly: true },
] as const;

export function AppShell() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, hasPermission, isDepartmentScoped, isCitizen, logout } = useAuth();
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
  const districts = useQuery({
    queryKey: ['admin', 'districts'],
    queryFn: adminApi.districts,
  });
  const homeDistrict = profile?.isSuperAdmin
    ? undefined
    : districts.data?.find((district) => profile?.districtIds.includes(district.id)) ??
      (profile?.districtIds.length === 1 ? districts.data?.[0] : undefined);
  const districtName = homeDistrict?.name;
  const title = districtName
    ? isCitizen
      ? `${districtName} public dashboard`
      : `${districtName} District Dashboard`
    : (import.meta.env.VITE_APP_TITLE ?? 'District Development Works Monitoring');
  const visibleNav = isCitizen
    ? []
    : NAV_ITEMS.filter((item) => {
        if ('officerOnly' in item && item.officerOnly && isDepartmentScoped) {
          return false;
        }
        if ('permission' in item) {
          return hasPermission(item.permission);
        }
        return item.anyOf.some((permission) => hasPermission(permission));
      });

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.5, px: 2, alignItems: 'center', minHeight: 84 }}>
        <GovSeal size={46} />
        <Box>
          <Typography sx={{ color: govColors.gold, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em' }}>
            ARUNACHAL PRADESH
          </Typography>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            {districtName ?? (isCitizen ? 'Public view' : isDepartmentScoped ? 'Department desk' : 'DC Dashboard')}
          </Typography>
        </Box>
      </Toolbar>
      <Box sx={{ mx: 2, mb: 1, height: '1px', bgcolor: 'rgba(196,163,90,0.4)' }} />
      <List sx={{ px: 1, flex: 1, minHeight: 0, overflow: 'auto' }}>
        {visibleNav.map((item) => (

          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              color: 'inherit',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
              '&.Mui-selected': {
                bgcolor: 'rgba(255,255,255,0.12)',
                color: '#fff',
                boxShadow: `inset 3px 0 0 ${govColors.saffronBright}`,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
                '& .MuiListItemIcon-root': { color: govColors.gold },
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={
                isCitizen && 'citizenLabel' in item
                  ? item.citizenLabel
                  : isDepartmentScoped && 'deptLabel' in item
                    ? item.deptLabel
                    : item.label
              }
            />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ px: 2, py: 1.75, flexShrink: 0, borderTop: '1px solid rgba(196,163,90,0.35)' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', letterSpacing: '0.04em' }}>
          {districtName
            ? isCitizen
              ? `${districtName} · read only`
              : `${districtName} District`
            : 'Govt. of Arunachal Pradesh'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <TricolorStrip fixed />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          top: 5,
          width: { md: isCitizen ? '100%' : `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: isCitizen ? 0 : `${DRAWER_WIDTH}px` },
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: govColors.navyDark,
          color: '#fff',
          borderBottom: `3px solid ${govColors.gold}`,
        }}
      >
        <Toolbar>
          {!isDesktop && !isCitizen && (
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
          <Typography
            variant="subtitle1"
            fontWeight={650}
            noWrap
            sx={{ flexGrow: 1, minWidth: 0, fontFamily: '"Source Serif 4", Georgia, serif' }}
          >
            {isCitizen ? 'Public schemes' : title}
          </Typography>
          <Typography
            variant="body2"
            noWrap
            sx={{
              display: { xs: 'none', sm: 'block' },
              mr: 2,
              px: 1.25,
              py: 0.4,
              borderRadius: 99,
              bgcolor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.16)',
            }}
          >
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
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={() => void logout()}
            sx={{ border: '1px solid rgba(255,255,255,0.28)' }}
          >
            Sign out
          </Button>
        </Toolbar>
      </AppBar>
      {isCitizen ? null : (
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isDesktop ? (
          <Drawer
            variant="permanent"
            open
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                top: 5,
                height: 'calc(100% - 5px)',
                bgcolor: govColors.navy,
                color: '#fff',
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
                bgcolor: govColors.navy,
                color: '#fff',
              },
            }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          pt: { xs: 2, md: 3 },
          minWidth: 0,
          overflowX: 'auto',
          width: { md: isCitizen ? '100%' : `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        <Box sx={{ height: 5 }} />
        <Outlet />
      </Box>
    </Box>
  );
}
