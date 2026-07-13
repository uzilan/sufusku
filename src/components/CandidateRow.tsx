import { Box, Typography } from '@mui/material';

interface CandidateRowProps {
  candidates: Set<number>;
}

const CandidateRow = ({ candidates }: CandidateRowProps) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(9, 1fr)',
      width: '100%',
      position: 'absolute',
      bottom: { xs: 1.5, sm: 2 },
      left: 0,
      px: 0.15,
      textAlign: 'center',
    }}
  >
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
      <Typography
        key={num}
        sx={{
          fontSize: { xs: '6.5px', sm: '7.5px', md: '8px' },
          fontWeight: 700,
          color: candidates.has(num) ? 'primary.light' : 'transparent',
          lineHeight: 1,
        }}
      >
        {num}
      </Typography>
    ))}
  </Box>
);

export default CandidateRow;
