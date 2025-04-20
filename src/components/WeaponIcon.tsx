import { getIconComponent } from '../lib/utils/iconComponent';

const WeaponIcon = ({ iconName, className }: { iconName: string; className: string }) => {
  const path = `weapons/${iconName}`;
  console.log('WeaponIcon path:', path);
  const Icon = getIconComponent(path);
  console.log('WeaponIcon Icon:', Icon);

  if (!Icon) return null;

  return <Icon className={className} />;
};

export default WeaponIcon;
