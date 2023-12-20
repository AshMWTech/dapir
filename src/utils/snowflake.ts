let inc: number = 0;
let lastSnowflake: string;
let apiEpoch: number = 1640995200000;

export const setEpoch = (epoch: number) => {
  if (typeof epoch !== 'number') throw new TypeError('Epoch must be a number');
  apiEpoch = epoch;
}

export const generate = () => {
  const pad = (num: number, by: number) => num.toString(2).padStart(by, '0');

  const msSince = pad(new Date().getTime() - apiEpoch, 42),
    pid = pad(process.pid, 5).slice(0, 5),
    wid = pad(0, 5),
    getInc = (add: number) => pad(inc + add, 12);

  let snowflake = `0b${msSince}${wid}${pid}${getInc(inc)}`;
  (snowflake === lastSnowflake) ? snowflake = `0b${msSince}${wid}${pid}${getInc(++inc)}` : inc = 0;

  lastSnowflake = snowflake;
  return BigInt(snowflake).toString();
}

// https://discord.com/developers/docs/reference#convert-snowflake-to-datetime
export const getDate = (snowflake: string) => {
  if (!/^\d{16,20}$/.test(snowflake)) throw new TypeError('Invalid snowflake provided');

  let binary64;
  try {
    binary64 = `0b${BigInt(snowflake).toString(2).padStart(64, '0')}`;
  } catch (e) {
    binary64 = '';
  }

  const sinceEpochMs = Number(binary64.slice(0, 42 + 2));
  return new Date(sinceEpochMs + apiEpoch);
}

const SnowflakeUtils = { getDate, generate };
export default SnowflakeUtils;