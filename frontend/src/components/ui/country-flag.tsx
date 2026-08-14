import type { HTMLAttributes } from 'react';

const FLAG_CODES: Record<string, string> = {
  BR: '🇧🇷',
  BO: '🇧🇴',
  CO: '🇨🇴',
  ID: '🇮🇩',
  PE: '🇵🇪',
};

interface CountryFlagProps extends HTMLAttributes<HTMLSpanElement> {
  countryCode?: string | null;
  countryName?: string | null;
  size?: 'sm' | 'md';
}

export function CountryFlag({ countryCode, countryName, size = 'md', className, ...props }: CountryFlagProps) {
  const flag = countryCode ? FLAG_CODES[countryCode.toUpperCase()] : undefined;
  if (!flag) return null;

  return (
    <span
      role="img"
      aria-label={countryName ?? countryCode ?? undefined}
      title={countryName ?? undefined}
      className={`${size === 'sm' ? 'text-base' : 'text-xl'} inline-flex leading-none ${className ?? ''}`}
      {...props}
    >
      {flag}
    </span>
  );
}
