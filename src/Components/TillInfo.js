import React from 'react';

import { Zoom } from '@mui/material';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';

const InfoTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: 'rgb(230,230,255)',
    border: '1px solid rgb(120,120,255)',
    color: 'rgb(80,80,255)',
    textAlign: 'center',
    maxWidth: 200
  },
}));


export default function TillInfo() {
  return (
    <InfoTooltip
      TransitionComponent={Zoom}
      title="Information about till events."
    >
      <InfoIcon sx={{ color: '#2f6dd5' }}/>
    </InfoTooltip>
  );
}