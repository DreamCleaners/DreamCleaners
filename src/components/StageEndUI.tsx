import { useContext, useEffect, useState } from 'react';
import { GameContext } from '../contexts/GameContext';
import { WeaponRarity } from '../lib/weapons/weaponRarity';
import '../styles/stageEndUI.css';
import { WeaponPassivesManager } from '../lib/weapons/passives/weaponPassivesManager';

const StageEndUI = () => {
  const game = useContext(GameContext);
  const [rewardUsed, setRewardUsed] = useState(false); // Track if the reward has been used
  const [playerWeapons, setPlayerWeapons] = useState(game?.player.getWeapons() || []); // Track player weapons

  useEffect(() => {
    if (!game) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        game.uiManager.hideUI();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [game]);

  if (!game) return null;

  const stageReward = game.sceneManager.getCurrentScene()?.stageInfo.stageReward;
  const stageRewardGold = stageReward?.getMoneyReward() ?? 0;
  const weaponReward = stageReward?.getWeaponReward();

  const handleReplaceWeapon = async (weaponIndex: number) => {
    if (!stageReward || !weaponReward) return;

    try {
      // Call the abstract method of StageReward to get the new weapon
      const newWeapon = await stageReward.createWeapon(game.player);

      // Replace the weapon at the specified index
      game.player.replaceWeaponAtIndex(weaponIndex, newWeapon);

      // Update the player weapons state
      setPlayerWeapons(game.player.getWeapons());

      // Mark the reward as used
      setRewardUsed(true);
    } catch (error) {
      console.error('Failed to create weapon:', error);
    }
  };

  const handleHideUI = () => {
    game.uiManager.hideUI();
  };

  return (
    <div className="score-interface-container">
      <div className="score-section">
        <h1>Stage score</h1>
        <p>
          <strong>press backspace to skip</strong>
        </p>
        <p>
          Enemies killed: {game.scoreManager.totalKill}, score: +
          {game.scoreManager.totalKillScore}
        </p>
        <p>
          Time elapsed: {game.scoreManager.timeElapsed}s, score: +
          {game.scoreManager.totalTimeBonus}
        </p>
        <p>
          Damage taken: {game.scoreManager.totalDamageTaken}, score: -
          {game.scoreManager.totalDamageTakenMalus}
        </p>
        <h3>Final score: {game.scoreManager.getScore()}</h3>
      </div>
      <div className="reward-section">
        <h2>Rewards</h2>
        <p>Gold reward: {stageRewardGold}$</p>
      </div>
      <div className="center-container">
        {weaponReward && (
          <div className="weapon-reward-container">
            {!rewardUsed && (
              <div className="reward-weapon">
              <h3>Reward Weapon</h3>
                <p>Type: {weaponReward.weaponType}</p>
                <p>Rarity: {WeaponRarity[weaponReward.rarity]}</p>
                {weaponReward.embeddedPassives.map((passive, index) => (
                  <p key={index}>
                    Passive {index + 1}: {WeaponPassivesManager.getInstance().getPrettyPassiveName(passive)}
                  </p>
                ))}
              </div>
            )}
            <h4 className="current-weapons-label">Current Weapons</h4>
            <div className="player-weapons">
              <div className="player-weapon left">
                <p>Type: {playerWeapons[0].weaponType}</p>
                <p>Rarity: {WeaponRarity[playerWeapons[0].currentRarity]}</p>
                {!rewardUsed && (
                  <button onClick={() => handleReplaceWeapon(0)}>Replace</button>
                )}
              </div>
              <div className="player-weapon right">
                {playerWeapons[1] ? (
                  <>
                    <p>Type: {playerWeapons[1].weaponType}</p>
                    <p>Rarity: {WeaponRarity[playerWeapons[1].currentRarity]}</p>
                    {!rewardUsed && (
                      <button onClick={() => handleReplaceWeapon(1)}>Replace</button>
                    )}
                  </>
                ) : (
                  <>
                    <p>You have no weapon in this emplacement !</p>
                    {!rewardUsed && (
                      <button onClick={() => handleReplaceWeapon(1)}>Choose</button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="back-to-hub-container">
          <button onClick={handleHideUI}>Back to Hub</button>
        </div>
      </div>
    </div>
  );
};

export default StageEndUI;
