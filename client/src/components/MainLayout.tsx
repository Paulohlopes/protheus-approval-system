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
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';
import CompanyLogo from './CompanyLogo';

const drawerWidth = 280;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [open, setOpen] = useState(true);
  const [approvalMenuOpen, setApprovalMenuOpen] = useState(true);
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
        sx={{
          width: { sm: open ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { sm: open ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            {open ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div" fontWeight={700}>
              {t?.header?.title || 'AprovaFácil'}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <LanguageSelector />

            <Divider
              orientation="vertical"
              flexItem
              sx={{
                bgcolor: alpha(theme.palette.common.white, 0.2),
                mx: 1,
                height: '40px',
                alignSelf: 'center',
              }}
            />

            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1,
              borderRadius: '12px',
              background: alpha(theme.palette.common.white, 0.1),
            }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  mr: 1,
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                  fontSize: '1rem',
                }}
              >
                {user?.email?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2" sx={{ color: 'white', display: { xs: 'none', sm: 'block' } }}>
                {user?.email?.split('@')[0]}
              </Typography>
            </Box>

            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<Logout />}
              sx={{
                borderRadius: '12px',
                px: 2,
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
            background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
            borderRight: `1px solid ${theme.palette.divider}`,
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
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            filter: 'brightness(0) invert(1)', // Makes the logo white
          }}>
            <CompanyLogo variant="full" size="medium" />
          </Box>
        </Toolbar>

        <Divider />

        <List sx={{ px: 2, py: 3 }}>
          {menuItems.map((item) => (
            <React.Fragment key={item.id}>
              {item.expandable ? (
                <>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemButton
                      onClick={() => setApprovalMenuOpen(!approvalMenuOpen)}
                      sx={{
                        borderRadius: '12px',
                        mb: 0.5,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        primaryTypographyProps={{
                          fontWeight: 600,
                        }}
                      />
                      {approvalMenuOpen ? <ExpandLess /> : <ExpandMore />}
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
                              pl: 4,
                              borderRadius: '12px',
                              '&.Mui-selected': {
                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.16),
                                },
                              },
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                              },
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                color: isPathActive(subItem.path)
                                  ? theme.palette.primary.main
                                  : 'inherit',
                                minWidth: 40,
                              }}
                            >
                              {subItem.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={subItem.title}
                              primaryTypographyProps={{
                                fontWeight: isPathActive(subItem.path) ? 600 : 400,
                                fontSize: '0.9rem',
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </>
              ) : (
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => !item.disabled && item.path && navigate(item.path)}
                    disabled={item.disabled}
                    selected={item.path ? isPathActive(item.path) : false}
                    sx={{
                      borderRadius: '12px',
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.16),
                        },
                      },
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: item.path && isPathActive(item.path)
                          ? theme.palette.primary.main
                          : 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        fontWeight: item.path && isPathActive(item.path) ? 600 : 400,
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

        <List sx={{ px: 2, py: 2 }}>
          <ListItem disablePadding>
            <ListItemButton
              disabled
              sx={{
                borderRadius: '12px',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText primary={t?.menu?.settings || 'Configurações'} />
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
    </Box>
  );
};

export default MainLayout;
