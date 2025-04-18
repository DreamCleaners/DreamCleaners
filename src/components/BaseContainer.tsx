const BaseContainer = ({
  children,
  title,
  backButtonCallback,
}: {
  children: React.ReactNode;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backButtonCallback?: (param: any) => void;
}) => {
  return (
    <div className="main-container">
      <div className="main-background"></div>
      <div className="main-content">
        <div className="top-buttons-container">
          {backButtonCallback && (
            <button className="back-button button" onClick={backButtonCallback}>
              <h2>BACK</h2>
            </button>
          )}
          <h1 className="main-title">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
};

export default BaseContainer;
