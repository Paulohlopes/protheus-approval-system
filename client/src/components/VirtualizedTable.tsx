import React, { useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  Box,
  TableCell,
  TableRow,
  Paper,
  Table,
  TableHead,
  TableBody,
  Checkbox,
} from '@mui/material';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => string;
}

interface VirtualizedTableProps {
  columns: Column[];
  data: any[];
  rowHeight?: number;
  height?: number;
  onRowClick?: (row: any) => void;
  selectedRows?: string[];
  onSelectRow?: (rowId: string) => void;
  rowIdField?: string;
}

const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  columns,
  data,
  rowHeight = 53,
  height = 600,
  onRowClick,
  selectedRows = [],
  onSelectRow,
  rowIdField = 'id',
}) => {
  const isSelected = useCallback(
    (rowId: string) => selectedRows.includes(rowId),
    [selectedRows]
  );

  const handleSelectRow = useCallback(
    (rowId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      if (onSelectRow) {
        onSelectRow(rowId);
      }
    },
    [onSelectRow]
  );

  // Row renderer
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const row = data[index];
      const rowId = row[rowIdField];
      const selected = isSelected(rowId);

      return (
        <TableRow
          hover
          role="checkbox"
          aria-checked={selected}
          tabIndex={-1}
          selected={selected}
          onClick={() => onRowClick && onRowClick(row)}
          style={{
            ...style,
            cursor: onRowClick ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid rgba(224, 224, 224, 1)',
          }}
        >
          {onSelectRow && (
            <TableCell
              padding="checkbox"
              sx={{
                flex: '0 0 60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Checkbox
                checked={selected}
                onClick={(e) => handleSelectRow(rowId, e)}
                color="primary"
              />
            </TableCell>
          )}
          {columns.map((column) => {
            const value = row[column.id];
            const formattedValue = column.format ? column.format(value) : value;

            return (
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                sx={{
                  flex: `1 0 ${column.minWidth || 150}px`,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {formattedValue}
              </TableCell>
            );
          })}
        </TableRow>
      );
    },
    [data, columns, onRowClick, selectedRows, onSelectRow, rowIdField, isSelected, handleSelectRow]
  );

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ overflow: 'hidden' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ display: 'flex' }}>
              {onSelectRow && (
                <TableCell
                  padding="checkbox"
                  sx={{
                    flex: '0 0 60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Checkbox disabled color="primary" />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{
                    flex: `1 0 ${column.minWidth || 150}px`,
                    fontWeight: 'bold',
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
        </Table>

        {/* Virtualized Body */}
        <List
          height={height}
          itemCount={data.length}
          itemSize={rowHeight}
          width="100%"
          overscanCount={5}
        >
          {Row}
        </List>
      </Box>
    </Paper>
  );
};

export default React.memo(VirtualizedTable);
