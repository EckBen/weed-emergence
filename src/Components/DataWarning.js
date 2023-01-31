import React from 'react';

import { Zoom } from '@mui/material';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const WarningTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: 'rgb(255,230,230)',
    border: '1px solid rgb(255,120,120)',
    color: 'rgb(255,80,80)',
    textAlign: 'center',
    maxWidth: 200,
  },
}));

export default function DataWarning() {
  return (
    <WarningTooltip
      TransitionComponent={Zoom}
      title='Warning: Evapotranspiration data was unavailable for this location/time (data is unavailable from November through February). As a results, the displayed data are not accurate.'
    >
      <WarningAmberIcon sx={{ color: 'rgb(205,0,0)' }} />
    </WarningTooltip>
  );
}
