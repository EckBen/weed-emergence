import React, { useRef } from 'react';
import PropTypes from 'prop-types';

import { Box, Button } from '@mui/material';

import { bbox, token, allowedStates } from './LocationVariables';
import './LocationPicker.css';

import Map from './Map';
import MapBar from './MapBar';



export default function LocationPicker(props) {
  // Allows MapBar to fly to new location on Map
  const mapRef = useRef(null);

  return (
    <Box sx={{
      height: '100vh',
      width: '100vw'
    }}>
      <MapBar
        token={token}
        bbox={bbox}
        allowedStates={allowedStates}
        mapRef={mapRef}
        handleChangeLocations={props.newLocationsCallback}
        setShow={props.setShow}
        show={props.showAddressSearch}
      />

      <Button
        sx={{
          position: 'absolute',
          bottom: 15,
          right: 15,
          zIndex: 2,
          fontSize: 12,
          backgroundColor: 'rgb(237, 142, 0)',
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgb(207, 112, 0)'
          }
        }}
        onClick={() => props.setShow('addressSearch')}
      >Search for Address</Button>

      <Map
        token={token}
        allowedStates={allowedStates}
        bbox={bbox}
        mapRef={mapRef}
        handleChangeLocations={props.newLocationsCallback}
        currentLocation={props.locations[props.selected]}
        pastLocations={props.locations}
      />
    </Box>
  );
}

LocationPicker.propTypes = {
  modalZIndex: PropTypes.number,
  newLocationsCallback: PropTypes.func,
  selected: PropTypes.string,
  locations: PropTypes.object,
  showAddressSearch: PropTypes.bool,
  setShow: PropTypes.func
};