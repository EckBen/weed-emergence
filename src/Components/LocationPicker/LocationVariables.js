const name = 'weed-emergence';
const token =
  'pk.eyJ1IjoicHJlY2lwYWRtaW4iLCJhIjoiY2xkdDlvamVvMGdiZzNvbjBneGtvanQweiJ9.6ym2K6NuvEF31vsMsUAiLg';

const bbox = {
  north: 47.53,
  south: 37.09,
  east: -66.89,
  west: -82.7542,
};

const allowedStates = [
  'Maine',
  'New Hampshire',
  'Vermont',
  'Rhode Island',
  'Massachusetts',
  'Connecticut',
  'New York',
  'New Jersey',
  'Pennsylvania',
  'Delaware',
  'Maryland',
  'West Virginia',
  'Ohio',
  'Virginia',
  'Kentucky',
];

export { allowedStates, bbox, name, token };
