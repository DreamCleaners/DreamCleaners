const rawIcons = import.meta.glob('@/assets/icons/*/*.svg', {
  import: 'default',
  eager: true,
  query: '?react',
});

const icons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = Object.fromEntries(
  Object.entries(rawIcons).filter(([, value]) => typeof value === 'function') as [
    string,
    React.FC<React.SVGProps<SVGSVGElement>>,
  ][],
);

export const getIconComponent = (name: string) => {
  const key = `/src/assets/icons/${name}.svg`;
  return icons[key] || null;
};
