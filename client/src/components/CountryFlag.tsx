import React from 'react';
import * as flags from 'country-flag-icons/react/3x2';

interface CountryFlagProps {
  country: string;
  size?: number;
}

const CountryFlag: React.FC<CountryFlagProps> = ({ country, size = 20 }) => {
  // Map country codes to flag components
  const FlagComponent = (flags as any)[country] || flags.BR;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'middle',
        width: size,
        height: size * 0.67, // 3:2 aspect ratio
      }}
    >
      <FlagComponent style={{ width: '100%', height: '100%', borderRadius: 2 }} />
    </span>
  );
};

export default CountryFlag;
