import React from 'react';
import PropTypes from 'prop-types';

import { Box, TextField, FormLabel } from '@mui/material';
import { formatISO } from 'date-fns';

import TillDates from './TillDates';

import {
  yearItems
} from '../AppConfigs';


export default function OptionsPanel({
  location,
  year,
  setYear,
  tillDates,
  setTillDates,
  soilTemps,
  show,
  setShow
}) {
  return (
    <Box sx={{
      boxSizing: 'border-box',
      position: 'fixed',
      top: 0,
      left: show ? 0 : -198,
      height: '100vh',
      width: '200px',
      zIndex: 3,
      backgroundColor: 'white',
      borderRight: '2px solid rgb(207, 112, 0)',
      transition: 'left 0.5s cubic-bezier(.17,.67,.5,1.01)'
    }}>
      <Box
        sx={{
          background: 'linear-gradient(0deg, rgba(207,112,0,1) 0%, rgba(237,142,0,1) 100%)',
          padding: '4px 6px',
          borderRadius: '6px 6px 0px 0px',
          position: 'absolute',
          right: -46,
          top: 85,
          transform: 'rotate(90deg)',
          fontSize: 10,
          color: 'white',
          '&:hover': {
            cursor: 'pointer'
          }
        }}
        onClick={() => setShow(show ? '' : 'options')}
      >
        {show ? 'Hide Options' : 'Show Options'}
      </Box>

      <Box sx={{
        boxSizing: 'border-box',
        padding: '20px 4px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        overflowY: 'auto'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormLabel color='success' sx={{ fontSize: '12.5px' }}>Location</FormLabel>
          <Box sx={{ textAlign: 'center' }}>{location}</Box>
        </Box>
        <TextField
          select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          variant='standard'
          sx={{textAlign: 'center'}}
          label='Season'
        >
          {yearItems(2022, new Date().getFullYear())}
        </TextField>
        <TillDates
          tillDates={tillDates}
          setTillDates={setTillDates}
          dateRange={Object.keys(soilTemps).length > 0 ? [soilTemps.dates[0], soilTemps.dates[soilTemps.dates.length - 1]] : [formatISO(new Date()), formatISO(new Date())]}
        />
      </Box>
    </Box>
  );
}

OptionsPanel.propTypes = {
  location: PropTypes.string,
  year: PropTypes.number,
  setYear: PropTypes.func,
  tillDates: PropTypes.array,
  setTillDates: PropTypes.func,
  soilTemps: PropTypes.object,
  show: PropTypes.bool,
  setShow: PropTypes.func
};