import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  Box,
  Button,
  Stack,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Close,
} from '@mui/icons-material';

interface BulkActionsBarProps {
  selectedCount: number;
  totalPendingCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  totalPendingCount,
  allSelected,
  onSelectAll,
  onBulkApprove,
  onBulkReject,
  onCancel,
  isProcessing,
}) => {
  const hasSelection = selectedCount > 0;
  const isIndeterminate = hasSelection && selectedCount < totalPendingCount;

  return (
    <Card sx={{ mb: 3, borderRadius: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
      <CardContent>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allSelected}
                    indeterminate={isIndeterminate}
                    onChange={onSelectAll}
                    color="primary"
                  />
                }
                label="Selecionar todos"
              />
              {hasSelection && (
                <Typography variant="body2" color="text.secondary">
                  {selectedCount} de {totalPendingCount} selecionados
                </Typography>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
              {hasSelection && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={onBulkApprove}
                    disabled={isProcessing}
                    sx={{ borderRadius: 2 }}
                  >
                    Aprovar ({selectedCount})
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={onBulkReject}
                    disabled={isProcessing}
                    sx={{ borderRadius: 2 }}
                  >
                    Rejeitar ({selectedCount})
                  </Button>
                </>
              )}
              <Button
                variant="text"
                startIcon={<Close />}
                onClick={onCancel}
                sx={{ borderRadius: 2 }}
              >
                Cancelar
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default BulkActionsBar;