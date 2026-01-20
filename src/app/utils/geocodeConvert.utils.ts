import axios from 'axios';
import { ICoord } from '../modules/users/user.interface';
import env from '../config/env';

export const addressToLongLat = async (address: string): Promise<ICoord> => {
  const googleGeoCodingAPI = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${env.GOOGLE_MAP_API_KEY}`;
  const response = await axios.get(googleGeoCodingAPI);
  const coordinates = response.data.results[0].geometry.location;

  return {
    long: coordinates?.lng,
    lat: coordinates?.lat,
  };
};
