import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  FormLabel,
  FormControlLabel,
  Checkbox,
  Button
} from '@mui/material';

import { weedSpecies } from '../Scripts/weedModels';

export default function SpeciesSelectors({ showWeeds, handleToggleWeed }) {
  return (
    <Box>
      <FormLabel color='success' sx={{ fontSize: '12.5px' }}>Weed Species</FormLabel>

      <ul>
        <li><Box sx={{ margin: '10px auto', width: 'fit-content' }}><Button sx={{ fontSize: '12px' }}variant='contained' color='success' onClick={() => handleToggleWeed('all')}>Select All</Button></Box></li>
        <li><Box sx={{ margin: '10px auto', width: 'fit-content' }}><Button sx={{ fontSize: '12px' }}variant='contained' color='error' onClick={() => handleToggleWeed('none')}>Select None</Button></Box></li>
      
        {weedSpecies.map(weedObj => (
          <li key={weedObj.id}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showWeeds[weedObj.id]}
                  onChange={() => handleToggleWeed(weedObj.id)}
                  sx={{
                    color: weedObj.color,
                    '&.Mui-checked': {
                      color: weedObj.color,
                    },
                  }}
                />
              }
              label={weedObj.name}
            />
          </li>
        ))}
      </ul>
    </Box>
  );
}

SpeciesSelectors.propTypes = {
  showWeeds: PropTypes.object,
  handleToggleWeed: PropTypes.func
};