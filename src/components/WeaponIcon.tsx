import { getIconComponent } from '../lib/utils/iconComponent';

const WeaponIcon = ({ iconName, className }: { iconName: string; className: string }) => {
  const path = `weapons/${iconName}`;
  const Icon = getIconComponent(path);

  if (!Icon) return null;

  return <Icon className={className} />;
};

export default WeaponIcon;
