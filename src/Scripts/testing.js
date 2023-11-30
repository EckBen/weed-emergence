// Smooth Pigweed
const mohsenConstants = {
  b: 4.09997196191081,
  lag: 12.6749114326069,
  c: 0.176380081641461,
  tb: 13.5,
  wb: -15
};

const htts = [
  12.66,
  12.67,
  12.68,
  12.69
];

const mohsensPWeibul = (htt, weedConstants) => {
  const { lag, b: scale, c: shape } = weedConstants;
  const time = htt - lag;
  if (time < 0) return 0;
  return 1 - Math.exp(-((scale * time) ** shape));
};

htts.forEach(htt => console.log(htt, mohsensPWeibul(htt, mohsenConstants)));