/**
 * The coolest part of the project. Send images of pets.
 * @packageDocumentation
 */

import fb from './facebook';

const MAX_CAT_IMG = 10229;
const MAX_DOG_IMG = 5250;

/**
 * Return random integer between `min` and `max`
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer between `min` and `max`
 */
const randomIntFromInterval = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * Get random picture of cat
 * @returns URL to image
 */
const getCatData = (): string => {
  const img = randomIntFromInterval(1, MAX_CAT_IMG);
  if (img <= 9360) {
    return `https://nuimeow.github.io/jpg/${img}.jpg`;
  } else {
    return `https://nuimeow.github.io/gif/${img}.gif`;
  }
};

/**
 * Get random picture of dog
 * @returns URL to image
 */
const getDogData = (): string => {
  const img = randomIntFromInterval(1, MAX_DOG_IMG);
  if (img <= 5169) {
    return `https://nuimeow.github.io/dog/jpg/${img}.jpg`;
  } else {
    return `https://nuimeow.github.io/dog/jpg/${img}.gif`;
  }
};

/**
 * Send random picture of cat
 * @param id1 - ID of first user
 * @param id2 - ID of second user
 */
const sendCatPic = async (id1: string, id2: string | null): Promise<void> => {
  const url = getCatData();
  if (id2 !== null) {
    await fb.sendAttachment('', id1, 'image', url, true, false, false);
    await fb.sendAttachment('', id2, 'image', url, true, false, true);
  } else {
    await fb.sendAttachment('', id1, 'image', url, true, true, false);
  }
};

/**
 * Send random picture of dog
 * @param id1 - ID of first user
 * @param id2 - ID of second user
 */
const sendDogPic = async (id1: string, id2: string | null): Promise<void> => {
  const url = getDogData();
  if (id2 !== null) {
    await fb.sendAttachment('', id1, 'image', url, true, false, false);
    await fb.sendAttachment('', id2, 'image', url, true, false, true);
  } else {
    await fb.sendAttachment('', id1, 'image', url, true, true, false);
  }
};

export default {
  sendCatPic,
  sendDogPic,
};
