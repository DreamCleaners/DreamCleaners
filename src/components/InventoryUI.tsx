import React, { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';
import { Rarity } from '../lib/shop/rarity';
import { ShopItemType } from '../lib/shop/shopItemType';
import { WeaponPassivesManager } from '../lib/weapons/passives/weaponPassivesManager';
import ItemIcon from './ItemIcon';
import { WeaponItem } from '../lib/shop/weaponItem';
import { WeaponPassiveItem } from '../lib/shop/weaponPassiveItem';
import { Weapon } from '../lib/weapons/weapon';
import '../styles/inventoryUI.css';

const InventoryUI = ({
  isDisabled,
  buttonCallback,
  getButtonText,
  selectedWeapon,
  titleElement,
}: {
  isDisabled: (weapon: Weapon, isSlotEmpty: boolean) => boolean;
  buttonCallback: (weaponIndex: number) => void;
  getButtonText: (weapon: Weapon | undefined) => React.ReactNode;
  selectedWeapon?: WeaponItem;
  selectedWeaponPassive?: WeaponPassiveItem;
  titleElement: React.ReactNode;
}) => {
  const game = useContext(GameContext);

  const getWeaponStats = (statDiff: number) => {
    if (statDiff < 0) return <span className="stat-worse">({statDiff})</span>;
    if (statDiff > 0) return <span className="stat-better">(+{statDiff})</span>;
    return <span>(0)</span>;
  };

  if (!game) return null;

  return (
    <div className="inventory-container">
      {titleElement}
      <div className="inventory-weapon-container">
        {Array.from({ length: 2 }, (_, index) => {
          const weapon = game.player.inventory.getWeapons()[index];
          const isSlotEmpty = game.player.inventory.getWeapons().length <= index;

          return (
            <div className="inventory-weapon-item-container" key={index}>
              <div
                className={`inventory-weapon-item ${isSlotEmpty ? '' : Rarity[weapon?.currentRarity].toLowerCase()}-border`}
              >
                {isSlotEmpty ? (
                  <h2>EMPTY SLOT</h2>
                ) : (
                  <>
                    <h2 className={`${Rarity[weapon.currentRarity].toLowerCase()}`}>
                      {weapon.weaponData.weaponName}
                    </h2>
                    <ItemIcon
                      iconName={weapon.weaponType.toLowerCase()}
                      className={`inventory-weapon-icon ${Rarity[
                        weapon.currentRarity
                      ].toLowerCase()}-shadow`}
                      shopItemType={ShopItemType.WEAPON}
                    />
                    <div className="inventory-weapon-stats-container">
                      <div className="inventory-weapon-stat-item">
                        <p className="inventory-weapon-stat-text">Damage:</p>
                        <div className="inventory-weapon-stat-value">
                          {weapon.weaponData.globalStats[
                            weapon.currentRarity
                          ].damage.toFixed(2)}{' '}
                          {selectedWeapon !== undefined && (
                            <p className="inventory-weapon-stat-difference">
                              {getWeaponStats(
                                parseFloat(
                                  (
                                    game.weaponDataManager.getWeaponData(
                                      selectedWeapon!.weaponType,
                                    ).globalStats[selectedWeapon!.rarity].damage -
                                    weapon.weaponData.globalStats[weapon.currentRarity]
                                      .damage
                                  ).toFixed(2),
                                ),
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="inventory-weapon-stat-item">
                        <p className="inventory-weapon-stat-text">Fire rate:</p>
                        <div className="inventory-weapon-stat-value">
                          {(
                            1 /
                            weapon.weaponData.globalStats[weapon.currentRarity].cadency
                          ).toFixed(2)}{' '}
                          {selectedWeapon !== undefined && (
                            <p className="inventory-weapon-stat-difference">
                              {getWeaponStats(
                                parseFloat(
                                  (
                                    1 /
                                      game.weaponDataManager.getWeaponData(
                                        selectedWeapon!.weaponType,
                                      ).globalStats[selectedWeapon!.rarity].cadency -
                                    1 /
                                      weapon.weaponData.globalStats[weapon.currentRarity]
                                        .cadency
                                  ).toFixed(2),
                                ),
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="inventory-weapon-stat-item">
                        <p className="inventory-weapon-stat-text">Range:</p>
                        <div className="inventory-weapon-stat-value">
                          {weapon.weaponData.globalStats[
                            weapon.currentRarity
                          ].range.toFixed(2)}{' '}
                          {selectedWeapon !== undefined && (
                            <p className="inventory-weapon-stat-difference">
                              {getWeaponStats(
                                parseFloat(
                                  (
                                    game.weaponDataManager.getWeaponData(
                                      selectedWeapon!.weaponType,
                                    ).globalStats[selectedWeapon!.rarity].range -
                                    weapon.weaponData.globalStats[weapon.currentRarity]
                                      .range
                                  ).toFixed(2),
                                ),
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="inventory-weapon-passive-container">
                      {weapon.embeddedPassives.length === 0 && <div>NO PASSIVES</div>}
                      {weapon.embeddedPassives.map((passive, index) => (
                        <div
                          className={`inventory-weapon-passive-item ${Rarity[
                            WeaponPassivesManager.getInstance().getPassiveRarity(passive)
                          ].toLowerCase()}-border`}
                          key={index}
                        >
                          <p
                            key={index}
                            className={`inventory-weapon-passive-text ${Rarity[
                              WeaponPassivesManager.getInstance().getPassiveRarity(
                                passive,
                              )
                            ].toLowerCase()}`}
                          >
                            {WeaponPassivesManager.getInstance().getPrettyPassiveName(
                              passive,
                            )}
                          </p>
                          <ItemIcon
                            iconName={passive.toLowerCase()}
                            className={`inventory-weapon-passive-icon ${Rarity[
                              WeaponPassivesManager.getInstance().getPassiveRarity(
                                passive,
                              )
                            ].toLowerCase()}-shadow`}
                            shopItemType={ShopItemType.WEAPON_PASSIVE}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                className="button inventory-weapon-button"
                disabled={isDisabled(weapon, isSlotEmpty)}
                onClick={buttonCallback.bind(null, index)}
              >
                {getButtonText(weapon)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryUI;
