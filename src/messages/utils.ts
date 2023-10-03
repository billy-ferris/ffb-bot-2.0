export const addHeatScale = (streakType: string, streakLength: number) => {
  const symbols = {
    WIN: '🔥',
    LOSS: '❄️',
  };

  const numberOfSymbols = Math.min(Math.floor(streakLength / 2), 3);
  return symbols[streakType]
    ? symbols[streakType].repeat(numberOfSymbols)
    : null;
};
