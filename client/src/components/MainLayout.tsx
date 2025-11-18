import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Stack,
  alpha,
  useTheme,
  Button,
  Collapse,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft,
  Assignment,
  Dashboard,
  Settings,
  Logout,
  ExpandLess,
  ExpandMore,
  CheckCircle,
  TableChart,
  ViewList,
  Analytics,
  Person,
  Email,
  Business,
  Work,
  Group,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';
import CompanyLogo from './CompanyLogo';

const drawerWidth = 240;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [open, setOpen] = useState(true);
  const [approvalMenuOpen, setApprovalMenuOpen] = useState(true);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const theme = useTheme();
  const { t } = useLanguage();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    {
      id: 'approvals',
      title: t?.menu?.approvals || 'Aprovações',
      icon: <Assignment />,
      expandable: true,
      submenu: [
        {
          id: 'documents-table',
          title: t?.menu?.documentApprovals || 'Aprovações de Documentos',
          icon: <TableChart />,
          path: '/documents',
        },
        {
          id: 'documents-cards',
          title: t?.menu?.cardView || 'Visão em Cards',
          icon: <ViewList />,
          path: '/documents-cards',
          disabled: true, // Exemplo para futura implementação
        },
      ],
    },
    {
      id: 'dashboard',
      title: t?.menu?.dashboard || 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
      disabled: true, // Exemplo para futura implementação
    },
    {
      id: 'analytics',
      title: t?.menu?.analytics || 'Análises',
      icon: <Analytics />,
      path: '/analytics',
      disabled: true, // Exemplo para futura implementação
    },
  ];

  const isPathActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: open ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { sm: open ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          background: theme.palette.background.paper,
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important', py: 1 }}>
          <IconButton
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            size="small"
            sx={{
              mr: 2,
              color: 'text.secondary',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
            }}
          >
            {open ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              noWrap
              component="div"
              fontWeight={600}
              fontSize="1.1rem"
              color="text.primary"
            >
              {t?.header?.title || 'AprovaFácil'}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <LanguageSelector />

            <Divider
              orientation="vertical"
              flexItem
              sx={{
                bgcolor: alpha(theme.palette.divider, 0.3),
                mx: 0.5,
                height: '32px',
                alignSelf: 'center',
              }}
            />

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.75,
                borderRadius: '8px',
                background: alpha(theme.palette.primary.main, 0.04),
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.08),
                  borderColor: alpha(theme.palette.divider, 0.5),
                },
              }}
              onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  mr: 1,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  fontSize: '0.9rem',
                }}
              >
                {(user?.name || user?.displayName || user?.email)?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, lineHeight: 1.2, fontSize: '0.875rem' }}>
                  {user?.name || user?.displayName || user?.username || user?.email?.split('@')[0]}
                </Typography>
                {user?.role && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    {user.role}
                  </Typography>
                )}
              </Box>
            </Box>

            <Button
              onClick={handleLogout}
              startIcon={<Logout fontSize="small" />}
              size="small"
              sx={{
                borderRadius: '8px',
                px: 1.5,
                py: 0.75,
                color: 'text.secondary',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.04),
                  color: 'error.main',
                },
              }}
            >
              {t?.common?.logout || 'Sair'}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
        sx={{
          width: open ? drawerWidth : 0,
          flexShrink: 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: theme.palette.background.paper,
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            transition: theme.transitions.create('transform', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
            py: 1.5,
            minHeight: '56px !important',
            background: alpha(theme.palette.primary.main, 0.04),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            opacity: 0.85,
          }}>
            <CompanyLogo variant="full" size="small" />
          </Box>
        </Toolbar>

        <Divider />

        <List sx={{ px: 2, py: 2 }}>
          {menuItems.map((item) => (
            <React.Fragment key={item.id}>
              {item.expandable ? (
                <>
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => setApprovalMenuOpen(!approvalMenuOpen)}
                      sx={{
                        borderRadius: '8px',
                        py: 0.75,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      <ListItemIcon sx={{
                        color: theme.palette.primary.main,
                        minWidth: 36,
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        primaryTypographyProps={{
                          fontWeight: 500,
                          fontSize: '0.9rem',
                        }}
                      />
                      {approvalMenuOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={approvalMenuOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.submenu?.map((subItem) => (
                        <ListItem key={subItem.id} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemButton
                            onClick={() => !subItem.disabled && navigate(subItem.path)}
                            disabled={subItem.disabled}
                            selected={isPathActive(subItem.path)}
                            sx={{
                              pl: 3.5,
                              py: 0.75,
                              borderRadius: '8px',
                              '&.Mui-selected': {
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                },
                              },
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                              },
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                color: isPathActive(subItem.path)
                                  ? theme.palette.primary.main
                                  : 'inherit',
                                minWidth: 32,
                              }}
                            >
                              {subItem.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={subItem.title}
                              primaryTypographyProps={{
                                fontWeight: isPathActive(subItem.path) ? 500 : 400,
                                fontSize: '0.85rem',
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </>
              ) : (
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => !item.disabled && item.path && navigate(item.path)}
                    disabled={item.disabled}
                    selected={item.path ? isPathActive(item.path) : false}
                    sx={{
                      borderRadius: '8px',
                      py: 0.75,
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        },
                      },
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: item.path && isPathActive(item.path)
                          ? theme.palette.primary.main
                          : 'inherit',
                        minWidth: 36,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        fontWeight: item.path && isPathActive(item.path) ? 500 : 400,
                        fontSize: '0.9rem',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              )}
            </React.Fragment>
          ))}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        <Divider />

        <List sx={{ px: 2, py: 1.5 }}>
          <ListItem disablePadding>
            <ListItemButton
              disabled
              sx={{
                borderRadius: '8px',
                py: 0.75,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Settings />
              </ListItemIcon>
              <ListItemText
                primary={t?.menu?.settings || 'Configurações'}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          bgcolor: 'grey.50',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          width: `calc(100% - ${open ? drawerWidth : 0}px)`,
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={() => setProfileMenuAnchor(null)}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 320,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Profile Header */}
        <Box sx={{ px: 2, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 56,
                height: 56,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                fontSize: '1.5rem',
              }}
            >
              {(user?.name || user?.displayName || user?.email)?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {user?.name || user?.displayName || user?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* User Details */}
        <Box sx={{ px: 2, py: 2 }}>
          <Stack spacing={1.5}>
            {user?.username && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Person fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Usuário
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {user.username}
                  </Typography>
                </Box>
              </Box>
            )}

            {user?.role && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Work fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Cargo
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {user.role}
                  </Typography>
                </Box>
              </Box>
            )}

            {user?.department && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Business fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Departamento
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {user.department}
                  </Typography>
                </Box>
              </Box>
            )}

            {user?.groups && user.groups.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Group fontSize="small" color="action" sx={{ mt: 0.5 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    Grupos
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {user.groups.slice(0, 3).map((group, index) => (
                      <Chip
                        key={index}
                        label={group.display || group.value}
                        size="small"
                        variant="outlined"
                        sx={{ height: 24, fontSize: '0.75rem' }}
                      />
                    ))}
                    {user.groups.length > 3 && (
                      <Chip
                        label={`+${user.groups.length - 3}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 24, fontSize: '0.75rem' }}
                      />
                    )}
                  </Stack>
                </Box>
              </Box>
            )}
          </Stack>
        </Box>

        <Divider />

        {/* Menu Actions */}
        <MenuItem
          disabled
          sx={{
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
          }}
        >
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Configurações" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            setProfileMenuAnchor(null);
            handleLogout();
          }}
          sx={{
            py: 1.5,
            px: 2,
            color: theme.palette.error.main,
            '&:hover': {
              bgcolor: alpha(theme.palette.error.main, 0.08),
            },
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary={t?.common?.logout || 'Sair'} />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MainLayout;
