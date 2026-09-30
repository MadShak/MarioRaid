var MK = window.MK = window.MK || {};

MK.getDifficulty = function (distance) {
  const level = Math.floor(distance / 3500);
  return {
    level,
    scrollMultiplier: 1 + level * 0.1,
    enemyMultiplier: 1 + level * 0.18,
  };
};

