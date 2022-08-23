import React from 'react';
import PropTypes from 'prop-types';

import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { Box, TextField, FormLabel } from '@mui/material';
import { formatISO } from 'date-fns';

import LocationPicker from './LocationPicker/LocationPicker';
import TillDates from './TillDates';

import {
  allowedStates,
  bbox,
  name,
  token,
  storeLocations
} from './LocationPicker/LocationVariables';

import {
  yearItems
} from '../AppConfigs';


export default function OptionsPanel({
  selected,
  setSelected,
  locations,
  setLocations,
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
      left: show ? 0 : -173,
      height: '100vh',
      width: '175px',
      zIndex: 10,
      backgroundColor: 'white',
      borderRight: '2px solid rgb(207, 112, 0)',
    }}>
      <Box
        sx={{
          background: 'linear-gradient(90deg, rgba(207,112,0,1) 0%, rgba(237,142,0,1) 100%)',
          padding: '6px 4px 6px 2px',
          borderRadius: '0px 6px 6px 0px',
          position: 'absolute',
          right: -32,
          top: 35,
          '&:hover': {
            cursor: 'pointer'
          }
        }}
        onClick={() => setShow(!show)}
      >
        {show ?
          <KeyboardDoubleArrowLeftIcon sx={{ color: 'white' }}/>
          :
          <KeyboardDoubleArrowRightIcon sx={{ color: 'white' }}/>
        }
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
          <LocationPicker
            selected={selected}
            locations={locations}
            newLocationsCallback={(s, l) => storeLocations(s, l, name, setSelected, setLocations)}
            token={token}
            bbox={bbox}
            allowedStates={allowedStates}
            modalZIndex={1}
          />
        </Box>
        <TextField
          select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          variant='standard'
          sx={{textAlign: 'center'}}
          label='Season'
          disabled
        >
          {yearItems(2020,2022)}
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
  selected: PropTypes.string,
  setSelected: PropTypes.func,
  locations: PropTypes.object,
  setLocations: PropTypes.func,
  year: PropTypes.number,
  setYear: PropTypes.func,
  tillDates: PropTypes.array,
  setTillDates: PropTypes.func,
  soilTemps: PropTypes.object,
  show: PropTypes.bool,
  setShow: PropTypes.func
};