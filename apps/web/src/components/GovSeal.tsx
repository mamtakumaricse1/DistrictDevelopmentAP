import { Box } from '@mui/material';

type GovSealProps = {
  size?: number;
};

export function GovSeal({ size = 72 }: GovSealProps) {
  return (
    <Box
      component="svg"
      width={size}
      height={size}
      viewBox="0 0 80 80"
      role="img"
      aria-label="District administration seal"
      sx={{ display: 'block', flexShrink: 0 }}
    >
      <circle cx="40" cy="40" r="38" fill="#071E33" stroke="#C4A35A" strokeWidth="2.4" />
      <circle cx="40" cy="40" r="32.5" fill="none" stroke="#C4A35A" strokeWidth="0.7" />
      <path d="M18 50 L31 32 L40 42 L49 26 L62 50 Z" fill="#F3E6C4" />
      <path d="M24 50 L34 38 L41 45 L51 33 L58 50 Z" fill="#FFF8EA" opacity="0.55" />
      <path d="M16 52 H64" stroke="#C4A35A" strokeWidth="1.2" />
      <text
        x="40"
        y="64"
        textAnchor="middle"
        fill="#C4A35A"
        fontSize="8"
        fontFamily="Georgia, serif"
        letterSpacing="1.5"
      >
        DC
      </text>
    </Box>
  );
}
