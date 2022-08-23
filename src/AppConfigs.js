import React, { Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MenuItem, Box } from '@mui/material';
import { format, parseISO } from 'date-fns';

function round(value, step) {
  step || (step = 1.0);
  var inv = 1.0 / step;
  return Math.round(value * inv) / inv;
}

const constants = {
  bucketDepth: 36,
  topBucket: 6,
  bottomBucket: function() { return this.bucketDepth - this.topBucket; },

  laminarThickness: 0.00001,

  intercept: 0.10,
  p: 0.3,
  TAW: 2 * (2/3),
  
  F: 0.5,
  G: function() { return 1 - this.F; },

  SL: 24,
  M: 20,
  DT: 3600,

  Kc: 1.0,

  TB: 10
};

const chartOptions = (year) => {
  return {
    colors: ['#D9ED92', '#99D98C', '#52B69A', '#34A0A4', '#1A759F', '#184E77'],
    title: {
      text: `Percent Cumulative Emergence for Weed Species in ${year}`
    },
    yAxis: {
      title: {
        enabled: false
      },
      labels: {
        format: '{value}%'
      },
      min: 0,
      max: 100,
      gridLineDashStyle: 'Dash'
    },
    tooltip: {
      shared: true,
      outside: true,
      split: false,
      useHTML: true,
      backgroundColor: 'white',
      formatter: function() {
        if (!this || !this.points) return '';
        
        const weeds = this.points.map((p, i) => {
          return (
            <Fragment key={i}>
              <Box style={{ color: p.color }}>{p.series.name}:</Box>
              <Box style={{ color: p.color, justifySelf: 'right' }}><span style={{ fontWeight: 'bold' }}>{round(p.y, 0)}</span>%</Box>
            </Fragment>
          );
        });

        return renderToStaticMarkup(<Box style={{
          padding: '0px 6px',
          height: 'fit-content'
        }}>
          <Box style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>{format(parseISO(this.points[0].key), 'MMM do, yyyy')}</Box>
          
          <Box style={{
            height: '1px',
            width: '85%',
            backgroundColor: 'black',
            margin: '2px auto'
          }} />

          <Box style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 50%)',
            gridTemplateRows: `repeat(${weeds.length}, 18px)`,
            gridColumnGap: '3px',
            alignItems: 'center'
          }}>
            {weeds}
          </Box>
        </Box>);
      }
    }
  };
};

const initEmergences = {
  nrcc: {
    pigweed: [],
    ragweed: [],
    velvetLeaf: [],
    foxtail: [],
    lambsquarter: []
  },
  weedcast: {
    pigweed: [],
    ragweed: [],
    velvetLeaf: [],
    largeCrabgrass: [],
    foxtail: [],
    lambsquarter: []
  }
};

const yearItems = (begin, end) => {
  const items = [];
  for (let i = end; i >= begin; i--) {
    items.push(<MenuItem key={i} value={i}>{i}</MenuItem>);
  }
  return items;
};

export {
  constants,
  chartOptions,
  initEmergences,
  yearItems
};