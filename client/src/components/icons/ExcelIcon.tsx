import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

const ExcelIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path
        fill="#217346"
        d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"
      />
      <path
        fill="#ffffff"
        d="M14,2V8H20L14,2M11.5,15L9.8,12.3L8.1,15H6.5L9,11.5L6.5,8H8.1L9.8,10.7L11.5,8H13.1L10.6,11.5L13.1,15H11.5Z"
      />
    </SvgIcon>
  );
};

export default ExcelIcon;
