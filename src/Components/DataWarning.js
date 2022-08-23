import React from 'react';

import { Box } from '@mui/material';


export default function DataWarning() {
  return (
    <Box sx={{
      backgroundColor: 'rgba(255,0,0,0.1)',
      borderBottom: '1px solid rgba(200,0,0,0.1)'
    }}>
      <Box style={{
        color: 'red',
        textAlign: 'center',
        width: '600px',
        margin: '5px auto',
      }}>
        Warning: Evapotranspiration data was unavailable for this location/time. As a results, the displayed data are not accurate.
      </Box>
    </Box>
  );
}