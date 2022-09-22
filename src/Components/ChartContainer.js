import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '@mui/material';

import DataWarning from './DataWarning';
import TillInfo from './TillInfo';



export default function ChartContainer({ children, showWarning, showInfo, sx }) {
  return (
    <Box sx={{
      position: 'relative',
      boxSizing: 'border-box',
      padding: '5px 20px',
      maxWidth: 1400,
      width: '100%',
      margin: '0 auto'
    }}>
      <Box sx={sx}>
        {showWarning && <DataWarning />}
        {showInfo && <TillInfo />}
      </Box>
      {children}
    </Box>
  );
}

ChartContainer.propTypes = {
  children: PropTypes.element,
  showWarning: PropTypes.bool,
  showInfo: PropTypes.bool,
  sx: PropTypes.object
};