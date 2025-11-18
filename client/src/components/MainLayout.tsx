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
  Settings,
  Logout,
  ExpandLess,
  ExpandMore,
  CheckCircle,
  TableChart,
  ViewList,
  Person,
  Email,
  Business,
  Work,
  Group,
  Language,
  ShoppingCart,
  AccountTree,
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
  const [approvalMenuOpen, setApprovalMenuOpen] = useState(true);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const theme = useTheme();
  const { t } = useLanguage();

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
          disabled: true,
        },
      ],
    },
    {
      id: 'purchase-center',
      title: t?.menu?.purchaseCenter || 'Central de Compras',
      icon: <ShoppingCart />,
      path: '/purchase-center',
      disabled: true,
    },
    {
      id: 'registration-flow',
      title: t?.menu?.registrationFlow || 'Fluxo de Cadastros',
      icon: <AccountTree />,
      path: '/registration-flow',
      disabled: true,
    },
  ];

  const isPathActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Drawer */}
      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: theme.palette.background.paper,
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
            py: 1.5,
            minHeight: '56px',
            background: alpha(theme.palette.primary.main, 0.04),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            opacity: 0.85,
          }}>
            <CompanyLogo variant="full" size="small" />
          </Box>
        </Box>

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

        {/* User Profile Section */}
        <Box sx={{ px: 2, py: 2 }}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: '8px',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: `1px solid transparent`,
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.03),
                borderColor: alpha(theme.palette.divider, 0.2),
              },
            }}
            onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  mr: 1.25,
                  background: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {(user?.name || user?.displayName || user?.email)?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 500,
                    lineHeight: 1.3,
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.name || user?.displayName || user?.username || user?.email?.split('@')[0]}
                </Typography>
              </Box>
            </Box>
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: 0.5
              }}
            >
              <LanguageSelector />
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* Logout */}
        <List sx={{ px: 2, py: 1.5 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: '8px',
                py: 0.75,
                color: 'error.main',
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.04),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'error.main' }}>
                <Logout sx={{ fontSize: '1.2rem' }} />
              </ListItemIcon>
              <ListItemText
                primary={t?.common?.logout || 'Sair'}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
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
          width: `calc(100% - ${drawerWidth}px)`,
        }}
      >
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
      </Menu>
    </Box>
  );
};

export default MainLayout;
