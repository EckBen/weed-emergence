import React from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Button,
  TextField,
  FormLabel,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';



export default function TillDates({ tillDates, setTillDates, dateRange }) {
  const dateElems = tillDates.map((date, i) => {
    return (
      <Box
        key={i}
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center'
        }}
      >
        <TextField
          type='date'
          value={date}
          onChange={(e) => {
            const newTillDates = [...tillDates];
            newTillDates[i] = e.target.value;
            setTillDates(newTillDates);
          }}
          sx={{ marginTop: 1, width: 120 }}
          color='success'
          variant='standard'
          InputProps={{inputProps: { min: dateRange[0], max: dateRange[1]} }}
        />

        <IconButton
          size='small'
          color='error'
          sx={{
            position: 'relative',
            top: '4px'
          }}
          onClick={() => {
            const newTillDates = [...tillDates];
            newTillDates.splice(i,1);
            setTillDates(newTillDates);
          }}
        >
          <CloseIcon fontSize='small' color='error' />
        </IconButton>
      </Box>
    );
  });
  
  return (
    <Box>
      <FormLabel color='success' sx={{ fontSize: '12.5px' }}>Till Events</FormLabel>

      <Box sx={{
        textAlign: 'center',
        marginTop: '3px'
      }}>
        <Button
          onClick={() => setTillDates(prev => [...prev, dateRange[0]])}
          sx={{
            marginTop: '10px',
            fontSize: 12,
            backgroundColor: 'rgb(237, 142, 0)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgb(207, 112, 0)'
            }
          }}
        >Add Till Event</Button>
      </Box>

      {dateElems}
    </Box>
  );
}

TillDates.propTypes = {
  tillDates: PropTypes.array,
  setTillDates: PropTypes.func,
  dateRange: PropTypes.array
};