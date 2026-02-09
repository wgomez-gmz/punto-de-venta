import moment from 'moment-timezone';

export const timezoneMex = 'America/Mexico_City';


export function getLocalDate(day: Date) {
    const nowTZ = moment.tz(day, 'America/Mexico_City').format("YYYY-MM-DDTHH:mm:ss");
    return new Date(nowTZ + 'Z')
  }