import React from 'react';
import PropTypes from 'prop-types';
import { Marker } from 'react-map-gl';

import { Box } from '@mui/material';

import redPin from './pin-red.svg';
import bluePin from './pin-blue.svg';



export default function Markers(props) {
  return <>
    {Object.keys(props.pastLocations).map(key => {
      const loc = props.pastLocations[key];
      const isSelected = loc.id === props.currentLocation.id;
          
      return (
        <Marker
          key={loc.address}
          longitude={loc.lng}
          latitude={loc.lat}
          onClick={(e) => props.onMarkerClick(e, loc)}
          style={{ zIndex: isSelected ? 2 : 1, top: -20 }}
        >
          <Box
            sx={{
              border: 'none',
              cursor: 'pointer',
              height: '40px',
              width: '20px',
              backgroundImage: `url(${isSelected ? redPin : bluePin})`
            }}
            onMouseEnter={() => props.onMarkerMouseEnter({ ...loc, isSelected })}
            onMouseLeave={props.onMarkerMouseLeave}
            onContextMenu={() => props.onMarkerRightClick(loc, isSelected)}
          ></Box>
        </Marker>
      );
    })}
  </>;
}

Markers.propTypes = {
  currentLocation: PropTypes.object,
  pastLocations: PropTypes.object,
  onMarkerMouseEnter: PropTypes.func,
  onMarkerMouseLeave: PropTypes.func,
  onMarkerClick: PropTypes.func,
  onMarkerRightClick: PropTypes.func
};