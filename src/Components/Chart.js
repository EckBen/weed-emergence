import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '@mui/material';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import { parseISO, format } from 'date-fns';
NoDataToDisplay(Highcharts);



export default function Chart({ categories, series, options }) {
  return (
    <Box id='other' sx={{
      position: 'relative',
      height: 400,
      width: '100%',
      borderRadius: '5px',
      overflow: 'hidden',
      boxShadow: '2px 2px 3px 2px rgb(180,180,180)',
      borderRight: '1px solid rgba(237, 142, 0, 0.5)',
      borderBottom: '1px solid rgba(237, 142, 0, 0.5)'
    }}>
      <HighchartsReact
        highcharts={Highcharts}
        options={{
          credits: { enabled: false },
          chart: {
            zoomType: 'x'
          },
          plotOptions: {
            line: {
              marker: {
                symbol: 'circle',
                radius: 3
              }
            }
          },
          series,
          tooltip: {
            shared: true
          },
      
          ...options,
          
          xAxis: {
            categories: categories,
            labels: {
              formatter: function() {
                let label = this.axis.defaultLabelFormatter.call(this);
                try {
                  return format(parseISO(label), 'MMM d');
                } catch {
                  return label;
                }
              }
            },
            crosshair: true,
            ...options.xAxis
          }
        }}
      />
    </Box>
  );
}

Chart.propTypes = {
  categories: PropTypes.array,
  series: PropTypes.array,
  options: PropTypes.object
};