import { ShopItemType } from '../lib/shop/shopItemType';
import { getIconComponent } from '../lib/utils/iconComponent';

const ItemIcon = ({
  iconName,
  className,
  shopItemType,
}: {
  iconName: string;
  className: string;
  shopItemType: ShopItemType;
}) => {
  const name = iconName.toLowerCase().replace(/[\s_]/g, '-').replace(/'/g, '');

  let path = '';

  if (shopItemType === ShopItemType.WEAPON) {
    path = `weapons/${name}`;
  }
  if (shopItemType === ShopItemType.PLAYER_PASSIVE) {
    // path = `player-passives/${name}`;
    path = `player-passives/potion-ball`; // debug
  }
  if (shopItemType === ShopItemType.WEAPON_PASSIVE) {
    path = `weapon-passives/${name}`;
  }

  const Icon = getIconComponent(path);

  if (!ItemIcon) return null;

  return <Icon className={className} />;
};

export default ItemIcon;
