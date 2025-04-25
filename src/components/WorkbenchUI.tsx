import { useContext, useState } from 'react';
import { GameContext } from '../contexts/GameContext';
import '../styles/workbenchUI.css';
import { Rarity } from '../lib/shop/rarity';
import {
  WeaponPassivesManager,
  WeaponPassiveType,
} from '../lib/weapons/passives/weaponPassivesManager';
import { withClickSound } from './Utils';

const WorkbenchUI = () => {
  const game = useContext(GameContext);
  const [weapons, setWeapons] = useState(game?.player.getInventory().getWeapons() || []);

  const handleCloseUI = () => {
    game?.uiManager.hideUI();
  };

  const getRarityColor = (rarity: Rarity) => {
    switch (rarity) {
      case Rarity.COMMON:
        return 'gray';
      case Rarity.RARE:
        return 'green';
      case Rarity.EPIC:
        return 'purple';
      case Rarity.LEGENDARY:
        return 'orange';
    }
  };

  const handleImproveQuality = (index: number) => {
    if (!game) return;

    const weapon = weapons[index];
    const cost = game.workbenchManager.getCostForQualityUpgrade(weapon);

    if (game.moneyManager.getPlayerMoney() >= cost) {
      game.moneyManager.removePlayerMoney(cost); // Deduct the cost
      game.workbenchManager.improveWeaponQuality(index); // Improve the weapon quality
      setWeapons([...game.player.getInventory().getWeapons()]); // Re-render with updated weapons
    }
  };

  const renderPassives = (passives: WeaponPassiveType[]) => {
    const passivesManager = WeaponPassivesManager.getInstance();
    return passives.map((passive, index) => {
      const rarityIndex = passivesManager.getQualityIndexForPassive(passive);
      const rarityClass = `rarity-${rarityIndex}`;

      return (
        <div key={index} className={`passive-container ${rarityClass}`}>
          <h4>{passivesManager.getPrettyPassiveName(passive)}</h4>
          <p>{passivesManager.getPassiveDescription(passive)}</p>
        </div>
      );
    });
  };

  return (
    <div className="workbench-interface-container">
      <div className="workbench-content">
        {/* Left Section: First Weapon */}
        <div className="weapon-section">
          <h2>Weapon 1</h2>
          {weapons[0] ? (
            <div>
              <div className="stats-and-button-container">
                <ul className="weapon-stats">
                  <li>Name: {weapons[0].weaponData.weaponName}</li>
                  <li style={{ color: getRarityColor(weapons[0].currentRarity) }}>
                    Quality: {Rarity[weapons[0].currentRarity]}
                  </li>
                  <li>
                    Damage:{' '}
                    {weapons[0].weaponData.globalStats[weapons[0].currentRarity].damage}
                  </li>
                  <li>
                    Fire Rate:{' '}
                    {Math.round(
                      (1 /
                        weapons[0].weaponData.globalStats[weapons[0].currentRarity]
                          .cadency) *
                        100,
                    ) / 100}{' '}
                    shots/sec
                  </li>
                  <li>
                    Ammo:{' '}
                    {
                      weapons[0].weaponData.globalStats[weapons[0].currentRarity]
                        .magazineSize
                    }
                  </li>
                  <li>
                    Reload time:{' '}
                    {
                      weapons[0].weaponData.globalStats[weapons[0].currentRarity]
                        .reloadTime
                    }
                  </li>
                </ul>
                <div className="upgrade-container">
                  <button
                    onClick={withClickSound(game, () => handleImproveQuality(0))}
                    disabled={
                      weapons[0].currentRarity === Rarity.LEGENDARY ||
                      (game?.moneyManager.getPlayerMoney() ?? 0) <
                        (game?.workbenchManager.getCostForQualityUpgrade(weapons[0]) ??
                          Infinity)
                    }
                    style={{
                      backgroundColor:
                        weapons[0].currentRarity === Rarity.LEGENDARY ||
                        (game?.moneyManager.getPlayerMoney() ?? 0) <
                          (game?.workbenchManager.getCostForQualityUpgrade(weapons[0]) ??
                            0)
                          ? '#666'
                          : '#444',
                      cursor:
                        weapons[0].currentRarity === Rarity.LEGENDARY ||
                        (game?.moneyManager.getPlayerMoney() ?? 0) <
                          (game?.workbenchManager.getCostForQualityUpgrade(weapons[0]) ??
                            0)
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    Improve Quality
                  </button>
                  <p>
                    Cost: {game?.workbenchManager.getCostForQualityUpgrade(weapons[0])}$
                  </p>
                </div>
              </div>
              <h3>Passives:</h3>
              {weapons[0].embeddedPassives.length > 0 ? (
                renderPassives(weapons[0].embeddedPassives)
              ) : (
                <p>This weapon has no passives</p>
              )}
            </div>
          ) : (
            <p>No weapon equipped</p>
          )}
        </div>

        {/* Right Section: Second Weapon */}
        <div className="weapon-section">
          <h2>Weapon 2</h2>
          {weapons[1] ? (
            <div>
              <div className="stats-and-button-container">
                <ul className="weapon-stats">
                  <li>Name: {weapons[1].weaponData.weaponName}</li>
                  <li style={{ color: getRarityColor(weapons[1].currentRarity) }}>
                    Quality: {Rarity[weapons[1].currentRarity]}
                  </li>
                  <li>
                    Damage:{' '}
                    {weapons[1].weaponData.globalStats[weapons[1].currentRarity].damage}
                  </li>
                  <li>
                    Fire Rate:{' '}
                    {Math.round(
                      (1 /
                        weapons[1].weaponData.globalStats[weapons[1].currentRarity]
                          .cadency) *
                        100,
                    ) / 100}{' '}
                    shots/sec
                  </li>
                  <li>
                    Ammo:{' '}
                    {
                      weapons[1].weaponData.globalStats[weapons[1].currentRarity]
                        .magazineSize
                    }
                  </li>
                  <li>
                    Reload time:{' '}
                    {
                      weapons[1].weaponData.globalStats[weapons[1].currentRarity]
                        .reloadTime
                    }
                  </li>
                </ul>
                <div className="upgrade-container">
                  <button
                    onClick={withClickSound(game, () => handleImproveQuality(1))}
                    disabled={
                      weapons[1].currentRarity === Rarity.LEGENDARY ||
                      (game?.moneyManager.getPlayerMoney() ?? 0) <
                        (game?.workbenchManager.getCostForQualityUpgrade(weapons[1]) ?? 0)
                    }
                    style={{
                      backgroundColor:
                        weapons[1].currentRarity === Rarity.LEGENDARY ||
                        (game?.moneyManager.getPlayerMoney() ?? 0) <
                          (game?.workbenchManager.getCostForQualityUpgrade(weapons[1]) ??
                            0)
                          ? '#666'
                          : '#444',
                      cursor:
                        weapons[1].currentRarity === Rarity.LEGENDARY ||
                        (game?.moneyManager.getPlayerMoney() ?? 0) <
                          (game?.workbenchManager.getCostForQualityUpgrade(weapons[1]) ??
                            0)
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    Improve Quality
                  </button>
                  <p>
                    Cost: {game?.workbenchManager.getCostForQualityUpgrade(weapons[1])}$
                  </p>
                </div>
              </div>
              <h3>Passives:</h3>
              {weapons[1].embeddedPassives.length > 0 ? (
                renderPassives(weapons[1].embeddedPassives)
              ) : (
                <p>This weapon has no passives</p>
              )}
            </div>
          ) : (
            <p>No weapon equipped</p>
          )}
        </div>
      </div>
      <button onClick={withClickSound(game, handleCloseUI)}>Back</button>
    </div>
  );
};

export default WorkbenchUI;
