import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Settings,
  Description,
  AccountTree,
  Group,
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { useLanguage } from '../contexts/LanguageContext';
import TemplateManager from '../components/admin/TemplateManager';
import WorkflowManager from '../components/admin/WorkflowManager';
import ApprovalGroupManager from '../components/admin/ApprovalGroupManager';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const { user } = useAuthStore();
  const { t } = useLanguage();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Check if user is admin
  if (!user?.isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          <AlertTitle>Acesso Negado</AlertTitle>
          Você não tem permissão para acessar esta página. Apenas administradores podem gerenciar
          configurações do sistema.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Settings fontSize="large" color="primary" />
          <Typography variant="h4" component="h1" fontWeight={600}>
            Administração
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Gerencie templates de formulários, workflows de aprovação e configurações do sistema
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="admin tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
            },
          }}
        >
          <Tab
            icon={<Description />}
            iconPosition="start"
            label="Templates de Formulários"
            id="admin-tab-0"
            aria-controls="admin-tabpanel-0"
          />
          <Tab
            icon={<AccountTree />}
            iconPosition="start"
            label="Workflows de Aprovação"
            id="admin-tab-1"
            aria-controls="admin-tabpanel-1"
          />
          <Tab
            icon={<Group />}
            iconPosition="start"
            label="Grupos de Aprovação"
            id="admin-tab-2"
            aria-controls="admin-tabpanel-2"
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={currentTab} index={0}>
        <TemplateManager />
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <WorkflowManager />
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <ApprovalGroupManager />
      </TabPanel>
    </Container>
  );
};

export default AdminPage;
