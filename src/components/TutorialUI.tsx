import { useContext, useState } from 'react';
import BaseContainer from './BaseContainer';
import { GameContext } from '../contexts/GameContext';
import { withClickSound } from '../lib/utils/withClickSound';
import tutorialData from '../assets/data/tutorial.json';

import '../styles/shared.css';
import '../styles/tutorialUI.css';

// Define TypeScript interfaces for the tutorial data
interface TutorialImage {
  path: string;
  caption?: string;
}

interface TutorialSection {
  id: number;
  title: string;
  description: string;
  images: TutorialImage[];
  hasImages: boolean;
}

interface TutorialData {
  sections: TutorialSection[];
}

const TutorialUI = () => {
  const game = useContext(GameContext);
  const [currentSection, setCurrentSection] = useState(0);

  // Cast the imported JSON to our interface
  const tutorialSections = (tutorialData as TutorialData).sections;

  const handleHideUI = () => {
    game?.uiManager.hideTutorialMenu();
  };

  const nextSection = () => {
    if (currentSection < tutorialSections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  if (!game) return null;

  const currentSectionData = tutorialSections[currentSection];

  return (
    <BaseContainer
      title="TUTORIAL"
      backButtonCallback={withClickSound(game, handleHideUI)}
    >
      <div className="tutorial-container">
        <div className="tutorial-background"></div>
        <div className="tutorial-content">
          <div className="tutorial-navigation">
            <button
              className={`tutorial-nav-button ${currentSection === 0 ? 'disabled' : ''}`}
              onClick={withClickSound(game, prevSection)}
              disabled={currentSection === 0}
            >
              Previous
            </button>
            <span className="tutorial-pagination">
              {currentSection + 1} / {tutorialSections.length}
            </span>
            <button
              className={`tutorial-nav-button ${currentSection === tutorialSections.length - 1 ? 'disabled' : ''}`}
              onClick={withClickSound(game, nextSection)}
              disabled={currentSection === tutorialSections.length - 1}
            >
              Next
            </button>
          </div>

          <div className="tutorial-section">
            <h2 className="tutorial-section-title">{currentSectionData.title}</h2>
            <div
              className={`tutorial-section-content ${!currentSectionData.hasImages ? 'text-only' : ''}`}
            >
              {currentSectionData.hasImages && currentSectionData.images.length > 0 && (
                <div className="tutorial-images-container">
                  {currentSectionData.images.map((image, index) => (
                    <div key={index} className="tutorial-image-wrapper">
                      <img
                        src={image.path}
                        alt={
                          image.caption ||
                          `${currentSectionData.title} image ${index + 1}`
                        }
                        className="tutorial-image"
                      />
                      {image.caption && (
                        <p className="tutorial-image-caption">{image.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div
                className={`tutorial-description ${!currentSectionData.hasImages ? 'full-width' : ''}`}
              >
                <p>{currentSectionData.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseContainer>
  );
};

export default TutorialUI;
