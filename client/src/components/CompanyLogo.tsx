import React from 'react';
import { Box } from '@mui/material';
import { Business } from '@mui/icons-material';

interface CompanyLogoProps {
  variant?: 'full' | 'icon' | 'compact';
  size?: 'small' | 'medium' | 'large';
  showFallback?: boolean;
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({
  variant = 'full',
  size = 'medium',
  showFallback = true
}) => {
  const [imageError, setImageError] = React.useState(false);

  // Tamanhos baseados no variant e size
  const getSizes = () => {
    const sizeMap = {
      small: { height: 32, iconSize: 24 },
      medium: { height: 48, iconSize: 32 },
      large: { height: 64, iconSize: 40 },
    };
    return sizeMap[size];
  };

  const sizes = getSizes();

  // Caminho do logo - usuário deve colocar o arquivo aqui
  const logoPath = '/logo.png';

  // Fallback quando a imagem não existe ou falha ao carregar
  const renderFallback = () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: sizes.height,
        bgcolor: 'primary.main',
        borderRadius: 1,
        px: variant === 'icon' ? 1 : 2,
      }}
    >
      <Business sx={{ fontSize: sizes.iconSize, color: 'white' }} />
    </Box>
  );

  // Se houver erro ou não quiser mostrar o fallback, retorna o ícone
  if (imageError || !showFallback) {
    return renderFallback();
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: sizes.height,
      }}
    >
      <img
        src={logoPath}
        alt="Company Logo"
        style={{
          height: '100%',
          width: 'auto',
          objectFit: 'contain',
          maxWidth: variant === 'icon' ? sizes.height : 'none',
        }}
        onError={() => setImageError(true)}
      />
    </Box>
  );
};

export default CompanyLogo;
