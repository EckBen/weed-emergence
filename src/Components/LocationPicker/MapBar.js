import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Button,
  TextField
} from '@mui/material';


export default function MapBar({ token, allowedStates, bbox, mapRef, handleChangeLocations, setShow, show }) {
  const [address, setAddress] = useState('');

  // Handles getting location from mapbox geocoding API based on user input, restricts locations to be within bounds, updates state and flys to new location
  const handleSearch = () => {
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${address.split(' ').join('%20')}.json?proximity=-75.37,43.21&country=US&types=postcode,place,address&access_token=${token}`, { method: 'GET' })
      .then(response => response.json())
      .then(jData => {
        const newLocation = jData.features.reduce((acc, feat) => {
          const region = feat.context.find((c) => c.id.includes('region') && (!allowedStates || allowedStates.includes(c.text)));
          
          if (!acc && region && feat.center[0] >= bbox.west && feat.center[1] >= bbox.south) {
            const type = feat.place_type[0];
            
            let address;
            if (type === 'postcode') {
              address = feat.place_name.split(',').slice(0,2).join(',');
            } else if (type === 'place') {
              address = `${feat.text}, ${region.text}`;
            } else if (type === 'address') {
              const city = feat.context.find((c) => c.id.includes('place'));
              address = `${feat.text}, ${city.text}, ${region.text}`;
            }
  
            return {
              address,
              lng: feat.center[0],
              lat: feat.center[1]
            };
          }

          return acc;
        }, false);

        if (newLocation) {
          setAddress(newLocation.address);
          handleChangeLocations('add', newLocation);
          mapRef.current.flyTo({
            center: [newLocation.lng, newLocation.lat],
            speed: 0.8,
            essential: true
          });
        }
      })
      .catch(e => {
        console.log(e);
        return false;
      });
  };


  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      backgroundColor: 'white',
      borderTop: '2px solid rgb(207, 112, 0)',
      position: 'fixed',
      bottom: show ? 0 : -80,
      width: '100vw',
      height: 55,
      zIndex: 6,
      transition: 'all 0.5s cubic-bezier(.17,.67,.5,1.01)'
    }}>
      <Box
        sx={{
          background: 'linear-gradient(0deg, rgba(207,112,0,1) 0%, rgba(237,142,0,1) 100%)',
          padding: '4px 6px',
          borderRadius: '6px 6px 0px 0px',
          position: 'absolute',
          right: 15,
          top: -20,
          fontSize: 10,
          color: 'white',
          '&:hover': {
            cursor: 'pointer'
          }
        }}
        onClick={setShow}
      >Hide Search</Box>

      <TextField
        label='Address Search'
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' ? handleSearch() : ''}
        color='warning'
        size='small'
        sx={{
          width: 'calc(100% - 90px)'
        }}
      />

      <Button
        sx={{
          border: 'none',
          height: 30,
          width: 70,
          fontSize: 12,
          backgroundColor: 'rgb(237, 142, 0)',
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgb(207, 112, 0)'
          }
        }}
        onClick={handleSearch}
      >Search</Button>
    </Box>
  );
}

MapBar.propTypes = {
  token: PropTypes.string,
  allowedStates: PropTypes.array,
  bbox: PropTypes.object,
  mapRef: PropTypes.object,
  handleChangeLocations: PropTypes.func,
  setShow: PropTypes.func,
  show: PropTypes.bool
};