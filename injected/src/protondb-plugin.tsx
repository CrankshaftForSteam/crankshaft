import { SELECTORS } from './selectors';
import { NetworkGetError } from './services/Network';
import { SMM } from './SMM';
import { info } from './util';

export const loadProtonDBPlugin = (smm: SMM) => {
  enum TierColours {
    pending = '#6a6a6a',
    borked = '#ff0000',
    bronze = '#cd7f32',
    silver = '#a6a6a6',
    gold = '#cfb53b',
    platinum = '#b4c7dc',
  }

  const protonDbCache: Record<string, any> = {};

  smm.addEventListener('switchToAppDetails', async (event: any) => {
    document
      .querySelectorAll('[data-smm-protondb]')
      .forEach((node) => node.remove());

    const { appId } = event.detail;
    let data = protonDbCache[appId];
    if (!data) {
      try {
        data = await smm.Network.get(
          `https://www.protondb.com/api/v1/reports/summaries/${appId}.json`
        );
        protonDbCache[appId] = data;
      } catch (err) {
        if (err instanceof NetworkGetError) {
          // TODO: show toast?
          info('Error fetching ProtonDB rating:', err.status);
          return;
        }
      }
    }
    const { tier } = data as { tier: keyof typeof TierColours };

    const indicator = (
      <a
        href={`https://www.protondb.com/app/${appId}`}
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          backgroundColor: TierColours[tier],
          color: 'rgba(0, 0, 0, 50%)',
          fontSize: 20,
          textDecoration: 'none',
        }}
        data-smm-protondb={true}
      >
        <img
          src={`http://localhost:${window.smmServerPort}/assets/protondb-logo.svg`}
          style={{
            width: 20,
            marginRight: 4,
          }}
        />
        <span>{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
      </a>
    );

    document.querySelector(SELECTORS.appDetailsHeader)!.appendChild(indicator);
  });
};