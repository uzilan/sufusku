import { Box, Typography } from '@mui/material';

interface CandidateRowProps {
  candidates: Set<number>;
}

const CandidateRow = ({ candidates }: CandidateRowProps) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
      position: 'absolute',
      inset: 0,
    }}
  >
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
      <Typography
        key={num}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: { xs: '9px', sm: '10px', md: '11px' },
          fontWeight: 700,
          color: candidates.has(num) ? 'primary.light' : 'transparent',
          opacity: candidates.has(num) ? 0.35 : 1,
          lineHeight: 1,
        }}
      >
        {num}
      </Typography>
    ))}
  </Box>
);

export default CandidateRow;
